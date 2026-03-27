from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/vendors/', include('vendors.urls')),
    path('api/workflow/', include('workflow.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/sap/', include('sap.urls')),
    path('api/admin-portal/', include('administration.urls')),
    path('api/audit/', include('audit.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
