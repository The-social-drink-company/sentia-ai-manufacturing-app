# Render Dashboard Deployment Instructions

## STEP-BY-STEP DEPLOYMENT GUIDE

### Step 1: Deploy Using Blueprint (Automatic Setup)

1. **Go to Render Dashboard**
   - Open: https://dashboard.render.com
   - You should be logged in with GitHub

2. **Create New Blueprint**
   - Click the "New +" button (top right)
   - Select "Blueprint"

3. **Connect Repository**
   - Select: `The-social-drink-company/sentia-manufacturing-dashboard`
   - Branch: `development` (or your default branch)
   - Render will detect the `render.yaml` file

4. **Review Services**
   Render will show these services to be created:
   - sentia-manufacturing-development (Web Service - Starter $7/month)
   - sentia-manufacturing-testing (Web Service - Free tier)
   - sentia-manufacturing-production (Web Service - Starter $7/month)
   - sentia-mcp-server (Worker - Free tier)
   - 3 PostgreSQL databases (Free for 90 days)

5. **Click "Apply"**
   - This will create all services and databases
   - Initial setup takes 5-10 minutes

---

### Step 2: Add Environment Variables (CRITICAL)

After services are created, you need to add environment variables to EACH service.

#### For Development Service (sentia-manufacturing-development):

1. Click on the service name in dashboard
2. Go to "Environment" tab on the left
3. Click "Add Environment Variable" or use "Bulk Edit"
4. Copy ALL variables from `render-env-complete.json` under "development" section

**Quick Copy Method:**

- Open `render-env-complete.json` in this folder
- Copy all key-value pairs from the "development" section
- In Render, click "Bulk Edit"
- Paste in this format:

```
NODE_ENV=development
PORT=5000
CORS_ORIGINS=http://localhost:3000,https://sentia-manufacturing-development.onrender.com
DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
```

(Continue with all variables from the JSON file)

5. Click "Save Changes"
6. Service will auto-redeploy with new variables

#### Repeat for Testing Service:

- Use variables from "testing" section in `render-env-complete.json`

#### Repeat for Production Service:

- Use variables from "production" section in `render-env-complete.json`

#### For MCP Server (sentia-mcp-server):

- Use variables from "mcp_server" section in `render-env-complete.json`

---

### Step 3: Update Database Connection (IMPORTANT)

Render creates its own PostgreSQL databases. You have two options:

#### Option A: Use Existing Neon Database (Recommended for now)

- Keep the DATABASE_URL as provided in the JSON file
- This uses your existing Neon PostgreSQL database
- No migration needed

#### Option B: Use Render's Database (Later)

1. Go to each database service in Render
2. Copy the "Internal Database URL"
3. Update the DATABASE_URL in each environment
4. Run migrations:

```bash
DATABASE_URL=your-render-database-url npx prisma migrate deploy
```

---

### Step 4: Verify Deployment

After environment variables are set and services redeploy:

1. **Check Service Status**
   - Each service should show "Live" status
   - Click on service name → "Logs" to check for errors

2. **Test Endpoints**
   - Development: https://sentia-manufacturing-development.onrender.com
   - Testing: https://sentia-manufacturing-testing.onrender.com
   - Production: https://sentia-manufacturing-production.onrender.com

3. **Test API Health**
   ```
   https://sentia-manufacturing-development.onrender.com/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

---

### Step 5: Configure Auto-Deploy from GitHub

Render automatically sets up deployments from your GitHub branches:

- `development` branch → Development environment
- `test` branch → Testing environment
- `production` branch → Production environment (manual deploy)

To change auto-deploy settings:

1. Go to service → Settings
2. Find "Build & Deploy" section
3. Toggle "Auto-Deploy" on/off

---

## TROUBLESHOOTING

### If Services Show "Deploy Failed":

1. Check Logs tab for specific error
2. Common issues:
   - Missing environment variables (especially Clerk keys)
   - Node version mismatch (check package.json)
   - Build command errors

### If Site Shows 502 Bad Gateway:

1. Service is still starting (wait 2-3 minutes)
2. Check environment variables are set
3. Check logs for crash errors

### If Database Connection Fails:

1. Verify DATABASE_URL is correct
2. For Neon: Ensure SSL mode is set
3. For Render DB: Use internal URL for same-region connection

### Build Taking Too Long:

- First build takes 5-10 minutes
- Subsequent builds are faster (2-3 minutes)
- Starter plan has 0.5 CPU, so builds are slower than local

---

## COSTS BREAKDOWN

With Starter plan ($7/month per service):

- **Development**: $7/month (Starter)
- **Testing**: $0/month (Free tier)
- **Production**: $7/month (Starter)
- **MCP Server**: $0/month (Free worker)
- **Databases**: $0 for 90 days, then $7/month each
- **Total Initial**: $14/month
- **Total After 90 days**: ~$35/month (with 3 databases)

To reduce costs:

- Use single database with different schemas
- Keep testing on free tier
- Upgrade only production to Starter

---

## NEXT STEPS

1. ✅ Services are being created via Blueprint
2. ⏳ Add environment variables to each service
3. ⏳ Wait for initial deploy to complete
4. ⏳ Test each environment URL
5. ⏳ Update your local .env to point to Render URLs
6. ⏳ Migrate from Railway completely

---

## YOUR NEW URLS

Save these for reference:

```
Development: https://sentia-manufacturing-development.onrender.com
Testing: https://sentia-manufacturing-testing.onrender.com
Production: https://sentia-manufacturing-production.onrender.com
MCP Server: https://sentia-mcp-server.onrender.com

API Endpoints:
Dev API: https://sentia-manufacturing-development.onrender.com/api
Test API: https://sentia-manufacturing-testing.onrender.com/api
Prod API: https://sentia-manufacturing-production.onrender.com/api
```

---

**IMPORTANT**: After deployment completes, update all references from Railway URLs to Render URLs in your application configuration and documentation.
