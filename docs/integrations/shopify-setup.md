# Shopify Multi-Store Integration Setup Guide

**BMAD Story**: BMAD-MOCK-002
**Sprint**: Sprint 1 - Financial & Sales Data
**Framework**: BMAD-METHOD v6a Phase 4
**Last Updated**: 2025-10-19

## Overview

This guide walks through connecting your Shopify UK/EU and USA stores to the Sentia Manufacturing Dashboard for real-time sales data integration with automatic 2.9% transaction fee tracking.

### What You'll Get

- **Real-time Sales Data**: Live order tracking from multiple Shopify stores
- **Commission Tracking**: Automatic 2.9% Shopify transaction fee calculations
- **Regional Performance**: Separate UK (GBP) vs USA (USD) analytics
- **Product Analytics**: Top sellers by revenue, units sold, SKU tracking
- **Auto-Sync**: Data refreshes every 15 minutes automatically
- **Net Revenue Visibility**: Gross revenue minus transaction fees for accurate financial planning

---

## Prerequisites

- Shopify store admin access (both UK/EU and USA stores)
- Render dashboard access (to set environment variables)
- Shopify Custom App or Private App with REST API access

---

## Step 1: Create Shopify Custom App (UK/EU Store)

### 1.1 Access Shopify Admin

1. Log in to your Shopify admin: `https://[your-store].myshopify.com/admin`
2. Example for Sentia: `https://sentia-uk-eu.myshopify.com/admin`

### 1.2 Navigate to App Development

1. Click **Settings** (bottom left)
2. Click **Apps and sales channels**
3. Click **Develop apps** (top right)
4. Click **Create an app**

### 1.3 Configure App Details

**App Name**: `Sentia Manufacturing Dashboard - UK/EU`
**App developer**: Your email address

Click **Create app**

### 1.4 Configure Admin API Scopes

1. Click **Configure Admin API scopes**
2. Enable the following scopes:

   - ☑ `read_orders` - Read order data (required for sales tracking)
   - ☑ `read_products` - Read product inventory (required for SKU analytics)
   - ☑ `read_customers` - Read customer information (required for customer counts)

3. Click **Save**

### 1.5 Install App and Get Access Token

1. Click **Install app** (top right)
2. Click **Install** to confirm
3. **IMPORTANT**: Copy the **Admin API access token** immediately
   - Format: `shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - This is shown **only once** - save it securely
   - If lost, you'll need to regenerate it

4. Also note your **shop domain**: Extract the prefix before `.myshopify.com`
   - Full domain: `sentia-uk-eu.myshopify.com`
   - Use for env var: `sentia-uk-eu` (without .myshopify.com)

---

## Step 2: Repeat for USA Store

Follow the exact same steps as Step 1, but for your USA Shopify store:

1. Log in to USA store: `https://sentia-usa.myshopify.com/admin`
2. Create app named: `Sentia Manufacturing Dashboard - USA`
3. Configure the same 3 API scopes: `read_orders`, `read_products`, `read_customers`
4. Install app and copy access token (starts with `shpat_`)
5. Note shop domain: `sentia-usa` (without .myshopify.com)

---

## Step 3: Configure Environment Variables on Render

### 3.1 Access Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your service: `sentia-manufacturing-dashboard-621h` (development)
3. Click **Environment** tab

### 3.2 Add Shopify Environment Variables

Add the following 4 environment variables:

```bash
# Shopify UK/EU Store
SHOPIFY_UK_SHOP_DOMAIN=sentia-uk-eu
SHOPIFY_UK_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Shopify USA Store
SHOPIFY_US_SHOP_DOMAIN=sentia-usa
SHOPIFY_US_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**IMPORTANT**:
- Shop domain: Use **without** `.myshopify.com` suffix
- Access token: Full token starting with `shpat_`
- Click **Save Changes** after adding all 4 variables

### 3.3 Verify Auto-Deployment

1. After saving, Render will automatically redeploy (takes ~5 minutes)
2. Monitor deployment progress in **Logs** tab
3. Look for success messages:
   ```
   [INFO] SHOPIFY: Initializing multi-store connection...
   [INFO] SHOPIFY: Connected to 2/2 stores
   [INFO]   ✅ Sentia UK/EU Store (UK_EU) - Connected
   [INFO]   ✅ Sentia US Store (US) - Connected
   [INFO] SHOPIFY: Starting sync scheduler (every 15 minutes)
   ```

---

## Step 4: Verify Connection

### 4.1 Check Dashboard

1. Navigate to: `https://sentia-frontend-prod.onrender.com`
2. Go to executive dashboard
3. You should see:
   - **Sales Performance** widget with real Shopify data
   - **Regional Performance** showing UK vs USA breakdown
   - **Shopify Commission** section highlighting 2.9% transaction fees
   - **Net Revenue** calculations (gross revenue minus fees)

### 4.2 Verify Data Accuracy

Compare dashboard values with Shopify Admin:

1. **Total Orders**: Should match Shopify order count (last 30 days, paid status)
2. **Gross Revenue**: Should match Shopify total sales
3. **Transaction Fees**: Should be exactly 2.9% of gross revenue
4. **Net Revenue**: Should be gross revenue - transaction fees
5. **Customer Count**: Should match total customers across stores

### 4.3 Check Sync Status

API endpoint: `GET https://sentia-frontend-prod.onrender.com/api/v1/dashboard/shopify-sales`

Expected response:
```json
{
  "success": true,
  "data": {
    "sales": {
      "totalOrders": 150,
      "totalRevenue": 45000,
      "netRevenue": 43695,
      "transactionFees": 1305,
      "feeRate": 0.029,
      "avgOrderValue": 300,
      "customers": 120
    },
    "commission": {
      "shopifyTransactionFees": 1305,
      "effectiveMargin": 0.971,
      "feeImpact": "2.9% transaction fees applied"
    },
    "regionalPerformance": [
      {
        "region": "uk_eu",
        "name": "Sentia UK/EU Store",
        "revenue": 30000,
        "netRevenue": 29130,
        "transactionFees": 870,
        "orders": 100,
        "currency": "GBP"
      },
      {
        "region": "us",
        "name": "Sentia US Store",
        "revenue": 15000,
        "netRevenue": 14565,
        "transactionFees": 435,
        "orders": 50,
        "currency": "USD"
      }
    ]
  }
}
```

---

## Commission Tracking Explained

### Why Track Shopify Transaction Fees?

Shopify charges **2.9% + $0.30** per transaction on most plans. Our dashboard tracks the 2.9% percentage fee for accurate net revenue calculations.

### Calculation Formula

```javascript
Gross Revenue = Sum of all paid orders (total_price field)
Transaction Fee Rate = 0.029 (2.9%)
Transaction Fees = Gross Revenue × 0.029
Net Revenue = Gross Revenue - Transaction Fees
```

### Example Calculation

```
UK Store Gross Revenue: £30,000
Transaction Fees: £30,000 × 0.029 = £870
Net Revenue: £30,000 - £870 = £29,130

Effective Margin: £29,130 / £30,000 = 97.1%
```

### Why This Matters

- **Cash Flow Planning**: Know actual revenue after Shopify fees
- **Profitability Analysis**: True margins = revenue - COGS - Shopify fees
- **Regional Comparison**: Compare net revenue (not just gross) between UK and USA
- **Budget Forecasting**: Accurate expense tracking includes marketplace fees

---

## Data Sync Details

### Sync Frequency

- **Automatic Sync**: Every 15 minutes
- **Data Range**: Last 30 days of orders (paid status only)
- **Cache Duration**: 30 minutes (Redis TTL)
- **Real-time Events**: SSE broadcasts on sync completion

### What Data is Synced?

**Per Store**:
- Orders (last 30 days, financial_status: paid)
- Customer count
- Product inventory levels
- Top 50 published products

**Consolidated Metrics**:
- Total orders across all stores
- Total revenue (gross and net)
- Total transaction fees (2.9% of gross)
- Average order value (gross and net)
- Regional breakdown (UK vs USA)

### Manual Sync

The system syncs automatically, but you can trigger manually via API:

```bash
# Not needed - auto-sync runs every 15 minutes
# Data is fresh within 15-30 minutes of any Shopify order
```

---

## Troubleshooting

### Error: "Shopify stores not configured"

**Symptom**: Dashboard shows empty sales data widget

**Cause**: Missing environment variables

**Solution**:
1. Verify all 4 environment variables are set in Render
2. Check for typos in variable names:
   - Must be exactly: `SHOPIFY_UK_SHOP_DOMAIN`, `SHOPIFY_UK_ACCESS_TOKEN`, `SHOPIFY_US_SHOP_DOMAIN`, `SHOPIFY_US_ACCESS_TOKEN`
3. Ensure access tokens start with `shpat_`
4. Redeploy service after adding variables (automatic on save)
5. Wait 5 minutes for deployment to complete

---

### Error: "Shopify API error (401): Unauthorized"

**Symptom**: Logs show authentication errors

**Cause**: Invalid or expired access token

**Solution**:
1. Go to Shopify Admin → Settings → Apps and sales channels → Develop apps
2. Click your app
3. Click **Regenerate** Admin API access token
4. Copy new token (starts with `shpat_`)
5. Update `SHOPIFY_UK_ACCESS_TOKEN` or `SHOPIFY_US_ACCESS_TOKEN` in Render
6. Service will auto-redeploy
7. Verify connection in logs after ~5 minutes

---

### Error: "Rate limit exceeded"

**Symptom**: Logs show "429 Too Many Requests"

**Cause**: Too many API requests to Shopify

**Solution**:
- **Wait**: Shopify rate limit resets after 60 seconds
- **Our Limits**: Service uses Redis caching to minimize API calls
- **Shopify Limits**: 2 requests/second for REST Admin API
- **Sync Interval**: 15 minutes is well within limits (< 1 request/minute average)
- **No Action Needed**: Service automatically retries with exponential backoff

---

### One Store Connected, One Not

**Symptom**: Dashboard shows data from UK but not USA (or vice versa)

**Cause**: One store has configuration issues

**Solution**:
1. Check Render logs for specific error:
   ```
   [WARN] SHOPIFY: Failed to connect to Sentia US Store: [error details]
   ```
2. Verify both stores have valid credentials
3. Ensure both Shopify apps have correct API scopes:
   - `read_orders`
   - `read_products`
   - `read_customers`
4. Check setup status endpoint:
   ```
   GET /api/v1/dashboard/setup-status
   ```
5. Look at `integrations.shopify.stores` array for per-store status

---

### Data Doesn't Match Shopify Admin

**Symptom**: Revenue/order counts differ between dashboard and Shopify Admin

**Possible Causes**:
1. **Time Range**: Dashboard shows last 30 days, Shopify Admin may show different range
2. **Order Status**: Dashboard only counts orders with `financial_status: paid`
3. **Sync Delay**: Data may be up to 15-30 minutes old (auto-sync interval)
4. **Currency Conversion**: UK (GBP) and USA (USD) are not converted - shown separately

**Verification Steps**:
1. In Shopify Admin, filter orders to:
   - **Date Range**: Last 30 days
   - **Financial Status**: Paid
   - **All Locations**: Include both stores
2. Compare filtered totals with dashboard
3. Allow for 15-30 minute sync delay
4. Check `lastUpdated` timestamp in API response

---

## Advanced Configuration

### Adjust Sync Frequency

**Default**: 15 minutes

**To Change** (requires code modification):

Edit `services/shopify-multistore.js` line 12:
```javascript
this.syncFrequency = 15 * 60 * 1000; // 15 minutes in milliseconds
```

Change to 30 minutes:
```javascript
this.syncFrequency = 30 * 60 * 1000; // 30 minutes
```

**Note**: Longer intervals reduce API usage but delay data freshness.

---

### Adjust Data Range

**Default**: Last 30 days

**To Change** (requires code modification):

Edit `services/shopify-multistore.js` line 206:
```javascript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
```

Change to 60 days:
```javascript
const sixtyDaysAgo = new Date();
sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
```

**Warning**: Longer ranges increase API response time and may hit rate limits.

---

### Add More Stores

The service supports multi-store expansion beyond UK/EU and USA.

**To Add a Third Store** (e.g., Canada):

1. Edit `services/shopify-multistore.js` constructor (lines 15-34)
2. Add new store config to `storeConfigs` array:
   ```javascript
   {
     id: 'ca_store',
     name: 'Sentia Canada Store',
     shopDomain: process.env.SHOPIFY_CA_SHOP_DOMAIN,
     accessToken: process.env.SHOPIFY_CA_ACCESS_TOKEN,
     apiVersion: '2024-01',
     region: 'ca',
     currency: 'CAD'
   }
   ```
3. Add environment variables to Render:
   - `SHOPIFY_CA_SHOP_DOMAIN`
   - `SHOPIFY_CA_ACCESS_TOKEN`
4. Redeploy service
5. Data will automatically consolidate across all 3 stores

---

## API Endpoints Reference

### GET /api/v1/dashboard/shopify-sales

Returns consolidated sales data with commission tracking.

**Response**:
```json
{
  "success": true,
  "data": {
    "sales": {
      "totalOrders": 150,
      "totalRevenue": 45000,
      "netRevenue": 43695,
      "transactionFees": 1305,
      "feeRate": 0.029,
      "avgOrderValue": 300,
      "avgNetOrderValue": 291.3,
      "customers": 120
    },
    "commission": {
      "shopifyTransactionFees": 1305,
      "effectiveMargin": 0.971,
      "feeImpact": "2.9% transaction fees applied"
    },
    "regionalPerformance": [...],
    "lastUpdated": "2025-10-19T10:30:00Z"
  }
}
```

---

### GET /api/v1/dashboard/sales-trends?period=12months

Returns monthly sales trends.

**Query Parameters**:
- `period`: `1month`, `3months`, `6months`, `12months`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-01",
      "revenue": 15000,
      "quantity": 500,
      "orders": 50,
      "avgOrderValue": 300
    }
    // ... more months
  ],
  "period": "12months",
  "lastUpdated": "2025-10-19T10:30:00Z"
}
```

---

### GET /api/v1/dashboard/product-performance?limit=20

Returns top products by revenue.

**Query Parameters**:
- `limit`: Number of products (default: 50)
- `startDate`: ISO date (optional)
- `endDate`: ISO date (optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "123456789",
        "title": "Product Name",
        "sku": "SKU-001",
        "unitsSold": 100,
        "revenue": 5000,
        "currency": "GBP",
        "region": "Sentia UK/EU Store",
        "avgPrice": 50
      }
      // ... more products
    ],
    "summary": {
      "totalRevenue": 45000,
      "totalOrders": 150,
      "totalUnitsSold": 1500,
      "avgOrderValue": 300
    }
  }
}
```

---

## Security Best Practices

1. **Never Commit Access Tokens**: Keep tokens in environment variables only
2. **Rotate Tokens Periodically**: Regenerate every 90 days
3. **Minimum Scopes**: Only enable `read_orders`, `read_products`, `read_customers`
4. **Monitor Access**: Check Shopify Admin → Apps regularly for suspicious activity
5. **Audit Logs**: Review Render logs for unexpected API errors

---

## Support

**Integration Issues**:
1. Check Render logs for error details
2. Verify Shopify Admin app settings
3. Test API endpoints directly
4. Contact development team with specific error messages

**BMAD Documentation**:
- Story: [BMAD-MOCK-002](../../bmad/stories/2025-10-shopify-sales-data-integration.md)
- Epic: [EPIC-002: Eliminate Mock Data](../../bmad/epics/2025-10-eliminate-mock-data-epic.md)
- Retrospective: [BMAD-MOCK-002 Retrospective](../../bmad/retrospectives/2025-10-bmad-mock-002-shopify-retrospective.md)

---

**Last Updated**: 2025-10-19
**BMAD Story**: BMAD-MOCK-002
**Framework**: BMAD-METHOD v6a Phase 4 (Implementation)
**Integration Status**: ✅ OPERATIONAL
