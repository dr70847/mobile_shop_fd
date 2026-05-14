# API Reference — MobileShop

Burimi zyrtar i specifikimit: **`server/docs/openapi.js`** (OpenAPI 3.0.3), i shfaqur në **Swagger UI** në:

`https://<host>:<HTTPS_PORT>/docs`

Porti HTTPS lexohet nga `HTTPS_PORT` në `mobile-shop/.env` (shembull: `3444`). Në testim me certifikatë vetë-nënshkruar, shfletuesi mund të kërkojë konfirmim sigurie.

---

## 1. Autentifikimi

Përveç rrugëve të poshtme, ekziston edhe **legacy** `/auth/*` që mapon te i njëjti modul.

### 1.1 Regjistrim

**`POST /api/v1/auth/signup`**

Header: `Content-Type: application/json`

Shembull trupi:

```json
{
  "name": "Arben Krasniqi",
  "email": "arben@example.com",
  "password": "Fjalekalim1"
}
```

Shembull përgjigje e suksesshme (201):

```json
{
  "message": "Account created. Please activate it from your email before login.",
  "user": {
    "id": 12,
    "name": "Arben Krasniqi",
    "email": "arben@example.com",
    "is_admin": false,
    "is_active": false,
    "roles": ["ROLE_USER"]
  },
  "_links": { "...": "..." }
}
```

_Nuk ka token aksesi derisa llogaria të aktivizohet (email) dhe përdoruesi të hyjë._

### 1.2 Hyrje

**`POST /api/v1/auth/login`**

```json
{
  "email": "arben@example.com",
  "password": "Fjalekalim1"
}
```

Shembull përgjigje (200), e thjeshtuar:

```json
{
  "token": "<jwt-access>",
  "accessToken": "<jwt-access>",
  "refreshToken": "<refresh-bearer>",
  "expiresIn": 900,
  "user": {
    "id": 12,
    "email": "arben@example.com",
    "name": "Arben Krasniqi",
    "is_admin": false,
    "roles": ["ROLE_USER"]
  }
}
```

Header për rrugët e mbrojtura:

`Authorization: Bearer <jwt-access>`

### 1.3 OAuth2-style token (opsional)

**`POST /api/v1/auth/oauth/token`**

- `grant_type=password` — fushat `username` (email) dhe `password`.
- `grant_type=refresh_token` — fusha `refresh_token`.

### 1.4 Përdoruesi aktual

**`GET /api/v1/auth/me`** — kërkon `Bearer` token.

### 1.5 Aktivizim llogarie

**`GET /api/v1/auth/activate?token=<token nga email>`**

---

## 2. Produktet

Baza e rrugës: **`/api/v1/products`** (e njëjta logjikë mund të arrihet edhe nën `/api/v1/business/products`).

### 2.1 Lista

**`GET /api/v1/products`**

Përgjigje tipike: listë ose objekt me `items` (sipas implementimit të rrugës).

### 2.2 Detaj

**`GET /api/v1/products/:id`**

### 2.3 Krijim (admin)

**`POST /api/v1/products`** — `Authorization: Bearer <admin-jwt>`

```json
{
  "name": "Telefon X",
  "description": "Përshkrim",
  "price": 499.99,
  "stock": 10,
  "image_url": "https://example.com/img.png"
}
```

### 2.4 Përditësim / fshirje (admin)

- **`PUT /api/v1/products/:id`**
- **`DELETE /api/v1/products/:id`**

---

## 3. Porositë

- **`GET /api/v1/orders/my`** — porositë e përdoruesit të autentikuar.
- **`POST /api/v1/orders/checkout`** — kërkon Bearer.

Shembull trupi:

```json
{
  "items": [
    { "product_id": 1, "quantity": 2 }
  ],
  "shippingAddress": { "line1": "Rruga A", "city": "Prishtinë", "zip": "10000" }
}
```

`shippingAddress` është opsionale (objekt JSON). Çmimet lexohen nga baza; nuk besohet çmimi nga klienti.

---

## 4. Statistika (admin)

- **`GET /api/v1/stats/overview`**
- **`GET /api/v1/stats/reports/sales-by-day`**
- **`GET /api/v1/stats/monitoring/modules`**

Të gjitha me `Authorization: Bearer <admin-jwt>`.

---

## 5. Përdoruesit (admin / profil)

Baza: **`/api/v1/users`** — lista, krijim (admin), `GET/PATCH/DELETE` sipas ID; audit: **`GET /api/v1/users/audit-logs`**. Detajet në kodin e `server/modules/user-management/index.js`.

---

## 6. Shembull `curl` (HTTPS lokal)

```bash
curl -k -s https://localhost:3444/health
```

```bash
curl -k -s -X POST https://localhost:3444/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"yourpassword\"}"
```

Flamuri `-k` anashkalon verifikimin e certifikatës vetë-nënshkruar — **vetëm për dev**.

---

## 7. Kodi përgjigjesh të zakonshëm

| Kodi | Kuptimi i zakonshëm |
|------|---------------------|
| 200 / 201 | Sukses |
| 400 | Validim / input i pavlefshëm |
| 401 | Mungon token ose token i pavlefshëm / i skaduar |
| 403 | Nuk keni të drejtë (jo admin, etj.) |
| 404 | Resurs nuk u gjet |
| 409 | Konflikt (p.sh. email ekzistues) |
| 429 | Shumë kërkesa (rate limit për `/api`) |
| 500 | Gabim serveri / baze të dhënash |

---

_Për listën e plotë të rrugëve, përdorni Swagger UI në `/docs` ose zgjeroni `openapi.js` me skema `requestBody`/`responses` nëse dëshironi dokumentacion edhe më të detajuar._
