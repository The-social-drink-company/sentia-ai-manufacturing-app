# Inventory Optimization Business Logic

## Core Policy Mathematics

### Economic Order Quantity (EOQ)
```
EOQ = √(2 × D × S / H)

Where:
- D = Annual demand (units/year)
- S = Setup/ordering cost per order (£)
- H = Holding cost per unit per year (£/unit/year)
```

### Safety Stock Calculation
```
Safety Stock = z × σ_LT

Where:
- z = Service level z-score (99% = 2.33, 98% = 2.05, 95% = 1.65)
- σ_LT = Standard deviation of demand during lead time

For multiplicative seasonality:
σ_LT = √(LT × σ²_daily × (1 + CV²_seasonal))

For additive seasonality:
σ_LT = √(LT × σ²_daily + seasonal_variance)
```

### Reorder Point (ROP)
```
ROP = μ_LT + Safety Stock

Where:
- μ_LT = Mean demand during lead time
- Safety Stock = Calculated safety buffer
```

### Lead Time Demand Statistics
```
μ_LT = daily_mean × lead_time_days
σ_LT = √(lead_time_days) × daily_std_dev

For variable lead times:
μ_LT = demand_mean × LT_mean
σ_LT = √(demand_var × LT_mean + demand_mean² × LT_var)
```

## Service Level Policy Matrix

### Default Service Levels by ABC Class
- **A Items (Top 20% by revenue)**: 99% service level (z = 2.33)
- **B Items (Next 30% by revenue)**: 98% service level (z = 2.05)
- **C Items (Bottom 50% by revenue)**: 95% service level (z = 1.65)

### ABC Classification
```
A Items: Cumulative revenue > 80%
B Items: Cumulative revenue 50-80%
C Items: Cumulative revenue < 50%
```

## Constraint Handling Framework

### 1. Capacity Constraints
```
∑(order_qty_sku_t × processing_time_sku) ≤ capacity_limit_t

For each period t and resource constraint
```

### 2. Minimum Order Quantity (MOQ)
```
order_qty_sku ∈ {0} ∪ [MOQ_sku, ∞)
With lot-size constraints: order_qty_sku = MOQ_sku × n, n ∈ ℕ
```

### 3. Working Capital Constraints
```
∑(order_qty_sku_t × unit_cost_sku) ≤ WC_limit_t

Cash flow timing:
- Cash out: order_date + payment_terms_days
- Cash in: delivery_date + customer_payment_terms
```

### 4. Storage Capacity
```
∑(inventory_sku_t × unit_volume_sku) ≤ warehouse_capacity_t
```

## Optimization Heuristic Algorithm

### Phase 1: Unconstrained Baseline
1. Calculate EOQ, Safety Stock, and ROP for each SKU
2. Generate time-phased requirements from demand forecast
3. Create tentative order schedule using (s, S) policy

### Phase 2: Constraint-Aware Adjustment
1. **Priority Ranking**: Sort orders by cost reduction per £ invested
   ```
   Priority = (holding_cost_saved + stockout_cost_avoided) / investment
   ```

2. **Greedy Allocation**: 
   - Start with highest priority orders
   - Allocate while constraints allow
   - Record constraint violations and adjustments

3. **Local Search Refinement**:
   - For each constrained period, try ±lot_size adjustments
   - Accept moves that reduce total expected cost
   - Terminate after max_iterations or convergence

### Phase 3: Multi-Warehouse Optimization
When FEATURE_MULTI_WH enabled:

1. **Source Selection**:
   ```
   min_cost_source = argmin(landed_cost_wh + stockout_penalty_wh)
   
   landed_cost = unit_cost + duty + tariff + shipping_cost
   ```

2. **Transfer Optimization**:
   - Consider inter-warehouse transfers during stockouts
   - Respect minimum ship quantities and frequencies
   - Account for additional lead times

## Decision Rationale Framework

### Per-SKU Decision Record Schema
```json
{
  "sku_id": "SKU-12345",
  "inputs": {
    "demand_mean_daily": 15.2,
    "demand_std_daily": 3.8,
    "lead_time_days": 14,
    "service_level": 0.98,
    "unit_cost": 25.50,
    "holding_rate": 0.25,
    "moq": 100,
    "lot_size": 50
  },
  "calculations": {
    "eoq": 286,
    "safety_stock": 31,
    "rop": 244,
    "mu_lt": 213,
    "sigma_lt": 14.2
  },
  "outputs": {
    "recommended_order_qty": 300,
    "recommended_order_date": "2024-02-15",
    "expected_stockout_risk_pct": 2.0,
    "projected_holding_cost": 125.75
  },
  "adjustments": [
    {
      "constraint": "moq_constraint",
      "before_qty": 286,
      "after_qty": 300,
      "reason": "Rounded up to meet MOQ of 100",
      "cost_impact": 8.25
    }
  ],
  "risk_flags": ["high_variance", "slow_mover"],
  "abc_class": "B"
}
```

## Risk Assessment Categories

### Risk Flag Definitions
- **slow_mover**: Demand < 1 unit per week on average
- **obsolete**: No demand in last 90 days with current inventory > 0
- **high_variance**: Coefficient of variation > 1.5
- **data_gaps**: Missing demand data > 10% of analysis period
- **seasonal_item**: Seasonal coefficient of variation > 0.3
- **new_item**: Less than 6 months of demand history

### Stockout Risk Calculation
```
Stockout_Risk = P(Demand_LT > ROP)

For normal distribution:
Stockout_Risk = 1 - Φ((ROP - μ_LT) / σ_LT)

Where Φ is the standard normal CDF
```

## Working Capital Impact Analysis

### WC Components
1. **Inventory Investment**: order_qty × unit_cost
2. **Payment Timing**: order_date + payment_terms
3. **Cash Generation**: sale_date + collection_terms

### WC Utilization Timeline
```json
{
  "period": "2024-02",
  "wc_limit": 1000000,
  "wc_used": 875000,
  "utilization_pct": 87.5,
  "orders": [
    {
      "sku_id": "SKU-001",
      "order_qty": 500,
      "unit_cost": 25.00,
      "cash_out_date": "2024-02-10",
      "cash_impact": 12500
    }
  ],
  "deferred_orders": [
    {
      "sku_id": "SKU-002", 
      "reason": "wc_limit_exceeded",
      "deferred_to": "2024-03-01",
      "risk_increase_pct": 5.2
    }
  ]
}
```

## Multi-Warehouse Logic

### Warehouse Selection Criteria
1. **Total Landed Cost**: Unit cost + duties + tariffs + shipping
2. **Lead Time Impact**: Longer lead times increase safety stock
3. **Capacity Availability**: Warehouse storage and processing limits
4. **Service Level Impact**: Regional demand variability differences

### Cross-Border Considerations
```json
{
  "source_warehouse": "WH_UK",
  "destination_region": "EU",
  "cost_components": {
    "base_unit_cost": 20.00,
    "duty_pct": 5.0,
    "tariff_pct": 2.5,
    "shipping_cost": 1.50,
    "landed_cost": 22.25
  },
  "lead_time_adjustment": 3,
  "currency_impact": {
    "fx_rate": 1.15,
    "fx_uncertainty": 0.05
  }
}
```

## Solver Integration (Optional)

### MILP Formulation (when FEATURE_OPT_SOLVER enabled)

**Decision Variables:**
- `x_sku_t` ∈ ℕ: Order quantity for SKU in period t
- `I_sku_t` ∈ ℝ+: Inventory level for SKU at end of period t
- `B_sku_t` ∈ ℝ+: Backlog for SKU at end of period t

**Objective Function:**
```
minimize: ∑∑(holding_cost × I_sku_t + stockout_cost × B_sku_t + order_cost × δ(x_sku_t))
```

**Constraints:**
```
Flow Balance: I_sku,t-1 + x_sku_t + B_sku,t-1 = demand_sku_t + I_sku_t + B_sku_t
Capacity: ∑(x_sku_t × resource_usage_sku) ≤ capacity_t
MOQ: x_sku_t = 0 OR x_sku_t ≥ MOQ_sku
Working Capital: ∑(x_sku_t × unit_cost_sku) ≤ WC_limit_t
Service Level: P(stockout_sku) ≤ (1 - service_level_sku)
```

### Solver Timeouts and Fallbacks
- **Timeout**: 30 seconds per optimization run
- **Fallback**: Revert to heuristic solution if solver fails
- **Warm Start**: Use heuristic solution as initial feasible point

## Governance and Approval Workflow

### Plan Approval States
- **DRAFT**: Plan created, under review
- **SUBMITTED**: Plan ready for approval
- **APPROVED**: Plan approved by authorized user
- **REJECTED**: Plan rejected with reason
- **IMPLEMENTED**: Plan executed and orders placed

### Approval Matrix
- **Planner**: Can create and submit plans
- **Manager**: Can approve plans up to £50K impact
- **Director**: Can approve plans up to £200K impact  
- **CFO**: Can approve unlimited impact plans

### Audit Trail Requirements
```json
{
  "plan_id": "OPT-2024-001",
  "created_by": "user123",
  "created_at": "2024-01-15T09:00:00Z",
  "approved_by": "manager456",
  "approved_at": "2024-01-15T14:30:00Z",
  "approval_reason": "Supports Q1 revenue targets",
  "modifications": [
    {
      "field": "service_level_SKU001",
      "before": 0.95,
      "after": 0.98,
      "reason": "Critical customer requirement",
      "modified_by": "manager456",
      "modified_at": "2024-01-15T14:25:00Z"
    }
  ]
}
```

## Performance Requirements

### Scalability Targets
- **SKUs**: Support up to 10,000 active SKUs
- **Time Horizon**: 12-month optimization window
- **Response Time**: < 5 minutes for full optimization
- **Concurrent Users**: Support 10 simultaneous optimizations

### Caching Strategy
- **Demand Statistics**: Cache μ and σ calculations for reuse
- **Seasonal Indices**: Pre-compute and cache seasonal factors
- **Constraint Matrices**: Cache constraint coefficients between runs
- **ABC Classifications**: Update weekly, cache results

## Integration Points

### Data Dependencies
1. **Demand Forecasts**: From forecasting service API
2. **Current Inventory**: From warehouse management system
3. **Lead Times**: From supplier master data
4. **Costs**: From ERP procurement module
5. **Constraints**: From capacity planning system

### Output Destinations
1. **Reorder Reports**: Export to procurement system
2. **KPI Dashboard**: Feed optimization metrics
3. **CFO Reports**: Working capital impact analysis
4. **Audit Trail**: Log all decisions and approvals