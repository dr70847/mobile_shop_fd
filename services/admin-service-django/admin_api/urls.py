from django.urls import path
from .views import AdminDashboardView, AdminHealthView

urlpatterns = [
    path("health", AdminHealthView.as_view()),
    path("dashboard", AdminDashboardView.as_view()),
]
