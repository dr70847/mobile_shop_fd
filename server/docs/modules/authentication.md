# Authentication Module

## Purpose
This module handles user authentication and token issuing for protected APIs.

## Public API
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/oauth/token`
- `GET /api/v1/auth/me`

## Technical Notes
- Uses JWT (`Bearer`) for authentication.
- Passwords are hashed with `bcryptjs`.
- User persistence relies on the `users` table.

## Logging & Monitoring
- All requests in this module are logged with duration and status code.
- Internal request/error counters and latency averages are tracked in-memory.
