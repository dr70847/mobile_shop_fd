# MobileShop Microservices Setup

Ky setup implementon:
- API Gateway
- Service Discovery mechanism (registry statik + lookup opsional nga Consul)
- Backend mix enterprise:
  - `auth-service` (Express.js)
  - `catalog-service` (Express.js + gRPC server)
  - `order-service` (Express.js + RabbitMQ/Kafka producer + gRPC client)
  - `inventory-service` (Spring Boot)
  - `admin-service` (Django + DRF)
- Deploy i pavarur me `docker-compose.microservices.yml`

## Struktura

- `gateway/` -> hyrja e vetme publike
- `services/auth-service/`
- `services/catalog-service/`
- `services/order-service/`
- `services/inventory-service-spring/`
- `services/admin-service-django/`

Secili service ka ndarje ne shtresa:
- `presentation`
- `business`
- `persistence`
- `integration`

(`catalog-service` dhe `order-service` jane mbajtur te thjeshtuar ne nje file server per te ruajtur kompatibilitetin dhe migration gradual.)

## Nisja lokale me Docker

```bash
docker compose -f docker-compose.microservices.yml up --build
```

## Endpoint publik (gateway)

- Health: `GET http://localhost:8080/health`
- Auth:
  - `POST /api/v1/auth/signup`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
- Products:
  - `GET /api/v1/products`
  - `GET /api/v1/products/:id`
  - `POST /api/v1/products`
  - `PUT /api/v1/products/:id`
  - `DELETE /api/v1/products/:id`
- Orders:
  - `GET /api/v1/orders`
  - `GET /api/v1/orders/my`
  - `POST /api/v1/orders/checkout`

Gateway mban edhe route kompatibile me versionin e vjeter:
- `/auth/*`
- `/products/*`
- `/orders/*`

## Service Discovery

Ne `gateway/src/serviceDiscovery.js`:
- default perdoret registry statik me environment variables:
  - `AUTH_SERVICE_URL`
  - `CATALOG_SERVICE_URL`
  - `ORDER_SERVICE_URL`
- eshte shtuar edhe funksion `lookupViaConsul()` per lookup dinamik nga Consul.

## Mesazheri dhe gRPC

- RabbitMQ: `amqp://localhost:5672` (management UI: `http://localhost:15672`)
- Kafka: `localhost:9092`
- gRPC catalog endpoint: `localhost:50052`

`order-service` publikon eventin `order-created` ne RabbitMQ dhe Kafka.
Per validim me latence te ulet, `order-service` ben call gRPC te `catalog-service`.

## Frontend

- Frontend mbetet `React`.
- U shtua `Redux Toolkit` (`catalogSlice`) dhe route dinamike: `/products/:id`.

## Hapi i radhes (rekomanduar)

- Shto persistence reale per `inventory-service` dhe `admin-service`.
- Shto auth interoperability (JWT verification shared middleware/contracts).
- Shto integration tests per flow: checkout -> event bus -> consumers.
