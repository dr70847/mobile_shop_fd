# Mobile Shop

A full-stack **mobile phone storefront** demo: customers browse a catalog, add items to a cart, sign in, and check out; **admins** manage inventory from a protected dashboard. Data lives in **MySQL** (e.g. via XAMPP); the API is **Express** and the UI is **React**.

---

## What’s inside

| Area | Purpose |
|------|---------|
| **`client/`** | React app (Create React App): routes, catalog/cart UI, login/signup, orders, admin pages, JWT auth context. Proxies API calls to the backend in development (`http://localhost:3001`). |
| **`server/`** | Express REST API: auth, products, orders. Uses `mysql2`, JWT for sessions, bcrypt for passwords. Loads config from **`.env` in the parent folder** (`mobile-shop/.env`). |
| **`server/schema.sql`** | Reference MySQL schema for `users`, `products`, and `orders` (and optional seed products). The server can also bootstrap tables on startup when configured. |

---

## Features (at a glance)

- **Home / catalog** — Product grid with pricing and stock; cart and checkout flow.
- **Auth** — Register and log in; JWT stored client-side; protected routes for **Orders** (`/orders`).
- **Checkout** — Authenticated users submit cart items; server validates prices from the database.
- **Orders** — Logged-in users can view their order history.
- **Admin** — Users with `is_admin` can open **`/admin`** to create, edit, and delete products (API enforces admin on write operations).
- **Support** — Static support/info page (`/support`).
- **Default admin** — On server start, a default admin user is ensured (email/password configurable via env; see below).

---

## Tech stack

- **Frontend:** React 19, React Router, Axios, CSS modules per page/component.
- **Backend:** Node.js, Express 5, `mysql2`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `cors`.
- **Database:** MySQL (`mobile_shop` database by default).

---

## Prerequisites

- Node.js (LTS recommended) and npm  
- MySQL running locally (e.g. **XAMPP** MySQL on port `3306`)  
- Database created and schema applied (see `server/schema.sql`) unless you rely on the server’s bootstrap

---

## Configuration

Create **`mobile-shop/.env`** (next to `client/` and `server/`) with at least:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mobile_shop
DB_PORT=3306

# API
PORT=3001
JWT_SECRET=your-long-random-secret

# Default admin (optional overrides)
# ADMIN_EMAIL=admin@mobileshop.local
# ADMIN_PASSWORD=admin123
# ADMIN_NAME=Admin
```

Never commit real secrets; `.env` is ignored by Git in this repo.

---

## Run locally

1. **MySQL** — Start MySQL and ensure the `mobile_shop` database exists (run `server/schema.sql` in phpMyAdmin or the MySQL client if needed).

2. **Backend** (port **3001**):

   ```bash
   cd server
   npm install
   npm start
   ```

3. **Frontend** (port **3000**):

   ```bash
   cd client
   npm install
   npm start
   ```

Open **http://localhost:3000**. The React dev server talks to the API through its `proxy` setting.

**Admin login:** use the email/password from your env (defaults: `admin@mobileshop.local` / `admin123` if unchanged). Regular sign-ups are non-admin unless you set `is_admin` in the database.

---

## API overview (high level)

| Prefix | Role |
|--------|------|
| `/api/v1/auth` | Signup, login, OAuth2 password token (`/oauth/token`), `/me` (current user) |
| `/api/v1/products` | List/read products with HATEOAS links; create/update/delete require admin |
| `/api/v1/orders` | List orders; `/my` and `/checkout` require auth |

OpenAPI docs are served at `/docs` (Swagger UI).  
Rate limiting is applied under `/api/*`, and GET responses are cached for product endpoints.

---

## Repository layout

```
mobile-shop/
├── .env              # local secrets (not committed)
├── .gitignore
├── README.md
├── client/           # React SPA
└── server/           # Express API + models + routes
```

This README is a **project map** so you can quickly remember what each part does and how to run it end-to-end.

## Supporting model diagrams

See `DIAGRAMAT_MBESHTETESE_MODELIT.md` for:
- Component Diagram
- Sequence Diagram (API calls)
- Deployment Diagram
- State Diagram (dynamic entity lifecycle)
