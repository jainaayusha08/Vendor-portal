from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login),
    path('register/', views.register_employee),
    path('token/refresh/', views.token_refresh),
    path('vendor/send-otp/', views.vendor_send_otp),
    path('vendor/verify-otp/', views.vendor_verify_otp),
]
