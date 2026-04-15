# User Management Module

## Purpose
This module manages user retrieval and role administration.

## Public API
- `GET /api/v1/users` (admin)
- `GET /api/v1/users/:id` (self or admin)
- `PATCH /api/v1/users/:id/role` (admin)

## Technical Notes
- Uses auth middleware for identity and access control.
- Role updates are persisted using `is_admin` in the `users` table.
- Includes validation for user IDs and authorization checks.

## Logging & Monitoring
- Per-request logs include module, path, status, and latency.
- Internal metrics include request count, error count, and average latency.
