# Amazon SP-API Integration Setup Guide

## Overview

The Sentia Manufacturing Dashboard integrates with Amazon Selling Partner API (SP-API) to provide real-time FBA (Fulfillment by Amazon) data including:
- FBA inventory levels and stock status
- Order metrics (total orders, revenue, average order value)
- Unshipped orders and fulfillment tracking
- Multi-marketplace support (US, UK, EU, etc.)
- Channel performance analytics (Amazon vs. Shopify comparison)

This guide will walk you through setting up the Amazon SP-API integration using **OAuth 2.0 with Login with Amazon (LWA)**.

---

## Prerequisites

- **Amazon Seller Central Account**: Active seller account with FBA inventory
- **Amazon Developer Account**: Free account at [developer.amazonservices.com](https://developer.amazonservices.com)
- **AWS Account**: For IAM role creation (SP-API requires AWS IAM)
- **Server Access**: Ability to set environment variables and restart the application

---

## Step 1: Register as Amazon Developer

1. Visit [developer.amazonservices.com](https://developer.amazonservices.com)
2. Click **"Sign up"** or **"Log in"** with your Amazon seller credentials
3. Complete the developer registration:
   - **Developer Name**: Your company or organization name
   - **Developer Email**: Contact email for API notifications
   - **Privacy Policy URL**: Your privacy policy (required for public apps)
4. Accept the Amazon Services Business Solutions Agreement
5. Verify your email address

**Time Required**: 10 minutes

---

## Step 2: Create SP-API Application

1. Log in to [Seller Central](https://sellercentral.amazon.com)
2. Navigate to **Apps & Services** → **Develop Apps**
3. Click **"Add new app client"**

4. Fill in the application details:
   - **App Name**: `Sentia Manufacturing Dashboard` (or your preferred name)
   - **OAuth Redirect URI**: `https://your-dashboard-url.com/api/auth/amazon/callback`
     - For Render: `https://sentia-manufacturing-dashboard-621h.onrender.com/api/auth/amazon/callback`
     - For local dev: `http://localhost:5000/api/auth/amazon/callback`
   - **Application Type**: Select **"SP-API"**

5. Select API roles and permissions:
   - ✅ **Inventory and Order Tracking**
   - ✅ **Fulfillment Inbound**
   - ✅ **Reports**
   - ✅ **Sales**

6. Click **"Save and exit"**

**Time Required**: 5 minutes

---

## Step 3: Get LWA Credentials

1. In Seller Central, go to **Apps & Services** → **Develop Apps**
2. Click **"View"** on your newly created app
3. Under **"LWA credentials"** section, copy:
   - **LWA Client Identifier** (App ID) - looks like: `amzn1.application-oa2-client.abc123...`
   - **LWA Client Secret** - click **"View"** to reveal, looks like: `abc123def456...`

   > ⚠️ **IMPORTANT**: Store the LWA Client Secret securely. Treat it like a password!

**Time Required**: 2 minutes

---

## Step 4: Authorize Your Application

1. Still in your app details, scroll to **"Authorize"** section
2. Click **"Authorize"** button
3. You'll be redirected to Login with Amazon (LWA) consent screen
4. Review permissions and click **"Allow"**
5. You'll be redirected back to Seller Central
6. Copy the **Refresh Token** shown on screen

   > ⚠️ **CRITICAL**: This refresh token is shown only once! Save it immediately!

The refresh token looks like: `Atzr|IwEBIA...` (long alphanumeric string)

**Time Required**: 3 minutes

---

## Step 5: Create AWS IAM Role for SP-API

Amazon SP-API requires an AWS IAM role for security.

### Create IAM Role in AWS Console

1. Log in to [AWS Console](https://console.aws.amazon.com)
2. Navigate to **IAM** → **Roles** → **Create role**
3. Select **"Another AWS account"**
   - **Account ID**: Enter `437568002678` (Amazon's SP-API account)
   - Check **"Require external ID"**
   - **External ID**: Enter your Seller ID (found in Seller Central → Settings → Account Info)
4. Click **"Next: Permissions"**
5. Click **"Next: Tags"** (skip tags)
6. Click **"Next: Review"**
7. Enter role details:
   - **Role name**: `SentiaAmazonSPAPIRole`
   - **Role description**: `IAM role for Sentia Dashboard to access Amazon SP-API`
8. Click **"Create role"**

### Attach SP-API Policy

1. Open the newly created role `SentiaAmazonSPAPIRole`
2. Click **"Attach policies"**
3. Click **"Create policy"** → **JSON** tab
4. Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "execute-api:Invoke",
      "Resource": "arn:aws:execute-api:*:*:*"
    }
  ]
}
```

5. Click **"Review policy"**
6. Name it: `SentiaAmazonSPAPIPolicy`
7. Click **"Create policy"**
8. Go back to the role and attach the new policy

### Copy IAM Role ARN

1. Open the role `SentiaAmazonSPAPIRole`
2. Copy the **Role ARN** (looks like: `arn:aws:iam::123456789012:role/SentiaAmazonSPAPIRole`)

**Time Required**: 10 minutes

---

## Step 6: Get Your Seller ID

1. Log in to [Seller Central](https://sellercentral.amazon.com)
2. Go to **Settings** (gear icon) → **Account Info**
3. Under **"Business Information"**, copy your **Merchant Token** or **Seller ID**
   - Looks like: `A1B2C3D4E5F6G7` (alphanumeric, 13-14 characters)

**Time Required**: 2 minutes

---

## Step 7: Configure Environment Variables

Add the Amazon SP-API credentials to your application environment:

### For Render Deployment (Recommended)

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Select your service (e.g., `sentia-manufacturing-dashboard-621h`)
3. Click **"Environment"** tab
4. Add the following environment variables:

```
AMAZON_REFRESH_TOKEN=Atzr|IwEBIA...  # From Step 4
AMAZON_LWA_APP_ID=amzn1.application-oa2-client.abc123...  # From Step 3
AMAZON_LWA_CLIENT_SECRET=abc123def456...  # From Step 3
AMAZON_SP_ROLE_ARN=arn:aws:iam::123456789012:role/SentiaAmazonSPAPIRole  # From Step 5
AMAZON_SELLER_ID=A1B2C3D4E5F6G7  # From Step 6
AMAZON_REGION=us-east-1  # Or your AWS region (us-east-1, eu-west-1, etc.)
```

5. Click **"Save Changes"**
6. Render will automatically restart your service

### For Local Development

Add to your `.env` file:

```bash
AMAZON_REFRESH_TOKEN=Atzr|IwEBIA...
AMAZON_LWA_APP_ID=amzn1.application-oa2-client.abc123...
AMAZON_LWA_CLIENT_SECRET=abc123def456...
AMAZON_SP_ROLE_ARN=arn:aws:iam::123456789012:role/SentiaAmazonSPAPIRole
AMAZON_SELLER_ID=A1B2C3D4E5F6G7
AMAZON_REGION=us-east-1
```

**Time Required**: 3 minutes

---

## Step 8: Restart Application

### Render (Auto-restarts)
- Render automatically restarts when environment variables change
- Wait ~2-3 minutes for the deployment to complete

### Local Development
```bash
npm run dev
```

The Amazon SP-API service will automatically:
1. Initialize the SP-API client with LWA credentials
2. Exchange refresh token for access token
3. Assume the AWS IAM role
4. Connect to Amazon SP-API endpoints
5. Start 15-minute data sync schedule (inventory + orders)

**Time Required**: 2-3 minutes

---

## Step 9: Verify Connection

### Check Dashboard

1. Navigate to your dashboard: `/dashboard`
2. If Amazon is connected, you'll see:
   - ✅ Real Amazon FBA metrics (orders, revenue, inventory)
   - ✅ Channel performance widget comparing Amazon vs. Shopify
   - ✅ No "Connect Amazon SP-API" prompts

3. If Amazon is NOT connected, you'll see:
   - ❌ "Connect Amazon SP-API" prompt with setup instructions
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
      "amazon": {
        "connected": true,
        "status": "connected",
        "lastSync": "2025-10-19T10:30:00.000Z",
        "inventoryCount": 150,
        "orderCount": 47
      }
    }
  }
}
```

**Expected Response (Not Connected)**:
```json
{
  "success": true,
  "data": {
    "integrations": {
      "amazon": {
        "connected": false,
        "status": "configuration_error",
        "message": "Missing required environment variables",
        "details": {
          "missing": [
            "AMAZON_REFRESH_TOKEN",
            "AMAZON_LWA_APP_ID",
            "AMAZON_LWA_CLIENT_SECRET"
          ]
        }
      }
    }
  }
}
```

### Check Inventory Endpoint

```bash
curl https://your-dashboard-url.com/api/v1/dashboard/amazon-inventory
```

**Expected Response (Connected)**:
```json
{
  "success": true,
  "data": {
    "totalSKUs": 150,
    "totalQuantity": 5420,
    "lowStockItems": 8,
    "outOfStockItems": 2,
    "lastSynced": "2025-10-19T10:25:00.000Z"
  }
}
```

**Time Required**: 2 minutes

---

## Troubleshooting

### Error: "Configuration error - Missing AMAZON_REFRESH_TOKEN"

**Cause**: Environment variables not set or incorrect variable names

**Solution**:
1. Check variable names are exactly as listed (case-sensitive, underscores not hyphens)
2. Verify variables are set in the correct environment (development vs. production)
3. Ensure refresh token was copied completely (it's very long, ~500+ characters)
4. Restart application after adding variables

---

### Error: "Failed to get LWA access token"

**Cause**: Invalid LWA credentials or expired refresh token

**Solution**:
1. Verify LWA App ID and Client Secret copied correctly
2. Check refresh token is complete (starts with `Atzr|`)
3. No extra spaces or newlines in environment variables
4. Try re-authorizing your application in Seller Central (Step 4) to get a new refresh token
5. Ensure app is still "Active" in Seller Central → Develop Apps

---

### Error: "Failed to assume IAM role"

**Cause**: IAM role not configured correctly or invalid Role ARN

**Solution**:
1. Verify Role ARN copied correctly (starts with `arn:aws:iam::`)
2. Check IAM role trust relationship allows Amazon account `437568002678`
3. Ensure external ID matches your Seller ID
4. Verify SP-API policy is attached to the role
5. Check AWS credentials have permissions to assume the role

---

### Error: "Access denied - Insufficient permissions"

**Cause**: App doesn't have required SP-API permissions

**Solution**:
1. Go to Seller Central → Apps & Services → Develop Apps
2. Edit your app and ensure these permissions are selected:
   - Inventory and Order Tracking
   - Fulfillment Inbound
   - Reports
   - Sales
3. Save changes and re-authorize the app

---

### Error: "Rate limit exceeded"

**Cause**: Too many SP-API requests in short time period

**Solution**:
- Dashboard automatically caches Amazon data for 5 minutes
- Background sync runs every 15 minutes (not on every page load)
- SP-API rate limits:
  - Orders: 0.0167 requests/second (1 per minute)
  - Inventory: 0.1 requests/second (6 per minute)
  - Reports: Varies by endpoint
- Service respects these limits with intelligent caching and sync scheduling

---

### Data Not Updating

**Cause**: Background sync may not be running or encountering errors

**Solution**:
1. Check server logs for sync errors:
   - Render Dashboard → Logs
   - Search for "Amazon SP-API sync"
2. Verify data sync is scheduled (runs every 15 minutes):
   - Look for log: "Amazon SP-API data sync scheduled"
3. Manually trigger sync (if API endpoint available):
   ```bash
   curl -X POST https://your-dashboard-url.com/api/v1/integrations/amazon/sync
   ```
4. Check Redis cache is working (sync status stored in Redis)

---

## Data Refresh Schedule

The dashboard fetches Amazon data:
- **Inventory Summary**: Background sync every 15 minutes, cached 5 minutes
- **Order Metrics**: Background sync every 15 minutes, cached 5 minutes
- **FBA Inventory Details**: On-demand API calls, cached 5 minutes
- **SSE Broadcasts**: Dashboard updates pushed when new sync completes

---

## Security Best Practices

1. **Never commit credentials to git**:
   - Use `.env` files (already in `.gitignore`)
   - Use Render environment variables for production

2. **Rotate credentials regularly**:
   - Regenerate LWA Client Secret every 90 days
   - Refresh token can be re-authorized anytime in Seller Central
   - Update environment variables after rotation

3. **Use separate Amazon apps per environment**:
   - Development: One SP-API app with localhost redirect
   - Testing: Separate app with test environment redirect
   - Production: Separate app with production redirect

4. **Monitor API usage**:
   - Check Seller Central → Developer Console for API call statistics
   - Review server logs for authentication errors
   - Set up alerts for rate limit warnings

5. **Secure AWS IAM role**:
   - Minimize permissions (only `execute-api:Invoke`)
   - Use external ID for additional security
   - Regularly review role usage in CloudTrail

---

## Advanced Configuration

### Multi-Marketplace Support

Amazon SP-API supports multiple marketplaces (US, Canada, Mexico, UK, EU, etc.):

**Current Implementation**: US marketplace (default)

**To Add Multiple Marketplaces**:
1. Ensure your Seller Central account is registered in target marketplaces
2. Update service to specify marketplace IDs in API requests:
   ```javascript
   const marketplaceIds = [
     'ATVPDKIKX0DER', // US
     'A1AM78C64UM0Y8', // Mexico
     'A2EUQ1WTGCTBG2', // Canada
   ];
   ```
3. Modify sync logic to iterate over marketplaces
4. Aggregate inventory/orders across regions

---

### Custom Sync Schedules

**Default**: 15-minute background sync

**To Customize**:
Edit `services/amazon-sp-api.js` line 322:

```javascript
// Change from 15 minutes to custom interval
const SYNC_INTERVAL = 10 * 60 * 1000; // 10 minutes
```

**Recommendation**: Don't sync more frequently than 10 minutes to respect rate limits.

---

## API Endpoints

The dashboard uses these Amazon SP-API endpoints:

| SP-API Endpoint | Purpose | Frequency | Rate Limit |
|-----------------|---------|-----------|------------|
| `/fba/inventory/v1/summaries` | FBA inventory levels | Every 15 min | 0.1 req/s |
| `/orders/v0/orders` | Order metrics and status | Every 15 min | 0.0167 req/s |
| `/fba/inbound/v0/shipments` | Inbound shipment tracking | On-demand | 0.1 req/s |
| `/reports/2021-06-30/reports` | Historical sales reports | Daily | Varies |

---

## Dashboard API Endpoints

Internal API endpoints for dashboard consumption:

| Dashboard Endpoint | Purpose | Authentication |
|-------------------|---------|----------------|
| `/api/v1/dashboard/amazon-inventory` | Get FBA inventory summary | Clerk session |
| `/api/v1/dashboard/amazon-orders` | Get order metrics | Clerk session |
| `/api/v1/dashboard/channel-performance` | Compare Amazon vs. Shopify | Clerk session |
| `/api/v1/dashboard/executive` | Includes Amazon data in KPIs | Clerk session |

---

## Support

**Amazon SP-API Support**:
- Documentation: https://developer-docs.amazon.com/sp-api/
- Developer Forums: https://sellercentral.amazon.com/forums/c/Developer-Discussion
- Contact: sp-api-developer-support@amazon.com

**Dashboard Support**:
- Check server logs: Render Dashboard → Logs
- Review health check: `/api/v1/dashboard/setup-status`
- Contact: support@sentia-manufacturing.com (replace with actual support contact)

---

## Appendix: Technical Details

### Authentication Flow

```
1. Application starts
   ↓
2. amazonSPAPIService.initialize()
   - Validates environment variables (refresh token, LWA credentials, IAM role)
   ↓
3. Exchange refresh token for access token (LWA OAuth)
   - POST to https://api.amazon.com/auth/o2/token
   - Receives access_token (valid 1 hour)
   ↓
4. Assume AWS IAM role using STS
   - Uses SP-API Role ARN
   - Generates temporary AWS credentials
   ↓
5. Connection established ✅
   - Can now call SP-API endpoints with signed requests
   ↓
6. Start background sync (every 15 minutes)
   - Sync inventory → Store in Prisma database
   - Sync orders → Calculate metrics
   - Broadcast updates via SSE
```

### Data Transformation

**SP-API Inventory → Dashboard KPIs**:
```javascript
totalSKUs = inventoryItems.length
totalQuantity = sum(item.quantity)
lowStockItems = items where quantity < reorderPoint
outOfStockItems = items where quantity === 0
```

**SP-API Orders → Revenue Metrics**:
```javascript
totalRevenue = sum(order.OrderTotal.Amount)
totalOrders = orders.length
avgOrderValue = totalRevenue / totalOrders
unshippedOrders = orders where OrderStatus === 'Unshipped'
```

**Channel Performance (Amazon vs. Shopify)**:
```javascript
amazonPercentage = (amazonRevenue / totalRevenue) × 100
shopifyPercentage = (shopifyRevenue / totalRevenue) × 100
preferredChannel = amazonRevenue > shopifyRevenue ? 'Amazon' : 'Shopify'
```

---

**Last Updated**: 2025-10-19
**Version**: 1.0
**Story**: BMAD-MOCK-005
