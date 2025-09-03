# User Workflows

## Overview

This document defines the key user workflows for the Sentia Manufacturing Dashboard, including role-based permissions, interaction patterns, and business process flows.

## User Roles & Permissions

### Role Hierarchy
1. **ADMIN** - Full system access and user management
2. **MANAGER** - Operational control and team oversight  
3. **OPERATOR** - Daily operations and data entry
4. **VIEWER** - Read-only dashboard access

### Permission Matrix

| Feature | ADMIN | MANAGER | OPERATOR | VIEWER |
|---------|-------|---------|----------|--------|
| View Dashboards | ✅ | ✅ | ✅ | ✅ |
| Run Forecasts | ✅ | ✅ | ✅ | ❌ |
| Optimize Stock | ✅ | ✅ | ✅ | ❌ |
| Approve Purchase Orders | ✅ | ✅ | ❌ | ❌ |
| Working Capital Analysis | ✅ | ✅ | ❌ | ❌ |
| System Configuration | ✅ | ❌ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ✅ | ✅ |
| Save Layouts | ✅ | ✅ | ✅ | ❌ |

## Core Workflows

### 1. Daily Operations Workflow (OPERATOR)

#### Morning Review Process
```
1. Login → Dashboard Overview
2. Check KPI Strip for overnight alerts
3. Review capacity utilization status
4. Assess stock levels and reorder alerts
5. Process any critical notifications
```

**Workflow Actions:**
- **Navigation**: Dashboard → Overview
- **Time**: 5-10 minutes
- **Triggers**: Daily login, shift change
- **Success Criteria**: All critical alerts reviewed and actioned

#### Stock Monitoring Workflow
```
1. Navigate to Stock Status Widget
2. Filter by product categories or markets
3. Review ROP/Safety Stock alerts
4. Assess reorder recommendations
5. Export recommendations for procurement team
```

**Interactive Elements:**
- Filter dropdowns (Product, Market, ABC Class)
- Risk threshold slider
- Reorder suggestion cards
- Export button (CSV/Excel)

### 2. Demand Planning Workflow (MANAGER)

#### Weekly Forecast Review
```
1. Dashboard → Forecasts Section
2. Select forecast series (UK/EU/US markets)
3. Review accuracy metrics (MAPE, sMAPE)
4. Compare model performance (Ensemble vs ARIMA)
5. Adjust scenarios for upcoming campaigns
6. Trigger optimization based on new forecast
```

**Workflow Ribbon:**
```
Forecast Widget → [Use in Optimization] → Stock Planning View
```

**Key Interactions:**
- Model toggle switches
- Scenario dropdown selection
- Time horizon adjustment (30/60/90 days)
- Confidence interval display toggle
- Drill-down to product level

#### Optimization Workflow
```
1. Receive forecast data from previous step
2. Configure optimization parameters:
   - Service level targets
   - Lead time buffers
   - Capacity constraints
3. Run optimization job
4. Review stock recommendations
5. Export purchase order suggestions
6. Approve/modify recommendations
```

**Success Criteria:**
- Optimization completes within SLA (< 5 minutes)
- Recommendations align with business constraints
- Purchase orders generated for procurement

### 3. Financial Analysis Workflow (MANAGER/ADMIN)

#### Working Capital Review (Monthly)
```
1. Navigate to Working Capital Dashboard
2. Review KPI tiles:
   - DSO (Days Sales Outstanding) < 35 days target
   - DPO (Days Payable Outstanding) optimization
   - DIO (Days Inventory Outstanding) management
   - CCC (Cash Conversion Cycle) < 55 days target
3. Analyze cash flow timeline
4. Identify potential cash breaches (next 90 days)
5. Review payment terms optimization
6. Generate financial reports
```

**Workflow Actions:**
- Currency selection (GBP/EUR/USD)
- Time horizon adjustment
- Scenario analysis (base/optimistic/pessimistic)
- Policy optimization recommendations

#### Cash Breach Analysis
```
1. From WC Meter → Click "Analyze Breach Months"
2. Review cash timeline at breach anchor points
3. Assess impact of different scenarios
4. Identify mitigation strategies:
   - Accelerate collections
   - Delay payments
   - Inventory liquidation
   - Credit facility utilization
5. Export action plan for finance team
```

### 4. System Administration Workflow (ADMIN)

#### User Management
```
1. Navigate to Admin Panel
2. Review user access and roles
3. Add/modify user permissions
4. Configure feature flags
5. Monitor system health metrics
```

#### Dashboard Configuration
```
1. Configure role-based default layouts
2. Set up widget permissions
3. Manage data refresh intervals
4. Configure alert thresholds
5. System backup and maintenance
```

## Drill-Down Patterns

### Global → Market → Channel → Product → Time

#### Level 1: Global View
- **Widgets**: KPI Strip, high-level summaries
- **Filters**: Time range, environment
- **Actions**: Drill to market level

#### Level 2: Market View (UK/EU/US)
- **Widgets**: Market-specific forecasts and stock
- **Filters**: Market selection, product categories
- **Actions**: Drill to channel level, compare markets

#### Level 3: Channel View (Amazon/Shopify/Direct)
- **Widgets**: Channel performance, inventory by channel
- **Filters**: Channel selection, fulfillment method
- **Actions**: Drill to product level

#### Level 4: Product/SKU View
- **Widgets**: Individual product performance
- **Filters**: SKU selection, variant analysis
- **Actions**: Time series analysis, detailed forecasting

#### Level 5: Time Window Analysis
- **Widgets**: Time-series charts, seasonality analysis
- **Filters**: Date range, aggregation level
- **Actions**: Export data, save analysis

### URL State Management
```
/dashboard?market=UK&channel=amazon&product=SKU123&range=90d
```

**Query Parameters:**
- `market`: UK | EU | US
- `channel`: amazon | shopify | direct  
- `product`: SKU identifier
- `range`: 30d | 60d | 90d | custom
- `view`: overview | forecast | inventory | wc
- `layout`: default | custom_layout_id

## Interactive Workflows

### 1. Forecast → Optimization Workflow

**Trigger**: "Use in Optimization" button in Forecast Widget

**Flow**:
```
1. User clicks "Use in Optimization" from Forecast Widget
2. System captures current forecast parameters:
   - Selected series
   - Time horizon
   - Scenario settings
3. Navigation to Stock Planning view
4. Pre-populate optimization form with forecast data
5. User configures additional parameters
6. Run optimization job
7. Display results in Stock Widget
```

**Implementation**:
```typescript
const handleUseInOptimization = (forecastData: ForecastData) => {
  // Navigate with state
  navigate('/dashboard/inventory', {
    state: { 
      forecastInput: forecastData,
      autoTrigger: true 
    }
  })
}
```

### 2. Stock → Purchase Order Workflow

**Trigger**: "Commit PO Suggestions" button in Stock Widget

**Flow**:
```
1. User reviews reorder suggestions
2. Selects items to include in PO
3. Clicks "Commit PO Suggestions"
4. Approval modal opens with PO summary
5. User confirms or modifies quantities
6. System generates PO document
7. Export options (PDF/Excel) provided
8. Optional email to procurement team
```

### 3. Working Capital → Breach Analysis Workflow

**Trigger**: Click on cash breach indicators in WC Meter

**Flow**:
```
1. User clicks on breach month in cash timeline
2. System opens detailed breach analysis view
3. Display contributing factors:
   - AR collection delays
   - AP payment acceleration needed
   - Inventory liquidation opportunities
4. Show scenario impact analysis
5. Generate mitigation action plan
6. Export recommendations for finance team
```

## Notification Workflows

### Real-time Notifications

#### Stock Alerts
- **Trigger**: Stock level below ROP
- **Recipients**: OPERATOR, MANAGER
- **Actions**: 
  - Navigate to Stock Widget
  - Generate immediate PO
  - Adjust safety stock levels

#### Forecast Job Completion
- **Trigger**: Forecast job status change
- **Recipients**: Job initiator
- **Actions**:
  - Review forecast results
  - Compare with previous forecast
  - Trigger optimization if needed

#### Cash Breach Warning
- **Trigger**: Projected cash breach within 30 days
- **Recipients**: MANAGER, ADMIN
- **Actions**:
  - Open Working Capital analysis
  - Review mitigation options
  - Execute emergency cash management

### Email Digest Workflows

#### Daily Operations Summary (7 AM)
- **Recipients**: All active users
- **Content**: 
  - KPI summary
  - Critical alerts
  - Scheduled jobs status
  - Deep links to relevant dashboards

#### Weekly Performance Report (Monday 8 AM)
- **Recipients**: MANAGER, ADMIN
- **Content**:
  - Forecast accuracy metrics
  - Stock performance
  - Working capital trends
  - Recommendation summary

## Error Recovery Workflows

### Job Failure Recovery
```
1. User receives job failure notification
2. Navigate to job status dashboard
3. Review error details and logs
4. Options presented:
   - Retry with same parameters
   - Modify parameters and retry  
   - Contact support with error ID
5. Track resolution status
```

### Data Quality Issues
```
1. System detects data quality issue
2. Alert displayed in relevant widget
3. User can:
   - View data quality report
   - Access data import tools
   - Contact data team
4. Widget disabled until issue resolved
```

## Mobile Workflows

### Quick Status Check (Mobile)
```
1. Open mobile dashboard
2. Swipe through KPI cards
3. Tap for quick drill-down
4. Use voice notes for issues
5. Share snapshot with team
```

### Emergency Response (Mobile)
```
1. Receive push notification
2. Quick assessment via mobile dashboard
3. One-tap access to key actions:
   - Approve emergency PO
   - Trigger emergency forecast
   - Contact operations team
4. Status updates via mobile
```

## Integration Workflows

### ERP System Integration
```
1. Purchase orders generated in dashboard
2. Export to ERP system format
3. Automatic sync with inventory levels
4. Demand actuals import from ERP
5. Reconciliation reporting
```

### Third-party Analytics
```
1. Export dashboard data
2. Transform for analytics platform
3. Enhanced analysis in external tools
4. Import insights back to dashboard
5. Display external recommendations
```

## Performance Workflows

### Dashboard Loading Optimization
```
1. Initial page load prioritizes above-the-fold widgets
2. Progressive loading of remaining widgets
3. Background prefetch of likely drill-down data
4. Cache management for frequently accessed data
5. Offline fallback for critical KPIs
```

### Large Dataset Handling
```
1. Virtualized scrolling for large tables
2. Progressive disclosure for detailed data
3. Summary-first approach with drill-down
4. Export limitations with pagination
5. Background processing for large exports
```

## Success Metrics

### Workflow Efficiency Metrics
- Time to complete daily review: < 10 minutes
- Forecast-to-optimization cycle: < 15 minutes  
- Cash breach identification: < 5 minutes
- Alert response time: < 2 minutes

### User Adoption Metrics
- Daily active users by role
- Feature utilization rates
- Workflow completion rates
- User satisfaction scores

### Business Impact Metrics
- Forecast accuracy improvement
- Stock optimization effectiveness
- Working capital cycle reduction
- Cost savings from automation