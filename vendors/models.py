import uuid
import random
from datetime import datetime
from django.db import models
from authentication.models import User


class VendorType(models.TextChoices):
    FARMER = 'farmer', 'Farmer'
    DOMESTIC = 'domestic', 'Domestic'
    FOREIGN = 'foreign', 'Foreign'
    GOVERNMENT = 'government', 'Government'
    EMPLOYEE = 'employee', 'Employee'


class RequestStatus(models.TextChoices):
    LINK_SENT = 'link_sent', 'Link Sent'
    FORM_SUBMITTED = 'form_submitted', 'Form Submitted'
    L1_PENDING = 'l1_pending', 'L1 Pending'
    L2_PENDING = 'l2_pending', 'L2 Pending'
    L3_PENDING = 'l3_pending', 'L3 Pending'
    SAP_PENDING = 'sap_pending', 'SAP Pending'
    COMPLETED = 'completed', 'Completed'
    REJECTED = 'rejected', 'Rejected'
    CLARIFICATION_REQUESTED = 'clarification_requested', 'Clarification Requested'


def generate_ticket():
    year = datetime.now().year
    rand = random.randint(10000, 99999)
    return f'VREG-{year}-{rand}'


class VendorRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=50, unique=True)
    employee = models.ForeignKey(User, on_delete=models.PROTECT, related_name='vendor_requests')
    vendor_name = models.CharField(max_length=255)
    vendor_email = models.EmailField()
    vendor_company_name = models.CharField(max_length=255, blank=True)
    vendor_type = models.CharField(max_length=20, choices=VendorType.choices, blank=True)
    status = models.CharField(max_length=30, choices=RequestStatus.choices, default=RequestStatus.LINK_SENT)
    registration_token = models.TextField(blank=True)
    registration_token_expires = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    clarification_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vendor_requests'
        ordering = ['-created_at']

    def __str__(self):
        return self.ticket_number


class VendorForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor_request = models.OneToOneField(VendorRequest, on_delete=models.CASCADE, related_name='form')
    vendor_name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    service_type = models.CharField(max_length=100, blank=True)
    supply_category = models.CharField(max_length=100, blank=True)
    # Address
    street = models.CharField(max_length=255, blank=True)
    house_number = models.CharField(max_length=50, blank=True)
    district = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)
    # Contact
    contact_name = models.CharField(max_length=255, blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    contact_email = models.EmailField(blank=True)
    # Tax
    pan_number = models.CharField(max_length=20, blank=True)
    gst_number = models.CharField(max_length=20, blank=True)
    tan_number = models.CharField(max_length=20, blank=True)
    # MSME
    is_msme = models.BooleanField(default=False)
    msme_number = models.CharField(max_length=50, blank=True)
    # Bank
    bank_name = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    ifsc_code = models.CharField(max_length=20, blank=True)
    branch_address = models.TextField(blank=True)
    # Compliance
    compliance_accepted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vendor_registration_forms'


class AdminAdditions(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor_request = models.OneToOneField(VendorRequest, on_delete=models.CASCADE, related_name='admin_additions')
    added_by = models.ForeignKey(User, on_delete=models.PROTECT)
    company_code = models.CharField(max_length=50, blank=True)
    recall_account = models.CharField(max_length=50, blank=True)
    vendor_group_type = models.CharField(max_length=50, blank=True)
    tax_style = models.CharField(max_length=50, blank=True)
    tax_code = models.CharField(max_length=50, blank=True)
    payment_terms = models.CharField(max_length=100, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'admin_additions'
