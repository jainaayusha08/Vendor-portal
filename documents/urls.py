from django.urls import path
from . import views

urlpatterns = [
    path('vendor-request/<uuid:pk>/upload/', views.upload_document),
    path('vendor-request/<uuid:pk>/', views.get_documents),
    path('<uuid:pk>/', views.delete_document),
]
