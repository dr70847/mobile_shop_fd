# Diagramat Mbeshtetese te Modelit

Ky dokument permbledh diagramat kryesore te kerkuara per pershkrimin e modelit te sistemit MobileShop ne arkitekture microservices.

## 1) Component Diagram

```mermaid
flowchart LR
    Client[React Client] --> Gateway[API Gateway]
    Gateway --> SD[Service Discovery]

    SD --> AuthSvc[auth-service]
    SD --> CatalogSvc[catalog-service]
    SD --> OrderSvc[order-service]
    SD --> InventorySvc[inventory-service]
    SD --> AdminSvc[admin-service]

    OrderSvc --> Bus[(RabbitMQ/Kafka Event Bus)]
    InventorySvc --> Bus
    AdminSvc --> Bus

    AuthSvc --> AuthDB[(Auth DB)]
    CatalogSvc --> CatalogDB[(Catalog DB)]
    OrderSvc --> OrderDB[(Order DB)]
    InventorySvc --> InventoryDB[(Inventory DB)]
    AdminSvc --> AdminDB[(Admin DB)]
```

## 2) Sequence Diagram per API Calls (Checkout Flow)

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as React Frontend
    participant GW as API Gateway
    participant AUTH as auth-service
    participant ORD as order-service
    participant CAT as catalog-service
    participant INV as inventory-service
    participant BUS as RabbitMQ/Kafka
    participant ODB as order DB

    U->>FE: Klikon "Checkout"
    FE->>GW: POST /api/v1/orders/checkout (JWT + cart)
    GW->>AUTH: Validate token / role
    AUTH-->>GW: User valid
    GW->>ORD: Forward checkout request
    ORD->>CAT: Validate products + prices (sync call)
    CAT-->>ORD: Validation result
    ORD->>ODB: INSERT order + order_items (status=created)
    ODB-->>ORD: Persisted
    ORD->>BUS: Publish event order.created
    BUS-->>INV: Consume order.created
    INV->>BUS: Publish inventory.reserved / inventory.rejected
    BUS-->>ORD: Consume inventory outcome
    ORD-->>GW: 201 Created + order status
    GW-->>FE: Unified response
    FE-->>U: Shfaq konfirmimin
```

## 3) Deployment Diagram

```mermaid
flowchart TB
    subgraph UserDevice[User Device]
      Browser[Web Browser]
    end

    subgraph Edge[Edge Layer]
      FE[React App :3000]
      GW[API Gateway :8080]
    end

    subgraph Services[Microservices Cluster]
      AUTH[auth-service]
      CAT[catalog-service]
      ORD[order-service]
      INV[inventory-service]
      ADM[admin-service]
      DISC[Service Discovery]
      MQ[(RabbitMQ/Kafka)]
    end

    subgraph Data[Databases]
      AUTHDB[(auth_db)]
      CATDB[(catalog_db)]
      ORDDB[(order_db)]
      INVDB[(inventory_db)]
      ADMDB[(admin_db)]
    end

    Browser --> FE
    FE --> GW
    GW --> DISC
    DISC --> AUTH
    DISC --> CAT
    DISC --> ORD
    DISC --> INV
    DISC --> ADM

    ORD --> MQ
    INV --> MQ
    ADM --> MQ

    AUTH --> AUTHDB
    CAT --> CATDB
    ORD --> ORDDB
    INV --> INVDB
    ADM --> ADMDB
```

## 4) State Diagram per Entitet Dinamik (Order)

```mermaid
stateDiagram-v2
    [*] --> Created
    Created --> PendingValidation: Checkout submitted
    PendingValidation --> AwaitingInventory: Product validation passed
    PendingValidation --> Rejected: Product or auth validation failed
    AwaitingInventory --> Confirmed: inventory.reserved event
    AwaitingInventory --> Cancelled: inventory.rejected event
    Confirmed --> Processing: Fulfillment started
    Processing --> Shipped: Dispatch completed
    Shipped --> Delivered: Delivery confirmed
    Processing --> Cancelled: Manual cancel / system rule
    Rejected --> [*]
    Cancelled --> [*]
    Delivered --> [*]
```

## Shenime

- Diagramat jane te shkruara ne `mermaid`, prandaj mund te renderohen direkt ne shumicen e IDE-ve dhe platformave te dokumentimit.
- Keto versione jane te pershtatura per modelin microservices me `Gateway`, `Service Discovery`, `Event Bus`, dhe `database-per-service`.
