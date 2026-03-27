from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_all_requests),
    path('create/', views.create_vendor_request),
    path('my-requests/', views.my_requests),
    path('register/validate/', views.validate_registration_token),
    path('register/submit/', views.submit_vendor_form),
    path('<uuid:pk>/', views.get_vendor_request),
    path('<uuid:pk>/form/', views.get_vendor_form),
    path('<uuid:pk>/admin-fields/', views.save_admin_additions),
]
