---
title: Board Pack Creation Guide
description: Step-by-step guide for creating comprehensive board packs with CFO narratives
owner: finance
lastReviewed: 2025-09-04
role: CFO
stage: ga
---

import { Note, Warning, Tip, Alert, BoardReady, RoleBadge, Screenshot, Tabs, Tab, Mermaid } from '../src/components/MDXComponents';

# Board Pack Creation Guide

<div className="flex items-center gap-2 mb-6">
  <RoleBadge role="CFO" />
  <BoardReady status={true} />
</div>

## Overview

This guide provides comprehensive instructions for creating board-ready financial reports, including executive summaries, KPI dashboards, and narrative sections that address board concerns.

<Note title="Board Pack Timeline">
  - **T-5 days**: Data refresh and validation
  - **T-3 days**: Generate initial pack
  - **T-2 days**: CFO review and annotations
  - **T-1 day**: Final distribution to board
  - **T-0**: Board meeting
</Note>

## Board Pack Structure

<Mermaid chart={`
graph TD
    A[Cover Page] --> B[Executive Summary]
    B --> C[KPI Dashboard]
    C --> D[Financial Performance]
    D --> E[Working Capital Analysis]
    E --> F[Forecast & Scenarios]
    F --> G[Risk Assessment]
    G --> H[Strategic Initiatives]
    H --> I[Appendices]
    
    style A fill:#e0e7ff
    style B fill:#c7d2fe
    style C fill:#a5b4fc
`} />

## Section 1: Executive Summary

### Key Elements

The executive summary should be **one page maximum** and include:

1. **Performance Highlights** (3-4 bullets)
   - Revenue vs target
   - Profitability metrics
   - Cash position
   - Major achievements

2. **Critical Issues** (2-3 bullets)
   - Immediate concerns
   - Required decisions
   - Resource needs

3. **Forward Looking** (2-3 bullets)
   - Next quarter outlook
   - Key milestones
   - Strategic priorities

<Tip>
  Write the executive summary LAST, after completing all other sections. This ensures it accurately reflects the full content of the pack.
</Tip>

### Example Template

```markdown
## Executive Summary - Q4 2024

### Performance Highlights
- Revenue: £15.2M (+12% YoY, +2% vs target)
- EBITDA: £2.8M (18.4% margin, up 120bps YoY)
- Cash: £4.5M (185 days runway)
- Successfully onboarded 3 enterprise clients

### Critical Issues
- DSO increased to 58 days (target: 45)
- Supply chain disruption risk in Q1 2025
- Board approval needed for £2M capex investment

### Forward Looking
- Q1 2025 revenue forecast: £16.5M
- Product launch scheduled for February
- Targeting 20% EBITDA margin by Q2
```

## Section 2: KPI Dashboard

### Standard KPI Layout

<Screenshot 
  src="/assets/docs/screenshots/board__pack__kpi-layout.png"
  alt="Standard KPI dashboard layout for board presentations"
  caption="Recommended KPI dashboard layout with traffic light indicators"
/>

### Required Metrics

| Category | Metrics | Format | RAG Thresholds |
|----------|---------|--------|----------------|
| **Financial** | Revenue, EBITDA, FCF | Actual vs Budget vs LY | G: >100%, A: 95-100%, R: <95% |
| **Working Capital** | CCC, DSO, DIO, DPO | Days + Trend | Per policy |
| **Liquidity** | Cash, Runway, Quick Ratio | Absolute + Months | G: >6mo, A: 3-6mo, R: <3mo |
| **Operational** | Utilization, OEE, Lead Time | % + Trend | Industry benchmarks |

<Warning>
  Always include variance explanations for any RED indicators. Board members will focus on these immediately.
</Warning>

## Section 3: Financial Performance

### P&L Commentary Structure

<Tabs defaultTab={0}>
  <Tab label="Revenue Analysis">
    ```markdown
    ## Revenue Performance
    
    ### Headlines
    - Total: £15.2M (+12% YoY)
    - Organic: £14.1M (+8% YoY)  
    - New Products: £1.1M (7% of total)
    
    ### By Geography
    - UK: £9.8M (64%)
    - EU: £3.7M (24%)
    - US: £1.7M (12%)
    
    ### Key Drivers
    1. Volume: +7% (main driver)
    2. Price: +3% (annual increase)
    3. Mix: +2% (premium shift)
    ```
  </Tab>
  <Tab label="Cost Analysis">
    ```markdown
    ## Cost Performance
    
    ### COGS
    - Total: £8.1M (53.3% of revenue)
    - Material: £5.2M (up 5% - inflation)
    - Labor: £1.9M (flat - efficiency gains)
    - Overhead: £1.0M (down 2% - automation)
    
    ### OPEX
    - Total: £4.3M (28.3% of revenue)
    - Sales: £1.8M (volume related)
    - Admin: £1.5M (flat)
    - R&D: £1.0M (+20% - strategic)
    ```
  </Tab>
  <Tab label="Profitability">
    ```markdown
    ## Profitability Analysis
    
    ### EBITDA Bridge
    Starting EBITDA: £2.5M
    + Volume impact: +£0.4M
    + Price realization: +£0.2M
    - Cost inflation: -£0.3M
    + Efficiency gains: +£0.2M
    - One-offs: -£0.2M
    = Ending EBITDA: £2.8M
    
    ### Margin Analysis
    - Gross Margin: 46.7% (+80bps)
    - EBITDA Margin: 18.4% (+120bps)
    - Net Margin: 12.1% (+100bps)
    ```
  </Tab>
</Tabs>

## Section 4: Working Capital Deep Dive

### Cash Conversion Cycle Visualization

<Mermaid chart={`
graph LR
    A[DIO: 38 days] --> B[Production]
    B --> C[DSO: 58 days]
    C --> D[Cash Collection]
    D --> E[DPO: -43 days]
    E --> F[CCC: 53 days]
    
    style F fill:#fecaca,stroke:#dc2626
`} />

### Optimization Roadmap

| Initiative | Current | Target | Impact | Timeline | Owner |
|-----------|---------|--------|---------|----------|-------|
| Collections automation | 58 days | 45 days | £750K | Q1 2025 | CFO |
| Inventory optimization | 38 days | 32 days | £450K | Q2 2025 | COO |
| Payment terms extension | 43 days | 50 days | £400K | Q1 2025 | CPO |
| **Total WC Release** | | | **£1.6M** | | |

<Alert title="Board Action Required">
  Approval needed for collections automation system (£150K investment, 6-month payback)
</Alert>

## Section 5: Scenario Analysis

### Three Scenarios Presentation

<Note>
  Always present three scenarios to the board: Base, Upside, and Downside. This demonstrates thorough planning and risk awareness.
</Note>

#### Scenario Comparison Table

| Metric | Base Case | Upside | Downside | Key Assumptions |
|--------|-----------|---------|-----------|-----------------|
| Revenue Growth | 10% | 15% | 5% | Market conditions |
| EBITDA Margin | 18% | 20% | 15% | Cost management |
| Cash (EOY) | £5.2M | £6.8M | £3.5M | WC changes |
| Covenant Headroom | 25% | 40% | 10% | Debt levels |

### Stress Test Results

<Warning title="Stress Test Findings">
  Under severe downside (20% revenue drop), we would breach debt covenants in Q3. Mitigations include:
  - £2M undrawn RCF facility
  - £1.5M potential WC release
  - Discretionary capex deferral (£1M)
</Warning>

## Section 6: Risk Dashboard

### Risk Heat Map

```
         Impact →
    Low    Medium    High
Low    [1,4]   [7]     [9]
Medium [2,5]   [3,8]   [10]
High   [6]     [11]    [12,13]

Risks:
1. Currency fluctuation (hedged)
2. Minor supply delays
3. Customer concentration
...
12. Major customer loss
13. Covenant breach
```

### Top 5 Risks & Mitigations

1. **Customer Concentration** (High/High)
   - Risk: Top 3 = 45% of revenue
   - Mitigation: Diversification plan, 10 new prospects
   - Status: Amber

2. **Supply Chain** (High/Medium)
   - Risk: Single source components
   - Mitigation: Dual sourcing project
   - Status: Amber

[Continue for all top 5...]

## Section 7: Strategic Initiatives Update

### Initiative Tracker

<Tabs defaultTab={0}>
  <Tab label="Digital Transformation">
    **Status**: On Track (Green)
    **Budget**: £2.5M (45% spent)
    **Timeline**: Q2 2025 completion
    
    Key Milestones:
    - ✅ ERP selection complete
    - ✅ Phase 1 implementation
    - 🔄 Data migration (60%)
    - ⏳ Training rollout
    - ⏳ Go-live preparation
  </Tab>
  <Tab label="Market Expansion">
    **Status**: Behind (Amber)
    **Budget**: £1.0M (30% spent)
    **Timeline**: Q3 2025 completion
    
    Issues:
    - Regulatory delays in Germany
    - Revised timeline: +3 months
    - Additional budget needed: £200K
  </Tab>
  <Tab label="Product Innovation">
    **Status**: Ahead (Green)
    **Budget**: £1.5M (55% spent)
    **Timeline**: Q1 2025 launch
    
    Achievements:
    - Beta testing complete
    - 3 patents filed
    - Pre-orders: £800K
  </Tab>
</Tabs>

## Export Settings

### Board Mode Configuration

<Tip title="Activating Board Mode">
  1. Navigate to Dashboard → Settings → Export
  2. Toggle "Board Mode" ON
  3. Select "Redact Sensitive Data"
  4. Choose watermark: "CONFIDENTIAL - BOARD ONLY"
  5. Set expiry: 7 days
</Tip>

### Export Formats

| Format | Use Case | Features | File Size |
|--------|----------|----------|-----------|
| **PDF** | Formal distribution | Locked, watermarked, tracked | ~5MB |
| **PowerPoint** | Live presentation | Editable charts, notes | ~10MB |
| **Excel** | Detailed analysis | Full data, pivot tables | ~15MB |
| **Web Link** | Remote viewing | Real-time, expires, tracked | N/A |

## Narrative Templates

### CFO Commentary Template

```markdown
## CFO Commentary - [Month Year]

### Performance Summary
This quarter delivered [solid/strong/mixed] results with revenue 
[above/in line with/below] expectations at £[X]M. The [increase/
decrease] was primarily driven by [key factor 1] and [key factor 2].

### Key Achievements
- [Achievement 1 with quantified impact]
- [Achievement 2 with strategic importance]
- [Achievement 3 with future benefit]

### Areas of Focus
While we are pleased with [positive aspect], we acknowledge 
challenges in [area 1] and [area 2]. Management is taking the 
following actions:
1. [Specific action with timeline]
2. [Specific action with expected outcome]

### Outlook
Looking ahead, we remain [confident/cautiously optimistic] about 
[timeframe]. Key priorities include:
- [Priority 1 with success metric]
- [Priority 2 with milestone]
- [Priority 3 with expected impact]

### Board Action Required
[If applicable, specific decisions or approvals needed]
```

## Quality Checklist

### Before Distribution

<Alert>
  Complete this checklist before every board pack distribution:
</Alert>

- [ ] All data refreshed within 48 hours
- [ ] Variance commentary for all exceptions
- [ ] Risk register updated
- [ ] Covenant calculations verified
- [ ] Scenarios stress-tested
- [ ] Grammar and spell check complete
- [ ] Sensitive data redacted (if external)
- [ ] Page numbers and headers consistent
- [ ] Executive summary aligns with detail
- [ ] Distribution list confirmed

## Common Pitfalls to Avoid

<Warning title="Top 10 Board Pack Mistakes">
  1. **Too much detail** - Board wants insights, not raw data
  2. **No executive summary** - Board reads this first and maybe only
  3. **Missing variance explanations** - Always explain why
  4. **Inconsistent numbers** - Cross-check all figures
  5. **No forward view** - Board wants to know what's next
  6. **Technical jargon** - Use business language
  7. **No clear asks** - Be specific about decisions needed
  8. **Poor visualization** - Charts > tables > text
  9. **Late distribution** - Send 48 hours before meeting
  10. **No appendix** - Keep detail available but separate
</Warning>

## Quick Reference Card

### Essential Formulas
```
Working Capital = Current Assets - Current Liabilities
Quick Ratio = (Current Assets - Inventory) / Current Liabilities
CCC = DIO + DSO - DPO
EBITDA Margin = EBITDA / Revenue
Debt/EBITDA = Total Debt / LTM EBITDA
Interest Cover = EBITDA / Interest Expense
```

### Board Meeting Checklist
- [ ] Pack distributed T-48 hours
- [ ] Backup slides prepared
- [ ] Live demo environment ready
- [ ] Q&A anticipated and prepared
- [ ] Follow-up action list template ready

## Templates & Downloads

- [Cover Page Template (PPT)](/templates/board-pack-cover.pptx)
- [Executive Summary Template (Word)](/templates/exec-summary.docx)
- [KPI Dashboard Template (Excel)](/templates/kpi-dashboard.xlsx)
- [Risk Register Template (Excel)](/templates/risk-register.xlsx)
- [CFO Script Template (Word)](/templates/cfo-script.docx)

## Next Steps

- [CFO Dashboard Guide](/guides/cfo-dashboard)
- [Working Capital Management](/guides/working-capital)
- [Scenario Planning Guide](/guides/forecast-scenarios)
- [ROI Calculator](/guides/roi-calculator)

## Support

For board pack assistance:
- Email: board-support@sentia.com
- Slack: #board-packs
- Templates: SharePoint/BoardPacks/Templates
- Previous packs: SharePoint/BoardPacks/Archive