from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            'statusCode': response.status_code,
            'message': response.data.get('detail', str(response.data)),
            'error': exc.__class__.__name__,
        }
    return response
