import uuid
from django.db import models
from vendors.models import VendorRequest


class DocumentType(models.TextChoices):
    PAN_CARD = 'pan_card', 'PAN Card'
    GST_CERTIFICATE = 'gst_certificate', 'GST Certificate'
    BANK_PROOF = 'bank_proof', 'Bank Proof'
    INCORPORATION_CERTIFICATE = 'incorporation_certificate', 'Incorporation Certificate'
    MSME_CERTIFICATE = 'msme_certificate', 'MSME Certificate'
    ADDRESS_PROOF = 'address_proof', 'Address Proof'


class VendorDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor_request = models.ForeignKey(VendorRequest, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50, choices=DocumentType.choices)
    file_url = models.CharField(max_length=500)
    original_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    uploaded_by = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'vendor_documents'
