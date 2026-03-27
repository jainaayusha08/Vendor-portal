import io
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Q

from authentication.models import User
from authentication.permissions import IsAdmin, IsSuperAdmin
from vendors.models import VendorRequest, RequestStatus
from audit.models import AuditLog
from audit.serializers import AuditLogSerializer
from .serializers import CreateUserSerializer, UserSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def dashboard_stats(request):
    total = VendorRequest.objects.count()
    pending = VendorRequest.objects.filter(
        status__in=[RequestStatus.L1_PENDING, RequestStatus.L2_PENDING, RequestStatus.L3_PENDING]
    ).count()
    approved = VendorRequest.objects.filter(status=RequestStatus.SAP_PENDING).count()
    rejected = VendorRequest.objects.filter(status=RequestStatus.REJECTED).count()
    sap_created = VendorRequest.objects.filter(status=RequestStatus.COMPLETED).count()
    return Response({'total': total, 'pending': pending, 'approved': approved, 'rejected': rejected, 'sap_created': sap_created})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def create_user(request):
    serializer = CreateUserSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    if User.objects.filter(email=data['email']).exists():
        return Response({'message': 'User with this email already exists'}, status=status.HTTP_409_CONFLICT)
    user = User.objects.create_user(
        email=data['email'],
        password=data['password'],
        full_name=data['full_name'],
        role=data['role'],
        is_sso=data.get('is_sso', False),
    )
    return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def list_users(request):
    users = User.objects.all().order_by('email')
    return Response(UserSerializer(users, many=True).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def deactivate_user(request, pk):
    User.objects.filter(pk=pk).update(is_active=False)
    return Response({'message': 'User deactivated'})


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def activate_user(request, pk):
    User.objects.filter(pk=pk).update(is_active=True)
    return Response({'message': 'User activated'})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def export_report(request):
    """Export Excel report. ?type=registrations|rejections|sap-created"""
    import openpyxl
    from openpyxl.styles import Font

    report_type = request.query_params.get('type', 'registrations')
    if report_type == 'rejections':
        qs = VendorRequest.objects.filter(status=RequestStatus.REJECTED)
    elif report_type == 'sap-created':
        qs = VendorRequest.objects.filter(status=RequestStatus.COMPLETED)
    else:
        qs = VendorRequest.objects.all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Vendor Report'
    headers = ['Ticket Number', 'Vendor Name', 'Vendor Email', 'Status', 'Vendor Type', 'Created At']
    ws.append(headers)
    for cell in ws[1]:
        cell.font = Font(bold=True)

    for r in qs.order_by('-created_at'):
        ws.append([r.ticket_number, r.vendor_name, r.vendor_email, r.status, r.vendor_type,
                   r.created_at.strftime('%Y-%m-%d %H:%M')])

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    response = HttpResponse(buf.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename="vendor_report_{report_type}.xlsx"'
    return response
