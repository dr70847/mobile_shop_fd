# 7. Modelimi i Bazes se te Dhenave

Ky dokument mbulon:
- ERD relacional me constraints te avancuara
- indekse performance
- stored procedures dhe triggers ne nivel DB
- strategji NoSQL (kur aplikohet ne mikroservise)

## ERD (Relational)

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : included_in
    PRODUCTS ||--o{ PRODUCT_CATEGORIES : mapped
    CATEGORIES ||--o{ PRODUCT_CATEGORIES : mapped
    USERS ||--o{ REVIEWS : writes
    PRODUCTS ||--o{ REVIEWS : receives
    ORDERS ||--o{ PAYMENTS : has
    ORDERS ||--o| SHIPMENTS : ships_as

    USERS {
      int id PK
      varchar NAME
      varchar email UK
      varchar PASSWORD
      tinyint is_admin DEFAULT 0
      timestamp created_at
    }
    PRODUCTS {
      int id PK
      varchar NAME
      decimal price CHECK_ge_0
      int stock CHECK_ge_0
      enum product_type DEFAULT_PHYSICAL
      varchar sku UK
      enum status DEFAULT_ACTIVE
      timestamp created_at
    }
    ORDERS {
      int id PK
      int user_id FK
      decimal total_price DEFAULT_0 CHECK_ge_0
      enum STATUS DEFAULT_NEW
      json shipping_address JSON_VALID
      timestamp created_at
    }
    ORDER_ITEMS {
      int id PK
      int order_id FK
      int product_id FK
      int quantity CHECK_gt_0
      decimal unit_price CHECK_ge_0
      json product_snapshot JSON_VALID
      timestamp created_at
    }
    CATEGORIES {
      int id PK
      varchar name
      varchar slug UK
      timestamp created_at
    }
    PRODUCT_CATEGORIES {
      int product_id FK
      int category_id FK
      timestamp linked_at
    }
    REVIEWS {
      int id PK
      int user_id FK
      int product_id FK
      int rating CHECK_1_5
      text comment
      timestamp created_at
    }
    PAYMENTS {
      int id PK
      int order_id FK
      enum payment_type
      decimal amount CHECK_gt_0
      enum STATUS DEFAULT_PENDING
      varchar provider_ref
      timestamp created_at
    }
    SHIPMENTS {
      int id PK
      int order_id FK_UK
      varchar tracking_number
      varchar carrier
      enum STATUS DEFAULT_PENDING
      timestamp created_at
    }
```

## Constraints te Avancuara (Relational)

Te implementuara ne `server/schema.sql`:
- **CHECK**:
  - `products.price >= 0`, `products.stock >= 0`
  - `orders.total_price >= 0`
  - `order_items.quantity > 0`, `order_items.unit_price >= 0`
  - `reviews.rating BETWEEN 1 AND 5`
  - `JSON_VALID` per `orders.shipping_address` dhe `order_items.product_snapshot`
- **DEFAULT**:
  - status defaults per `orders`, `payments`, `shipments`
  - `users.is_admin = 0`, `orders.total_price = 0`
- **UNIQUE**:
  - `users.email`, `products.sku`, `categories.slug`
  - `(reviews.user_id, reviews.product_id)`
  - `shipments.order_id` (nje shipment per porosi)
- **FOREIGN KEYS + ON DELETE CASCADE**:
  - `order_items.order_id -> orders.id ON DELETE CASCADE`
  - `product_categories.* -> products/categories ON DELETE CASCADE`
  - `reviews.* -> users/products ON DELETE CASCADE`
  - `payments.order_id -> orders.id ON DELETE CASCADE`
  - `shipments.order_id -> orders.id ON DELETE CASCADE`

## Indekse te Optimizuara per Performance

Te shtuara ne `schema.sql`:
- `idx_orders_user_created(user_id, created_at)` per "my orders"
- `idx_orders_status_created(STATUS, created_at)` per dashboards/fulfillment
- `idx_order_items_order_product(order_id, product_id)` per join-e checkout/details
- `idx_products_status_created(status, created_at)` per katalog public/admin
- `idx_reviews_product_created(product_id, created_at)` per product detail page
- `idx_payments_order_status(order_id, STATUS)` per payment lifecycle queries

## Stored Procedures & Triggers

### Stored Procedures
- `sp_create_order_with_items`
  - krijon porosi nga JSON items ne transaksion
  - bllokon input invalid
  - popullon `order_items` dhe llogarit `total_price`
- `sp_transition_order_status`
  - kontrollon tranzicionet valide te statusit (`NEW -> PENDING_PAYMENT -> PAID -> SHIPPED -> DELIVERED`, me `CANCELLED` sipas rregullave)

### Triggers
- `trg_order_items_before_insert_stock_guard`
  - ndalon insert nese produkti mungon ose stock nuk mjafton
- `trg_order_items_after_insert_reduce_stock`
  - ul stock pas insert te item-it
- `trg_order_items_after_delete_restore_stock`
  - rikthen stock nese item fshihet
- `trg_order_items_after_insert/update/delete_recalc_total`
  - mban `orders.total_price` te sinkronizuar automatikisht

## NoSQL (Kur Aplikohet)

Nese `order-service` ose `catalog-service` kalon ne MongoDB:

### Struktura e koleksioneve
- `orders`:
  - `_id`, `userId`, `status`, `totalPrice`, `shippingAddress`, `createdAt`
  - `items` embedded: `{ productId, quantity, unitPrice, productSnapshot }`
- `products`:
  - `_id`, `sku`, `name`, `status`, `price`, `stock`, `categories[]`
- `users`:
  - `_id`, `email`, `roles[]`, profile fields

### Denormalizim i kalkuluar
- `orders.items.productSnapshot` ruan emrin/cmimin ne moment checkout (audit i qendrueshem).
- `orders.totalPrice` ruhet i denormalizuar dhe rifreskohet me domain events/triggers aplikative.

### Strategjia e shardimit
- **Orders**: shard key `userId + createdAt` (ose hashed `userId`) per shperndarje uniforme dhe query te shpejta te historikut per user.
- **Products**: shard key hashed `_id` ose `sku` sipas pattern-it te leximeve.

### Konsistenca
- Konsistence e forte per operacionet kritike (checkout/payment) ne transaction boundaries.
- Eventual consistency per projection-e read-model (analytics, recommendations).
- Idempotency keys per event consumers dhe retries.
