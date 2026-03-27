from rest_framework import serializers
from .models import VendorRequest, VendorForm, AdminAdditions


class CreateVendorRequestSerializer(serializers.Serializer):
    vendor_name = serializers.CharField()
    vendor_email = serializers.EmailField()
    vendor_company_name = serializers.CharField(required=False, allow_blank=True)


class VendorRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorRequest
        fields = '__all__'


class VendorFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorForm
        exclude = ['vendor_request']


class SubmitVendorFormSerializer(serializers.Serializer):
    token = serializers.CharField()
    vendor_name = serializers.CharField()
    company_name = serializers.CharField()
    service_type = serializers.CharField(required=False, allow_blank=True)
    supply_category = serializers.CharField(required=False, allow_blank=True)
    street = serializers.CharField(required=False, allow_blank=True)
    house_number = serializers.CharField(required=False, allow_blank=True)
    district = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    postal_code = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)
    contact_name = serializers.CharField(required=False, allow_blank=True)
    contact_phone = serializers.CharField(required=False, allow_blank=True)
    contact_email = serializers.EmailField(required=False, allow_blank=True)
    pan_number = serializers.CharField(required=False, allow_blank=True)
    gst_number = serializers.CharField(required=False, allow_blank=True)
    tan_number = serializers.CharField(required=False, allow_blank=True)
    is_msme = serializers.BooleanField(required=False)
    msme_number = serializers.CharField(required=False, allow_blank=True)
    bank_name = serializers.CharField(required=False, allow_blank=True)
    account_number = serializers.CharField(required=False, allow_blank=True)
    ifsc_code = serializers.CharField(required=False, allow_blank=True)
    branch_address = serializers.CharField(required=False, allow_blank=True)
    compliance_accepted = serializers.BooleanField(required=False)


class AdminAdditionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminAdditions
        exclude = ['vendor_request', 'added_by']
