from django.urls import path
from . import views

urlpatterns = [
    path('<uuid:pk>/approve/', views.approve),
    path('<uuid:pk>/reject/', views.reject),
    path('<uuid:pk>/clarification/', views.request_clarification),
    path('<uuid:pk>/history/', views.workflow_history),
    path('config/', views.workflow_config),
]
