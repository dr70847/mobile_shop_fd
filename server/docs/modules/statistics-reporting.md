# Statistics & Reporting Module

## Purpose
This module provides analytics, reporting, and monitoring endpoints for admins.

## Public API
- `GET /api/v1/stats/overview`
- `GET /api/v1/stats/reports/sales-by-day`
- `GET /api/v1/stats/monitoring/modules`

## Technical Notes
- Aggregates data from `users`, `products`, and `orders`.
- Exposes business KPIs such as total orders and total revenue.
- Produces a 30-day sales report grouped by day.

## Logging & Monitoring
- Requests are logged with status and response times.
- Monitoring endpoint returns in-memory metrics from all registered modules.
