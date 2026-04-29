from django.urls import path
from .views import AdminDashboardView, AdminHealthView, AdminOrdersView, AdminProductsView

urlpatterns = [
    path("health", AdminHealthView.as_view()),
    path("dashboard", AdminDashboardView.as_view()),
    path("orders", AdminOrdersView.as_view()),
    path("products", AdminProductsView.as_view()),
]
