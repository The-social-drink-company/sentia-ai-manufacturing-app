# Unleashed ERP Integration Setup Guide

## Overview

The CapLiquify Manufacturing Platform integrates with Unleashed Software ERP to provide real-time manufacturing intelligence including:
- Assembly job tracking (active batches, planned jobs, completed jobs)
- Stock on hand inventory levels
- Production schedule and capacity planning
- Quality control alerts (yield tracking)
- Low-stock notifications for manufacturing materials
- Resource utilization metrics

This guide will walk you through setting up the Unleashed ERP integration using **HMAC-SHA256 API authentication**.

---

## Prerequisites

- **Unleashed Software Account**: Active company subscription with API access enabled
- **Admin Access**: Unleashed admin panel permissions to generate API keys
- **Server Access**: Ability to set environment variables and restart the application
- **Assembly Jobs**: Unleashed configured with AssemblyJobs module (production tracking)
- **Stock On Hand**: Inventory items configured in Unleashed

---

## Step 1: Generate API Credentials

1. Log in to [Unleashed Software](https://go.unleashedsoftware.com)
2. Navigate to **Integration** → **API Access**
3. Click **"Add API Key"**

4. Configure API key:
   - **Key Name**: `CapLiquify Manufacturing Platform`
   - **Key Description**: `Manufacturing intelligence platform integration`

5. Select API permissions:
   - ✅ **Assembly Jobs** (Read) - Production tracking
   - ✅ **Stock On Hand** (Read) - Inventory levels
   - ✅ **Sales Orders** (Read) - Order data
   - ✅ **Purchase Orders** (Read) - Material tracking
   - ✅ **Products** (Read) - Product information
   - ✅ **Warehouses** (Read) - Warehouse locations
   - ❌ **Stock Movements** (Known Limitation: 403 Forbidden error)

6. Click **"Save"**

7. Copy the generated credentials:
   - **API ID** (GUID format): `a1b2c3d4-e5f6-7890-abcd-1234567890ab`
   - **API Key** (base64 string): `AbCdEf123456==`

   > ⚠️ **IMPORTANT**: Store the API Key securely. Treat it like a password!

**Time Required**: 5 minutes

---

## Step 2: Test API Connection (Optional)

Before configuring the dashboard, verify your API credentials work:

### Using cURL:

```bash
# Set your credentials
API_ID="a1b2c3d4-e5f6-7890-abcd-1234567890ab"
API_KEY="AbCdEf123456=="

# Generate HMAC-SHA256 signature for /Currencies endpoint
SIGNATURE=$(echo -n "" | openssl dgst -sha256 -hmac "$API_KEY" -binary | base64)

# Test connection
curl -X GET "https://api.unleashedsoftware.com/Currencies?pageSize=1" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "api-auth-id: $API_ID" \
  -H "api-auth-signature: $SIGNATURE"
```

**Expected Response**:
```json
{
  "Pagination": { "PageNumber": 1, "PageSize": 1 },
  "Items": [
    {
      "CurrencyCode": "USD",
      "Description": "United States Dollar"
    }
  ]
}
```

**Time Required**: 2 minutes

---

## Step 3: Configure Environment Variables

Add the Unleashed ERP credentials to your application environment:

### For Render Deployment (Recommended)

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Select your service (e.g., `sentia-manufacturing-dashboard-621h`)
3. Click **"Environment"** tab
4. Add the following environment variables:

```
UNLEASHED_API_ID=a1b2c3d4-e5f6-7890-abcd-1234567890ab
UNLEASHED_API_KEY=AbCdEf123456==
UNLEASHED_API_URL=https://api.unleashedsoftware.com
```

5. Click **"Save Changes"**
6. Render will automatically restart your service

### For Local Development

Add to your `.env` file:

```bash
UNLEASHED_API_ID=a1b2c3d4-e5f6-7890-abcd-1234567890ab
UNLEASHED_API_KEY=AbCdEf123456==
UNLEASHED_API_URL=https://api.unleashedsoftware.com
```

**Time Required**: 3 minutes

---

## Step 4: Restart Application

### Render (Auto-restarts)
- Render automatically restarts when environment variables change
- Wait ~2-3 minutes for the deployment to complete

### Local Development
```bash
npm run dev
```

The Unleashed ERP service will automatically:
1. Initialize the ERP client with HMAC-SHA256 authentication
2. Test connection with `/Currencies` endpoint
3. Connect to Unleashed API
4. Start 15-minute data sync schedule (production + inventory)

**Time Required**: 2-3 minutes

---

## Step 5: Verify Connection

### Check Server Logs

Look for these log messages in Render Dashboard → Logs:

**Successful Connection**:
```
[INFO] UNLEASHED: Initializing ERP connection...
[INFO] UNLEASHED: Connected to Unleashed ERP successfully
[INFO] UNLEASHED: Production - 3 active batches
[INFO] UNLEASHED: Quality Score - 97.5%
[INFO] UNLEASHED: Utilization - 87.0%
```

**Connection Errors**:
```
[ERROR] UNLEASHED ERP: Connection failed: Missing API credentials
[WARN] ⚠️ Unleashed ERP: Not connected. Check credentials.
```

### Check Dashboard

1. Navigate to your dashboard: `/dashboard`
2. If Unleashed is connected, you'll see:
   - ✅ Real production metrics (active batches, quality score)
   - ✅ Manufacturing schedule widget with assembly jobs
   - ✅ Quality control alerts (if yield < 95%)
   - ✅ Low-stock notifications for manufacturing materials

3. If Unleashed is NOT connected, you'll see:
   - ❌ "Connect Unleashed ERP" prompt with setup instructions
   - ❌ Empty states with configuration guidance

### Check Manufacturing Endpoint

```bash
curl https://your-dashboard-url.com/api/v1/dashboard/manufacturing
```

**Expected Response (Connected)**:
```json
{
  "success": true,
  "data": {
    "production": {
      "activeBatches": 3,
      "completedToday": 2,
      "qualityScore": 97.5,
      "utilizationRate": 87.0
    },
    "productionSchedule": [
      {
        "jobId": "guid-123",
        "productName": "Sentia Premium Blend 750ml",
        "quantity": 500,
        "scheduledTime": "2025-10-20T08:00:00Z",
        "priority": "High"
      }
    ],
    "qualityAlerts": [],
    "inventoryAlerts": [
      {
        "productCode": "MAT-001",
        "description": "Premium Base Material",
        "currentStock": 45,
        "minLevel": 100,
        "location": "Main Warehouse"
      }
    ],
    "lastUpdated": "2025-10-19T10:30:00.000Z"
  }
}
```

**Time Required**: 2 minutes

---

## Data Sync Schedule

The dashboard syncs Unleashed data:

| Data Type | Sync Frequency | Cache Duration | API Endpoint |
|-----------|----------------|----------------|--------------|
| Assembly Jobs (Production) | Every 15 min | 15 min | `/AssemblyJobs` |
| Stock On Hand (Inventory) | Every 15 min | 15 min | `/StockOnHand` |
| Sales Orders | Every 15 min | 15 min | `/SalesOrders` |
| Purchase Orders | Every 15 min | 15 min | `/PurchaseOrders` |
| Consolidated Manufacturing | On-demand | 30 min | - |

**SSE Real-time Updates**:
- `unleashed-sync-started` - Sync initiated
- `unleashed-sync-completed` - New data available
- `unleashed-quality-alert` - Quality issue detected
- `unleashed-low-stock-alert` - Inventory below minimum
- `unleashed-sync-error` - Sync failure

---

## Production Metrics Explained

### Active Batches
```javascript
activeBatches = AssemblyJobs where JobStatus === 'InProgress'
```
**Purpose**: Number of production runs currently in progress

### Completed Today
```javascript
completedToday = AssemblyJobs where CompletedDate === Today
```
**Purpose**: Daily production output tracking

### Quality Score
```javascript
qualityScore = (jobs without yield issues / total completed jobs) × 100
```
**Yield Issue**: Actual quantity < 95% of planned quantity

**Purpose**: Manufacturing quality percentage (target: ≥95%)

### Utilization Rate
```javascript
utilizationRate = (active jobs / max capacity) × 100
```
**Max Capacity**: 4 concurrent production lines (configurable)

**Purpose**: Production line capacity usage

---

## Inventory Metrics Explained

### Total Value
```javascript
totalValue = Σ(QtyOnHand × AverageLandedCost)
```
**Purpose**: Current inventory valuation

### Low Stock Items
```javascript
lowStockItems = Items where QtyOnHand < MinStockLevel
```
**Purpose**: Identify materials needing reorder

### Zero Stock Items
```javascript
zeroStockItems = Items where QtyOnHand === 0
```
**Purpose**: Critical stockouts requiring immediate action

---

## Quality Alerts Explained

### Yield Shortfall
```javascript
if (job.ActualQuantity < job.PlannedQuantity × 0.95) {
  severity = "Medium"
  issue = `Yield shortfall: ${ActualQuantity}/${PlannedQuantity}`
}
```

**Example**:
- Planned: 500 units
- Actual: 460 units
- Yield: 92% (< 95% threshold)
- **Alert**: ⚠️ Yield shortfall: 460/500

**Action**: Review production process for quality issues

---

## Troubleshooting

### Error: "Missing Unleashed ERP API credentials"

**Cause**: Environment variables not set or incorrect variable names

**Solution**:
1. Verify variable names are exactly:
   - `UNLEASHED_API_ID` (not `API_ID` or `UNLEASHED_ID`)
   - `UNLEASHED_API_KEY` (not `API_KEY` or `UNLEASHED_KEY`)
2. Check for typos (case-sensitive, underscores not hyphens)
3. Ensure values are not wrapped in quotes in environment variables
4. Restart application after adding variables

---

### Error: "403 Forbidden" on Stock Movements

**Cause**: Unleashed API limitation - Stock Movements endpoint requires special permissions

**Solution**:
- This is a **known limitation** and expected behavior
- Dashboard automatically uses alternative calculation:
  - Inbound: Purchase order quantities
  - Outbound: Sales order quantities
  - Net movements: Inbound - Outbound
- **No action required** - system handles gracefully

**Impact**: Limited - calculated movements provide sufficient visibility

---

### Error: "Connection timeout"

**Cause**: Large datasets or slow network response

**Solution**:
1. Check Unleashed API status: https://status.unleashedsoftware.com/
2. Reduce page sizes if necessary:
   ```javascript
   // services/unleashed-erp.js line 117
   pageSize: 100  // Reduced from 250
   ```
3. Increase timeout:
   ```javascript
   // services/unleashed-erp.js line 19
   timeout: 45000  // Increased from 30000 (45 seconds)
   ```

---

### Error: "HMAC signature verification failed"

**Cause**: Incorrect API Key or signature generation issue

**Solution**:
1. Verify API Key copied exactly (no extra spaces/newlines)
2. Check API Key is base64-encoded string
3. Regenerate API Key in Unleashed admin panel if needed
4. Update environment variable with new key
5. Restart application

**Signature Details**:
- Algorithm: HMAC-SHA256
- Input: Query string only (empty string for `/Currencies`)
- Encoding: base64
- Header: `api-auth-signature`

---

### Error: "API key expired or revoked"

**Cause**: API key disabled in Unleashed admin panel

**Solution**:
1. Log in to Unleashed → Integration → API Access
2. Check API key status (should show "Active")
3. If inactive, click **"Activate"** or generate new key
4. Update environment variables if key regenerated

---

### Data Not Updating

**Cause**: Background sync may not be running

**Solution**:
1. Check server logs for sync status:
   ```
   [DEBUG] UNLEASHED ERP: Starting comprehensive data sync...
   [DEBUG] UNLEASHED ERP: Production data synced
   [DEBUG] UNLEASHED ERP: Inventory data synced
   [DEBUG] UNLEASHED ERP: Sync completed successfully
   ```
2. Verify Redis cache is operational (sync results cached)
3. Manually trigger sync via API:
   ```bash
   curl -X POST https://your-dashboard-url.com/api/v1/dashboard/unleashed-sync
   ```

---

### Low Data Quality

**Cause**: Incomplete configuration in Unleashed

**Solution**:
1. **Assembly Jobs**: Ensure planned/actual quantities entered
2. **Stock On Hand**: Verify min stock levels configured for each item
3. **Products**: Check products have average landed costs
4. **Warehouses**: Confirm warehouse locations assigned to stock items

**Recommended Unleashed Setup**:
- Set minimum stock levels for all manufacturing materials
- Configure planned quantities for assembly jobs
- Track actual quantities on job completion
- Maintain accurate average landed costs

---

## Known Limitations

### Stock Movements Endpoint (403 Forbidden)

**Issue**: `/StockMovements` endpoint returns 403 Forbidden error

**Cause**: API key permissions or subscription plan limitation

**Workaround**: Dashboard calculates movements from Sales Orders + Purchase Orders:
- Outbound movements: `SalesOrders` quantity fulfillment
- Inbound movements: `PurchaseOrders` quantity received
- Net movements: Inbound - Outbound

**Transparency**: System explicitly documents this in resource metrics:
```json
{
  "utilizationDetails": {
    "note": "Calculated from AssemblyJobs (Unleashed API has no direct resource endpoint)"
  }
}
```

**Impact**: Minimal - derived metrics provide sufficient manufacturing visibility

**Resolution**: Contact Unleashed support to enable Stock Movements API access

---

## Security Best Practices

1. **Never commit credentials to git**:
   - Use `.env` files (already in `.gitignore`)
   - Use Render environment variables for production

2. **Rotate API keys regularly**:
   - Regenerate Unleashed API Key every 90 days
   - Update environment variables after rotation
   - Monitor API access logs in Unleashed admin

3. **Use separate API keys per environment**:
   - Development: One API key for localhost
   - Testing: Separate key for test environment
   - Production: Separate key for production deployment

4. **Monitor API usage**:
   - Check Unleashed admin panel for API call statistics
   - Review server logs for authentication errors
   - Set up alerts for sync failures

5. **Secure HMAC signatures**:
   - API Key treated as symmetric key (both parties share)
   - Never expose API Key in client-side code
   - Always sign requests server-side only

---

## Advanced Configuration

### Custom Sync Frequency

**Default**: 15-minute background sync

**To Customize**:
Edit `services/unleashed-erp.js` line 15:

```javascript
// Change from 15 minutes to custom interval
this.syncFrequency = 30 * 60 * 1000; // 30 minutes
```

**Recommendation**: Don't sync more frequently than 10 minutes to avoid unnecessary API calls.

---

### Custom Production Capacity

**Default**: 4 concurrent production lines

**To Customize**:
Edit `services/unleashed-erp.js` line 262:

```javascript
// Change production line capacity
const maxCapacity = 6; // Increased from 4 to 6 lines
```

**Impact**: Affects utilization rate calculation:
```
utilizationRate = (activeJobs / maxCapacity) × 100
```

---

### Custom Page Sizes

**Current Settings**:
- Assembly Jobs: 100 items per page
- Stock On Hand: 250 items per page
- Sales Orders: 100 items per page
- Purchase Orders: 50 items per page

**To Adjust** (if experiencing timeouts):

Edit `services/unleashed-erp.js`:
```javascript
// Line 204 - Assembly Jobs
pageSize: 50, // Reduced from 100

// Line 283 - Stock On Hand
pageSize: 150, // Reduced from 250
```

---

## API Endpoints

The dashboard uses these Unleashed API endpoints:

| Unleashed Endpoint | Purpose | Frequency | Page Size |
|--------------------|---------|-----------|-----------|
| `/Currencies` | Connection test | On connect | 1 |
| `/AssemblyJobs` | Production tracking | Every 15 min | 100 |
| `/StockOnHand` | Inventory levels | Every 15 min | 250 |
| `/SalesOrders` | Order data | Every 15 min | 100 |
| `/PurchaseOrders` | Material tracking | Every 15 min | 50 |

---

## Dashboard API Endpoints

Internal API endpoints for dashboard consumption:

| Dashboard Endpoint | Purpose | Authentication |
|-------------------|---------|----------------|
| `/api/v1/dashboard/manufacturing` | Get consolidated manufacturing data | Clerk session |
| `/api/v1/dashboard/production-data` | Get production metrics | Clerk session |
| `/api/v1/dashboard/unleashed-inventory` | Get inventory summary | Clerk session |
| `/api/v1/dashboard/quality-control` | Get quality alerts | Clerk session |
| `/api/v1/dashboard/unleashed-sales` | Get sales order metrics | Clerk session |
| `/api/v1/dashboard/unleashed-status` | Get connection status | Clerk session |
| `/api/v1/dashboard/unleashed-sync` | Manual sync trigger (POST) | Clerk session |

---

## Support

**Unleashed Software Support**:
- Documentation: https://apidocs.unleashedsoftware.com/
- Support Portal: https://support.unleashedsoftware.com/
- Contact: support@unleashedsoftware.com

**Dashboard Support**:
- Check server logs: Render Dashboard → Logs
- Review health check: `/api/v1/dashboard/unleashed-status`
- Contact: support@sentia-manufacturing.com (replace with actual support contact)

---

## Appendix: Technical Details

### Authentication Flow

```
1. Application starts
   ↓
2. unleashedERPService.connect()
   - Validates environment variables (API_ID, API_KEY)
   ↓
3. Test connection to /Currencies endpoint
   - Generates HMAC-SHA256 signature
   - Sends authenticated request
   ↓
4. Connection established ✅
   - Can now call all Unleashed API endpoints
   ↓
5. Start background sync (every 15 minutes)
   - Sync assembly jobs → Calculate production metrics
   - Sync stock on hand → Identify low-stock items
   - Broadcast updates via SSE
```

### HMAC-SHA256 Signature Generation

```javascript
// Query string extraction
const url = '/AssemblyJobs?pageSize=100&orderBy=ModifiedOn'
const queryString = 'pageSize=100&orderBy=ModifiedOn'

// Signature generation
const signature = crypto
  .createHmac('sha256', API_KEY)
  .update(queryString)
  .digest('base64')

// Request headers
headers: {
  'api-auth-id': API_ID,
  'api-auth-signature': signature
}
```

**Important**: Only the query string (after `?`) is signed, not the full URL or path.

### Data Transformation

**Assembly Jobs → Production Metrics**:
```javascript
activeBatches = jobs.filter(job => job.JobStatus === 'InProgress').length
completedToday = jobs.filter(job => completedDate === today).length
qualityScore = (qualityJobs / completedJobs) × 100
utilizationRate = (activeJobs / maxCapacity) × 100
```

**Stock On Hand → Inventory Metrics**:
```javascript
totalValue = sum(item.QtyOnHand × item.AverageLandedCost)
lowStockItems = items.filter(item => item.QtyOnHand < item.MinStockLevel).length
zeroStockItems = items.filter(item => item.QtyOnHand === 0).length
```

**Quality Alerts → Yield Issues**:
```javascript
hasQualityIssue = job.ActualQuantity < job.PlannedQuantity × 0.95
issue = `Yield shortfall: ${job.ActualQuantity}/${job.PlannedQuantity}`
severity = "Medium"
```

---

**Last Updated**: 2025-10-19
**Version**: 1.0
**Story**: BMAD-MOCK-004-UNLEASHED
