from django.urls import path
from . import views

urlpatterns = [
    path('pending/', views.sap_pending),
    path('import/', views.import_vendor_codes),
    path('<uuid:pk>/export/', views.export_vendor_data),
]
