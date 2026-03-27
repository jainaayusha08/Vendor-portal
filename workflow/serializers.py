from rest_framework import serializers
from .models import ApprovalWorkflow


class ApprovalWorkflowSerializer(serializers.ModelSerializer):
    actioned_by_email = serializers.EmailField(source='actioned_by.email', read_only=True)

    class Meta:
        model = ApprovalWorkflow
        fields = '__all__'


class ApproveSerializer(serializers.Serializer):
    comments = serializers.CharField(required=False, allow_blank=True)


class RejectSerializer(serializers.Serializer):
    reason = serializers.CharField()


class ClarificationSerializer(serializers.Serializer):
    note = serializers.CharField()
