import uuid
from django.db import models
from authentication.models import User
from vendors.models import VendorRequest


class NotificationType(models.TextChoices):
    FORM_SUBMITTED = 'form_submitted', 'Form Submitted'
    L1_APPROVED = 'l1_approved', 'L1 Approved'
    L2_APPROVED = 'l2_approved', 'L2 Approved'
    L3_APPROVED = 'l3_approved', 'L3 Approved'
    CLARIFICATION_REQUESTED = 'clarification_requested', 'Clarification Requested'
    REJECTED = 'rejected', 'Rejected'
    VENDOR_CODE_CREATED = 'vendor_code_created', 'Vendor Code Created'


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    vendor_email = models.EmailField(blank=True)
    vendor_request = models.ForeignKey(VendorRequest, on_delete=models.CASCADE)
    ticket_number = models.CharField(max_length=50)
    type = models.CharField(max_length=40, choices=NotificationType.choices)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
