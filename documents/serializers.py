from rest_framework import serializers
from .models import VendorDocument


class VendorDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorDocument
        fields = '__all__'
