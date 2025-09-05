# URGENT: Fix Railway Environment Variables

## The Problem
Railway is seeing an empty variable name with the value starting with VITE_CLERK_PUBLISHABLE_KEY. This means there's a malformed entry in your Railway dashboard.

## Immediate Fix Required

### Step 1: Go to Railway Dashboard
1. Open your Railway project
2. Click on the **Variables** tab
3. Look for ANY of these issues:
   - A variable with NO NAME (empty field) 
   - A variable with just "=" as the name
   - A variable that shows: `= VITE_CLERK_PUBLISHABLE_KEY=pk_test...`
   - Any duplicate entries

### Step 2: Delete ALL Malformed Entries
Delete any variables that have:
- Empty names
- Names with "=" in them
- Duplicate entries
- Malformed formats

### Step 3: Add Variables Correctly
Add each variable ONE BY ONE with the correct format:

| Variable Name | Variable Value |
|--------------|----------------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_Z3VpZGluZy1zbG90aC04Ni5jbGVyay5hY2NvdW50cy5kZXYk` |
| `UNLEASHED_API_ID` | `d5313df6-db35-430c-a69e-ae27dffe0c5a` |
| `UNLEASHED_API_KEY` | `2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==` |

### Step 4: Verify No Hidden Characters
Make sure when copying values:
- No leading spaces
- No trailing spaces
- No quotes around values
- No extra line breaks

### Step 5: Trigger Redeploy
After fixing variables, Railway should automatically redeploy. If not:
1. Click the "Redeploy" button
2. Or push a small change to trigger deployment

## Common Mistakes to Avoid

❌ **DON'T** paste this:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Z3VpZGluZy1zbG90aC04Ni5jbGVyay5hY2NvdW50cy5kZXYk
```

✅ **DO** this instead:
- Name field: `VITE_CLERK_PUBLISHABLE_KEY`
- Value field: `pk_test_Z3VpZGluZy1zbG90aC04Ni5jbGVyay5hY2NvdW50cy5kZXYk`

## After Fixing
The deployment should succeed and show:
- Build successful
- Server running on port 3000
- AI Enhanced Dashboard accessible