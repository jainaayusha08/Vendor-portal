import uuid
from django.db import models
from authentication.models import User
from vendors.models import VendorRequest


class ApprovalStage(models.TextChoices):
    L1 = 'L1', 'L1'
    L2 = 'L2', 'L2'
    L3 = 'L3', 'L3'


class ApprovalAction(models.TextChoices):
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'
    CLARIFICATION = 'clarification', 'Clarification'


class ApprovalWorkflow(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor_request = models.ForeignKey(VendorRequest, on_delete=models.CASCADE, related_name='workflow_entries')
    stage = models.CharField(max_length=5, choices=ApprovalStage.choices)
    action = models.CharField(max_length=20, choices=ApprovalAction.choices)
    actioned_by = models.ForeignKey(User, on_delete=models.PROTECT)
    comments = models.TextField(blank=True)
    actioned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'approval_workflow'
        ordering = ['actioned_at']
