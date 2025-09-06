# Database Schema Documentation

## Overview

The Sentia Manufacturing Dashboard uses a comprehensive PostgreSQL database schema designed for global multi-entity manufacturing operations. The schema supports multi-currency transactions, working capital management, AI-powered forecasting, and comprehensive audit trails.

## Core Architecture

### Database Provider
- **Primary**: Neon PostgreSQL (Cloud-native)
- **ORM**: Prisma with TypeScript support
- **Connection Pooling**: Built-in Neon connection pooling
- **Migrations**: Prisma Migrate for schema versioning

### Global Readiness Features
- **Multi-Entity Support**: Independent business entities with separate reporting
- **Multi-Currency**: Transaction and base currency support with FX conversion
- **Multi-Region**: Geographic region support (UK, EU, USA, ASIA)
- **Compliance**: Tax jurisdiction tracking and regulatory compliance

## Core Business Models

### User Management

#### Users (`users`)
Primary user authentication and authorization model integrated with Clerk.

**Key Fields:**
- `id` (UUID): Primary key
- `username` (String, unique): User login identifier
- `email` (String, unique): Email address
- `role` (String): User role (admin, manager, operator, viewer)
- `permissions` (JSON): Granular permissions array
- `department` (String): User department
- `access_regions` (JSON): Allowed geographic regions
- `two_factor_enabled` (Boolean): 2FA status
- `sso_provider` (String): SSO integration (okta, azuread, google)
- `approved` (Boolean): Manual approval status for JIT provisioning

**Security Features:**
- Account locking with failed login tracking
- Password history and complexity requirements
- Session management with device tracking
- Audit trail integration

**Global Extensions:**
- `default_entity_id`: Default business entity
- `allowed_entity_ids`: Array of accessible entities
- `preferred_currency_code`: User's preferred currency
- `preferred_locale`: Localization preferences

### Product Catalog

#### Products (`products`)
Central product master data with manufacturing specifications.

**Key Fields:**
- `id` (UUID): Primary key
- `sku` (String, unique): Stock keeping unit
- `name` (String): Product name
- `category` (String): Product category
- `market_region` (String): Target market region
- `unit_cost` (Decimal): Manufacturing cost
- `selling_price` (Decimal): Standard selling price
- `production_time_hours` (Decimal): Manufacturing time
- `batch_size_min/max` (Integer): Production batch constraints

**Manufacturing Integration:**
- Weight and dimension specifications
- Production time calculations
- Batch size optimization
- Cost tracking and profitability analysis

#### Markets (`markets`)
Geographic market configuration with regional requirements.

**Key Fields:**
- `code` (String, unique): Market identifier (UK, USA, EU, ASIA)
- `name` (String): Display name
- `region` (String): Geographic region
- `currency_code` (String): Base currency (ISO 4217)
- `tax_rate` (Decimal): Standard tax rate
- `shipping_days` (Integer): Logistics timing
- `regulatory_requirements` (JSON): Compliance rules

**Compliance Features:**
- Import/export restrictions
- Customs requirements
- Regulatory compliance tracking
- Tax calculation support

### Sales & Revenue

#### Historical Sales (`historical_sales`)
Transactional sales data with comprehensive financial tracking.

**Key Fields:**
- `id` (UUID): Primary key
- `product_id` (UUID): Product reference
- `sales_channel_id` (UUID): Channel reference
- `sale_date` (Date): Transaction date
- `quantity_sold` (Integer): Units sold
- `gross_revenue` (Decimal): Total revenue
- `net_revenue` (Decimal): Revenue after deductions
- `cost_of_goods_sold` (Decimal): COGS allocation
- `net_profit` (Decimal): Calculated profit

**Financial Breakdown:**
- `unit_price`: Per-unit selling price
- `discounts`: Applied discounts
- `shipping_cost`: Logistics costs
- `platform_fees`: Channel commissions
- `taxes`: Applied tax amounts

**Global Currency Support:**
- `currency_code_tx`: Transaction currency
- `currency_code_base`: Base reporting currency
- `amount_tx/amount_base`: Multi-currency amounts
- `fx_rate_used`: Exchange rate applied

**Data Quality:**
- `data_quality_score`: Automated quality assessment
- `is_validated`: Manual validation status
- `validation_notes`: Quality control notes

#### Sales Channels (`sales_channels`)
Multi-channel sales platform integration.

**Key Fields:**
- `id` (UUID): Primary key
- `name` (String): Channel name
- `channel_type` (String): Platform type (marketplace, direct, retail)
- `market_code` (String): Target market
- `api_endpoint` (String): Integration endpoint
- `commission_rate` (Decimal): Channel fees
- `sync_enabled` (Boolean): Auto-sync status

**Integration Features:**
- API credentials management (encrypted)
- Marketplace-specific IDs
- Sync frequency configuration
- Error handling and retry logic
- Performance metrics tracking

### Forecasting & AI

#### Forecasts (`forecasts`)
AI-powered demand forecasting with confidence scoring.

**Key Fields:**
- `id` (UUID): Primary key
- `product_id` (UUID): Product reference
- `sales_channel_id` (UUID): Channel reference
- `forecast_date` (Date): Prediction date
- `forecast_horizon_days` (Integer): Prediction timeframe
- `predicted_demand` (Integer): Forecasted units
- `confidence_score` (Decimal): Model confidence (0-1)
- `predicted_revenue` (Decimal): Revenue forecast

**Model Metadata:**
- `model_type` (String): Algorithm used
- `model_version` (String): Model iteration
- `training_data_start/end` (Date): Training period
- `model_accuracy_score` (Decimal): Historical accuracy

**Forecast Ranges:**
- `demand_lower_bound/upper_bound`: Confidence intervals
- `revenue_lower_bound/upper_bound`: Revenue ranges
- `seasonal_factor`: Seasonality adjustment
- `trend_factor`: Trend adjustment

**Validation:**
- `actual_demand/revenue`: Realized values
- `forecast_error`: Prediction error
- `forecast_accuracy`: Accuracy percentage
- `is_approved`: Manual approval status

### Inventory Management

#### Inventory Levels (`inventory_levels`)
Real-time inventory tracking with optimization metrics.

**Key Fields:**
- `id` (UUID): Primary key
- `product_id` (UUID): Product reference
- `location_type` (String): Storage type
- `location_id` (String): Warehouse/location ID
- `available_quantity` (Integer): Available stock
- `reserved_quantity` (Integer): Allocated stock
- `total_quantity` (Integer): Total on hand

**Optimization Metrics:**
- `reorder_point` (Integer): ROP calculation
- `safety_stock` (Integer): Safety stock level
- `economic_order_quantity` (Integer): EOQ optimization
- `days_of_supply` (Integer): Stock coverage
- `turnover_rate_monthly` (Decimal): Inventory velocity

**Financial Valuation:**
- `unit_cost` (Decimal): Per-unit cost
- `total_value` (Decimal): Total inventory value
- `storage_cost_per_unit_monthly` (Decimal): Carrying costs
- Multi-currency valuation support

**Data Integrity:**
- `last_count_date` (Date): Physical count date
- `requires_recount` (Boolean): Recount flag
- `data_source` (String): Source system
- `sync_status` (String): Sync state

### Working Capital Management

#### Working Capital (`working_capital`)
Comprehensive cash flow and working capital projections.

**Key Fields:**
- `id` (UUID): Primary key
- `projection_date` (Date): Forecast date
- `projection_period` (String): Period type (monthly, weekly)
- `product_id` (UUID): Optional product filter
- `market_code` (String): Market scope
- `currency_code` (String): Reporting currency

**Cash Flow Components:**
- `projected_sales_revenue` (Decimal): Revenue forecast
- `cost_of_goods_sold` (Decimal): Direct costs
- `accounts_receivable` (Decimal): AR balance
- `accounts_payable` (Decimal): AP balance
- `inventory_value` (Decimal): Inventory investment
- `net_cash_flow` (Decimal): Period cash flow

**Working Capital Metrics:**
- `cash_conversion_cycle_days` (Integer): CCC calculation
- `days_sales_outstanding` (Integer): DSO metric
- `days_inventory_outstanding` (Integer): DIO metric
- `days_payable_outstanding` (Integer): DPO metric
- `working_capital_turnover` (Decimal): Efficiency ratio

**Advanced Features:**
- `scenario_type` (String): Scenario analysis
- `sensitivity_analysis` (JSON): Parameter sensitivity
- `risk_factors` (JSON): Risk assessment
- `assumptions` (JSON): Model assumptions

**Global Compliance:**
- `tax_jurisdiction` (String): Tax authority
- `vat_rate_applied` (Decimal): Applied tax rate
- `compliance_status` (String): Regulatory status
- `risk_category` (String): Risk classification

## Enhanced Financial Models

### AR/AP Policy Management

#### AR Policies (`ar_policies`)
Accounts receivable terms and collection policies.

**Key Fields:**
- `id` (UUID): Primary key
- `channel_id` (UUID): Sales channel reference
- `term_days` (Integer): Payment terms
- `pct_share` (Decimal): Percentage of sales
- `fees_pct` (Decimal): Channel fees
- `bad_debt_pct` (Decimal): Expected losses
- `active_from/to` (Date): Policy period

#### AP Policies (`ap_policies`)
Accounts payable optimization strategies.

**Key Fields:**
- `id` (UUID): Primary key
- `supplier_id` (String): Supplier identifier
- `term_days` (Integer): Payment terms
- `early_pay_discount_pct` (Decimal): Early payment discount
- `strategy` (String): Payment strategy
- `active_from/to` (Date): Policy period

#### Inventory Policies (`inventory_policies`)
Inventory optimization parameters.

**Key Fields:**
- `id` (UUID): Primary key
- `product_id` (UUID): Product reference
- `target_dio` (Integer): Target inventory days
- `service_level` (Decimal): Service level target
- `rop` (Integer): Reorder point
- `ss` (Integer): Safety stock
- `effective_from/to` (Date): Policy period

### Working Capital Analytics

#### WC Projections (`wc_projections`)
Cash flow projections with scenario analysis.

**Key Fields:**
- `id` (UUID): Primary key
- `run_id` (UUID): Calculation run grouping
- `month` (Date): Projection month
- `cash_in/out` (Decimal): Cash flows
- `net_change` (Decimal): Period change
- `ending_cash` (Decimal): Ending balance
- `scenario` (String): Scenario type

#### WC KPIs (`wc_kpis`)
Key performance indicators tracking.

**Key Fields:**
- `id` (UUID): Primary key
- `run_id` (UUID): Calculation run
- `dso/dpo/dio` (Decimal): Working capital components
- `ccc` (Decimal): Cash conversion cycle
- `inv_turnover` (Decimal): Inventory turnover
- `facility_utilization` (Decimal): Credit utilization

#### WC Scenarios (`wc_scenarios`)
Scenario planning and stress testing.

**Key Fields:**
- `id` (UUID): Primary key
- `name` (String): Scenario name
- `scenario_type` (String): Type classification
- `parameters` (JSON): Scenario parameters
- `status` (String): Approval status
- `run_id` (UUID): Latest execution

#### WC Optimizations (`wc_optimizations`)
AI-driven optimization recommendations.

**Key Fields:**
- `id` (UUID): Primary key
- `recommendation_type` (String): Optimization type
- `current_state` (JSON): Current situation
- `recommended_state` (JSON): Proposed changes
- `impact_analysis` (JSON): Financial impact
- `priority_score` (Decimal): Implementation priority
- `confidence_level` (Decimal): Recommendation confidence

## Global Readiness Models

### Multi-Entity Support

#### Entities (`entities`)
Business entity master data for multi-company operations.

**Key Fields:**
- `id` (UUID): Primary key
- `name` (String): Entity name
- `country_code` (String): ISO country code
- `currency_code` (String): Base currency
- `tax_number` (String): Tax registration
- `address` (Text): Legal address
- `is_active` (Boolean): Status flag

#### Currencies (`currencies`)
Multi-currency support with FX management.

**Key Fields:**
- `code` (String): ISO 4217 currency code (PK)
- `name` (String): Currency name
- `symbol` (String): Currency symbol
- `decimal_places` (Integer): Precision
- `is_active` (Boolean): Status flag

#### FX Rates (`fx_rates`)
Exchange rate management for currency conversion.

**Key Fields:**
- `id` (UUID): Primary key
- `as_of_date` (Date): Rate date
- `base_code` (String): Base currency
- `quote_code` (String): Quote currency
- `rate` (Decimal): Exchange rate (high precision)
- `source` (String): Rate provider

### Tax Management

#### VAT Rates (`vat_rates`)
European VAT rate management.

**Key Fields:**
- `id` (UUID): Primary key
- `country_code` (String): Country identifier
- `rate_name` (String): Rate type (Standard, Reduced, Zero)
- `rate_pct` (Decimal): Tax percentage
- `valid_from/to` (Date): Validity period

#### Sales Tax US (`sales_tax_us`)
US state and local tax rates.

**Key Fields:**
- `id` (UUID): Primary key
- `state_code` (String): US state code
- `locality` (String): City/county
- `rate_pct` (Decimal): Tax percentage
- `valid_from/to` (Date): Validity period

## Data Management Models

### Import Management

#### Data Imports (`data_imports`)
Comprehensive data import tracking and validation.

**Key Fields:**
- `id` (UUID): Primary key
- `import_name` (String): Import identifier
- `import_type` (Enum): Data type (PRODUCTS, SALES, INVENTORY)
- `status` (Enum): Processing status
- `total_rows` (Integer): Total records
- `processed_rows` (Integer): Successfully processed
- `failed_rows` (Integer): Failed records
- `data_quality_score` (Decimal): Overall quality

**File Management:**
- `original_filename` (String): Source file name
- `file_path` (String): Storage location
- `file_size_bytes` (BigInt): File size
- `file_hash` (String): Content hash for integrity

**Processing Metrics:**
- `progress_percentage` (Integer): Completion status
- `processing_duration_seconds` (Integer): Processing time
- `completeness_score` (Decimal): Data completeness
- `accuracy_score` (Decimal): Data accuracy

#### Import Errors (`import_errors`)
Detailed error tracking for data quality.

**Key Fields:**
- `id` (UUID): Primary key
- `import_id` (UUID): Parent import reference
- `row_number` (Integer): Error location
- `error_type` (String): Error classification
- `error_message` (String): Error details
- `original_value` (String): Source value
- `suggested_value` (String): Correction suggestion
- `is_resolved` (Boolean): Resolution status

#### Import Templates (`import_templates`)
Reusable import configurations.

**Key Fields:**
- `id` (UUID): Primary key
- `template_name` (String): Template identifier
- `import_type` (Enum): Target data type
- `field_definitions` (JSON): Field mappings
- `validation_rules` (JSON): Quality rules
- `success_rate` (Decimal): Historical success rate

### System Configuration

#### System Settings (`system_settings`)
Configurable system parameters with versioning.

**Key Fields:**
- `id` (UUID): Primary key
- `category` (String): Setting category
- `key` (String): Setting key
- `name` (String): Display name
- `value_text/integer/decimal/boolean/json` (Various): Typed values
- `data_type` (String): Value type
- `is_encrypted` (Boolean): Security flag
- `version` (Integer): Configuration version

**Environment Support:**
- `environment` (String): Target environment
- `scope` (String): Scope identifier
- `effective_from/to` (DateTime): Validity period
- `requires_restart` (Boolean): Application restart flag

## Manufacturing Models

### Production Planning

#### Jobs (`jobs`)
Manufacturing job scheduling and tracking.

**Key Fields:**
- `id` (UUID): Primary key
- `job_number` (String, unique): Job identifier
- `customer_name` (String): Customer reference
- `product_type` (String): Product category
- `quantity` (Integer): Production quantity
- `priority` (Integer): Job priority
- `status` (String): Current status
- `due_date` (DateTime): Delivery deadline
- `estimated_hours` (Float): Planned duration
- `actual_hours` (Float): Actual duration

#### Schedules (`schedules`)
Production schedule optimization.

**Key Fields:**
- `id` (UUID): Primary key
- `name` (String): Schedule name
- `version` (Integer): Schedule version
- `start_date/end_date` (DateTime): Schedule period
- `optimization_score` (Float): Schedule quality
- `total_jobs` (Integer): Job count
- `completed_jobs` (Integer): Completion status

#### Resources (`resources`)
Manufacturing resource management.

**Key Fields:**
- `id` (UUID): Primary key
- `name` (String): Resource name
- `type` (String): Resource type
- `capacity` (Float): Resource capacity
- `efficiency_rating` (Float): Performance rating
- `cost_per_hour` (Float): Operating cost
- `location` (String): Physical location
- `last_maintenance` (DateTime): Maintenance history

## Security & Audit Models

### Authentication

#### User Sessions (`user_sessions`)
Enhanced session management with security tracking.

**Key Fields:**
- `id` (UUID): Primary key
- `user_id` (UUID): User reference
- `refresh_token_hash` (String): Secure token storage
- `device_name` (String): Device identification
- `ip_address` (String): Session IP
- `ip_country/city` (String): Geolocation
- `expires_at` (DateTime): Expiration time
- `is_suspicious` (Boolean): Security flag

#### Password Reset Tokens (`password_reset_tokens`)
Secure password reset management.

**Key Fields:**
- `id` (UUID): Primary key
- `user_id` (UUID): User reference
- `token_hash` (String): Secure token hash
- `expires_at` (DateTime): Token expiration
- `used_at` (DateTime): Usage timestamp

### Audit Trail

#### Audit Logs (`audit_logs`)
Comprehensive system activity logging.

**Key Fields:**
- `id` (UUID): Primary key
- `user_id` (UUID): Actor reference
- `event_type` (String): Event classification
- `event_data` (JSON): Event details
- `resource_type/id` (String): Affected resource
- `old_value/new_value` (JSON): Change tracking
- `severity` (String): Event severity
- `environment` (String): Environment context

## AI/ML & Agent Models

### Agent Orchestration

#### Agent Runs (`agent_runs`)
AI agent execution tracking and management.

**Key Fields:**
- `id` (UUID): Primary key
- `goal` (String): Agent objective
- `mode` (String): Execution mode (DRY_RUN, PROPOSE, EXECUTE)
- `scope` (JSON): Execution scope
- `status` (String): Current status
- `outcomes` (JSON): Execution results
- `reflection` (JSON): Self-assessment
- `lessons` (JSON): Learning outcomes

#### Agent Steps (`agent_steps`)
Individual agent action tracking.

**Key Fields:**
- `id` (UUID): Primary key
- `run_id` (UUID): Parent run reference
- `step_number` (Integer): Execution sequence
- `tool_id` (String): Tool identifier
- `params` (JSON): Tool parameters
- `expected_outcome` (JSON): Expected result
- `status` (String): Step status
- `result` (JSON): Actual result

#### Agent Policies (`agent_policies`)
AI safety and governance policies.

**Key Fields:**
- `id` (UUID): Primary key
- `name` (String): Policy name
- `role_scope` (String): Applicable roles
- `allowed_tools` (String[]): Permitted tools
- `default_mode` (String): Default execution mode
- `max_steps` (Integer): Step limit
- `require_step_up` (Boolean): Human approval requirement

### Model Management

#### Model Artifacts (`model_artifacts`)
ML model versioning and metadata.

**Key Fields:**
- `id` (UUID): Primary key
- `type` (String): Model type (forecast, optimization)
- `entity_id` (UUID): Entity scope
- `metrics_json` (JSON): Performance metrics
- `params_json` (JSON): Model parameters
- `artifact_url` (String): Model storage location
- `version` (String): Model version
- `status` (String): Model status

#### Model Baselines (`model_baselines`)
Production model management.

**Key Fields:**
- `id` (UUID): Primary key
- `type` (String): Model type
- `entity_id` (UUID): Entity scope
- `active_from/to` (DateTime): Deployment period
- `artifact_id` (UUID): Model reference
- `approver_id` (UUID): Approval authority
- `snapshot_json` (JSON): Model snapshot

### Data Quality

#### DQ Rules (`dq_rules`)
Data quality rule definitions.

**Key Fields:**
- `id` (UUID): Primary key
- `dataset` (String): Target dataset
- `rule_key` (String): Rule identifier
- `severity` (String): Rule severity (WARN, FAIL)
- `config_json` (JSON): Rule configuration
- `active` (Boolean): Rule status

#### DQ Runs (`dq_runs`)
Data quality execution tracking.

**Key Fields:**
- `id` (UUID): Primary key
- `dataset` (String): Target dataset
- `status` (String): Run status
- `total_rules` (Integer): Rule count
- `passed_rules` (Integer): Passed rules
- `failed_rules` (Integer): Failed rules

## Database Indexes and Performance

### Primary Indexes
- All tables have UUID primary keys for global distribution
- Unique constraints on business keys (SKU, job numbers, etc.)
- Composite unique constraints for time-series data

### Performance Indexes
- Time-based queries: Date/timestamp columns with range queries
- User activity: User ID with timestamp for audit trails
- Multi-column indexes for common query patterns
- Partial indexes for active records only

### Global Indexes
- Entity-based partitioning support
- Region-based data access patterns
- Currency code lookups for FX operations
- Cross-reference indexes for related data

## Data Relationships

### Core Business Flow
```
Users -> Products -> Historical Sales -> Forecasts
     -> Markets -> Sales Channels -> Working Capital
```

### Global Entity Relationships
```
Entities -> Currencies -> FX Rates
        -> Historical Sales (multi-currency)
        -> Forecasts (multi-currency)
        -> Working Capital (multi-currency)
```

### Manufacturing Flow
```
Products -> Jobs -> Schedules -> Resources
        -> Inventory Levels -> Working Capital
```

### Data Quality Flow
```
Import Jobs -> Validation Results -> Import Errors
            -> Data Imports -> Historical Sales
```

## Migration Strategy

### Schema Versioning
- Prisma migrations with forward/backward compatibility
- Feature flags for gradual rollout
- Data migration scripts for complex transformations
- Backup and rollback procedures

### Environment Management
- Development → Test → Production pipeline
- Schema synchronization across environments
- Data seeding for development/testing
- Performance testing with production-like data

## Security Considerations

### Data Protection
- Sensitive data encryption at rest
- PII masking in non-production environments
- Row-level security for multi-entity access
- Audit logging for all data modifications

### Access Control
- Role-based permissions with granular controls
- API-level authorization checks
- Database connection pooling with authentication
- Session management with device tracking

### Compliance
- GDPR compliance with right to erasure
- Financial data retention policies
- Multi-jurisdiction tax compliance
- Regulatory reporting capabilities

## Monitoring and Maintenance

### Performance Monitoring
- Query performance tracking
- Index usage analysis
- Connection pool monitoring
- Slow query identification

### Data Health
- Data quality metrics tracking
- Import success rate monitoring
- Referential integrity checks
- Automated data validation

### Backup and Recovery
- Automated daily backups
- Point-in-time recovery capability
- Cross-region backup replication
- Disaster recovery procedures