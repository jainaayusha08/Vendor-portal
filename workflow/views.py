from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from authentication.models import UserRole
from authentication.permissions import IsInternalUser
from vendors.models import VendorRequest, RequestStatus
from audit.models import AuditLog
from .models import ApprovalWorkflow, ApprovalStage, ApprovalAction
from .serializers import ApprovalWorkflowSerializer, ApproveSerializer, RejectSerializer, ClarificationSerializer

STAGE_MAP = {
    RequestStatus.L1_PENDING: (ApprovalStage.L1, RequestStatus.L2_PENDING, UserRole.EMPLOYEE),
    RequestStatus.L2_PENDING: (ApprovalStage.L2, RequestStatus.L3_PENDING, UserRole.ADMIN),
    RequestStatus.L3_PENDING: (ApprovalStage.L3, RequestStatus.SAP_PENDING, UserRole.FINANCE_CONTROLLER),
}


def _validate_stage_access(user_role, current_status):
    entry = STAGE_MAP.get(current_status)
    if not entry:
        return None, None, 'Request is not in an approvable state'
    stage, next_status, required_role = entry
    if user_role not in [required_role, UserRole.SUPER_ADMIN]:
        return None, None, f'Only {required_role} can action this request at this stage'
    return stage, next_status, None


def _get_request(pk):
    try:
        return VendorRequest.objects.get(pk=pk), None
    except VendorRequest.DoesNotExist:
        return None, 'Request not found'


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsInternalUser])
def approve(request, pk):
    req, err = _get_request(pk)
    if err:
        return Response({'message': err}, status=status.HTTP_404_NOT_FOUND)

    stage, next_status, err = _validate_stage_access(request.user.role, req.status)
    if err:
        return Response({'message': err}, status=status.HTTP_403_FORBIDDEN)

    serializer = ApproveSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    already = ApprovalWorkflow.objects.filter(vendor_request=req, stage=stage, action=ApprovalAction.APPROVED).exists()
    if already:
        return Response({'message': 'Request already approved at this stage'}, status=status.HTTP_400_BAD_REQUEST)

    old_status = req.status
    ApprovalWorkflow.objects.create(
        vendor_request=req, stage=stage, action=ApprovalAction.APPROVED,
        actioned_by=request.user, comments=serializer.validated_data.get('comments', ''),
    )
    req.status = next_status
    req.save(update_fields=['status'])

    AuditLog.objects.create(
        user=request.user, action='APPROVE', entity_type='vendor_request',
        entity_id=str(req.id), old_value={'status': old_status}, new_value={'status': next_status},
    )

    # dispatch notification
    from notifications.utils import dispatch
    from notifications.models import NotificationType
    notify_map = {
        ApprovalStage.L1: NotificationType.L1_APPROVED,
        ApprovalStage.L2: NotificationType.L2_APPROVED,
        ApprovalStage.L3: NotificationType.L3_APPROVED,
    }
    dispatch(notify_map[stage], req)

    return Response({'message': f'Approved. Request moved to {next_status}', 'ticket_number': req.ticket_number})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsInternalUser])
def reject(request, pk):
    req, err = _get_request(pk)
    if err:
        return Response({'message': err}, status=status.HTTP_404_NOT_FOUND)

    stage, _, err = _validate_stage_access(request.user.role, req.status)
    if err:
        return Response({'message': err}, status=status.HTTP_403_FORBIDDEN)

    serializer = RejectSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    reason = serializer.validated_data['reason']

    old_status = req.status
    ApprovalWorkflow.objects.create(
        vendor_request=req, stage=stage, action=ApprovalAction.REJECTED,
        actioned_by=request.user, comments=reason,
    )
    req.status = RequestStatus.REJECTED
    req.rejection_reason = reason
    req.save(update_fields=['status', 'rejection_reason'])

    AuditLog.objects.create(
        user=request.user, action='REJECT', entity_type='vendor_request',
        entity_id=str(req.id), old_value={'status': old_status},
        new_value={'status': RequestStatus.REJECTED, 'reason': reason},
    )

    from notifications.utils import dispatch
    from notifications.models import NotificationType
    dispatch(NotificationType.REJECTED, req)

    return Response({'message': 'Request rejected', 'ticket_number': req.ticket_number})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsInternalUser])
def request_clarification(request, pk):
    req, err = _get_request(pk)
    if err:
        return Response({'message': err}, status=status.HTTP_404_NOT_FOUND)

    stage, _, err = _validate_stage_access(request.user.role, req.status)
    if err:
        return Response({'message': err}, status=status.HTTP_403_FORBIDDEN)

    serializer = ClarificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    note = serializer.validated_data['note']

    old_status = req.status
    ApprovalWorkflow.objects.create(
        vendor_request=req, stage=stage, action=ApprovalAction.CLARIFICATION,
        actioned_by=request.user, comments=note,
    )
    req.status = RequestStatus.CLARIFICATION_REQUESTED
    req.clarification_note = note
    req.save(update_fields=['status', 'clarification_note'])

    AuditLog.objects.create(
        user=request.user, action='CLARIFICATION', entity_type='vendor_request',
        entity_id=str(req.id), old_value={'status': old_status},
        new_value={'status': RequestStatus.CLARIFICATION_REQUESTED},
    )

    from notifications.utils import dispatch
    from notifications.models import NotificationType
    dispatch(NotificationType.CLARIFICATION_REQUESTED, req)

    return Response({'message': 'Clarification sent to vendor', 'ticket_number': req.ticket_number})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def workflow_history(request, pk):
    entries = ApprovalWorkflow.objects.filter(vendor_request_id=pk)
    return Response(ApprovalWorkflowSerializer(entries, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def workflow_config(request):
    """Get global workflow setup and approvers information"""
    config = [
        {
            'level': 1,
            'name': 'Amit Sharma',
            'role': 'Department Head',
            'department': 'Procurement',
            'email': 'amit.s@hindujarenewables.com',
            'status': 'L1 – Initial Verification'
        },
        {
            'level': 2,
            'name': 'Sanjay Gupta',
            'role': 'Finance Controller',
            'department': 'Finance',
            'email': 'sanjay.g@hindujarenewables.com',
            'status': 'L2 – Finance Review'
        },
        {
            'level': 3,
            'name': 'Rohan Mehta',
            'role': 'Chief Procurement Officer',
            'department': 'Management',
            'email': 'rohan.m@hindujarenewables.com',
            'status': 'L3 – Final Approval'
        }
    ]
    return Response(config)
