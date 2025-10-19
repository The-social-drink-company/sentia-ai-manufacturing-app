# Xero Integration Setup Guide

## Overview

The Sentia Manufacturing Dashboard integrates with Xero accounting software to provide real-time financial data including:
- Working capital analysis (AR/AP, cash conversion cycle)
- Profit & Loss (P&L) reports with month-over-month trends
- Cash flow categorization (operating, investing, financing)
- Financial KPIs (revenue, gross margin, net profit)

This guide will walk you through setting up the Xero integration using a **Custom Connection** (Client Credentials OAuth flow).

---

## Prerequisites

- **Xero Account**: Access to a Xero organization with financial data
- **Xero Developer Account**: Free account at [developer.xero.com](https://developer.xero.com)
- **Server Access**: Ability to set environment variables and restart the application

---

## Step 1: Create Xero Developer Account

1. Visit [developer.xero.com](https://developer.xero.com)
2. Click **"Sign up"** or **"Log in"** if you already have an account
3. Complete the registration process
4. Verify your email address

**Time Required**: 5 minutes

---

## Step 2: Create Custom Connection App

1. Log in to the [Xero Developer Portal](https://developer.xero.com/myapps)
2. Click **"New app"** → Select **"Custom Connection"**

   > **Why Custom Connection?** Custom Connections use Client Credentials OAuth flow, which is designed for server-to-server integrations without user interaction. Perfect for dashboard applications.

3. Fill in the app details:
   - **App name**: `Sentia Manufacturing Dashboard` (or your preferred name)
   - **Company or application URL**: Your company website or dashboard URL
   - **Purpose**: `Financial data integration for manufacturing intelligence dashboard`

4. Click **"Create app"**

**Time Required**: 3 minutes

---

## Step 3: Get API Credentials

1. Open your newly created Custom Connection app in the Developer Portal
2. Navigate to the **"Configuration"** tab
3. Copy the following credentials:
   - **Client ID** (looks like: `A1B2C3D4E5F6...`)
   - **Client Secret** (click "Generate a secret" if not already generated)

   > ⚠️ **IMPORTANT**: Store the Client Secret securely. You won't be able to see it again after closing the page!

**Time Required**: 2 minutes

---

## Step 4: Configure Environment Variables

Add the Xero credentials to your application environment:

### For Render Deployment (Recommended)

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Select your service (e.g., `sentia-manufacturing-dashboard-621h`)
3. Click **"Environment"** tab
4. Add the following environment variables:

```
XERO_CLIENT_ID=<your-client-id-from-step-3>
XERO_CLIENT_SECRET=<your-client-secret-from-step-3>
```

5. Click **"Save Changes"**
6. Render will automatically restart your service

### For Local Development

Add to your `.env` file:

```bash
XERO_CLIENT_ID=A1B2C3D4E5F6...
XERO_CLIENT_SECRET=abc123def456...
```

**Time Required**: 3 minutes

---

## Step 5: Restart Application

### Render (Auto-restarts)
- Render automatically restarts when environment variables change
- Wait ~2-3 minutes for the deployment to complete

### Local Development
```bash
npm run dev
```

The Xero service will automatically:
1. Initialize the Xero client
2. Exchange credentials for an access token
3. Fetch tenant connections
4. Authenticate with the first connected organization

**Time Required**: 2-3 minutes

---

## Step 6: Verify Connection

### Check Dashboard
1. Navigate to your dashboard: `/dashboard`
2. If Xero is connected, you'll see:
   - ✅ Real financial KPIs (revenue, working capital, cash flow)
   - ✅ Live data badge: "Live data from Xero"
   - ✅ No "Connect Xero" prompts

3. If Xero is NOT connected, you'll see:
   - ❌ "Connect Xero" prompt with setup instructions
   - ❌ Configuration error messages (if env vars missing)

### Check API Status Endpoint
```bash
curl https://your-dashboard-url.com/api/v1/dashboard/setup-status
```

**Expected Response (Connected)**:
```json
{
  "success": true,
  "data": {
    "integrations": {
      "xero": {
        "connected": true,
        "status": "connected",
        "message": "Xero API fully operational",
        "organizationId": "abc-123-def-456",
        "lastCheck": "2025-10-19T10:30:00.000Z"
      }
    },
    "dashboardReady": true,
    "nextSteps": [
      "Xero connected successfully! ✅"
    ]
  }
}
```

**Expected Response (Not Connected)**:
```json
{
  "success": true,
  "data": {
    "integrations": {
      "xero": {
        "connected": false,
        "status": "configuration_error",
        "message": "Xero configuration error: Missing: XERO_CLIENT_ID, XERO_CLIENT_SECRET"
      }
    },
    "dashboardReady": false,
    "nextSteps": [
      "Set XERO_CLIENT_ID environment variable",
      "Set XERO_CLIENT_SECRET environment variable",
      "Restart application to connect to Xero"
    ]
  }
}
```

**Time Required**: 2 minutes

---

## Troubleshooting

### Error: "Configuration error - Missing XERO_CLIENT_ID"

**Cause**: Environment variables not set or incorrect variable names

**Solution**:
1. Check variable names are exactly `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET` (case-sensitive)
2. Verify variables are set in the correct environment (development vs. production)
3. Restart application after adding variables

---

### Error: "Failed to get custom connection token"

**Cause**: Invalid Client ID or Client Secret

**Solution**:
1. Verify credentials copied correctly from Xero Developer Portal
2. No extra spaces or newlines in environment variables
3. Check Xero app status is "Active" in Developer Portal
4. Try regenerating the Client Secret

---

### Error: "No tenant connections found"

**Cause**: Custom Connection not authorized with a Xero organization

**Solution**:
1. Go to [Xero Developer Portal](https://developer.xero.com/myapps)
2. Open your Custom Connection app
3. Click **"Connect to Xero"** button
4. Select the organization you want to connect
5. Restart application

---

### Error: "Xero API rate limit exceeded"

**Cause**: Too many API requests in short time period

**Solution**:
- Dashboard automatically caches Xero data for 5 minutes
- If you're testing, wait 1-2 minutes between refreshes
- Xero API limits:
  - 60 calls per minute
  - 5,000 calls per day
- Dashboard respects these limits with intelligent caching

---

### Error: "403 Forbidden - Custom connection not authorized"

**Cause**: Custom Connection doesn't have required scopes

**Solution**:
The dashboard requires these scopes:
- `accounting.transactions.read`
- `accounting.settings.read`
- `accounting.contacts.read`
- `accounting.reports.read`

These are automatically requested during Custom Connection token exchange.

---

## Data Refresh Schedule

The dashboard fetches Xero data:
- **Working Capital**: On dashboard load, cached 5 minutes
- **P&L Reports**: On dashboard load, cached 5 minutes
- **Cash Flow**: On dashboard load, cached 5 minutes
- **SSE Broadcasts**: Every 5 minutes (for real-time updates)

---

## Security Best Practices

1. **Never commit credentials to git**:
   - Use `.env` files (already in `.gitignore`)
   - Use Render environment variables for production

2. **Rotate credentials regularly**:
   - Regenerate Client Secret every 90 days
   - Update environment variables after rotation

3. **Use separate Xero apps per environment**:
   - Development: One Custom Connection
   - Testing: Separate Custom Connection
   - Production: Separate Custom Connection

4. **Monitor API usage**:
   - Check Xero Developer Portal for API call statistics
   - Review server logs for authentication errors

---

## Advanced Configuration

### Custom Connection vs. Standard OAuth 2.0

**Custom Connection** (Used by this dashboard):
- ✅ Server-to-server integration
- ✅ No user interaction required
- ✅ Automatic token refresh
- ✅ Simpler setup
- ❌ Only works with one Xero organization

**Standard OAuth 2.0**:
- ✅ Multi-organization support
- ✅ User consent flow
- ❌ Requires user login redirect
- ❌ More complex setup
- ❌ Not suitable for dashboards

---

## API Endpoints

The dashboard uses these Xero API endpoints:

| Endpoint | Purpose | Frequency |
|----------|---------|-----------|
| `/connections` | Get tenant connections | On authentication |
| `/api.xro/2.0/Organisation` | Verify connection | On health check |
| `/api.xro/2.0/Reports/BalanceSheet` | Working capital data | Every 5 min |
| `/api.xro/2.0/Reports/ProfitAndLoss` | P&L analysis | Every 5 min |
| `/api.xro/2.0/Reports/BankSummary` | Cash flow data | Every 5 min |

---

## Support

**Xero Developer Support**:
- Documentation: https://developer.xero.com/documentation/
- Community Forum: https://central.xero.com/s/topic/0TO1N000000MeM6WAK/xero-developer

**Dashboard Support**:
- Check server logs: `render logs` or Render Dashboard → Logs
- Review health check: `/api/v1/dashboard/setup-status`
- Contact: support@sentia-manufacturing.com (replace with actual support contact)

---

## Appendix: Technical Details

### Authentication Flow

```
1. Application starts
   ↓
2. xeroService.initializeXeroClient()
   - Validates XERO_CLIENT_ID and XERO_CLIENT_SECRET
   ↓
3. xeroService.authenticate()
   - Exchange credentials for access token (Client Credentials flow)
   - Fetch tenant connections via /connections endpoint
   - Store tenant ID and organization ID
   ↓
4. Connection established ✅
   - Dashboard can now fetch financial data
```

### Data Transformation

**Balance Sheet → Working Capital**:
```
Current Assets = Cash + AR + Inventory
Current Liabilities = AP + Short-term Debt
Working Capital = Current Assets - Current Liabilities
Current Ratio = Current Assets / Current Liabilities
Quick Ratio = (Current Assets - Inventory) / Current Liabilities
```

**P&L + Balance Sheet → Cash Conversion Cycle**:
```
DSO = (Accounts Receivable / Revenue) × 365
DIO = (Inventory / COGS) × 365
DPO = (Accounts Payable / COGS) × 365
CCC = DSO + DIO - DPO
```

Where COGS = Expenses × 0.65 (manufacturing estimate)

---

**Last Updated**: 2025-10-19
**Version**: 1.0
**Story**: BMAD-MOCK-001
