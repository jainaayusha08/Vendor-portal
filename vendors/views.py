import secrets
from datetime import datetime, timedelta, timezone

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import AccessToken

from authentication.models import UserRole
from authentication.permissions import IsEmployee, IsAdmin
from .models import VendorRequest, VendorForm, AdminAdditions, RequestStatus, generate_ticket
from .serializers import (
    CreateVendorRequestSerializer, VendorRequestSerializer,
    SubmitVendorFormSerializer, AdminAdditionsSerializer, VendorFormSerializer,
)
from notifications.utils import send_email


def _generate_registration_token(email):
    token = AccessToken()
    token['purpose'] = 'vendor_registration'
    token['email'] = email
    token.set_exp(lifetime=timedelta(hours=72))
    return str(token)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsEmployee])
def create_vendor_request(request):
    """Employee creates vendor onboarding request"""
    serializer = CreateVendorRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    token = _generate_registration_token(data['vendor_email'])
    req = VendorRequest.objects.create(
        ticket_number=generate_ticket(),
        employee=request.user,
        vendor_name=data['vendor_name'],
        vendor_email=data['vendor_email'],
        vendor_company_name=data.get('vendor_company_name', ''),
        status=RequestStatus.LINK_SENT,
        registration_token=token,
        registration_token_expires=datetime.now(timezone.utc) + timedelta(hours=72),
    )
    link = f"{settings.FRONTEND_URL}/vendor/register?token={token}"
    
    # Send invite email
    subject = "Invitation to Onboard as a Vendor: Hinduja Renewables"
    body = f"Hello {data['vendor_name']},\n\nYou have been invited by the Hinduja Renewables Procurement team to register as an authorized vendor.\n\nPlease complete your registration form using the link below:\n\n{link}\n\nThis link is valid for 72 hours.\n\nThank you,\nHinduja Renewables procurement"
    send_email(data['vendor_email'], subject, body)

    return Response({**VendorRequestSerializer(req).data, 'registration_link': link}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_requests(request):
    """List requests relevant to the current user (Employee or Vendor)"""
    user = request.user
    if user.role == UserRole.EMPLOYEE:
        qs = VendorRequest.objects.filter(employee=user)
    elif user.role == UserRole.VENDOR:
        qs = VendorRequest.objects.filter(vendor_email=user.email)
    else:
        qs = VendorRequest.objects.none()
    return Response(VendorRequestSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def validate_registration_token(request):
    """Vendor validates registration link token"""
    token = request.query_params.get('token')
    if not token:
        return Response({'message': 'token is required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        payload = AccessToken(token)
        req = VendorRequest.objects.get(registration_token=token)
        if req.status not in [RequestStatus.LINK_SENT, RequestStatus.CLARIFICATION_REQUESTED]:
            return Response({'message': 'This registration link has already been used'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'valid': True, 'ticket_number': req.ticket_number, 'vendor_email': payload['email']})
    except VendorRequest.DoesNotExist:
        return Response({'message': 'Invalid registration link'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({'message': 'Invalid or expired registration link'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_vendor_form(request):
    """Vendor submits registration form"""
    serializer = SubmitVendorFormSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    token = data.pop('token')

    try:
        AccessToken(token)
        req = VendorRequest.objects.get(registration_token=token)
    except VendorRequest.DoesNotExist:
        return Response({'message': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception:
        return Response({'message': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)

    # PAN duplicate check
    pan = data.get('pan_number', '')
    if pan:
        existing = VendorForm.objects.filter(pan_number=pan).exclude(vendor_request=req).first()
        if existing:
            return Response({'message': 'A vendor with this PAN number already exists'}, status=status.HTTP_400_BAD_REQUEST)

    form, _ = VendorForm.objects.update_or_create(vendor_request=req, defaults=data)
    req.status = RequestStatus.L1_PENDING
    req.save(update_fields=['status'])

    # Notify employees/admins that a new vendor form has been submitted
    from notifications.utils import dispatch
    from notifications.models import NotificationType
    dispatch(NotificationType.FORM_SUBMITTED, req)

    return Response({'message': 'Form submitted successfully', 'ticket_number': req.ticket_number})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_vendor_request(request, pk):
    """Get a single vendor request by ID"""
    try:
        req = VendorRequest.objects.get(pk=pk)
    except VendorRequest.DoesNotExist:
        return Response({'message': 'Vendor request not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(VendorRequestSerializer(req).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_vendor_form(request, pk):
    """Get vendor form for a request"""
    try:
        req = VendorRequest.objects.get(pk=pk)
        form = req.form
    except (VendorRequest.DoesNotExist, VendorForm.DoesNotExist):
        return Response({'message': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(VendorFormSerializer(form).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdmin])
def save_admin_additions(request, pk):
    """Admin adds company code and tax fields"""
    try:
        req = VendorRequest.objects.get(pk=pk)
    except VendorRequest.DoesNotExist:
        return Response({'message': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = AdminAdditionsSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    obj, _ = AdminAdditions.objects.update_or_create(
        vendor_request=req,
        defaults={**serializer.validated_data, 'added_by': request.user},
    )
    return Response(AdminAdditionsSerializer(obj).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_requests(request):
    """Admin/internal users: list all requests with optional filters"""
    qs = VendorRequest.objects.all()
    status_filter = request.query_params.get('status')
    vendor_type = request.query_params.get('vendor_type')
    if status_filter:
        qs = qs.filter(status=status_filter)
    if vendor_type:
        qs = qs.filter(vendor_type=vendor_type)
    return Response(VendorRequestSerializer(qs, many=True).data)
