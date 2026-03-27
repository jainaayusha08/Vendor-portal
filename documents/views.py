import os
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import VendorDocument, DocumentType
from .serializers import VendorDocumentSerializer

ALLOWED_MIME = {'application/pdf', 'image/png', 'image/jpeg'}
MAX_SIZE = 40 * 1024 * 1024


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def upload_document(request, pk):
    """Upload a document for a vendor request"""
    file = request.FILES.get('file')
    doc_type = request.data.get('document_type')

    if not file:
        return Response({'message': 'file is required'}, status=status.HTTP_400_BAD_REQUEST)
    if file.content_type not in ALLOWED_MIME:
        return Response({'message': 'Invalid file type. Only PDF, PNG, JPG allowed'}, status=status.HTTP_400_BAD_REQUEST)
    if file.size > MAX_SIZE:
        return Response({'message': 'File too large. Maximum size is 40MB'}, status=status.HTTP_400_BAD_REQUEST)
    if doc_type not in [c[0] for c in DocumentType.choices]:
        return Response({'message': 'Invalid document type'}, status=status.HTTP_400_BAD_REQUEST)

    from vendors.models import VendorRequest
    try:
        req = VendorRequest.objects.get(pk=pk)
    except VendorRequest.DoesNotExist:
        return Response({'message': 'Vendor request not found'}, status=status.HTTP_404_NOT_FOUND)

    uploads_dir = settings.MEDIA_ROOT
    os.makedirs(uploads_dir, exist_ok=True)
    filename = f'{req.ticket_number}_{doc_type}_{file.name}'
    filepath = os.path.join(uploads_dir, filename)
    with open(filepath, 'wb+') as dest:
        for chunk in file.chunks():
            dest.write(chunk)

    doc = VendorDocument.objects.create(
        vendor_request=req,
        document_type=doc_type,
        file_url=f'/uploads/{filename}',
        original_name=file.name,
        file_size=file.size,
        mime_type=file.content_type,
        uploaded_by=str(request.user) if request.user.is_authenticated else '',
    )
    return Response(VendorDocumentSerializer(doc).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_documents(request, pk):
    docs = VendorDocument.objects.filter(vendor_request_id=pk)
    return Response(VendorDocumentSerializer(docs, many=True).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_document(request, pk):
    try:
        doc = VendorDocument.objects.get(pk=pk)
    except VendorDocument.DoesNotExist:
        return Response({'message': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
    doc.delete()
    return Response({'message': 'Document deleted'})
