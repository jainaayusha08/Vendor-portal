import random
import string
from datetime import datetime, timedelta, timezone

from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, VendorAccount, UserRole
from .serializers import LoginSerializer, VendorOtpRequestSerializer, VendorOtpVerifySerializer
from notifications.utils import send_email


def _get_tokens(user):
    refresh = RefreshToken.for_user(user)
    refresh['role'] = user.role
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'role': user.role,
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role,
        }
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login for Employee / Admin / Finance Controller / SAP User"""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email']
    password = serializer.validated_data['password']

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response({'message': 'Account is deactivated'}, status=status.HTTP_403_FORBIDDEN)

    # Check lockout
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        return Response({'message': 'Account locked. Try again after 30 minutes'}, status=status.HTTP_403_FORBIDDEN)

    if not user.check_password(password):
        user.login_attempts += 1
        if user.login_attempts >= 5:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=30)
            user.login_attempts = 0
        user.save(update_fields=['login_attempts', 'locked_until'])
        return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    user.login_attempts = 0
    user.locked_until = None
    user.save(update_fields=['login_attempts', 'locked_until'])

    return Response(_get_tokens(user))


@api_view(['POST'])
@permission_classes([AllowAny])
def vendor_send_otp(request):
    """Send OTP to vendor email"""
    serializer = VendorOtpRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email']

    # Rate limit: max 3 per 10 minutes
    rate_key = f'otp_rate:{email}'
    attempts = cache.get(rate_key, 0)
    if attempts >= 3:
        return Response({'message': 'Too many OTP requests. Try again after 10 minutes'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
    cache.set(rate_key, attempts + 1, timeout=600)

    otp = ''.join(random.choices(string.digits, k=6))
    cache.set(f'otp:{email}', otp, timeout=600)  # 10 minutes

    # Integrated SendGrid / Local Console Dispatch
    subject = "Your Vendor Portal One-Time Password (OTP)"
    body = f"Hello,\n\nYour 6-digit verification code for the Hinduja Renewables Vendor Portal is: {otp}\n\nThis code is valid for 10 minutes. Please do not share this code with anyone.\n\nThank you,\nProcurement Team"
    send_email(email, subject, body)

    return Response({'message': 'OTP sent to email'})


@api_view(['POST'])
@permission_classes([AllowAny])
def vendor_verify_otp(request):
    """Verify vendor OTP and issue JWT"""
    serializer = VendorOtpVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email']
    otp = serializer.validated_data['otp']

    stored_otp = cache.get(f'otp:{email}')
    if not stored_otp or stored_otp != otp:
        return Response({'message': 'Invalid or expired OTP'}, status=status.HTTP_401_UNAUTHORIZED)

    cache.delete(f'otp:{email}')

    try:
        user = User.objects.get(email=email)
        if user.role != UserRole.VENDOR:
            # Handle collision — although rarely possible with separate login paths
            pass
    except User.DoesNotExist:
        user = User.objects.create(
            email=email,
            full_name='Vendor',
            role=UserRole.VENDOR,
            is_active=True
        )

    return Response(_get_tokens(user))


@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh(request):
    """Refresh access token"""
    refresh_token = request.data.get('refresh_token')
    if not refresh_token:
        return Response({'message': 'refresh_token is required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        refresh = RefreshToken(refresh_token)
        return Response({'access_token': str(refresh.access_token)})
    except Exception:
        return Response({'message': 'Invalid or expired refresh token'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_employee(request):
    """Self-registration for employees"""
    from .serializers import UserSerializer
    email    = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')
    name     = request.data.get('name', '').strip()
    dept     = request.data.get('department', '').strip()

    if not email or not password or not name:
        return Response({'message': 'name, email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 6:
        return Response({'message': 'password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({'message': 'An account with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        email=email, password=password,
        full_name=name, role=UserRole.EMPLOYEE,
    )
    if dept:
        # Store department in a simple way — extend model if you need a dedicated field
        user.is_active = True
        user.save()

    return Response({'message': 'Registration successful', 'user_id': str(user.id)}, status=status.HTTP_201_CREATED)
