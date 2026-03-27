from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_stats),
    path('users/', views.list_users),
    path('users/create/', views.create_user),
    path('users/<uuid:pk>/deactivate/', views.deactivate_user),
    path('users/<uuid:pk>/activate/', views.activate_user),
    path('reports/export/', views.export_report),
]
