# Feature Guides

## Overview
Step-by-step guides for using specific features of the CapLiquify Manufacturing Platform.

## Table of Contents
- [Dashboard Customization](#dashboard-customization)
- [Working Capital Analysis](#working-capital-analysis)
- [Financial Forecasting](#financial-forecasting)
- [Inventory Optimization](#inventory-optimization)
- [Report Generation](#report-generation)
- [User Management](#user-management)
- [Mobile App Usage](#mobile-app-usage)
- [Integration Setup](#integration-setup)

---

## Dashboard Customization

### Creating Your Perfect Dashboard

**Step 1: Enter Edit Mode**
1. Click the **"Edit Dashboard"** button in the top-right corner
2. The dashboard will switch to edit mode (indicated by blue borders around widgets)
3. You'll see a toolbar with widget options appear

**Step 2: Add New Widgets**
1. Click the **"+ Add Widget"** button
2. Choose from the widget gallery:
   - **KPI Metrics**: Revenue, orders, customers, inventory
   - **Charts**: Line, bar, pie, area charts
   - **Tables**: Data grids with sorting and filtering
   - **Calendar**: Upcoming events and deadlines
   - **Quick Actions**: Buttons for common tasks

3. Configure your widget:
   ```
   Widget: Revenue Trend Chart
   ├── Data Source: Sales Data
   ├── Chart Type: Line Chart
   ├── Time Period: Last 30 Days
   ├── Grouping: Daily
   └── Colors: Primary Blue
   ```

**Step 3: Arrange Your Layout**
1. **Drag widgets** to reposition them
2. **Resize widgets** by dragging the corners
3. **Stack widgets** by placing them close together
4. Use the **grid snapping** for precise alignment

**Step 4: Configure Widget Settings**
1. Click the **gear icon** on any widget
2. Customize data sources and filters
3. Set refresh intervals (real-time, 1min, 5min, 15min)
4. Choose color schemes and styling

**Step 5: Save Your Layout**
1. Click **"Save Layout"** when finished
2. Give your layout a name (e.g., "Daily Operations", "Executive Summary")
3. Set as default if desired
4. Share with team members (if admin)

### Advanced Customization

**Creating Multiple Dashboards:**
```
Executive Dashboard:
├── High-level KPIs
├── Revenue trends
├── Customer metrics
└── Strategic goals

Operations Dashboard:
├── Production metrics
├── Inventory levels
├── Order status
└── Quality indicators

Financial Dashboard:
├── Cash flow
├── Profitability
├── Working capital
└── Budget vs actual
```

**Widget Linking:**
- Link charts to detailed tables
- Click on chart elements to filter other widgets
- Create drill-down experiences
- Set up dashboard navigation flows

---

## Working Capital Analysis

### Understanding Your Financial Health

**Step 1: Access Working Capital Dashboard**
1. Navigate to **"Working Capital"** from the main menu
2. Review the overview metrics at the top:
   - Current Ratio
   - Quick Ratio
   - Working Capital Amount
   - Cash Conversion Cycle

**Step 2: Analyze Current Assets**

**Cash Analysis:**
```
Current Cash Position: £200,000
├── Operating Account: £150,000
├── Savings Account: £50,000
├── Petty Cash: £500
└── Available Credit: £100,000
```

1. Click on **"Cash Flow"** tab
2. Review daily cash positions
3. Identify cash flow patterns
4. Note any negative cash days

**Accounts Receivable Analysis:**
1. Go to **"Accounts Receivable"** section
2. Review aging report:
   ```
   Aging Analysis:
   ├── Current (0-30 days): 65% - £195,000 ✅
   ├── 31-60 days: 20% - £60,000 ⚠️
   ├── 61-90 days: 10% - £30,000 ⚠️
   └── 90+ days: 5% - £15,000 ❌
   ```
3. Click on overdue amounts to see customer details
4. Use **"Send Reminder"** for overdue accounts

**Step 3: Manage Current Liabilities**

**Accounts Payable Optimization:**
1. Navigate to **"Accounts Payable"** tab
2. View upcoming payments:
   ```
   Next 7 Days: £45,000
   ├── Critical: £15,000 (2 suppliers)
   ├── Normal: £25,000 (8 suppliers)
   └── Optional: £5,000 (3 suppliers)
   ```
3. **Early Payment Discounts**: Look for 2/10 net 30 terms
4. **Payment Scheduling**: Optimize payment timing for cash flow

**Step 4: Improve Working Capital**

**Strategies Implementation:**
1. **Reduce DSO** (Days Sales Outstanding):
   - Send invoices immediately
   - Offer early payment discounts
   - Implement automated reminders
   - Require deposits for large orders

2. **Optimize DPO** (Days Payable Outstanding):
   - Negotiate better payment terms
   - Take advantage of payment discounts
   - Consolidate suppliers for better terms

3. **Minimize DIO** (Days Inventory Outstanding):
   - Implement just-in-time inventory
   - Improve demand forecasting
   - Reduce slow-moving stock

---

## Financial Forecasting

### 90-Day Cash Flow Forecast

**Step 1: Set Up Forecast Parameters**
1. Go to **"Working Capital"** > **"Forecast"**
2. Select forecast period (30/60/90 days)
3. Choose scenario:
   - Conservative (worst case)
   - Most likely (expected)
   - Optimistic (best case)

**Step 2: Review Forecast Components**

**Expected Receipts:**
```
Customer Payments Forecast:
├── Week 1: £75,000
│   ├── Confirmed orders: £60,000
│   ├── Probable orders: £12,000
│   └── Possible orders: £3,000
├── Week 2: £82,000
└── Week 3: £78,000
```

**Planned Payments:**
```
Scheduled Payments:
├── Suppliers: £45,000/week
├── Payroll: £25,000/week
├── Rent & Utilities: £8,000/month
├── Loan payments: £5,000/month
└── Other expenses: £10,000/month
```

**Step 3: Identify Cash Gaps**
1. Look for negative cash flow days (highlighted in red)
2. Review cumulative cash position
3. Note minimum cash requirements
4. Plan for seasonal variations

**Step 4: Create Action Plans**
1. **For Cash Shortfalls**:
   - Accelerate receivables collection
   - Delay non-critical payments
   - Secure additional financing
   - Reduce inventory purchases

2. **For Excess Cash**:
   - Pay down debt early
   - Invest in growth opportunities
   - Build cash reserves
   - Negotiate better supplier terms

### Scenario Planning

**Best Case Scenario (+15% receipts, -5% payments):**
- Assumes all probable orders convert
- Early customer payments
- Supplier discounts achieved
- No unexpected expenses

**Worst Case Scenario (-15% receipts, +10% payments):**
- Customer payment delays
- Order cancellations
- Supplier price increases
- Emergency repairs needed

**Most Likely Scenario (baseline):**
- Historical patterns maintained
- Normal payment timing
- Expected market conditions
- Seasonal adjustments

---

## Inventory Optimization

### ABC Analysis Implementation

**Step 1: Classify Your Inventory**
1. Navigate to **"Inventory"** > **"ABC Analysis"**
2. System automatically categorizes items:
   ```
   A Items (20% of items, 80% of value):
   ├── Raw Material A: £50,000 annual usage
   ├── Component B: £45,000 annual usage
   └── Finished Good C: £40,000 annual usage
   
   B Items (30% of items, 15% of value):
   ├── Various components: £5,000-£15,000 each
   
   C Items (50% of items, 5% of value):
   ├── Consumables: <£5,000 each
   └── Low-usage parts: <£2,000 each
   ```

**Step 2: Set Management Policies**

**A Items - Tight Control:**
- Daily monitoring
- Accurate demand forecasting
- Multiple supplier sources
- Safety stock: 1-2 weeks
- Reorder point: Lead time + safety stock

**B Items - Moderate Control:**
- Weekly monitoring  
- Regular demand review
- Primary + backup supplier
- Safety stock: 2-4 weeks
- Economic order quantity (EOQ)

**C Items - Simple Control:**
- Monthly monitoring
- Bulk ordering (3-6 months)
- Single supplier acceptable
- Higher safety stock acceptable
- Focus on ordering efficiency

**Step 3: Optimize Reorder Points**

**Reorder Point Calculation:**
```
Reorder Point = (Average Daily Usage × Lead Time) + Safety Stock

Example for A Item:
├── Average Daily Usage: 50 units
├── Lead Time: 7 days
├── Safety Stock: 100 units (2 days)
└── Reorder Point: (50 × 7) + 100 = 450 units
```

**Step 4: Set Up Automated Alerts**
1. Configure low stock alerts
2. Set reorder triggers
3. Enable automatic PO generation
4. Implement approval workflows

### Demand Forecasting

**Step 1: Choose Forecasting Method**
1. Go to **"Inventory"** > **"Forecasting"**
2. Select method based on data:
   - **Moving Average**: Stable demand
   - **Exponential Smoothing**: Trending demand
   - **Seasonal Decomposition**: Seasonal patterns
   - **Machine Learning**: Complex patterns

**Step 2: Analyze Historical Patterns**
```
Demand Analysis:
├── Trend: +5% annual growth
├── Seasonality: 20% higher in Q4
├── Cyclical: 3-year replacement cycle
└── Random: ±10% monthly variation
```

**Step 3: Generate Forecasts**
1. Select forecast horizon (3, 6, 12 months)
2. Review forecast accuracy metrics
3. Adjust for known events (promotions, launches)
4. Export forecasts to procurement system

**Step 4: Monitor and Adjust**
1. Track forecast vs actual monthly
2. Calculate forecast error:
   ```
   MAPE = |Actual - Forecast| / Actual × 100
   Target: <20% for A items, <30% for B items
   ```
3. Adjust parameters quarterly
4. Update for market changes

---

## Report Generation

### Creating Custom Reports

**Step 1: Access Report Builder**
1. Navigate to **"Reports"** > **"Create New Report"**
2. Choose report type:
   - **Tabular**: Data tables with grouping
   - **Chart**: Visual representations
   - **Dashboard**: Multiple visualizations
   - **Form**: Printable forms

**Step 2: Select Data Sources**
1. Choose from available data sources:
   ```
   Available Data Sources:
   ├── Sales Data
   ├── Customer Information
   ├── Inventory Records
   ├── Financial Transactions
   ├── Employee Data
   └── Vendor Information
   ```
2. Join multiple sources if needed
3. Preview available fields

**Step 3: Configure Report Fields**

**Add Fields:**
- Drag fields from data source panel
- Arrange in desired order
- Set column widths
- Apply formatting (currency, percentage, date)

**Add Calculations:**
```sql
Examples:
├── Gross Margin = (Revenue - Cost) / Revenue * 100
├── Days Outstanding = (Accounts Receivable / Daily Sales)
├── Inventory Turns = Cost of Goods Sold / Average Inventory
└── Growth Rate = (Current Period - Previous Period) / Previous Period * 100
```

**Step 4: Apply Filters and Grouping**
1. **Filters**: Limit data to specific criteria
   - Date ranges
   - Customer types
   - Product categories
   - Geographic regions

2. **Grouping**: Organize data hierarchically
   - Group by customer, then product
   - Group by month, then region
   - Show subtotals and grand totals

**Step 5: Format and Style**
1. **Headers and Footers**:
   - Company logo and branding
   - Report title and description
   - Page numbers and print date
   - Confidentiality notices

2. **Styling Options**:
   - Color schemes
   - Font sizes and styles
   - Border and shading
   - Conditional formatting

**Step 6: Save and Schedule**
1. Save report template
2. Set up automatic generation:
   ```
   Schedule Options:
   ├── Frequency: Daily/Weekly/Monthly/Quarterly
   ├── Day of week: Monday
   ├── Time: 6:00 AM
   ├── Recipients: manager@company.com, cfo@company.com
   └── Format: PDF attachment
   ```

### Advanced Reporting Features

**Conditional Formatting:**
- Highlight values above/below thresholds
- Color-code performance indicators
- Show data bars and icons
- Create heat maps

**Interactive Features:**
- Drill-down capabilities
- Parameter prompts
- Dynamic filtering
- Export options

**Distribution Options:**
- Email delivery
- Shared folders
- API integration
- Web publishing

---

## User Management

### Adding New Users

**Step 1: Access User Management**
1. Go to **"Settings"** > **"Users"** (Admin only)
2. Click **"Add New User"**
3. Choose user type:
   - **Internal**: Company employees
   - **External**: Clients or partners
   - **Service**: API integrations

**Step 2: Configure User Details**
```
User Information:
├── First Name: John
├── Last Name: Smith
├── Email: john.smith@company.com
├── Department: Operations
├── Job Title: Operations Manager
└── Phone: +44 20 1234 5678
```

**Step 3: Assign Role and Permissions**
1. **Select Primary Role**:
   - Super Admin
   - Admin  
   - Manager
   - Operator
   - Viewer

2. **Customize Permissions** (optional):
   ```
   Custom Permissions:
   ├── Dashboard: Full Access ✅
   ├── Working Capital: View Only ⭕
   ├── Reports: Full Access ✅
   ├── User Management: No Access ❌
   └── System Settings: No Access ❌
   ```

**Step 4: Set Up Access Controls**
1. **Login Requirements**:
   - Force password change on first login
   - Require two-factor authentication
   - Set password expiration (90 days)
   - Account expiration date (optional)

2. **Access Restrictions**:
   - IP address restrictions
   - Time-based access (business hours only)
   - Geographic restrictions
   - Device limitations

**Step 5: Send Invitation**
1. Review user details
2. Click **"Send Invitation"**
3. User receives email with:
   - Welcome message
   - Login instructions
   - Temporary password
   - Setup guide

### Managing User Groups

**Creating Groups:**
1. Go to **"Settings"** > **"User Groups"**
2. Click **"Create New Group"**
3. Define group properties:
   ```
   Group: Sales Team
   ├── Description: Regional sales representatives
   ├── Default Role: Operator
   ├── Permissions: View sales data, create orders
   ├── Access Hours: 8 AM - 6 PM
   └── Data Access: Regional customers only
   ```

**Bulk User Operations:**
- Add multiple users to groups
- Update permissions across groups
- Deactivate/reactivate groups
- Generate group activity reports

### Security Management

**Password Policies:**
```
Policy Settings:
├── Minimum Length: 8 characters
├── Complexity: Upper, lower, number, special char
├── Expiration: 90 days
├── History: Cannot reuse last 5 passwords
├── Lockout: 5 failed attempts
└── Reset: Admin or self-service
```

**Session Management:**
- Session timeout: 8 hours inactive
- Concurrent sessions: 3 maximum
- Geographic alerts: Login from new location
- Device registration: Remember trusted devices

**Audit Logging:**
- User login/logout activities
- Permission changes
- Data access logs
- System configuration changes
- Failed login attempts

---

## Mobile App Usage

### Installation and Setup

**Installing the PWA:**
1. **iPhone/iPad**:
   - Open Safari
   - Navigate to https://sentia-manufacturing.com
   - Tap Share button (box with arrow)
   - Select "Add to Home Screen"
   - Tap "Add"

2. **Android**:
   - Open Chrome
   - Navigate to https://sentia-manufacturing.com  
   - Tap menu (three dots)
   - Select "Add to Home Screen"
   - Tap "Add"

**Initial Setup:**
1. Launch app from home screen
2. Sign in with your credentials
3. Enable biometric authentication (optional)
4. Allow push notifications
5. Complete mobile onboarding tour

### Mobile Navigation

**Bottom Navigation Bar:**
- 🏠 **Home**: Dashboard overview
- 📊 **Reports**: Quick metrics
- 💰 **Finance**: Working capital summary
- 👤 **Profile**: Settings and account

**Gesture Controls:**
```
Navigation Gestures:
├── Swipe right: Go back/previous
├── Pull down: Refresh current page
├── Long press: Context menu
├── Pinch: Zoom in/out on charts
└── Double tap: Quick actions
```

### Mobile-Optimized Features

**Dashboard Widgets:**
- Simplified KPI cards
- Touch-friendly charts
- Swipeable widget carousel
- Quick action buttons

**Data Entry:**
- Voice input support
- Barcode scanning (camera)
- Dropdown selections
- Auto-complete fields

**Offline Capabilities:**
1. **What Works Offline**:
   - View recently loaded data
   - Create new entries (cached)
   - Edit existing records
   - View saved reports

2. **Sync Process**:
   - Automatic sync when online
   - Conflict resolution prompts
   - Sync status indicators
   - Manual sync option

### Push Notifications

**Notification Types:**
- Critical alerts (cash flow warnings)
- Overdue payments reminders
- System maintenance notices
- Report generation completion

**Configuration:**
1. Go to Profile > Notifications
2. Choose notification types:
   ```
   Notification Settings:
   ├── Critical Alerts: Immediate
   ├── Payment Reminders: Daily at 9 AM
   ├── Weekly Reports: Monday at 8 AM
   ├── System Updates: As they occur
   └── Marketing: Disabled
   ```

---

## Integration Setup

### Connecting External Systems

**Step 1: Access Integration Hub**
1. Navigate to **"Settings"** > **"Integrations"**
2. View available integrations:
   ```
   Available Integrations:
   ├── Accounting: QuickBooks, Xero, Sage
   ├── E-commerce: Shopify, Amazon, eBay
   ├── ERP: SAP, Oracle, Microsoft Dynamics
   ├── CRM: Salesforce, HubSpot, Pipedrive
   └── Inventory: TradeGecko, Unleashed, DEAR
   ```

**Step 2: Configure QuickBooks Integration**
1. Click **"Connect"** next to QuickBooks
2. **Authentication Process**:
   - Redirected to QuickBooks login
   - Authorize Sentia Dashboard access
   - Select QuickBooks company
   - Confirm data sharing permissions

3. **Mapping Configuration**:
   ```
   Data Mapping:
   ├── Chart of Accounts → Dashboard Categories
   ├── Customer List → CRM Contacts
   ├── Item List → Product Catalog
   ├── Vendor List → Supplier Database
   └── Transaction Types → Report Categories
   ```

**Step 3: Set Sync Preferences**
1. **Sync Frequency**:
   - Real-time (webhooks)
   - Hourly batch
   - Daily overnight
   - Manual only

2. **Data Direction**:
   - Import only (QB → Dashboard)
   - Export only (Dashboard → QB)
   - Bi-directional sync
   - Custom field mapping

**Step 4: Test Integration**
1. Run test sync
2. Verify data accuracy
3. Check for duplicate records
4. Validate calculations
5. Generate test reports

### API Integration

**For Developers:**
```javascript
// Authentication
const token = await getAuthToken();

// API Request
const response = await fetch('https://api.sentia-manufacturing.com/v1/orders', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const orders = await response.json();
```

**Webhook Setup:**
1. Register webhook endpoint
2. Configure event types
3. Implement signature verification
4. Handle retry logic
5. Test webhook delivery

### Data Import/Export

**Bulk Data Import:**
1. Go to **"Settings"** > **"Data Import"**
2. Download import template
3. Prepare your data:
   ```
   CSV Format Requirements:
   ├── First row: Column headers
   ├── Date format: YYYY-MM-DD
   ├── Currency: No symbols, decimal format
   ├── Text: No line breaks or special chars
   └── Required fields: Cannot be empty
   ```
4. Upload and validate
5. Review mapping and errors
6. Execute import

**Scheduled Exports:**
1. Create export template
2. Set schedule (daily/weekly/monthly)
3. Configure delivery method:
   - Email attachment
   - FTP/SFTP upload
   - API webhook
   - Cloud storage (Dropbox, Google Drive)

This comprehensive feature guide provides detailed instructions for using all major features of the CapLiquify Manufacturing Platform. Each section includes step-by-step instructions, examples, and best practices to help users maximize the platform's value.