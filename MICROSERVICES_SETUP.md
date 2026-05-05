# MobileShop Microservices Setup

Ky setup implementon:
- **API Gateway** (Node.js + proxy) — i njëjti roli si **Zuul** / **Spring Cloud Gateway** në botën Spring: një pikë hyrjeje, rrugë API, centralizim të thjeshtë të gabimeve (`502`).
- **Edge / API management**:
  - **Nginx** (`infra/nginx/nginx.conf`) — reverse proxy para gateway-it (porti `9080`); shembull i “menaxhimit të kërkesave hyrëse” në shtresën e rrjetit (forward headers, hyrje e vetme).
  - **Kong** (opsionale, `docker compose --profile kong ...`) — gateway me plugin-e; konfig fillestar: `infra/kong/kong.yml`.
- **Service Discovery** — **Consul** (`register-services.sh` + health checks) dhe **Eureka** (`eureka-server`; `inventory-service` regjistrohet si klient Spring); gateway zgjedh URL sipas radhës së konfiguruar.
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
- `services/eureka-server/`
- `services/admin-service-django/`
- `infra/nginx/`, `infra/kong/`, `infra/consul/`

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

Me **Kong** (portet `9130` proxy, `9131` admin):

```bash
docker compose -f docker-compose.microservices.yml --profile kong up --build
```

## Endpoint publik

- Direkt tek gateway: `GET http://localhost:8080/health`
- Përmes **Nginx edge**: `GET http://localhost:9080/health`
- **Consul UI**: `http://localhost:8500` — shfaq shërbimet e regjistruara nga `infra/consul/register-services.sh`
- **Eureka dashboard**: `http://localhost:8761` — shfaq së paku **INVENTORY-SERVICE** (Spring Boot registron vetë aplikimin Java)
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

Ne `gateway/src/serviceDiscovery.js`, `resolveServiceUrl()`:
1. (**Consul**) nëse është vendosur `CONSUL_URL`, përdoret `GET /v1/health/service/{emër-sherbimi}` që të gjendet një instancë që kalon health check.
2. (**Eureka**) nëse është vendosur `EUREKA_URL` (Docker: `http://eureka-server:8761/eureka`), provo REST-in e Netflix për instanca `UP` (përdoret për `inventory-service`).
3. (**Static fallback**) variablat `AUTH_SERVICE_URL`, `CATALOG_SERVICE_URL`, `ORDER_SERVICE_URL`, `INVENTORY_SERVICE_URL`, `ADMIN_SERVICE_URL`.

Radha e hapave ndryshohet me `SERVICE_RESOLVER_ORDER` (default: `consul,eureka,static`).

## Si ta shpjegosh profesorit (shkurtesë)

1. **API Gateway (Zuul / Kong / Nginx në literaturë):** Zuul është gateway historik në **Spring Cloud Netflix** (tanim **zëvendësuar kryesisht nga Spring Cloud Gateway**, jo nga ky repo). Tek MobileShop gateway-i është **implementuar në Express** sepse pjesa dërrmuese e mikroshërbimeve janë në **Node.js** — por **roli është i njëjtë**: klientët flasin vetëm me një host/port; ky shtresë bën reverse proxy dhe rrugët API. **Nginx** para gateway-it është shtresa “edge”: pranon gjithë trafikun hyrës dhe ia kalon më tej gateway-it; **Kong** është alternativë industriale me politikë më të pasur (auth, quotas, plugins) — e aktivizoje me `--profile kong`.
2. **Service Discovery (Eureka / Consul):** **Consul** regjistrohen shërbimet me HTTP API një herë në start (job `consul-register`); Eureka mban një **dashbord për shërbimet Spring** dhe `inventory-service` regjistrohet automatikisht. Gateway-i nuk duhet të “hardcoded” adresat kur registry ka instanca aktive dhe të shëndetshme; përfundimisht përdoren URL ENV si rezervë.

Kjo lidh mësimoret teknike (Zuul/Kong/Nginx dhe Eureka/Consul) me implementimin konkret që shikon në kod dhe në `docker-compose.microservices.yml`.

## Mesazheri asinkron, gRPC/REST, Circuit Breaker, Redis, Rate limiting

### Ku është në kod

| Tema | Ku shikon | Shënim |
|------|-----------|--------|
| **RabbitMQ** (publish) | `services/order-service/src/integration/messageBus.js` | Exchange `orders`, routing key `orders.created`. |
| **RabbitMQ** (consume: porosi + inventory events) | `services/order-service/src/integration/inventoryEventConsumer.js` | Radhët `inventory.reserved` / `inventory.rejected`. |
| **RabbitMQ** (consume: Spring) | `services/inventory-service-spring/.../OrderCreatedRabbitListener.java`, `RabbitMqTopologyConfig.java` | Radha `orders.created` → log / zgjerim i ardhshëm. |
| **Kafka** (publish) | `services/order-service/src/integration/messageBus.js` | Topic nga `KAFKA_TOPIC` (default `order-created`). |
| **Kafka** (consume demo) | `services/order-service/src/integration/kafkaOrderAuditConsumer.js` | Aktiv me `ENABLE_KAFKA_AUDIT_CONSUMER=true` (compose e ndez). |
| **gRPC** (server) | `services/catalog-service/src/integration/grpcCatalogServer.js`, `services/order-service/src/proto/catalog.proto` | Port `GRPC_PORT` (50052). |
| **gRPC + REST fallback** | `services/order-service/src/integration/grpcCatalogClient.js` (opossum), `services/order-service/src/business/orderService.js` | Nëse gRPC dështon ose circuit breaker është **OPEN**, përdoret REST `catalogReadRepository`. |
| **Circuit Breaker (Java / Resilience4j)** | `services/inventory-service-spring/.../CatalogRestClient.java`, `application.yml` (`resilience4j.circuitbreaker`) | Thirrje REST nga inventory → catalog; **Hystrix** është legacy — përdoret **Resilience4j**. |
| **Redis cache** | `services/catalog-service/src/integration/productCache.js`, `services/catalog-service/src/business/productService.js` | Nëse `REDIS_URL` është vendosur; invalidim pas mutimeve. |
| **Rate limit (Node)** | `gateway/src/server.js` | `express-rate-limit`; variabla `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`. |
| **Rate limit (Java / Bucket4j)** | `services/inventory-service-spring/.../http/ApiRateLimiterFilter.java` | Kufi për minutë nga `INVENTORY_RATE_LIMIT_PER_MIN` / `mobileshop.ratelimit.requests-per-minute`. |
| **Infra** | `docker-compose.microservices.yml` | Shërbimet `redis`, `rabbitmq`, `kafka`, variabla mjedisi. |

### Si ta tregosh me **website** (UI) vs **kod**

- **RabbitMQ Management:** `http://localhost:15672` (user/pass zakonisht `guest` / `guest`) — shikon **exchanges**, **queues**, **bindings**; pas checkout shfaqen mesazhet në exchange `orders`.
- **Kafka:** nuk ka UI default në compose; verifikim nga **logjet** e `order-service` (`[Kafka consumer] ...`) ose me mjete të jashtme (Kafka UI). **Publish** provohet duke bërë checkout dhe duke parë logjet.
- **gRPC:** jo browser; dëshmo me **kod** + logje (`catalog-service gRPC running...`) ose me `grpcurl` nëse e ke.
- **Redis:** UI opsionale (RedisInsight); në praktikë **dy kërkesa** `GET /api/v1/products` — e dyta duhet të jetë më e shpejtë kur cache është “nxehtë” (verifiko nga `catalog-service` ose matje e thjeshtë).
- **Circuit breaker (opossum):** në logjet e `order-service` shfaqet `[circuit-breaker] gRPC catalog: OPEN` nëse catalog gRPC është i padisponueshëm; pastaj checkout vazhdon me **REST**.
- **Resilience4j:** në logje `catalogProductNameViaRestCircuitBreaker` në përgjigjen e `GET .../stock` kur catalog REST punon; në `GET /actuator/health` kontributorët e shëndetit mund të tregojnë gjendjen e circuit-it (varësisht nga konfigurimi).
- **Rate limit:** thirr shumë herë `GET http://localhost:8081/api/inventory/products/1/stock` me shpejtësi — pas kufirit kthen **429**; për gateway, thirr shpesh çdo rrugë (përveç `/health`) deri të marrësh **429**.

### Shpjegim i shkurtër për profesorin

- **Asinkron:** **RabbitMQ** dhe **Kafka** zhvendosin punën nga kërkesa HTTP: `order-service` publikon ngjarje; konsumatorët (Node ose Spring) i lexojnë **pa bllokuar** përgjigjen e checkout-it.
- **Sinkron ndër-modul:** **gRPC** për latencë të ulët; **REST** si alternativë/fallback kur gRPC ose rrjeti dështojnë.
- **Circuit breaker:** mbron sistemin nga thirrjet e përsëritura te një shërbim i sëmurë (**opossum** në Node, **Resilience4j** në Spring); **Hystrix** përmendet vetëm historikisht.
- **Redis:** cache e leximeve të shpeshta të katalogut.
- **Rate limiting:** kufizon abuzimin në **gateway** (Express) dhe në **inventory** (Bucket4j).

## Frontend

- Frontend mbetet `React`.
- U shtua `Redux Toolkit` (`catalogSlice`) dhe route dinamike: `/products/:id`.

## Hapi i radhes (rekomanduar)

- Shto persistence reale per `inventory-service` dhe `admin-service`.
- Shto auth interoperability (JWT verification shared middleware/contracts).
- Shto integration tests per flow: checkout -> event bus -> consumers.
