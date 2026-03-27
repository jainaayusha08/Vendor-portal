from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from authentication.permissions import IsAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_logs(request):
    qs = AuditLog.objects.all()
    entity_type = request.query_params.get('entity_type')
    entity_id = request.query_params.get('entity_id')
    if entity_type:
        qs = qs.filter(entity_type=entity_type)
    if entity_id:
        qs = qs.filter(entity_id=entity_id)
    return Response(AuditLogSerializer(qs[:200], many=True).data)
