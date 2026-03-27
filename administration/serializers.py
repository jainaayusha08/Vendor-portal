from rest_framework import serializers
from authentication.models import User, UserRole


class CreateUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField()
    role = serializers.ChoiceField(choices=UserRole.choices)
    password = serializers.CharField(min_length=6)
    is_sso = serializers.BooleanField(required=False, default=False)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'is_active', 'is_sso', 'created_at']
