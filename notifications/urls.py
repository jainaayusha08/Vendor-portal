from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_notifications),
    path('unread-count/', views.unread_count),
    path('mark-all-read/', views.mark_all_read),
    path('<uuid:pk>/read/', views.mark_read),
]
