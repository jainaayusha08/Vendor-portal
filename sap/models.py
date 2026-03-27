import uuid
from django.db import models
from authentication.models import User
from vendors.models import VendorRequest


class SapVendorCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor_request = models.OneToOneField(VendorRequest, on_delete=models.CASCADE, related_name='sap_code')
    ticket_number = models.CharField(max_length=50)
    vendor_code = models.CharField(max_length=100, unique=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sap_vendor_codes'
