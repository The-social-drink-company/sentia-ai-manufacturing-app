# FIX RAILWAY ENVIRONMENT VARIABLES - URGENT

## The Problem
Railway deployment is failing with: `ERROR: invalid key-value pair "= SECRET_KEY=": empty key`

This means there's a malformed environment variable in Railway's Variables section.

## IMMEDIATE FIX STEPS:

### 1. Go to Railway Dashboard
- Open https://railway.app
- Navigate to your project
- Select the TEST environment
- Click on "Variables" tab

### 2. Look for These Common Issues:

#### Empty Key Issues (MUST FIX):
- `= SECRET_KEY=value` → Should be `SECRET_KEY=value`
- ` SECRET_KEY=value` → Should be `SECRET_KEY=value` (no leading space)
- `=SECRET_KEY=value` → Should be `SECRET_KEY=value`
- Any line starting with `=` → Delete it

#### Double Equals Issues:
- `SECRET_KEY==value` → Should be `SECRET_KEY=value`
- `SECRET_KEY=` → Either add a value or delete the line

### 3. Required Variables for Test Environment:

Copy and paste these EXACTLY as shown (no spaces before or after):

```
NODE_ENV=test
PORT=3000
SECRET_KEY=7a91c84993193fe2592863a924eefff4b39fe51bc656fb6475c227d7b969c6fb
DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
UNLEASHED_API_ID=d5313df6-db35-430c-a69e-ae27dffe0c5a
UNLEASHED_API_KEY=2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==
VITE_API_BASE_URL=/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard - Test
CORS_ORIGINS=*
```

### 4. How to Fix in Railway:

1. **Delete All Variables** in the test environment
2. **Add Variables One by One** using the "New Variable" button
3. **Format**: Enter `KEY` in the name field, `value` in the value field
4. **DO NOT** copy-paste the entire `KEY=value` into one field
5. **Save** after adding all variables

### 5. Alternative: Use Railway CLI

If you have Railway CLI access:
```bash
railway variables set SECRET_KEY=7a91c84993193fe2592863a924eefff4b39fe51bc656fb6475c227d7b969c6fb
railway variables set NODE_ENV=test
railway variables set PORT=3000
# ... add other variables
```

### 6. Verify No Malformed Entries:
After adding, check that the Variables tab shows:
- No entries with empty names
- No entries starting with `=`
- Each variable has both a name and a value

### 7. Redeploy
Once fixed, Railway should automatically redeploy. If not, click "Redeploy" button.

## COMMON MISTAKES TO AVOID:
❌ Don't paste `KEY=value` into the name field
❌ Don't leave trailing spaces
❌ Don't use quotes around values unless needed
❌ Don't duplicate variable names
✅ Use the Railway UI's separate Name and Value fields
✅ Or use Railway CLI to set variables properly

## Expected Result:
After fixing, deployment should succeed and the test environment will be live at:
https://sentia-manufacturing-dashboard-test.up.railway.app