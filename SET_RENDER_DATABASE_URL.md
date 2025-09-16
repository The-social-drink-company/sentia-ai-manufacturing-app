# ✅ Connect to Render PostgreSQL Database

## Your Database Details:
- **Database Name**: `sentia-db-development`
- **Service ID**: `dpg-d344rkfdiees73a20c50-a`
- **Database**: `sentia_manufacturing_dev`
- **Username**: `sentia_dev`
- **Region**: Oregon

## IMMEDIATE ACTION REQUIRED:

### Step 1: Copy Your Internal Database URL
1. Go to your database `sentia-db-development` in Render Dashboard
2. Click the "Copy" button next to **Internal Database URL**
3. This will look like:
   ```
   postgres://sentia_dev:YOUR_PASSWORD@dpg-d344rkfdiees73a20c50-a:5432/sentia_manufacturing_dev
   ```

### Step 2: Update Your Web Service Environment
1. Go to your web service `sentia-manufacturing-development`
2. Click on the **Environment** tab
3. Look for `DATABASE_URL`
   - If it exists and shows a Neon URL (contains "neon.tech"), click **Edit**
   - If it doesn't exist, click **Add Environment Variable**
4. Set:
   - **Key**: `DATABASE_URL`
   - **Value**: [Paste the Internal Database URL from Step 1]
5. Click **Save Changes**

### Step 3: Verify The Service Redeploys
The service will automatically redeploy. Watch the logs for:
```
✔ Generated Prisma Client
The database is already in sync with the Prisma schema.
OR
Migrations applied successfully
```

## IMPORTANT: Remove Neon References
In your Environment Variables, if you see any of these, DELETE them:
- Any DATABASE_URL containing "neon.tech"
- NEON_DATABASE_URL
- Any other Neon-related variables

## Expected Result After Fix:
1. Database will connect to Render PostgreSQL
2. Tables will be created automatically
3. Default users will be created
4. Your React app will load properly
5. You'll see the Clerk authentication login page

## Troubleshooting:
If you still see errors after setting DATABASE_URL:
1. Make sure you're using the **Internal** Database URL (not External)
2. Check that the password is copied correctly
3. Try manually deploying from Render Dashboard

## Connection String Format:
```
postgres://sentia_dev:PASSWORD@dpg-d344rkfdiees73a20c50-a:5432/sentia_manufacturing_dev
```
Replace PASSWORD with your actual password from the database connections page.

---
**Once DATABASE_URL is set correctly, your application will work!**