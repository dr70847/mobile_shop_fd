# Business Operations Module

## Purpose
This module groups core business capabilities around product catalog and ordering.

## Public API
- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `POST /api/v1/products` (admin)
- `PUT /api/v1/products/:id` (admin)
- `DELETE /api/v1/products/:id` (admin)
- `GET /api/v1/orders`
- `GET /api/v1/orders/my` (auth)
- `POST /api/v1/orders/checkout` (auth)

## Technical Notes
- Product write operations require admin privileges.
- Checkout validates product prices from the database to prevent tampering.
- Uses existing `products`, `orders`, and `order_items` structures.

## Logging & Monitoring
- Unified module-level request logging is enabled.
- Route-level counters and latency statistics are tracked for monitoring.
