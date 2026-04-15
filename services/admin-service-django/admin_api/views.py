from rest_framework.response import Response
from rest_framework.views import APIView


class AdminHealthView(APIView):
    def get(self, request):
        return Response({"status": "ok", "service": "admin-service-django"})


class AdminDashboardView(APIView):
    def get(self, request):
        return Response(
            {
                "activeOrders": 12,
                "lowStockProducts": 4,
                "source": "django-drf",
            }
        )
