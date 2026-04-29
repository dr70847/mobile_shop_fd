from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from .db import get_session
from .repositories import OrderRepository, ProductRepository, _safe_date, _safe_float, _safe_int


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


class AdminOrdersView(APIView):
    def get(self, request):
        session = get_session()
        try:
            repo = OrderRepository(session)
            page = _safe_int(request.query_params.get("page"), 1)
            limit = _safe_int(request.query_params.get("limit"), 20)
            status_q = request.query_params.get("status") or None
            min_total = _safe_float(request.query_params.get("minTotal"))
            max_total = _safe_float(request.query_params.get("maxTotal"))
            date_from = _safe_date(request.query_params.get("dateFrom"))
            date_to = _safe_date(request.query_params.get("dateTo"))

            result = repo.find_page(
                page=page,
                limit=limit,
                status=status_q,
                min_total=min_total,
                max_total=max_total,
                date_from=date_from,
                date_to=date_to,
            )
            return Response({"data": result.data, "meta": result.meta})
        except Exception as exc:
            return Response({"message": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            session.close()


class AdminProductsView(APIView):
    def get(self, request):
        session = get_session()
        try:
            repo = ProductRepository(session)
            page = _safe_int(request.query_params.get("page"), 1)
            limit = _safe_int(request.query_params.get("limit"), 20)
            q = (request.query_params.get("q") or "").strip() or None
            min_price = _safe_float(request.query_params.get("minPrice"))
            max_price = _safe_float(request.query_params.get("maxPrice"))
            in_stock_raw = (request.query_params.get("inStock") or "").lower()
            in_stock = True if in_stock_raw == "true" else False if in_stock_raw == "false" else None

            result = repo.find_page(
                page=page,
                limit=limit,
                q=q,
                min_price=min_price,
                max_price=max_price,
                in_stock=in_stock,
            )
            return Response({"data": result.data, "meta": result.meta})
        except Exception as exc:
            return Response({"message": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            session.close()
