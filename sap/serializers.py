from rest_framework import serializers
from .models import SapVendorCode


class SapVendorCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SapVendorCode
        fields = '__all__'
