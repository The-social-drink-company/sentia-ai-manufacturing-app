---
title: CFO Dashboard Guide
description: Complete guide to the CFO dashboard features, KPIs, and board reporting
owner: finance
lastReviewed: 2025-09-04
role: CFO
stage: ga
---

import { Note, Warning, Tip, Kpi, RoleBadge, BoardReady, Screenshot, Mermaid } from '../src/components/MDXComponents';

# CFO Dashboard Guide

<div className="flex items-center gap-2 mb-6">
  <RoleBadge role="CFO" />
  <BoardReady status={true} />
</div>

## Overview

The CFO Dashboard provides executive-level financial insights with real-time KPIs, working capital metrics, and board-ready visualizations. This guide covers all features essential for financial leadership and board reporting.

<Note title="What the Board Cares About">
  - Cash runway and liquidity position
  - Working capital efficiency (CCC trends)
  - DSO/DPO optimization opportunities  
  - Forecast accuracy and confidence intervals
  - Covenant compliance status
</Note>

## Key Features

### 1. CFO KPI Strip

The executive KPI strip displays critical financial metrics at a glance:

<div className="grid grid-cols-3 gap-4 my-6">
  <Kpi label="Cash Runway" value={185} suffix=" days" trend="up" delta={12} />
  <Kpi label="Working Capital" value={2450000} format="currency" trend="down" delta={-5} />
  <Kpi label="CCC" value={47} suffix=" days" trend="down" delta={-3} />
</div>

**Key Metrics Explained:**
- **Cash Runway**: Days of operations covered by current cash position
- **Working Capital**: Current assets minus current liabilities
- **Cash Conversion Cycle (CCC)**: DIO + DSO - DPO

### 2. Trust Badges & Compliance

<Screenshot 
  src="/assets/docs/screenshots/cfo__dashboard__trust-badges.png"
  alt="Trust badges showing data quality and compliance status"
  caption="Trust badges provide confidence in data quality and compliance"
/>

Trust badges automatically display:
- Data freshness indicators
- Forecast confidence levels
- Audit trail completeness
- Compliance checkpoints

### 3. Board Export Functionality

<Warning title="Board Mode">
  When Board Mode is activated, all sensitive data is automatically redacted and watermarked. This ensures safe sharing of financial insights during board meetings.
</Warning>

#### Generating Board Packs

1. Click the **Board Export** button in the top toolbar
2. Select export format:
   - PDF for formal board packs
   - PowerPoint for presentations
   - Excel for detailed analysis
3. Choose sections to include:
   - Executive Summary
   - KPI Dashboard
   - Working Capital Analysis
   - Forecast Scenarios
   - Risk Assessment

<Tip>
  Schedule automated board pack generation for the 3rd business day of each month to ensure timely distribution to board members.
</Tip>

## Working Capital Deep Dive

<Mermaid chart={`
graph LR
    A[Inventory] --> B[WIP]
    B --> C[Finished Goods]
    C --> D[Accounts Receivable]
    D --> E[Cash]
    E --> F[Accounts Payable]
    F --> A
    
    style A fill:#fef3c7
    style B fill:#fde68a
    style C fill:#fcd34d
    style D fill:#dbeafe
    style E fill:#93c5fd
    style F fill:#fecaca
`} />

### Optimization Opportunities

The dashboard automatically identifies working capital optimization opportunities:

| Component | Current | Target | Improvement | Annual Benefit |
|-----------|---------|--------|-------------|----------------|
| DSO | 52 days | 45 days | -7 days | £425,000 |
| DIO | 38 days | 35 days | -3 days | £185,000 |
| DPO | 43 days | 50 days | +7 days | £390,000 |
| **Total** | | | | **£1,000,000** |

### Scenario Analysis

The CFO dashboard includes powerful scenario modeling:

1. **Base Case**: Current trajectory
2. **Optimistic**: 20% revenue growth, improved collections
3. **Pessimistic**: 10% revenue decline, stretched payables
4. **Stress Test**: Supply chain disruption, customer defaults

<Note>
  Each scenario automatically recalculates covenant compliance and triggers alerts if thresholds are breached.
</Note>

## Regional & Currency Views

### Multi-Entity Consolidation

For global operations, the dashboard supports:
- Automatic FX translation at month-end rates
- Regional performance comparison
- Consolidated group view

<Tip title="FX Best Practice">
  Set your base currency in Admin > Settings > Finance. All foreign transactions will be automatically converted using daily ECB rates.
</Tip>

### Regional Performance

| Region | Revenue | Working Capital | CCC | DSO |
|--------|---------|-----------------|-----|-----|
| UK | £12.5M | £2.1M | 45 days | 48 days |
| EU | €8.3M | €1.4M | 52 days | 55 days |
| US | $5.2M | $0.9M | 38 days | 42 days |

## Common Pitfalls & Solutions

<Warning title="Common Pitfalls">
  1. **Stale Data**: Ensure daily data syncs are running
  2. **Missing Baselines**: Set quarterly baselines for accurate variance analysis
  3. **Incorrect FX Rates**: Verify FX provider configuration
  4. **Covenant Miscalculation**: Double-check formula configurations in Admin
</Warning>

### Troubleshooting Guide

| Issue | Symptom | Solution |
|-------|---------|----------|
| Blank KPIs | No data displayed | Check data import status, verify API connections |
| Wrong Currency | Values in USD instead of GBP | Update base currency in Settings |
| Missing Forecasts | Forecast widget empty | Run forecast generation job manually |
| Export Fails | PDF generation error | Clear browser cache, check permissions |

## Forecast Accuracy Tracking

The dashboard tracks forecast accuracy over time:

<div className="bg-gray-50 p-4 rounded-lg my-6">
  <h4 className="font-semibold mb-3">Forecast Performance Metrics</h4>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <p className="text-sm text-gray-600">3-Month MAPE</p>
      <p className="text-2xl font-bold">8.2%</p>
      <p className="text-sm text-green-600">↓ 1.3% vs last quarter</p>
    </div>
    <div>
      <p className="text-sm text-gray-600">Bias</p>
      <p className="text-2xl font-bold">+2.1%</p>
      <p className="text-sm text-yellow-600">Slight over-forecast</p>
    </div>
  </div>
</div>

## Automation & Alerts

### Automated Reports

Configure automated reports in Admin > Automation:
- Daily cash position email (7 AM)
- Weekly WC dashboard (Monday 9 AM)
- Monthly board pack (3rd business day)
- Quarterly trend analysis

### Alert Thresholds

Set up critical alerts for:
- Cash runway < 90 days
- DSO > 60 days
- Covenant breach risk > 20%
- Forecast variance > 15%

## Integration with Board Meetings

### Pre-Meeting Checklist

- [ ] Generate latest board pack (T-3 days)
- [ ] Review and annotate key variances
- [ ] Prepare scenario analysis slides
- [ ] Update risk register
- [ ] Enable Board Mode for live demo

### During the Meeting

1. Start with executive summary KPIs
2. Drill down into areas of concern
3. Show live scenario modeling
4. Export specific views as requested

### Post-Meeting Actions

1. Document board feedback
2. Update forecast assumptions if needed
3. Schedule follow-up reports
4. Adjust alert thresholds per board guidance

## Best Practices

<Tip title="CFO Best Practices">
  1. **Review daily**: Check cash position and critical KPIs each morning
  2. **Baseline quarterly**: Set new baselines after quarter close
  3. **Scenario monthly**: Run stress tests monthly, not just for board meetings
  4. **Automate alerts**: Don't rely on manual checking for critical thresholds
  5. **Document assumptions**: Keep forecast assumptions updated and visible
</Tip>

## Quick Reference

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+E` | Export dashboard |
| `Ctrl+B` | Toggle Board Mode |
| `Ctrl+S` | Save current view |
| `Ctrl+R` | Refresh data |
| `F11` | Full screen mode |

### Useful Formulas

```
Cash Runway = Cash Balance / Daily Burn Rate
CCC = DIO + DSO - DPO
Quick Ratio = (Current Assets - Inventory) / Current Liabilities
Debt Service Coverage = EBITDA / (Principal + Interest)
```

## Next Steps

- [Working Capital Management Guide](/guides/working-capital)
- [Forecast Scenarios Guide](/guides/forecast-scenarios)
- [Board Pack Templates](/training/board-pack)
- [ROI Calculator](/guides/roi-calculator)

## Support

For CFO-specific support:
- Email: cfo-support@sentia.com
- Slack: #cfo-dashboard
- Priority hotline: +44 20 7xxx xxxx