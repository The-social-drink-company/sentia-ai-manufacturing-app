# User Manual

## Welcome to Sentia Manufacturing Dashboard

The Sentia Manufacturing Dashboard is a comprehensive business intelligence platform designed to streamline your manufacturing operations, financial management, and strategic decision-making.

## Table of Contents
- [Getting Started](#getting-started)
- [Dashboard Overview](#dashboard-overview)
- [Working Capital Management](#working-capital-management)
- [Inventory Management](#inventory-management)
- [Reports & Analytics](#reports--analytics)
- [User Settings](#user-settings)
- [Mobile App](#mobile-app)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Requirements

**Web Browser (Recommended):**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile Devices:**
- iOS 13+ (Safari or Chrome)
- Android 8+ (Chrome or Firefox)

**Internet Connection:**
- Broadband connection recommended
- Minimum 1 Mbps for basic functionality
- 5+ Mbps for optimal performance

### First Login

1. **Access the Platform**
   - Navigate to https://sentia-manufacturing.com
   - You'll be redirected to the secure login page

2. **Sign In**
   - Enter your email address
   - Enter your password
   - Click "Sign In"

3. **Two-Factor Authentication** (if enabled)
   - Enter the 6-digit code from your authenticator app
   - Or enter the code sent to your phone/email

4. **Welcome Tour**
   - New users will see a guided tour
   - Follow the prompts to learn key features
   - You can restart the tour anytime from Settings

### User Roles & Permissions

| Role | Dashboard | Reports | Financial Data | User Management | System Settings |
|------|-----------|---------|----------------|-----------------|-----------------|
| **Super Admin** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Admin** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Manage Users | ❌ No Access |
| **Manager** | ✅ Full Access | ✅ Full Access | ✅ View Only | ❌ No Access | ❌ No Access |
| **Operator** | ✅ Limited | ✅ View Only | ❌ No Access | ❌ No Access | ❌ No Access |
| **Viewer** | ✅ View Only | ✅ View Only | ❌ No Access | ❌ No Access | ❌ No Access |

---

## Dashboard Overview

### Main Dashboard

The main dashboard provides a real-time overview of your business performance with customizable widgets and key performance indicators.

#### Navigation

**Top Navigation Bar:**
- **Dashboard**: Return to main dashboard
- **Working Capital**: Financial management tools
- **Reports**: Analytics and reporting
- **Settings**: User preferences and system settings

**Sidebar Menu:**
- Quick access to all major sections
- Collapsible for more screen space
- Recent items and favorites

#### Dashboard Widgets

**KPI Strip** (Top Row):
- Revenue metrics
- Order counts
- Customer data
- Inventory levels

**Charts & Analytics:**
- Revenue trends (line chart)
- Order distribution (bar chart)
- Geographic sales (map)
- Conversion funnel

**Quick Actions:**
- Create new order
- Generate report
- Export data
- Schedule meeting

### Customizing Your Dashboard

1. **Edit Mode**
   - Click the "Edit Dashboard" button (top right)
   - Dashboard widgets become draggable
   - Resize widgets by dragging corners

2. **Adding Widgets**
   - Click the "+" button in edit mode
   - Choose from widget gallery:
     - KPI Metrics
     - Charts (Line, Bar, Pie)
     - Tables
     - Calendar
     - Weather
     - News Feed

3. **Widget Settings**
   - Click the gear icon on any widget
   - Configure data source
   - Set refresh intervals
   - Customize appearance

4. **Saving Layouts**
   - Click "Save Layout" when finished
   - Layouts are automatically saved to your profile
   - Create multiple layouts for different views

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `G + D` | Go to Dashboard |
| `G + W` | Go to Working Capital |
| `G + R` | Go to Reports |
| `G + S` | Go to Settings |
| `E` | Toggle Edit Mode |
| `R` | Refresh Current Page |
| `?` | Show Keyboard Shortcuts |
| `ESC` | Close Modal/Cancel Action |

---

## Working Capital Management

### Overview

The Working Capital section provides comprehensive financial insights and cash flow management tools.

### Current Ratio Analysis

**Understanding Current Ratio:**
- **Good Ratio**: 1.5 - 3.0
- **Excellent Ratio**: 2.0 - 2.5
- **Warning**: Below 1.2 or above 4.0

**How to Interpret:**
```
Current Ratio = Current Assets ÷ Current Liabilities

Example:
- Current Assets: £900,000
- Current Liabilities: £400,000
- Current Ratio: 2.25 (Good)
```

### Accounts Receivable

**Aging Report:**
- **Current**: 0-30 days (should be >60%)
- **30 Days**: 30-60 days (should be <25%)
- **60 Days**: 60-90 days (should be <10%)
- **90+ Days**: Over 90 days (should be <5%)

**Managing Overdue Accounts:**

1. **View Overdue Items**
   - Go to Working Capital > Accounts Receivable
   - Filter by "Overdue" status
   - Sort by days overdue (highest first)

2. **Contact Customers**
   - Click on customer name
   - View contact history
   - Send payment reminder
   - Schedule follow-up

3. **Payment Plans**
   - Negotiate payment schedules
   - Set up automatic reminders
   - Track payment promises

### Accounts Payable

**Managing Payments:**

1. **Upcoming Payments**
   - View next 7/14/30 days
   - Priority indicators (High/Medium/Low)
   - Available cash balance check

2. **Payment Approval**
   - Review payment details
   - Check supporting documents
   - Approve or reject payments
   - Batch approve multiple payments

3. **Vendor Management**
   - Payment terms negotiation
   - Performance tracking
   - Discount opportunities

### Cash Flow Forecasting

**90-Day Forecast:**
- **Receipts**: Expected customer payments
- **Payments**: Scheduled vendor payments
- **Net Flow**: Daily cash position
- **Alerts**: Potential shortfalls

**Scenario Planning:**
- Best case scenario (+10% receipts, -5% payments)
- Worst case scenario (-10% receipts, +5% payments)
- Most likely scenario (current trends)

**Action Items:**
- Accelerate receivables collection
- Negotiate extended payment terms
- Secure additional financing
- Optimize inventory levels

---

## Inventory Management

### Stock Levels

**Inventory Categories:**
- **Raw Materials**: Production inputs
- **Work in Progress**: Partially completed goods
- **Finished Goods**: Ready for sale
- **Safety Stock**: Emergency reserves

**Stock Alerts:**
- 🔴 **Critical**: Below minimum threshold
- 🟡 **Low**: Below reorder point
- 🟢 **Normal**: Adequate stock levels
- 🔵 **Excess**: Above maximum threshold

### Reorder Management

**Automatic Reordering:**
1. Set reorder points for each item
2. System monitors stock levels daily
3. Automatic purchase orders generated
4. Approval workflow (if configured)
5. Supplier notification

**Manual Reordering:**
1. Review low stock report
2. Select items to reorder
3. Specify quantities
4. Choose suppliers
5. Generate purchase orders

### ABC Analysis

**Category Classification:**
- **A Items**: High value, 80% of inventory value
- **B Items**: Medium value, 15% of inventory value  
- **C Items**: Low value, 5% of inventory value

**Management Strategies:**
- **A Items**: Tight control, frequent monitoring
- **B Items**: Moderate control, periodic review
- **C Items**: Simple controls, bulk ordering

---

## Reports & Analytics

### Standard Reports

**Financial Reports:**
- Profit & Loss Statement
- Balance Sheet
- Cash Flow Statement
- Working Capital Analysis
- Accounts Receivable Aging
- Accounts Payable Summary

**Operational Reports:**
- Sales Performance
- Inventory Turnover
- Order Fulfillment
- Customer Analysis
- Supplier Performance
- Production Efficiency

**Custom Reports:**
- Build your own reports
- Drag-and-drop interface
- Custom calculations
- Scheduled delivery

### Creating Custom Reports

1. **Start New Report**
   - Go to Reports > Create New
   - Choose data sources
   - Select report type (Table, Chart, Dashboard)

2. **Configure Fields**
   - Drag fields from data sources
   - Set filters and conditions
   - Group and sort data
   - Add calculations

3. **Format Report**
   - Choose colors and styling
   - Add logos and branding
   - Set page layout
   - Configure headers/footers

4. **Save & Schedule**
   - Save report template
   - Schedule automatic generation
   - Set up email distribution
   - Configure access permissions

### Exporting Data

**Export Formats:**
- **Excel**: Full formatting, multiple sheets
- **PDF**: Print-ready, professional layout
- **CSV**: Raw data, database imports
- **PowerPoint**: Presentation slides

**Export Options:**
- Current view only
- All data (remove filters)
- Selected rows only
- Summary data only

---

## User Settings

### Profile Management

**Personal Information:**
- Update name and contact details
- Change password
- Set up two-factor authentication
- Upload profile picture

**Notification Preferences:**
- Email notifications (daily/weekly summaries)
- Push notifications (mobile app)
- Slack integration
- SMS alerts (for critical items)

### Display Preferences

**Theme Settings:**
- Light theme (default)
- Dark theme
- High contrast mode
- Custom color schemes

**Language & Region:**
- Interface language
- Date/time format
- Currency display
- Number formatting

**Dashboard Preferences:**
- Default landing page
- Widget refresh intervals
- Chart color schemes
- Data density (compact/comfortable)

### Security Settings

**Password Requirements:**
- Minimum 8 characters
- Include uppercase letter
- Include number
- Include special character
- Cannot reuse last 5 passwords

**Two-Factor Authentication:**
1. **Setup Process**
   - Go to Settings > Security
   - Click "Enable 2FA"
   - Scan QR code with authenticator app
   - Enter verification code
   - Save backup codes

2. **Supported Apps**
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
   - 1Password

**Session Management:**
- View active sessions
- Sign out from all devices
- Set session timeout
- Geographic login alerts

---

## Mobile App

### Installation

**iOS (iPhone/iPad):**
1. Open Safari on your device
2. Navigate to https://sentia-manufacturing.com
3. Tap the Share button
4. Select "Add to Home Screen"
5. Tap "Add" to install

**Android:**
1. Open Chrome on your device
2. Navigate to https://sentia-manufacturing.com
3. Tap the menu (three dots)
4. Select "Add to Home Screen"
5. Tap "Add" to install

### Mobile Features

**Optimized Interface:**
- Touch-friendly navigation
- Swipe gestures
- Bottom navigation bar
- Quick actions

**Offline Capability:**
- View recently loaded data
- Create orders offline
- Sync when connection restored
- Offline indicators

**Mobile-Specific Features:**
- Pull-to-refresh data
- Push notifications
- Biometric authentication
- Camera integration (future)

### Mobile Navigation

**Bottom Navigation:**
- 🏠 **Home**: Dashboard overview
- 📊 **Reports**: Key metrics
- 💰 **Finance**: Working capital
- 👤 **Profile**: Settings & account

**Gesture Controls:**
- **Swipe right**: Go back
- **Pull down**: Refresh data
- **Long press**: Context menu
- **Pinch**: Zoom charts

---

## Troubleshooting

### Common Issues

**Login Problems:**

*"I forgot my password"*
1. Click "Forgot Password" on login page
2. Enter your email address
3. Check email for reset link
4. Follow instructions to create new password

*"Two-factor authentication not working"*
1. Check time sync on your device
2. Try backup codes from setup
3. Contact admin to reset 2FA
4. Use backup authentication method

**Dashboard Issues:**

*"Dashboard is loading slowly"*
1. Check internet connection
2. Clear browser cache and cookies
3. Disable browser extensions
4. Try incognito/private mode

*"Widgets showing old data"*
1. Click refresh button (↻)
2. Check data source connections
3. Verify user permissions
4. Contact support if issue persists

**Data Export Issues:**

*"Excel export not working"*
1. Ensure pop-ups are allowed
2. Check download folder permissions
3. Try different export format (CSV)
4. Reduce data set size

*"PDF report is blank"*
1. Wait for report generation to complete
2. Check browser PDF settings
3. Try downloading instead of viewing
4. Use Chrome for best compatibility

### Browser Configuration

**Chrome (Recommended):**
```
Settings to enable:
- Allow pop-ups for sentia-manufacturing.com
- Enable JavaScript
- Allow cookies (first-party and third-party)
- Enable local storage
```

**Firefox:**
```
Settings to check:
- Privacy & Security > Cookies > Allow all
- Privacy & Security > Permissions > Block pop-ups (add exception)
- about:config > dom.storage.enabled = true
```

**Safari:**
```
Preferences > Privacy:
- Uncheck "Prevent cross-site tracking"
- Uncheck "Block all cookies"
- Website settings > Pop-up Windows > Allow
```

### Performance Optimization

**For Slow Performance:**
1. Close unnecessary browser tabs
2. Clear browser cache (Ctrl+Shift+Delete)
3. Update browser to latest version
4. Disable unnecessary extensions
5. Check available memory/disk space

**Network Issues:**
- Test speed at fast.com (minimum 1 Mbps)
- Check firewall settings
- Try different network/mobile hotspot
- Contact IT administrator

### Contact Support

**Self-Service Options:**
- FAQ section (below)
- Video tutorials
- User community forum
- Knowledge base search

**Direct Support:**
- **Email**: support@sentia-manufacturing.com
- **Phone**: +44 20 1234 5678
- **Live Chat**: Available 9 AM - 5 PM GMT
- **Emergency**: +44 800 URGENT (24/7)

**When Contacting Support:**
- Include screenshot of error
- Specify browser and version
- Describe steps to reproduce issue
- Mention any recent system changes

---

## Frequently Asked Questions

### Account & Access

**Q: How do I change my password?**
A: Go to Settings > Profile > Change Password. Enter your current password and new password twice, then click Save.

**Q: Can I have multiple users on one account?**
A: Yes, administrators can add multiple users with different permission levels. Go to Settings > Users > Add New User.

**Q: How long does my session last?**
A: Sessions automatically expire after 8 hours of inactivity for security. You can extend this in Settings > Security.

### Data & Reports

**Q: How often is data updated?**
A: Most data updates every 15 minutes. Financial data updates hourly. You can manually refresh anytime using the refresh button.

**Q: Can I export all my data?**
A: Yes, you can export data in Excel, CSV, or PDF format. Some large datasets may require scheduling for email delivery.

**Q: How far back does historical data go?**
A: We maintain 7 years of historical data for compliance. Older data may be available on request.

### Billing & Pricing

**Q: What happens if I exceed my user limit?**
A: You'll receive a warning at 80% of your limit. Additional users can be added through your account settings with automatic billing adjustment.

**Q: Can I downgrade my plan?**
A: Yes, but downgrades take effect at the next billing cycle. Some features may become unavailable immediately.

**Q: Do you offer annual discounts?**
A: Yes, annual subscriptions receive a 15% discount compared to monthly billing.

### Technical Issues

**Q: The dashboard won't load. What should I do?**
A: Try refreshing (Ctrl+R), clearing cache, or using incognito mode. If issues persist, contact support with your browser details.

**Q: Can I use this on my tablet?**
A: Yes, the platform is fully responsive and optimized for tablets. Install as a web app for the best experience.

**Q: Is my data secure?**
A: Yes, we use enterprise-grade encryption, regular security audits, and comply with GDPR and SOC 2 Type II standards.

---

*This user manual is updated regularly. Last updated: January 2025 | Version 1.0*

For the most current information, visit our online help center at https://help.sentia-manufacturing.com