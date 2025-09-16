# ⚠️ CRITICAL SETUP INSTRUCTIONS
## IMPORTANT: Missing Configuration for Testing & Production

---

## 🔴 CURRENT ISSUE

Your `render.yaml` only configures **ONE environment (development)**.
You need **THREE separate services** for complete deployment.

---

## ✅ SOLUTION: Use the Complete Configuration

### Option 1: Deploy Using Complete File (RECOMMENDED)

The file `render-environments-complete.yaml` has ALL three environments configured:
- ✅ sentia-manufacturing-development
- ✅ sentia-manufacturing-testing
- ✅ sentia-manufacturing-production

**To deploy all environments:**

1. **Rename the complete file**:
   ```bash
   # Backup current file
   cp render.yaml render-development-only.yaml

   # Use the complete configuration
   cp render-environments-complete.yaml render.yaml
   ```

2. **Push to GitHub**:
   ```bash
   git add render.yaml
   git commit -m "Use complete render.yaml with all three environments"
   git push origin development
   ```

3. **Render will create all services automatically**

---

### Option 2: Create Services Manually in Render Dashboard

Since render.yaml only has development, you need to manually create the other two:

#### For Testing Environment:

1. **Go to Render Dashboard** → New → Web Service
2. **Configure**:
   ```
   Name: sentia-manufacturing-testing
   Repository: Your GitHub repo
   Branch: test (or testing)
   Build Command: npm ci --legacy-peer-deps && npm run build && npx prisma generate && npx prisma db push --skip-generate
   Start Command: node server.js
   ```

3. **Add Environment Variables**:
   - Copy all from development
   - Change these:
     ```
     NODE_ENV=test
     CORS_ORIGINS=https://sentia-manufacturing-testing.onrender.com
     VITE_API_BASE_URL=https://sentia-manufacturing-testing.onrender.com/api
     DATABASE_URL=[Connect to sentia-db-testing]
     AUTO_DEPLOY_ENABLED=false
     ```

#### For Production Environment:

1. **Create Service**:
   ```
   Name: sentia-manufacturing-production
   Branch: production (or main)
   Plan: Standard (recommended for production)
   ```

2. **Production Variables** (CRITICAL):
   ```
   NODE_ENV=production
   CORS_ORIGINS=https://sentia-manufacturing-production.onrender.com
   ENABLE_AUTONOMOUS_TESTING=false
   AUTO_FIX_ENABLED=false
   AUTO_DEPLOY_ENABLED=false
   DEBUG_MODE=false
   DATABASE_URL=[Connect to sentia-db-production]
   ```

---

## 📋 VERIFICATION AFTER SETUP

Run this to check all three environments:

```powershell
.\verify-render-deployment.ps1 -Environment all
```

Expected output:
```
Development: ✅ Service exists
Testing: ✅ Service exists
Production: ✅ Service exists
```

---

## 🎯 CORRECT ARCHITECTURE

You should have:

```
Services (3):
├── sentia-manufacturing-development
├── sentia-manufacturing-testing
└── sentia-manufacturing-production

Databases (3):
├── sentia-db-development
├── sentia-db-testing
└── sentia-db-production
```

---

## ⚠️ IMPORTANT NOTES

1. **Each environment MUST have**:
   - Its own service
   - Its own database
   - Correct NODE_ENV setting
   - Unique CORS_ORIGINS

2. **Production MUST have**:
   - All test/debug flags set to FALSE
   - Paid plan for reliability
   - Separate database with backups

3. **Testing MUST have**:
   - AUTO_DEPLOY_ENABLED=false
   - Separate from development

---

## 🚨 ACTION REQUIRED

**Choose one:**

1. ✅ **RECOMMENDED**: Use `render-environments-complete.yaml` (has everything)
2. ⚡ **QUICK**: Manually create testing & production in Render Dashboard

Without all three services, you only have 33% of your infrastructure!