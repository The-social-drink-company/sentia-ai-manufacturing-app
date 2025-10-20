# Data Validation Rules

## Overview
This document defines the comprehensive validation rules for all data imported into the CapLiquify Manufacturing Platform. These rules ensure data quality, business logic compliance, and system integrity.

## General Validation Principles

### Data Type Validation
- **Strict Type Checking**: All fields must match expected data types
- **Format Validation**: Dates, currencies, and identifiers must follow standard formats
- **Encoding Validation**: UTF-8 encoding required for all text fields
- **Null Handling**: Clear distinction between null, empty string, and zero values

### Business Logic Validation
- **Cross-Field Dependencies**: Validate relationships between related fields
- **Temporal Consistency**: Ensure logical date/time sequences
- **Reference Integrity**: Validate foreign key relationships
- **Business Rule Compliance**: Enforce company-specific business rules

## Product Data Validation

### SKU Validation
```
Rules:
- Format: [PRODUCT]-[REGION]-[VARIANT] (e.g., "GABA-RED-UK-001")
- Length: 3-50 characters
- Characters: Alphanumeric, hyphens, underscores only
- Uniqueness: Must be unique across entire system
- Required: Cannot be null or empty

Validation Logic:
- RegEx: ^[A-Z0-9\-_]{3,50}$
- Database uniqueness check
- Product category must be valid (GABA Red, GABA Black, GABA Gold)
- Market region must be valid (UK, EU, USA)
```

### Product Specifications
```
Weight (weight_kg):
- Range: 0.001 - 50.000 kg
- Precision: 3 decimal places
- Required: Yes for active products

Dimensions (dimensions_cm):
- Format: "LxWxH" (e.g., "10.5x5.2x15.0")
- Range: Each dimension 0.1 - 200.0 cm
- Required: Yes for shipping calculations

Unit Cost (unit_cost):
- Range: 0.01 - 10000.00 (currency units)
- Precision: 2 decimal places
- Business Rule: Must be less than selling_price
- Required: Yes for cost calculations

Selling Price (selling_price):
- Range: 0.01 - 10000.00 (currency units)
- Precision: 2 decimal places
- Business Rule: Must be greater than unit_cost
- Market-specific validation: Price ranges vary by region

Production Time (production_time_hours):
- Range: 0.1 - 72.0 hours
- Precision: 2 decimal places
- Business Rule: GABA products typically 2.5-4 hours

Batch Sizes:
- batch_size_min: 1 - 10000 units
- batch_size_max: batch_size_min - 100000 units
- Business Rule: max >= min
```

## Sales Data Validation

### Transaction Validation
```
Quantity Sold (quantity_sold):
- Range: 1 - 10000 per transaction
- Type: Integer
- Business Rule: Cannot exceed available inventory at time of sale

Unit Price (unit_price):
- Range: 0.01 - 1000.00 (currency units)
- Precision: 2 decimal places
- Business Rule: Should be within 50% of product selling_price
- Currency: Must match sales channel currency

Revenue Calculations:
- gross_revenue = quantity_sold × unit_price
- net_revenue = gross_revenue - discounts
- Business Rule: net_revenue >= 0
- Auto-calculation: System validates calculated fields

Discounts:
- Range: 0.00 - gross_revenue
- Business Rule: Cannot exceed gross_revenue
- Percentage Cap: Maximum 90% discount on any single transaction
```

### Date and Time Validation
```
Sale Date (sale_date):
- Format: YYYY-MM-DD
- Range: 2020-01-01 to current_date + 7 days
- Business Rule: Cannot be future date (except for pre-orders)
- Required: Yes

Sale DateTime (sale_datetime):
- Format: ISO 8601 with timezone
- Range: Must be within same day as sale_date
- Timezone: Must match sales channel timezone
- Business Rule: Cannot be more than 24 hours from sale_date
```

### Geographic Validation
```
Shipping Country:
- Format: ISO 3166-1 alpha-2 country codes
- Valid Values: Subset based on business operations
- UK: GB, EU: 27 EU country codes, USA: US
- Business Rule: Must match sales channel region

Shipping Region:
- UK: England, Scotland, Wales, Northern Ireland
- EU: Valid EU country/region combinations
- USA: Valid state codes
- Cross-reference: Must be valid for shipping_country
```

## Financial Data Validation

### Currency and Monetary Values
```
Currency Validation:
- Format: ISO 4217 currency codes (GBP, EUR, USD)
- Business Rule: Must match market region currency
- Exchange Rates: Historical rates must be within market tolerance

Cost Validation:
- cost_of_goods_sold: 0.01 - unit_price
- shipping_cost: 0.00 - 100.00
- platform_fees: 0.00 - gross_revenue × 0.30 (30% cap)
- taxes: 0.00 - net_revenue × applicable_tax_rate

Profit Calculations:
- net_profit = net_revenue - cost_of_goods_sold - shipping_cost - platform_fees - taxes
- Business Rule: Profit margin should be > -100% (loss limit)
- Warning: Alert if margin < 10%
```

### Platform-Specific Validation
```
Amazon Validation:
- Order ID Format: XXX-XXXXXXX-XXXXXXX
- Fee Structure: Referral fee 15%, FBA fee variable
- Fulfillment: Must be "FBA" or "FBM"
- Business Rule: FBA orders must have valid FBA fees

Shopify Validation:
- Order ID Format: Numeric, 10+ digits
- Fee Structure: Transaction fee 2.9% + currency fee
- Fulfillment: Must be "Own" for Shopify stores
- Business Rule: Payment status must align with order status
```

## Manufacturing Data Validation

### Production Schedule Validation
```
Job Validation:
- job_type: Must be valid production type
- scheduled_start: Cannot be in the past (except updates)
- scheduled_end: Must be after scheduled_start
- estimated_duration: Must align with product production_time_hours

Resource Allocation:
- Resources must be available during scheduled time
- Capacity constraints: Cannot exceed resource max capacity
- Skill Requirements: Resources must have required capabilities
- Business Rule: No double-booking of critical resources
```

### Quality Control Validation
```
Quality Metrics:
- Defect Rate: 0.00 - 100.00 percentage
- Test Results: Pass/Fail with numerical scores
- Batch Traceability: Every batch must have unique identifier
- Compliance: All regulatory checkpoints must be completed

Material Consumption:
- Bill of Materials: Must match approved formulations
- Waste Percentage: 0.00 - 20.00% (alert if > 10%)
- Yield Rate: 70.00 - 100.00% (alert if < 85%)
```

## Data Quality Scoring

### Completeness Score (0-1 scale)
```
Calculation:
- Required fields present: 0.4 weight
- Optional fields present: 0.2 weight
- Reference data linked: 0.2 weight
- Metadata complete: 0.2 weight

Scoring Bands:
- 0.90-1.00: Excellent quality
- 0.75-0.89: Good quality
- 0.60-0.74: Acceptable quality
- 0.00-0.59: Poor quality (manual review required)
```

### Accuracy Score (0-1 scale)
```
Factors:
- Data type compliance: 0.3 weight
- Format compliance: 0.3 weight
- Business rule compliance: 0.4 weight

Penalties:
- Critical business rule violation: -0.5
- Data type mismatch: -0.3
- Format error: -0.2
- Minor validation warning: -0.1
```

## Cross-System Validation Rules

### Inventory Consistency
```
Stock Level Validation:
- Sales cannot exceed available inventory
- Negative inventory requires approval
- Cross-platform inventory sync within 1 hour
- FBA vs Own stock segregation

Inventory Movements:
- All movements must have valid reason codes
- Adjustment transactions require authorization
- Physical count discrepancies flagged for review
```

### Financial Reconciliation
```
Revenue Matching:
- Platform reported revenue vs system calculated
- Tolerance: ±1% or ±$10 per transaction
- Currency conversion using daily rates
- Tax calculations must match jurisdictional rules

Cost Allocation:
- Manufacturing costs allocated by batch
- Shipping costs allocated by order
- Platform fees matched to platform statements
- Exchange rate gains/losses tracked separately
```

## Error Handling and Reporting

### Validation Error Classifications
```
Critical Errors (Import Rejected):
- Data type mismatches
- Required field missing
- Business rule violations
- Security/compliance violations

Warning Errors (Import Accepted with Flags):
- Data quality concerns
- Business logic anomalies
- Potential duplicate records
- Statistical outliers

Information Messages:
- Data transformation notifications
- Auto-correction applied
- Default values used
- Reference data updated
```

### Error Resolution Workflow
```
1. Error Detection: Real-time validation during import
2. Error Logging: Detailed error messages with context
3. Error Notification: User alerts with correction guidance
4. Error Correction: Web interface for manual fixes
5. Batch Correction: Tools for systematic error resolution
6. Validation Rerun: Automatic revalidation after corrections
```

## Validation Rule Management

### Rule Configuration
```
Dynamic Rules: Business users can configure certain validation rules
Static Rules: System-enforced rules that cannot be modified
Override Controls: Admin ability to temporarily disable non-critical rules
A/B Testing: Ability to test new validation rules before deployment

Version Control:
- All rule changes tracked in audit log
- Rollback capability for rule changes
- Impact analysis before rule modifications
- Notification system for validation rule updates
```

### Performance Optimization
```
Validation Caching: Cache validation results for repeated patterns
Batch Validation: Optimize validation for large datasets
Parallel Processing: Concurrent validation where possible
Early Termination: Stop validation on first critical error

Monitoring:
- Validation performance metrics
- Rule effectiveness tracking
- False positive/negative analysis
- Continuous improvement feedback loop
```