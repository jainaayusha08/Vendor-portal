import csv
import io

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from authentication.permissions import IsSapUser
from audit.models import AuditLog
from vendors.models import VendorRequest, RequestStatus
from vendors.serializers import VendorRequestSerializer
from .models import SapVendorCode
from .serializers import SapVendorCodeSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSapUser])
def sap_pending(request):
    """Get all SAP-pending requests"""
    qs = VendorRequest.objects.filter(status=RequestStatus.SAP_PENDING).order_by('-updated_at')
    return Response(VendorRequestSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSapUser])
def export_vendor_data(request, pk):
    """Export vendor data for SAP entry"""
    try:
        req = VendorRequest.objects.select_related('form').get(pk=pk, status=RequestStatus.SAP_PENDING)
    except VendorRequest.DoesNotExist:
        return Response({'message': 'Request not found or not ready for SAP'}, status=status.HTTP_404_NOT_FOUND)

    form = getattr(req, 'form', None)
    return Response({
        'ticket_number': req.ticket_number,
        'vendor_name': form.vendor_name if form else None,
        'company_name': form.company_name if form else None,
        'pan_number': form.pan_number if form else None,
        'gst_number': form.gst_number if form else None,
        'bank_name': form.bank_name if form else None,
        'account_number': form.account_number if form else None,
        'ifsc_code': form.ifsc_code if form else None,
        'city': form.city if form else None,
        'country': form.country if form else None,
        'contact_name': form.contact_name if form else None,
        'contact_phone': form.contact_phone if form else None,
        'contact_email': form.contact_email if form else None,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSapUser])
@parser_classes([MultiPartParser, FormParser])
def import_vendor_codes(request):
    """Import vendor codes from CSV (columns: ticket_number, vendor_code)"""
    file = request.FILES.get('file')
    if not file:
        return Response({'message': 'CSV file is required'}, status=status.HTTP_400_BAD_REQUEST)

    decoded = file.read().decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    results = []

    for row in reader:
        ticket = row.get('ticket_number', '').strip()
        vendor_code = row.get('vendor_code', '').strip()

        if not ticket or not vendor_code:
            results.append({'ticket_number': ticket, 'vendor_code': vendor_code, 'status': 'skipped', 'reason': 'Missing fields'})
            continue

        try:
            req = VendorRequest.objects.get(ticket_number=ticket)
        except VendorRequest.DoesNotExist:
            results.append({'ticket_number': ticket, 'vendor_code': vendor_code, 'status': 'failed', 'reason': 'Ticket not found'})
            continue

        if req.status != RequestStatus.SAP_PENDING:
            results.append({'ticket_number': ticket, 'vendor_code': vendor_code, 'status': 'failed', 'reason': 'Not in SAP_PENDING status'})
            continue

        if SapVendorCode.objects.filter(vendor_code=vendor_code).exists():
            results.append({'ticket_number': ticket, 'vendor_code': vendor_code, 'status': 'failed', 'reason': 'Vendor code already exists'})
            continue

        SapVendorCode.objects.create(
            vendor_request=req,
            ticket_number=ticket,
            vendor_code=vendor_code,
            created_by=request.user,
        )
        req.status = RequestStatus.COMPLETED
        req.save(update_fields=['status'])

        AuditLog.objects.create(
            user=request.user, action='SAP_CODE_IMPORTED', entity_type='vendor_request',
            entity_id=str(req.id),
            old_value={'status': RequestStatus.SAP_PENDING},
            new_value={'status': RequestStatus.COMPLETED, 'vendor_code': vendor_code},
        )

        from notifications.utils import dispatch
        from notifications.models import NotificationType
        dispatch(NotificationType.VENDOR_CODE_CREATED, req)

        results.append({'ticket_number': ticket, 'vendor_code': vendor_code, 'status': 'success'})

    success_count = sum(1 for r in results if r['status'] == 'success')
    return Response({'imported': success_count, 'total': len(results), 'results': results})
