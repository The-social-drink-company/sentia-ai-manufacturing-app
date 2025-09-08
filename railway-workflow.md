# Railway CLI Workflow for Cursor Integration

## Setup Complete ✅
- Railway CLI v4.6.3 installed and authenticated
- Project linked: `Sentia-manufacturing-planning` (ID: b9ca1af1-13c5-4ced-9ab6-68fddd73fc8f)
- Service: `splendid-warmth`
- Environment tokens configured

## Railway Commands for Cursor

### 1. Deploy to Railway
```bash
# Deploy to development
set RAILWAY_TOKEN=f97b65ad-c306-410a-9d5d-5f5fdc098620 && railway up --service splendid-warmth --detach

# Deploy to testing
set RAILWAY_TOKEN=02e0c7f6-9ca1-4355-af52-ee9eec0b3545 && railway up --service splendid-warmth --detach

# Deploy to production
set RAILWAY_TOKEN=3e0053fc-ea90-49ec-9708-e09d58cad4a0 && railway up --service splendid-warmth --detach
```

### 2. Monitor Logs & Errors
```bash
# View live logs (development)
set RAILWAY_TOKEN=f97b65ad-c306-410a-9d5d-5f5fdc098620 && railway logs --service splendid-warmth

# View live logs (production)
set RAILWAY_TOKEN=3e0053fc-ea90-49ec-9708-e09d58cad4a0 && railway logs --service splendid-warmth
```

### 3. Environment Management
```bash
# Switch environments
railway environment development
railway environment testing  
railway environment production

# Check current status
railway status
```

### 4. Variable Management
```bash
# View environment variables
set RAILWAY_TOKEN=f97b65ad-c306-410a-9d5d-5f5fdc098620 && railway variables --service splendid-warmth

# Open Railway dashboard
railway open
```

## Bidirectional Workflow

### Code → Deploy → Monitor → Fix → Redeploy

1. **Code Changes in Cursor**
   ```bash
   # Make code changes
   # Commit changes
   git add .
   git commit -m "Fix: resolve deployment error"
   ```

2. **Deploy to Railway**
   ```bash
   set RAILWAY_TOKEN=f97b65ad-c306-410a-9d5d-5f5fdc098620 && railway up --service splendid-warmth --detach
   ```

3. **Monitor Deployment**
   ```bash
   set RAILWAY_TOKEN=f97b65ad-c306-410a-9d5d-5f5fdc098620 && railway logs --service splendid-warmth
   ```

4. **Fix Errors (if any)**
   - Read error logs in Cursor
   - Fix code issues
   - Repeat deploy cycle

5. **Redeploy**
   ```bash
   # Quick redeploy after fixes
   set RAILWAY_TOKEN=f97b65ad-c306-410a-9d5d-5f5fdc098620 && railway redeploy --service splendid-warmth
   ```

## Current Deployment Status
- ✅ Successfully deployed to Railway
- ✅ Server running on port 80
- ⚠️ Some warnings about missing modules (autonomous testing)
- ⚠️ Xero credentials not configured (expected)
- ✅ AI Analytics connected to Neon PostgreSQL

## Environment URLs
- Development: https://sentia-manufacturing-dashboard-development.up.railway.app
- Testing: https://sentiatest.financeflo.ai  
- Production: https://sentia-manufacturing-dashboard-production.up.railway.app