from django.conf import settings
from authentication.models import User, UserRole
from .models import Notification, NotificationType
import os
import requests

MESSAGES = {
    NotificationType.FORM_SUBMITTED: lambda t: f'Vendor form submitted for ticket {t}. Please review.',
    NotificationType.L1_APPROVED: lambda t: f'Ticket {t} approved by Employee. Admin review required.',
    NotificationType.L2_APPROVED: lambda t: f'Ticket {t} approved by Admin. Finance Controller review required.',
    NotificationType.L3_APPROVED: lambda t: f'Ticket {t} approved. Please create vendor code in SAP.',
    NotificationType.CLARIFICATION_REQUESTED: lambda t: f'Clarification requested for your application {t}. Please update and resubmit.',
    NotificationType.REJECTED: lambda t: f'Ticket {t} has been rejected. Please check for details.',
    NotificationType.VENDOR_CODE_CREATED: lambda t: f'Vendor code has been created for ticket {t}. Onboarding complete.',
}

NOTIFY_ROLES = {
    NotificationType.FORM_SUBMITTED: [UserRole.EMPLOYEE, UserRole.ADMIN],
    NotificationType.L1_APPROVED: [UserRole.ADMIN],
    NotificationType.L2_APPROVED: [UserRole.FINANCE_CONTROLLER],
    NotificationType.L3_APPROVED: [UserRole.SAP_USER],
    NotificationType.REJECTED: [UserRole.EMPLOYEE],
    NotificationType.VENDOR_CODE_CREATED: [UserRole.ADMIN, UserRole.EMPLOYEE],
}


def send_email(to_email, subject, body):
    """Sends email via SendGrid if API key is present, else prints to console."""
    api_key = getattr(settings, 'SENDGRID_API_KEY', '')
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'notif@hindujarenewables.com')

    if not api_key or api_key.startswith('SG.'):
        print(f"\n[DEV EMAIL FALLBACK]\nTo: {to_email}\nSubject: {subject}\nBody: {body}\n")
        return True

    # Simple implementation using requests for SendGrid API v3
    try:
        url = "https://api.sendgrid.com/v3/mail/send"
        payload = {
            "personalizations": [{"to": [{"email": to_email}]}],
            "from": {"email": from_email},
            "subject": subject,
            "content": [{"type": "text/plain", "value": body}]
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        res = requests.post(url, json=payload, headers=headers)
        return res.status_code in [200, 201, 202]
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


def dispatch(notif_type, vendor_request):
    message = MESSAGES[notif_type](vendor_request.ticket_number)
    roles = NOTIFY_ROLES.get(notif_type, [])

    # Internal notifications
    bulk = []
    for role in roles:
        users = User.objects.filter(role=role, is_active=True)
        for user in users:
            bulk.append(Notification(
                user=user,
                vendor_request=vendor_request,
                ticket_number=vendor_request.ticket_number,
                type=notif_type,
                message=message,
            ))
            # Optional: send email to employees/admins
            # send_email(user.email, f"Vendor Alert: {vendor_request.ticket_number}", message)

    if bulk:
        Notification.objects.bulk_create(bulk)

    # Vendor-facing notifications
    vendor_facing = [
        NotificationType.CLARIFICATION_REQUESTED,
        NotificationType.REJECTED,
        NotificationType.VENDOR_CODE_CREATED,
    ]
    if notif_type in vendor_facing:
        Notification.objects.create(
            vendor_email=vendor_request.vendor_email,
            vendor_request=vendor_request,
            ticket_number=vendor_request.ticket_number,
            type=notif_type,
            message=message,
        )
        send_email(vendor_request.vendor_email, f"Update on your Application: {vendor_request.ticket_number}", message)
