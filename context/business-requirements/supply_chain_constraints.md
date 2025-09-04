# Supply Chain Constraints and Requirements

## Overview
This document defines the business constraints and requirements for stock level optimization across multi-warehouse, cross-border operations with working capital limitations.

## Regional Operating Constraints

### UK Operations
- **Warehouse Locations**: Manchester, London, Birmingham
- **Capacity**: 50,000 unit storage capacity per location
- **Lead Times**: 7-14 days from EU suppliers, 14-28 days from Asia
- **Regulatory**: MHRA compliance for certain product categories
- **Working Hours**: 8 hours/day, 5 days/week standard
- **Peak Seasons**: Q4 (Oct-Dec), Summer holidays impact (Jul-Aug)

### EU Operations  
- **Warehouse Locations**: Amsterdam (Netherlands), Frankfurt (Germany)
- **Capacity**: 75,000 unit storage capacity Amsterdam, 40,000 Frankfurt
- **Lead Times**: 10-18 days from UK, 7-14 days intra-EU, 18-35 days from Asia
- **Regulatory**: CE marking requirements, REACH compliance
- **Customs**: Post-Brexit documentation and duty considerations
- **Languages**: Multi-language labeling requirements (DE, NL, FR)

### USA Operations
- **Warehouse Locations**: Los Angeles (West Coast), Atlanta (East Coast)
- **Capacity**: 100,000 unit storage capacity per location  
- **Lead Times**: 21-35 days from UK/EU, 14-21 days from Mexico
- **Regulatory**: FDA compliance, state-specific regulations
- **Seasonal Patterns**: Back-to-school (Aug-Sep), Holiday season (Nov-Dec)
- **Currency**: USD pricing, quarterly FX hedging policy

## Supplier Constraints

### Minimum Order Quantities (MOQ)
```json
{
  "supplier_tiers": {
    "tier_1_strategic": {
      "moq_range": "500-1000 units",
      "lot_size": "multiples of 100",
      "lead_time_days": "14-21",
      "payment_terms": "Net 30"
    },
    "tier_2_preferred": {
      "moq_range": "1000-2500 units", 
      "lot_size": "multiples of 250",
      "lead_time_days": "21-35",
      "payment_terms": "Net 45"
    },
    "tier_3_standard": {
      "moq_range": "2500-5000 units",
      "lot_size": "multiples of 500", 
      "lead_time_days": "35-56",
      "payment_terms": "Net 60"
    }
  }
}
```

### Lead Time Variability by Category
- **Raw Materials**: ±3 days standard deviation
- **Finished Goods**: ±5 days standard deviation  
- **Seasonal Items**: ±7 days standard deviation
- **Custom/Made-to-Order**: ±14 days standard deviation

### Supplier Capacity Constraints
```json
{
  "supplier_constraints": {
    "SUP-001": {
      "name": "Primary Tea Supplier",
      "max_monthly_capacity": 50000,
      "allocation_window": "monthly",
      "shared_capacity_skus": ["SKU-A001", "SKU-A002", "SKU-A003"]
    },
    "SUP-002": {
      "name": "Packaging Supplier", 
      "max_weekly_capacity": 10000,
      "allocation_window": "weekly",
      "setup_time_hours": 4,
      "changeover_cost": 500
    }
  }
}
```

## Warehouse Operational Constraints

### Storage Capacity by Product Type
```json
{
  "storage_constraints": {
    "ambient": {
      "uk_total": 120000,
      "eu_total": 95000, 
      "usa_total": 180000,
      "unit": "cubic_meters"
    },
    "temperature_controlled": {
      "uk_total": 5000,
      "eu_total": 8000,
      "usa_total": 12000,
      "temperature_range": "2-8°C"
    },
    "hazmat": {
      "uk_total": 1000,
      "eu_total": 1500,
      "usa_total": 2000,
      "special_requirements": ["segregation", "ventilation", "containment"]
    }
  }
}
```

### Processing Capacity Limits
- **Inbound Processing**: 5000 units/day per warehouse
- **Quality Control**: 2000 units/day (10% of throughput typically)
- **Pick/Pack Capacity**: 8000 lines/day standard, 12000 peak
- **Outbound Processing**: 6000 units/day per dock

### Seasonal Capacity Adjustments
```json
{
  "seasonal_multipliers": {
    "Q1": {
      "processing": 0.8,
      "storage": 0.9,
      "reason": "Post-holiday lull"
    },
    "Q2": {
      "processing": 1.0,
      "storage": 1.0, 
      "reason": "Normal operations"
    },
    "Q3": {
      "processing": 1.1,
      "storage": 1.0,
      "reason": "Holiday preparation"
    },
    "Q4": {
      "processing": 1.3,
      "storage": 0.7,
      "reason": "Peak season, high turnover"
    }
  }
}
```

## Working Capital Constraints

### Cash Flow Timing
```json
{
  "payment_cycles": {
    "suppliers": {
      "standard_terms": "Net 45",
      "early_pay_discount": "2/10 Net 45",
      "payment_methods": ["bank_transfer", "trade_finance"],
      "cash_out_timing": "order_date + payment_terms"
    },
    "customers": {
      "retail_terms": "Net 30", 
      "wholesale_terms": "Net 60",
      "cash_in_timing": "invoice_date + collection_terms",
      "collection_rate": 0.98
    }
  }
}
```

### Working Capital Limits by Entity
```json
{
  "wc_limits": {
    "uk_entity": {
      "monthly_limit": 2000000,
      "currency": "GBP",
      "utilization_target": 0.85,
      "emergency_reserve": 300000
    },
    "eu_entity": {
      "monthly_limit": 1500000,
      "currency": "EUR", 
      "utilization_target": 0.80,
      "emergency_reserve": 200000
    },
    "usa_entity": {
      "monthly_limit": 2500000,
      "currency": "USD",
      "utilization_target": 0.90,
      "emergency_reserve": 350000
    }
  }
}
```

### Inventory Carrying Cost Components
- **Storage Cost**: £2.50 per cubic meter per month
- **Insurance**: 0.5% of inventory value annually  
- **Obsolescence Reserve**: 2% of slow-moving inventory quarterly
- **Cost of Capital**: 8% annually (weighted average cost of capital)
- **Total Holding Rate**: ~25% annually (varies by product category)

## Cross-Border Trading Constraints

### Customs and Duties (Post-Brexit)
```json
{
  "trade_routes": {
    "uk_to_eu": {
      "duty_rates": {
        "tea_products": 3.2,
        "herbal_supplements": 6.5,
        "packaging_materials": 0.0
      },
      "documentation": ["commercial_invoice", "origin_certificate", "conformity_declaration"],
      "processing_time_days": 2,
      "minimum_shipment": 1000
    },
    "eu_to_uk": {
      "duty_rates": {
        "tea_products": 2.8,
        "herbal_supplements": 5.0, 
        "packaging_materials": 0.0
      },
      "additional_requirements": ["uk_responsible_person", "ukca_marking"],
      "processing_time_days": 3,
      "minimum_shipment": 1500
    },
    "uk_eu_to_usa": {
      "duty_rates": {
        "tea_products": 6.4,
        "herbal_supplements": 8.0
      },
      "fda_requirements": ["prior_notice", "facility_registration"],
      "processing_time_days": 5,
      "minimum_shipment": 2000
    }
  }
}
```

### FX Exposure Management
- **Natural Hedging**: Match revenue and cost currencies where possible
- **Financial Hedging**: Forward contracts for exposures >£100K, 3-month tenor
- **FX Budget Rate**: Set quarterly, ±5% tolerance before re-forecast
- **Translation Exposure**: Monthly revaluation of inventory at closing rates

## Service Level Requirements

### Customer Service Level Targets
```json
{
  "service_levels_by_channel": {
    "direct_to_consumer": {
      "target_service_level": 99.0,
      "max_backorder_days": 0,
      "stockout_penalty_per_unit": 50.0,
      "reason": "Brand protection and customer experience"
    },
    "retail_partners": {
      "target_service_level": 98.0,
      "max_backorder_days": 7,
      "stockout_penalty_per_unit": 25.0,
      "reason": "Contract SLA requirements"
    },
    "wholesale_distributors": {
      "target_service_level": 95.0,
      "max_backorder_days": 14,
      "stockout_penalty_per_unit": 10.0,
      "reason": "Price-sensitive, flexible timing"
    }
  }
}
```

### Product Priority Matrix
- **Hero Products** (top 20 SKUs): 99.5% service level, zero stockouts tolerated
- **Core Range** (next 200 SKUs): 98% service level, <1% stockout rate
- **Extended Range** (remaining SKUs): 95% service level, <5% stockout rate  
- **Seasonal/Promotional**: 99% during season, 90% off-season

## Regulatory and Compliance Constraints

### Product Registration Requirements
- **UK**: MHRA Traditional Herbal Registration (THR) for medicinal claims
- **EU**: EFSA Novel Foods approval for new ingredients  
- **USA**: FDA DSHEA compliance for dietary supplements

### Labeling and Packaging Constraints
```json
{
  "labeling_requirements": {
    "uk": {
      "language": "English", 
      "mandatory_fields": ["ingredients", "allergens", "batch_code", "expiry"],
      "regulatory_text": "THR registration number if applicable"
    },
    "eu": {
      "languages": ["local_language", "english_optional"],
      "mandatory_fields": ["ingredients", "allergens", "batch_code", "expiry", "nutrition"],
      "regulatory_text": "Health claims must be EFSA approved"
    },
    "usa": {
      "language": "English",
      "mandatory_fields": ["supplement_facts", "ingredients", "allergens", "batch_code"],
      "regulatory_text": "FDA disclaimer for supplements"
    }
  }
}
```

### Shelf Life and Expiry Management
- **Minimum Shelf Life at Receipt**: 75% of total shelf life remaining
- **First Expired First Out (FEFO)**: Mandatory rotation policy
- **Near-Expiry Management**: Automatic markdown at 90 days remaining
- **Disposal Process**: Expired inventory disposal within 30 days

## Quality Control Constraints

### Incoming Quality Control
- **Sample Rate**: 10% of all inbound lots
- **Testing Time**: 2-3 days for microbiological testing
- **Hold/Release Process**: Inventory held until QC clearance
- **Rejection Rate Target**: <2% of inbound lots

### Batch Tracking Requirements
- **Traceability**: Full forward and backward traceability required
- **Batch Size Limits**: Maximum 10,000 units per batch for control
- **Quarantine Capability**: 5% of total warehouse capacity reserved
- **Documentation**: All movements logged with batch references

## Technology and System Constraints

### System Integration Points
```json
{
  "system_constraints": {
    "erp_system": {
      "batch_size_limit": 1000,
      "api_rate_limit": "100 requests/minute",
      "maintenance_windows": ["Saturday 02:00-06:00 GMT"]
    },
    "wms_system": {
      "real_time_inventory": true,
      "batch_processing": "every 15 minutes",
      "capacity_planning": "daily at 23:00"
    },
    "forecasting_system": {
      "update_frequency": "weekly",
      "forecast_horizon": "52 weeks",
      "minimum_history": "12 weeks"
    }
  }
}
```

### Data Quality Requirements
- **Inventory Accuracy**: >99.5% cycle count accuracy
- **Demand Data**: Complete daily sales data within 24 hours
- **Cost Data**: Updated monthly, variance <1% from actual
- **Lead Time Data**: Updated weekly based on supplier performance

## Risk Management Constraints

### Supply Risk Mitigation
- **Dual Sourcing**: Required for A-class items
- **Safety Stock Multipliers**: 1.5x for single-source items
- **Supplier Financial Health**: Quarterly D&B monitoring
- **Geographic Diversification**: No single country >60% of supply

### Demand Risk Management
- **Forecast Accuracy Targets**: MAPE <20% for A items, <30% for B items
- **New Product Introduction**: Conservative forecast until 6 months of data
- **Seasonal Items**: Build inventory 2 months before season peak
- **Promotional Items**: Separate safety stock calculation

## Financial Performance Targets

### Inventory KPIs
- **Inventory Turns**: >6x annually for fast-moving items
- **Days Sales Outstanding**: <45 days average
- **Stockout Rate**: <2% for A items, <5% for B items, <10% for C items
- **Obsolete Inventory**: <3% of total inventory value

### Cost Management Targets  
- **Holding Cost**: <25% of average inventory value annually
- **Procurement Cost**: <2% of purchase value (ordering, receiving, QC)
- **Stockout Cost**: <1% of revenue (lost sales and expediting)
- **Working Capital Efficiency**: Inventory days <60 days

## Seasonal and Event-Driven Constraints

### Peak Season Planning (Q4)
- **Capacity Planning**: 30% increase in processing capability
- **Inventory Build**: Start 8 weeks before peak demand
- **Service Level**: Increase to 99.5% for hero products
- **Staffing**: Temporary staff 6-week minimum contracts

### Promotional Event Constraints
- **Lead Time**: 12 weeks notice for major promotions
- **Inventory Commitment**: 150% of projected demand for featured items
- **Pricing Protection**: Costs locked 8 weeks before promotion
- **Post-Event**: Excess inventory disposition plan required

## Sustainability and ESG Constraints

### Environmental Requirements
- **Packaging Sustainability**: 90% recyclable materials by 2025
- **Transport Optimization**: Consolidate shipments >80% container utilization
- **Carbon Footprint**: 20% reduction in CO2/unit by 2025
- **Waste Reduction**: Zero waste to landfill by 2024

### Social Responsibility
- **Supplier Code**: All Tier 1 suppliers must be certified
- **Fair Trade**: 50% of tea sourcing from certified sources
- **Local Sourcing**: 30% of packaging from local suppliers
- **Community Impact**: Preference for suppliers with community programs