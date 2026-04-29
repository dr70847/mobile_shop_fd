from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Order, Product


def _safe_int(value: Any, default: int) -> int:
    try:
        n = int(value)
        return n if n > 0 else default
    except Exception:
        return default


def _safe_float(value: Any) -> float | None:
    try:
        return float(value)
    except Exception:
        return None


def _safe_date(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except Exception:
        return None


@dataclass
class PageResult:
    data: list[dict]
    meta: dict


class OrderRepository:
    def __init__(self, session: Session):
        self.session = session

    def find_page(
        self,
        *,
        page: int = 1,
        limit: int = 20,
        status: str | None = None,
        min_total: float | None = None,
        max_total: float | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> PageResult:
        page = max(1, page)
        limit = min(max(1, limit), 100)
        offset = (page - 1) * limit

        stmt = select(Order)
        count_stmt = select(func.count()).select_from(Order)

        if status:
            stmt = stmt.where(Order.STATUS == status)
            count_stmt = count_stmt.where(Order.STATUS == status)

        if min_total is not None:
            stmt = stmt.where(Order.total_price >= min_total)
            count_stmt = count_stmt.where(Order.total_price >= min_total)
        if max_total is not None:
            stmt = stmt.where(Order.total_price <= max_total)
            count_stmt = count_stmt.where(Order.total_price <= max_total)

        if date_from:
            stmt = stmt.where(Order.created_at >= date_from)
            count_stmt = count_stmt.where(Order.created_at >= date_from)
        if date_to:
            stmt = stmt.where(Order.created_at <= date_to)
            count_stmt = count_stmt.where(Order.created_at <= date_to)

        stmt = stmt.order_by(Order.created_at.desc()).offset(offset).limit(limit)

        total = self.session.execute(count_stmt).scalar_one()
        rows = self.session.execute(stmt).scalars().all()

        return PageResult(
            data=[
                {
                    "id": o.id,
                    "user_id": o.user_id,
                    "total_price": float(o.total_price),
                    "status": o.STATUS,
                    "created_at": o.created_at.isoformat() if o.created_at else None,
                }
                for o in rows
            ],
            meta={
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": max(1, (total + limit - 1) // limit),
                "sort": "created_at",
                "dir": "desc",
            },
        )


class ProductRepository:
    def __init__(self, session: Session):
        self.session = session

    def find_page(
        self,
        *,
        page: int = 1,
        limit: int = 20,
        q: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        in_stock: bool | None = None,
    ) -> PageResult:
        page = max(1, page)
        limit = min(max(1, limit), 100)
        offset = (page - 1) * limit

        stmt = select(Product)
        count_stmt = select(func.count()).select_from(Product)

        if q:
            like = f"%{q}%"
            stmt = stmt.where((Product.NAME.like(like)) | (Product.description.like(like)))
            count_stmt = count_stmt.where((Product.NAME.like(like)) | (Product.description.like(like)))

        if min_price is not None:
            stmt = stmt.where(Product.price >= min_price)
            count_stmt = count_stmt.where(Product.price >= min_price)
        if max_price is not None:
            stmt = stmt.where(Product.price <= max_price)
            count_stmt = count_stmt.where(Product.price <= max_price)

        if in_stock is True:
            stmt = stmt.where(Product.stock > 0)
            count_stmt = count_stmt.where(Product.stock > 0)
        if in_stock is False:
            stmt = stmt.where(Product.stock == 0)
            count_stmt = count_stmt.where(Product.stock == 0)

        stmt = stmt.order_by(Product.created_at.desc()).offset(offset).limit(limit)

        total = self.session.execute(count_stmt).scalar_one()
        rows = self.session.execute(stmt).scalars().all()

        return PageResult(
            data=[
                {
                    "id": p.id,
                    "name": p.NAME,
                    "description": p.description or "",
                    "price": float(p.price),
                    "stock": int(p.stock),
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                }
                for p in rows
            ],
            meta={
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": max(1, (total + limit - 1) // limit),
                "sort": "created_at",
                "dir": "desc",
            },
        )

