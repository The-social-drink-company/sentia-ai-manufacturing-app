# CapLiquify Manufacturing Platform - Entity Relationship Diagrams

**Version**: 1.0
**Date**: October 17, 2025

---

## Complete System ER Diagram

```mermaid
erDiagram
    %% USER MANAGEMENT
    User ||--o{ Session : "has sessions"
    User ||--o{ AuditLog : "performs actions"
    User ||--o{ Product : "creates products"
    User ||--o{ Order : "creates orders"
    User ||--o{ ProductionJob : "creates jobs"
    User ||--o{ Scenario : "approves scenarios"
    User ||--o{ Forecast : "approves forecasts"

    %% PRODUCT & INVENTORY
    Product ||--o{ Inventory : "stored at"
    Product ||--o{ StockMovement : "moved as"
    Product ||--o{ SalesData : "generates sales"
    Product ||--o{ OrderItem : "sold as"
    Product ||--o{ Forecast : "forecasted"
    Product ||--o{ ProductionJob : "produced"
    Product ||--o{ WorkingCapital : "impacts capital"

    Warehouse ||--o{ Inventory : "contains inventory"
    Warehouse ||--o{ StockMovement : "records movements"
    Inventory ||--o{ StockMovement : "tracks changes"

    %% SALES & ORDERS
    Customer ||--o{ Order : "places orders"
    Order ||--o{ OrderItem : "contains items"
    OrderItem }o--|| Product : "references product"

    %% PRODUCTION
    ProductionJob ||--o| ProductionSchedule : "scheduled by"
    ProductionJob ||--o{ QualityMetric : "measured by"
    ProductionJob ||--o{ DowntimeEvent : "experiences downtime"
    ProductionJob }o--|| Product : "produces product"

    %% FORECASTING
    Forecast }o--|| Product : "predicts demand for"
    Forecast }o--|| User : "approved by"
    ForecastModel ||--o{ Forecast : "generates predictions"
    OptimizationResult ||--o{ Forecast : "uses forecasts"

    %% INTEGRATION
    IntegrationConfig ||--o{ SyncJob : "executes sync jobs"
    IntegrationConfig ||--o{ WebhookEvent : "receives webhooks"

    %% ENTITIES
    User {
        uuid id PK
        string clerkId UK
        string email UK
        string username UK
        UserRole role
        boolean mfaEnabled
        int sessionTimeout
        datetime lastLogin
    }

    Session {
        uuid id PK
        uuid userId FK
        string token UK
        SessionStatus status
        string ipAddress
        datetime expiresAt
        datetime lastUsedAt
    }

    AuditLog {
        uuid id PK
        uuid userId FK
        AuditAction action
        AuditSeverity severity
        string resourceType
        uuid resourceId
        json before
        json after
        datetime timestamp
    }

    Product {
        uuid id PK
        string sku UK
        string name
        ProductCategory category
        string region
        string channel
        decimal unitCost
        decimal sellingPrice
        boolean isActive
    }

    Warehouse {
        uuid id PK
        string code UK
        string name
        json location
        int capacity
        decimal storageCostPerUnitMonthly
    }

    Inventory {
        uuid id PK
        uuid productId FK
        uuid warehouseId FK
        int quantity
        int safetyStock
        int reorderPoint
        int economicOrderQty
        InventoryStatus status
        date snapshotDate
    }

    StockMovement {
        uuid id PK
        uuid inventoryId FK
        uuid warehouseId FK
        MovementType type
        int quantity
        datetime timestamp
    }

    Customer {
        uuid id PK
        string externalId UK
        string name
        OrderChannel channel
        string region
        decimal lifetimeValue
    }

    Order {
        uuid id PK
        string orderNumber UK
        uuid customerId FK
        OrderChannel channel
        OrderStatus status
        decimal total
        datetime orderDate
    }

    OrderItem {
        uuid id PK
        uuid orderId FK
        uuid productId FK
        int quantity
        decimal unitPrice
        decimal subtotal
    }

    SalesData {
        uuid id PK
        uuid productId FK
        OrderChannel channel
        string region
        date date
        int quantity
        decimal revenue
    }

    ProductionJob {
        uuid id PK
        string jobNumber UK
        uuid productId FK
        int quantity
        ProductionJobStatus status
        datetime scheduledStart
        datetime actualStart
        decimal oee
    }

    ProductionSchedule {
        uuid id PK
        uuid jobId FK UK
        datetime scheduledStart
        datetime scheduledEnd
        int priority
    }

    QualityMetric {
        uuid id PK
        uuid jobId FK
        decimal firstPassYield
        decimal defectRate
        datetime inspectionDate
    }

    DowntimeEvent {
        uuid id PK
        uuid jobId FK
        DowntimeReason reason
        int duration
        datetime startTime
    }

    WorkingCapital {
        uuid id PK
        date date
        uuid productId FK
        int daysInventoryOutstanding
        int daysPayableOutstanding
        int daysSalesOutstanding
        int ccc
    }

    CashRunway {
        uuid id PK
        date date
        decimal cashBalance
        decimal burnRate
        int runwayDays
        BreachRiskLevel breachRisk
    }

    Scenario {
        uuid id PK
        string name
        string scenarioType
        json assumptions
        json results
        ScenarioStatus status
    }

    Forecast {
        uuid id PK
        uuid productId FK
        ForecastModel model
        int horizon
        date forecastDate
        json predictions
        decimal accuracy
        ForecastStatus status
    }

    ForecastModel {
        uuid id PK
        string name UK
        string type
        json parameters
        decimal averageAccuracy
        boolean isActive
    }

    OptimizationResult {
        uuid id PK
        OptimizationType type
        json constraints
        json recommendations
        ApprovalStatus approvalStatus
    }

    Embedding {
        uuid id PK
        string entityType
        uuid entityId
        vector vector
        string content
    }

    IntegrationConfig {
        uuid id PK
        IntegrationSystem system UK
        IntegrationStatus status
        boolean syncEnabled
        datetime lastSync
    }

    SyncJob {
        uuid id PK
        uuid integrationId FK
        SyncJobStatus status
        int recordsProcessed
        int recordsFailed
        datetime startedAt
    }

    WebhookEvent {
        uuid id PK
        string source
        string event
        json payload
        boolean processed
        datetime timestamp
    }
```

---

## User Management Domain

```mermaid
erDiagram
    User ||--o{ Session : "authenticates via"
    User ||--o{ AuditLog : "creates audit trail"

    User {
        uuid id PK "Primary key"
        string clerkId UK "Clerk authentication ID"
        string email UK "User email address"
        string username UK "Login username"
        string firstName "First name"
        string lastName "Last name"
        UserRole role "ADMIN | MANAGER | OPERATOR | VIEWER"
        json permissions "Granular permissions array"
        string department "User department"
        string[] accessRegions "Allowed geographic regions"
        boolean mfaEnabled "MFA status"
        string mfaSecret "MFA secret (encrypted)"
        datetime lastLogin "Last successful login"
        string lastLoginIp "Last login IP address"
        int sessionTimeout "Session duration (seconds)"
        int failedLoginAttempts "Failed login counter"
        datetime accountLockedUntil "Account lock expiration"
        string preferredCurrency "Preferred currency (ISO 4217)"
        string preferredLocale "Preferred locale (ISO 639-1)"
        string preferredTimezone "Preferred timezone (IANA)"
        boolean isActive "Account active status"
        boolean isApproved "Manual approval status"
        datetime createdAt "Account creation timestamp"
        datetime updatedAt "Last update timestamp"
        datetime deletedAt "Soft delete timestamp"
    }

    Session {
        uuid id PK "Primary key"
        uuid userId FK "User reference"
        string token UK "Session JWT token"
        string refreshToken UK "Refresh token"
        SessionStatus status "ACTIVE | EXPIRED | REVOKED"
        string ipAddress "Client IP address"
        string userAgent "Client user agent"
        string deviceName "Device identifier"
        json location "Geolocation data"
        datetime expiresAt "Session expiration"
        datetime lastUsedAt "Last activity timestamp"
        datetime createdAt "Session start"
        datetime revokedAt "Revocation timestamp"
        string revokedReason "Reason for revocation"
    }

    AuditLog {
        uuid id PK "Primary key"
        uuid userId FK "Actor user ID"
        AuditAction action "CREATE | READ | UPDATE | DELETE | LOGIN | LOGOUT | APPROVE | REJECT"
        AuditSeverity severity "INFO | WARNING | ERROR | CRITICAL"
        string resourceType "Entity type (e.g., 'product', 'order')"
        uuid resourceId "Entity ID"
        json before "State before change (immutable)"
        json after "State after change (immutable)"
        string ipAddress "Client IP address"
        string userAgent "Client user agent"
        uuid sessionId "Session reference"
        uuid requestId "Request correlation ID"
        json metadata "Additional context"
        string errorMessage "Error details if applicable"
        datetime timestamp "Immutable event timestamp"
    }
```

---

## Product & Inventory Domain

```mermaid
erDiagram
    Product ||--o{ Inventory : "stored at locations"
    Product ||--o{ StockMovement : "tracks movements"
    Warehouse ||--o{ Inventory : "contains stock"
    Warehouse ||--o{ StockMovement : "records transactions"
    Inventory ||--o{ StockMovement : "generates movements"

    Product {
        uuid id PK
        string sku UK "Stock keeping unit (unique)"
        string name "Product name"
        string description "Product description"
        ProductCategory category "FINISHED_GOODS | RAW_MATERIALS | WORK_IN_PROGRESS | PACKAGING"
        decimal weightKg "Weight in kilograms"
        json dimensions "Length, width, height, unit"
        string hsCode "Harmonized System Code"
        decimal unitCost "Manufacturing cost"
        decimal sellingPrice "Retail selling price"
        string currency "Currency code (ISO 4217)"
        decimal productionTimeHours "Production time"
        int batchSizeMin "Minimum batch size"
        int batchSizeMax "Maximum batch size"
        int shelfLifeDays "Product shelf life"
        string region "Geographic market region"
        string channel "Primary sales channel"
        boolean isActive "Product active status"
        datetime discontinuedAt "Discontinuation date"
        datetime createdAt "Creation timestamp"
        datetime updatedAt "Last update timestamp"
        uuid createdBy FK "Creator user ID"
    }

    Warehouse {
        uuid id PK
        string code UK "Warehouse identifier"
        string name "Warehouse name"
        json location "Address, coordinates"
        string region "Geographic region"
        string timezone "Warehouse timezone"
        int capacity "Total capacity (units)"
        string capacityUnit "Capacity measurement unit"
        decimal utilisationPct "Current utilization %"
        decimal storageCostPerUnitMonthly "Monthly storage cost per unit"
        string currency "Currency code (ISO 4217)"
        boolean isActive "Warehouse active status"
        datetime createdAt "Creation timestamp"
        datetime updatedAt "Last update timestamp"
    }

    Inventory {
        uuid id PK
        uuid productId FK "Product reference"
        uuid warehouseId FK "Warehouse reference"
        int quantity "Current quantity"
        int safetyStock "Safety stock level"
        int reorderPoint "Reorder point (ROP)"
        int economicOrderQty "Economic order quantity (EOQ)"
        InventoryStatus status "AVAILABLE | RESERVED | DAMAGED | EXPIRED | IN_TRANSIT | QUARANTINE"
        decimal unitCost "Unit cost"
        decimal totalValue "Total inventory value"
        decimal turnoverRate "Annual turnover rate"
        int daysOfSupply "Days of supply"
        decimal stockoutRisk "Stockout risk score (0-1)"
        date snapshotDate "Snapshot date"
        datetime createdAt "Creation timestamp"
        datetime updatedAt "Last update timestamp"
    }

    StockMovement {
        uuid id PK
        uuid inventoryId FK "Inventory reference"
        uuid warehouseId FK "Warehouse reference"
        MovementType type "PURCHASE | SALE | TRANSFER | ADJUSTMENT | RETURN | PRODUCTION | WASTAGE | DAMAGE"
        int quantity "Movement quantity (positive=in, negative=out)"
        decimal unitCost "Unit cost"
        decimal totalValue "Total value"
        string referenceType "Source transaction type"
        uuid referenceId "Source transaction ID"
        string reason "Movement reason"
        string notes "Additional notes"
        datetime timestamp "Movement timestamp"
        uuid performedBy FK "User who performed movement"
    }
```

---

## Sales & Orders Domain

```mermaid
erDiagram
    Customer ||--o{ Order : "places orders"
    Order ||--o{ OrderItem : "contains items"
    OrderItem }o--|| Product : "references product"
    Product ||--o{ SalesData : "aggregates to"

    Customer {
        uuid id PK
        string externalId UK "External system ID (Shopify, Amazon)"
        string name "Customer name"
        string email "Customer email"
        string phone "Customer phone"
        string customerType "B2B | B2C"
        string region "Customer region"
        OrderChannel channel "Primary sales channel"
        decimal lifetimeValue "Customer lifetime value (LTV)"
        int totalOrders "Total orders count"
        decimal averageOrderValue "Average order value (AOV)"
        boolean isActive "Customer active status"
        datetime createdAt "Customer created"
        datetime updatedAt "Last update"
    }

    Order {
        uuid id PK
        string orderNumber UK "Unique order number"
        string externalId "External system order ID"
        uuid customerId FK "Customer reference"
        OrderChannel channel "AMAZON_UK | AMAZON_EU | SHOPIFY_UK | etc."
        string region "Order region"
        OrderStatus status "PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED | REFUNDED"
        decimal subtotal "Order subtotal"
        decimal discounts "Applied discounts"
        decimal shippingCost "Shipping cost"
        decimal tax "Tax amount"
        decimal total "Order total"
        string currency "Currency code"
        string shippingMethod "Shipping method"
        json shippingAddress "Shipping address"
        string trackingNumber "Shipment tracking number"
        datetime orderDate "Order placement date"
        datetime shippedDate "Shipment date"
        datetime deliveredDate "Delivery date"
        json metadata "Additional metadata"
        string notes "Order notes"
        datetime createdAt "Order creation"
        datetime updatedAt "Last update"
        uuid createdBy FK "Order creator user ID"
    }

    OrderItem {
        uuid id PK
        uuid orderId FK "Order reference"
        uuid productId FK "Product reference"
        int quantity "Item quantity"
        decimal unitPrice "Unit price"
        decimal discount "Item discount"
        decimal tax "Item tax"
        decimal subtotal "Item subtotal"
        json metadata "Additional metadata"
    }

    SalesData {
        uuid id PK
        uuid productId FK "Product reference"
        OrderChannel channel "Sales channel"
        string region "Sales region"
        date date "Sales date"
        int quantity "Total quantity sold"
        decimal revenue "Total revenue"
        decimal cost "Total cost"
        decimal profit "Total profit"
        string currency "Currency code"
        int orderCount "Number of orders"
        decimal averageOrderValue "Average order value"
        decimal returnRate "Return rate"
        datetime createdAt "Record creation"
        datetime updatedAt "Last update"
    }
```

---

## Production Management Domain

```mermaid
erDiagram
    Product ||--o{ ProductionJob : "produced by jobs"
    ProductionJob ||--o| ProductionSchedule : "scheduled by"
    ProductionJob ||--o{ QualityMetric : "measured by metrics"
    ProductionJob ||--o{ DowntimeEvent : "experiences downtime"

    ProductionJob {
        uuid id PK
        string jobNumber UK "Unique job identifier"
        uuid productId FK "Product reference"
        int quantity "Production quantity"
        int batchSize "Production batch size"
        int priority "Job priority (1-10)"
        ProductionJobStatus status "SCHEDULED | IN_PROGRESS | PAUSED | COMPLETED | CANCELLED | FAILED"
        datetime scheduledStart "Scheduled start time"
        datetime scheduledEnd "Scheduled end time"
        datetime actualStart "Actual start time"
        datetime actualEnd "Actual end time"
        decimal oee "Overall Equipment Effectiveness"
        decimal firstPassYield "First pass yield percentage"
        decimal defectRate "Defect rate percentage"
        int quantityProduced "Actual quantity produced"
        int quantityDefective "Defective quantity"
        int quantityScrap "Scrapped quantity"
        string notes "Job notes"
        datetime createdAt "Job creation"
        datetime updatedAt "Last update"
        uuid createdBy FK "Job creator user ID"
    }

    ProductionSchedule {
        uuid id PK
        uuid jobId FK UK "Production job reference (one-to-one)"
        datetime scheduledStart "Scheduled start time"
        datetime scheduledEnd "Scheduled end time"
        int priority "Schedule priority"
        json assignedResources "Assigned resource IDs"
        string[] dependencies "Dependent job IDs"
        boolean isLocked "Schedule locked status"
        datetime createdAt "Schedule creation"
        datetime updatedAt "Last update"
    }

    QualityMetric {
        uuid id PK
        uuid jobId FK "Production job reference"
        decimal firstPassYield "First pass yield %"
        decimal defectRate "Defect rate %"
        decimal reworkRate "Rework rate %"
        decimal scrapRate "Scrap rate %"
        json defectTypes "Defect type counts"
        decimal defectCost "Cost of defects"
        datetime inspectionDate "Inspection date"
        uuid inspectorId "Inspector user ID"
        string notes "Quality notes"
        datetime timestamp "Metric timestamp"
    }

    DowntimeEvent {
        uuid id PK
        uuid jobId FK "Production job reference"
        DowntimeReason reason "BREAKDOWN | MAINTENANCE | CHANGEOVER | NO_MATERIALS | NO_OPERATOR | QUALITY_ISSUE | POWER_OUTAGE | OTHER"
        string reasonDetails "Detailed reason"
        int duration "Duration in minutes"
        datetime startTime "Downtime start"
        datetime endTime "Downtime end"
        int productionLoss "Units not produced"
        decimal costImpact "Financial impact"
        string notes "Downtime notes"
        datetime timestamp "Event timestamp"
        uuid reportedBy "Reporter user ID"
    }
```

---

## Financial Management Domain

```mermaid
erDiagram
    Product ||--o{ WorkingCapital : "impacts working capital"

    WorkingCapital {
        uuid id PK
        date date "Working capital date"
        uuid productId FK "Product reference (optional)"
        string region "Geographic region"
        int daysInventoryOutstanding "DIO - Days Inventory Outstanding"
        int daysPayableOutstanding "DPO - Days Payable Outstanding"
        int daysSalesOutstanding "DSO - Days Sales Outstanding"
        int ccc "Cash Conversion Cycle (DIO + DSO - DPO)"
        decimal accountsReceivable "Accounts receivable"
        decimal inventory "Inventory value"
        decimal accountsPayable "Accounts payable"
        decimal workingCapital "Working capital (AR + Inv - AP)"
        string currency "Currency code"
        string notes "Working capital notes"
        json dataSource "Data source metadata"
        datetime createdAt "Record creation"
        datetime updatedAt "Last update"
    }

    CashRunway {
        uuid id PK
        date date "Runway calculation date"
        decimal cashBalance "Current cash balance"
        decimal burnRate "Monthly burn rate"
        int runwayDays "Days until cash depletion"
        BreachRiskLevel breachRisk "LOW | MEDIUM | HIGH | CRITICAL"
        date breachDate "Estimated cash depletion date"
        json projectedCashFlow "12-month cash flow projection"
        string currency "Currency code"
        datetime createdAt "Record creation"
        datetime updatedAt "Last update"
    }

    Scenario {
        uuid id PK
        string name "Scenario name"
        string description "Scenario description"
        string scenarioType "best_case | worst_case | most_likely"
        json assumptions "Scenario assumptions (growth %, costs, etc.)"
        json results "Calculated scenario results"
        ScenarioStatus status "DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | ARCHIVED"
        uuid approvedBy FK "Approver user ID"
        datetime approvedAt "Approval timestamp"
        string rejectionReason "Reason for rejection"
        datetime createdAt "Scenario creation"
        datetime updatedAt "Last update"
        uuid createdBy "Creator user ID"
    }
```

---

## Forecasting & AI Domain

```mermaid
erDiagram
    Product ||--o{ Forecast : "forecasted"
    User ||--o{ Forecast : "approves"
    ForecastModel ||--o{ Forecast : "generates predictions"

    Forecast {
        uuid id PK
        uuid productId FK "Product reference"
        ForecastModel model "ARIMA | EXPONENTIAL_SMOOTHING | PROPHET | LSTM | ENSEMBLE"
        int horizon "Forecast horizon (days)"
        date forecastDate "Forecast date"
        json predictions "Time series predictions"
        decimal accuracy "Forecast accuracy (MAPE)"
        decimal confidence "Overall confidence score"
        json lowerBound "Lower confidence interval"
        json upperBound "Upper confidence interval"
        decimal rmse "Root Mean Square Error"
        decimal mae "Mean Absolute Error"
        decimal mape "Mean Absolute Percentage Error"
        datetime trainingDataStart "Training data start date"
        datetime trainingDataEnd "Training data end date"
        ForecastStatus status "PENDING | PROCESSING | COMPLETED | FAILED | APPROVED | REJECTED"
        boolean isApproved "Approval status"
        uuid approvedBy FK "Approver user ID"
        datetime approvedAt "Approval timestamp"
        string modelVersion "Model version"
        json modelParameters "Model hyperparameters"
        json externalFactors "External factors (promotions, seasonality)"
        datetime createdAt "Forecast creation"
        datetime updatedAt "Last update"
    }

    ForecastModel {
        uuid id PK
        string name UK "Model name (unique)"
        string type "statistical | ml | hybrid"
        json parameters "Model configuration"
        json performance "Historical performance metrics"
        decimal averageAccuracy "Average accuracy score"
        string artifactUrl "Model artifact storage URL"
        string modelVersion "Model version"
        boolean isActive "Model active status"
        datetime createdAt "Model creation"
        datetime updatedAt "Last update"
        datetime lastTrainedAt "Last training timestamp"
    }

    OptimizationResult {
        uuid id PK
        OptimizationType type "INVENTORY | PRODUCTION | WORKING_CAPITAL | RESOURCE_ALLOCATION"
        json constraints "Optimization constraints"
        json recommendations "Optimization recommendations"
        json expectedImpact "Projected improvements"
        decimal confidenceScore "Recommendation confidence"
        ApprovalStatus approvalStatus "PENDING | APPROVED | REJECTED | IMPLEMENTED"
        uuid approvedBy "Approver user ID"
        datetime approvedAt "Approval timestamp"
        datetime implementedAt "Implementation timestamp"
        string notes "Optimization notes"
        datetime timestamp "Result timestamp"
        uuid createdBy "Creator user ID"
    }

    Embedding {
        uuid id PK
        string entityType "Entity type (product, forecast, scenario)"
        uuid entityId "Entity ID reference"
        vector vector "Vector embedding (pgvector 1536 dimensions)"
        string model "Embedding model (e.g., text-embedding-ada-002)"
        string content "Original text content"
        json metadata "Additional metadata"
        datetime createdAt "Embedding creation"
    }
```

---

## Integration Domain

```mermaid
erDiagram
    IntegrationConfig ||--o{ SyncJob : "executes sync jobs"

    IntegrationConfig {
        uuid id PK
        IntegrationSystem system UK "AMAZON_SP_API | SHOPIFY | UNLEASHED_ERP | XERO | CLERK | OPENAI"
        string apiKey "API key (encrypted)"
        string apiSecret "API secret (encrypted)"
        string endpoint "API endpoint URL"
        json credentials "Additional credentials (encrypted)"
        IntegrationStatus status "ACTIVE | INACTIVE | ERROR | MAINTENANCE"
        datetime lastSync "Last successful sync"
        string lastError "Last error message"
        boolean syncEnabled "Auto-sync enabled"
        int syncFrequency "Sync frequency (minutes)"
        datetime createdAt "Configuration creation"
        datetime updatedAt "Last update"
    }

    SyncJob {
        uuid id PK
        uuid integrationId FK "Integration reference"
        SyncJobStatus status "PENDING | RUNNING | COMPLETED | FAILED | CANCELLED"
        int recordsProcessed "Records successfully processed"
        int recordsFailed "Records failed"
        datetime startedAt "Job start time"
        datetime completedAt "Job completion time"
        int duration "Job duration (seconds)"
        json errors "Error details array"
        json metadata "Job metadata"
        datetime timestamp "Job timestamp"
    }

    WebhookEvent {
        uuid id PK
        string source "Source system"
        string event "Event type"
        json payload "Event payload"
        boolean processed "Processing status"
        datetime processedAt "Processing timestamp"
        int attempts "Processing attempts"
        string lastError "Last error message"
        datetime timestamp "Event timestamp"
    }
```

---

**Document Version**: 1.0
**Last Updated**: October 17, 2025
**Next Review**: November 17, 2025
**Maintained By**: Data Engineering Team
