# Arkitektura e Sistemit - MobileShop

Ky dokument e kthen backend-in aktual (monolit Express) ne nje arkitekture moderne, te shkallezueshme horizontalisht, me sherbime te pavarura dhe deploy te pavarur.

## 1) Gjendja aktuale (as-is)

Backend-i aktual ne `server/` ekspozon:
- `auth` (`/auth`)
- `products` (`/products`)
- `orders` (`/orders`)

Keto module jane nje pike e mire nisjeje per ndarje ne sherbime te pavarura.

## 2) Arkitektura target (to-be)

### Komponentet kryesore

- **Client layer**
  - `mobile/web client`
- **API Gateway**
  - hyrja e vetme publike
  - authN/authZ, rate limit, logging, request routing
- **Service Discovery**
  - regjistrim dhe zbulim dinamik i instancave te sherbimeve
- **Microservices**
  - `auth-service`
  - `catalog-service`
  - `order-service`
  - `inventory-service` (fillimisht minimal)
  - `notification-service` (event-driven)
- **Data layer**
  - database per secilin service (pattern: database-per-service)
- **Event bus**
  - RabbitMQ/Kafka per evente asinkrone
- **Observability**
  - logs, metrics, traces qendrore

### Shkallezim horizontal

Secili service vendoset ne disa instance (replica) dhe shkallezohet ne menyre te pavarur sipas ngarkeses.

## 3) Ndarja e sherbimeve nga kodi ekzistues

### A) `auth-service`

Merr pergjegjesite nga:
- `server/routes/auth.js`
- `server/models/User.js`
- `server/middleware/auth.js` (si biblioteke e perbashket ose middleware lokal)

API:
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`

DB:
- `users`

### B) `catalog-service`

Merr pergjegjesite nga:
- `server/routes/products.js`
- `server/models/Product.js`

API:
- `GET /products`
- `GET /products/:id`
- `POST /products` (admin)
- `PUT /products/:id` (admin)
- `DELETE /products/:id` (admin)

DB:
- `products`

### C) `order-service`

Merr pergjegjesite nga:
- `server/routes/orders.js`
- `server/models/Order.js`

API:
- `GET /orders/my`
- `POST /orders/checkout`
- `GET /orders/:id` (opsionale ne fazen 1)

DB:
- `orders`, `order_items`

Integrime:
- lexon cmimet nga `catalog-service` (synchronous call) ose nga cache/event projection.

### D) `inventory-service` (faza 2)

Pergjegjesi:
- rezervim stock-u
- ulje stock-u pas porosise
- release stock-u ne rast failure

DB:
- `inventory_movements` ose `stock`

### E) `notification-service` (faza 2)

Pergjegjesi:
- email/SMS pas eventeve `order.created`, `order.paid`

## 4) API Gateway + Service Discovery

## API Gateway

Rekomandim:
- lokale: Traefik ose Kong
- cloud: AWS API Gateway / GCP API Gateway

Funksione:
- JWT verification (ose delegim te `auth-service`)
- routing:
  - `/api/auth/*` -> `auth-service`
  - `/api/products/*` -> `catalog-service`
  - `/api/orders/*` -> `order-service`
- rate limiting dhe request ID

## Service Discovery

Nese perdoret Kubernetes:
- discovery nativ me `Service` + DNS
- p.sh. `http://catalog-service.default.svc.cluster.local`

Nese jo-K8s:
- Consul/Eureka per regjistrim dhe health checks.

## 5) Struktura e rekomanduar e repo-s

```text
mobile_shop_fd-1/
  gateway/
  services/
    auth-service/
      src/
        presentation/
        business/
        persistence/
        integration/
      tests/
    catalog-service/
      src/
        presentation/
        business/
        persistence/
        integration/
      tests/
    order-service/
      src/
        presentation/
        business/
        persistence/
        integration/
      tests/
  shared/
    contracts/
    middleware/
  infra/
    docker/
    k8s/
    observability/
```

Kjo mban ndarje te qarte te shtresave per cdo service:
- **Presentation**: routes/controllers, DTO validation
- **Business Logic**: use-cases/rregulla domain
- **Persistence**: repositories, DB adapters, migrations
- **Integration**: HTTP clients, message broker, external APIs

## 6) Kontrata API (versionim)

Vendos prefix:
- `/api/v1/auth`
- `/api/v1/products`
- `/api/v1/orders`

Rregulla:
- ndryshime breaking vetem ne `v2`
- response envelope i unifikuar:
  - success: `{ data, meta }`
  - error: `{ error: { code, message, details } }`

## 7) Event-driven contracts (minimum)

Evente fillestare:
- `order.created`
- `inventory.reserved`
- `inventory.rejected`
- `order.confirmed`
- `order.cancelled`

Format i rekomanduar:
- `eventId`
- `eventType`
- `occurredAt`
- `source`
- `payload`

## 8) Plan migrimi ne 3 faza

### Faza 1 - Modular Monolith i forte (1-2 jave)

Objektiv:
- ruaj backend ekzistues, por nda kodin sipas shtresave:
  - `presentation`, `business`, `persistence`, `integration`

Detyra:
- izolo logjiken e checkout nga route ne `order business service`
- izolo aksesin DB ne repository classes
- shto OpenAPI spec per endpoint-et ekzistuese
- vendos correlation ID ne cdo request

Rezultat:
- kod gati per nxjerrje ne microservices pa rewrite te madh

### Faza 2 - Nxjerrja e sherbimeve core (2-4 jave)

Objektiv:
- nda `auth-service`, `catalog-service`, `order-service`
- vendos API Gateway

Detyra:
- krijo 3 procese/containers te ndara
- cdo service me DB schema te vet
- implemento communication `order -> catalog` per validim cmimesh
- shto service discovery (K8s DNS ose Consul)

Rezultat:
- deploy i pavarur dhe scale i pavarur per secilin service

### Faza 3 - Event-driven + resiliency (2-3 jave)

Objektiv:
- shto `inventory-service` dhe `notification-service`
- kalim gradual ne flow asinkron me evente

Detyra:
- publiko `order.created` nga `order-service`
- `inventory-service` konsumon eventin dhe kthen `inventory.reserved|rejected`
- `order-service` ben update status sipas eventit
- implemento retry, dead-letter queue, idempotency keys

Rezultat:
- tolerance me e mire ndaj failure, throughput me i larte

## 9) CI/CD dhe testim per deploy te pavarur

Per cdo service:
- pipeline e vecante: lint -> unit tests -> integration tests -> build image -> deploy
- semantic versioning per image tag
- health endpoint `/health` dhe `/ready`

Test strategy:
- unit tests ne business layer
- contract tests mes services (consumer-driven)
- e2e tests per flows kryesore: login, checkout, admin product management

## 10) Minimal stack i rekomanduar

- **Runtime**: Node.js + Express (ose NestJS ne sherbimet e reja)
- **DB**: MySQL/PostgreSQL per service
- **Cache**: Redis
- **Messaging**: RabbitMQ
- **Containers**: Docker
- **Orchestration**: Kubernetes
- **Observability**: Prometheus + Grafana + OpenSearch/ELK + Jaeger

## 11) Rregulla praktike arkitekturore

- Asnje service nuk lexon direkt DB e service-it tjeter.
- Komunikimi behet vetem me API ose evente.
- Cdo service ka owner, pipeline dhe lifecycle te vet.
- Breaking changes ne API behet me versionim.
- Shto feature flags per migrim pa downtime.
