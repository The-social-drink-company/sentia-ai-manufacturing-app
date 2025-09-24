# Working Capital Calculations - Business Logic

## Overview

This document defines the mathematical formulas, business rules, and calculation methodologies for the Working Capital Modeling Engine. All calculations follow standard financial accounting practices with customizations for Sentia Manufacturing's multi-market operations.

## Current Implementation Status
- **Working Capital Engine**: DSO/DPO/DIO calculations with multi-currency support ✅ IMPLEMENTED
- **Cash Flow Projections**: Monthly projections with credit facility modeling ✅ IMPLEMENTED
- **Scenario Analysis**: Optimistic, pessimistic, and stress test scenarios ✅ IMPLEMENTED
- **CFO Reporting**: Executive board pack generation with KPI tracking ✅ IMPLEMENTED
- **Multi-entity Support**: Separate calculations per legal entity with consolidation ✅ IMPLEMENTED

## Core Working Capital Components

### 1. Accounts Receivable (AR) Modeling

#### Days Sales Outstanding (DSO)
```
DSO = 365 × (Average AR / Annual Credit Sales)

Where:
- Average AR = (Opening AR + Closing AR) / 2
- Annual Credit Sales = Sum of all credit sales in the trailing 12 months
```

#### AR Aging and Collection Schedule
```
Collections(t) = Σ[Revenue(t-d) × Collection_Rate(d) × (1 - Bad_Debt_Rate)]

Where:
- t = current period
- d = days since sale
- Collection_Rate(d) = percentage collected after d days
- Bad_Debt_Rate = expected write-offs as % of sales
```

#### Channel-Specific AR Terms
Each sales channel has specific collection patterns:

**Amazon (FBA):**
- Collection Terms: 14-day settlement cycles
- Bad Debt Rate: 0.1% (very low due to Amazon guarantee)
- Fees: Deducted upfront (15% commission + FBA fees)

**Shopify (Direct):**
- Collection Terms Mix:
  - 60% Net 30 (paid in 30 days)
  - 30% Net 60 (paid in 60 days) 
  - 10% COD (collected immediately)
- Bad Debt Rate: 2.5%
- Fees: 2.9% + £0.30 per transaction

### 2. Accounts Payable (AP) Modeling

#### Days Payable Outstanding (DPO)
```
DPO = 365 × (Average AP / Annual COGS)

Where:
- Average AP = (Opening AP + Closing AP) / 2
- Annual COGS = Cost of Goods Sold for trailing 12 months
```

#### Early Payment Discount Optimization
```
NPV_Discount = Cost × Discount_Rate / (1 + Daily_Cost_of_Capital)^Days_Early
NPV_Full = Cost / (1 + Daily_Cost_of_Capital)^Full_Term_Days

Decision: Choose min(NPV_Discount, NPV_Full)

Where:
- Cost = Invoice amount
- Discount_Rate = Early payment discount (e.g., 2% for 2/10 net 30)
- Daily_Cost_of_Capital = Annual WACC / 365
- Days_Early = Days saved by taking discount
```

#### Supplier Payment Terms
Standard supplier terms by category:
- **Raw Materials**: 2/10 net 30 (2% discount if paid in 10 days, otherwise 30 days)
- **Packaging**: Net 15
- **Logistics**: Net 21
- **Utilities**: Net 15
- **Professional Services**: Net 30

### 3. Inventory Modeling

#### Days Inventory Outstanding (DIO)
```
DIO = 365 × (Average Inventory Value / Annual COGS)

Alternative: Days Inventory on Hand (DIH)
DIH = Average Inventory Quantity / Daily Demand

Target Inventory Calculation:
Target_Inventory = (COGS_Annual / 365) × Target_DIO
```

#### Inventory Carrying Costs
```
Annual_Carrying_Cost = Average_Inventory_Value × Carrying_Cost_Rate

Where Carrying_Cost_Rate includes:
- Cost of Capital: 8% (WACC)
- Storage Costs: 2% (warehouse, utilities)
- Insurance: 0.5%
- Obsolescence Risk: 1.5%
- Total: 12% annually
```

#### Multi-Location Inventory
Inventory is tracked across multiple locations:
- **Own Warehouse (UK)**: Direct control, lower fees
- **FBA Centers**: Amazon storage fees, faster fulfillment
- **3PL Partners**: Third-party logistics for EU/USA

## Cash Conversion Cycle (CCC)

### Core Formula
```
CCC = DIO + DSO - DPO

Where:
- DIO = Days Inventory Outstanding
- DSO = Days Sales Outstanding  
- DPO = Days Payable Outstanding
```

### Working Capital Requirement
```
WC_Requirement = (Revenue / 365) × CCC
Monthly_WC_Change = WC_Requirement(t) - WC_Requirement(t-1)
```

## Monthly Cash Flow Projections

### Operating Cash Flow Components
```
Operating_Cash_Flow(t) = Cash_Receipts(t) - Cash_Disbursements(t) - Taxes(t)

Cash_Receipts(t) = Σ[AR_Collections + COD_Sales]
Cash_Disbursements(t) = Σ[AP_Payments + Operating_Expenses + Inventory_Purchases]
```

### Ending Cash Calculation
```
Ending_Cash(t) = Opening_Cash(t) + Net_Operating_Cash_Flow(t)

Where:
Opening_Cash(t) = Ending_Cash(t-1)
```

### Credit Facility Modeling
```
Facility_Utilization(t) = max(0, Credit_Line_Limit - Ending_Cash(t))
Available_Credit(t) = Credit_Line_Limit - Facility_Utilization(t)

Covenant_Headroom = min(
    Available_Credit(t),
    (Net_Worth × Max_Debt_to_Equity) - Current_Debt
)
```

## Multi-Currency Considerations

### FX Rate Application
All calculations performed in base currency (GBP) with conversions:
```
GBP_Amount = Foreign_Amount × FX_Rate_to_GBP(settlement_date)

For projections:
- Spot Rate: Current published rate
- Forward Rate: For scheduled settlements > 30 days
- Budget Rate: For budget comparisons
```

### Currency Risk Management
```
FX_Exposure(t) = Σ[AR_Foreign(t) - AP_Foreign(t)]
Hedging_Requirement = FX_Exposure(t) where abs(exposure) > £10,000
```

## Tax and Regulatory Calculations

### VAT/Sales Tax
Applied by market:
- **UK VAT**: 20% on domestic sales
- **EU VAT**: 19% average (varies by country)
- **USA Sales Tax**: 8% average (varies by state)

```
Tax_Payable(t) = Σ[Sales_Revenue(t) × Local_Tax_Rate] - Input_VAT_Credits(t)
```

### Import Duties
```
Import_Duty = (Product_Cost + Shipping) × Duty_Rate × Quantity

UK Post-Brexit Duties:
- Raw materials: 2.5%
- Finished goods: 5.5%
```

## Scenario Analysis Parameters

### Base Case Assumptions
- Revenue Growth: 15% annually
- Gross Margin: 65%
- DIO Target: 45 days
- DSO Target: 35 days  
- DPO Target: 25 days
- Cost of Capital: 8%

### Sensitivity Factors
**Optimistic (+15% revenue impact):**
- Demand: +20%
- Gross Margin: +5 percentage points
- Collection Speed: -5 days DSO
- Payment Terms: +3 days DPO

**Pessimistic (-10% revenue impact):**
- Demand: -15%
- Gross Margin: -3 percentage points
- Collection Speed: +7 days DSO
- Bad Debt: +1.5 percentage points

### Stress Test Scenarios
1. **Supply Chain Disruption**: +30 days DIO, +50% inventory costs
2. **Major Customer Loss**: -25% revenue, +5% bad debt
3. **Currency Crisis**: ±20% FX volatility
4. **Economic Downturn**: -20% demand, +10 days DSO, +2% bad debt

## Key Performance Indicators (KPIs)

### Primary Metrics
1. **Cash Conversion Cycle**: Target < 55 days
2. **Working Capital Turnover**: Revenue / Average WC, target > 6.5x
3. **Inventory Turnover**: COGS / Average Inventory, target > 8x
4. **Minimum Cash Balance**: Never below £50,000
5. **Credit Facility Utilization**: Keep below 60% of limit

### Early Warning Indicators
- CCC increasing > 5 days month-over-month
- DSO increasing > 3 days month-over-month
- Ending cash < £100,000 (2x minimum)
- Credit facility utilization > 75%
- Bad debt rate > 3% of sales

## Assumptions and Limitations

### Standard Assumptions
- 365-day year for all calculations
- Month = 30.4 days average (365/12)
- Linear cash flow within months (no intra-month seasonality)
- FX rates fixed within month, updated monthly
- No seasonal working capital financing needs

### Key Limitations
- Does not model intra-month cash flow volatility
- Assumes consistent collection patterns (historical-based)
- FX forward rates based on published curves (may not reflect actual hedging)
- No modeling of extraordinary items or one-off events
- Limited integration with detailed production scheduling

### Data Quality Requirements
- Minimum 12 months historical data for accurate seasonality
- Monthly data refresh required for accuracy
- AR aging data updated weekly minimum
- Supplier terms must be current and accurate
- FX rates updated daily for current month

---

*This document provides the mathematical foundation for all working capital calculations in the Sentia Manufacturing Dashboard. All formulas follow standard financial accounting practices adapted for the company's specific business model and operational requirements.*