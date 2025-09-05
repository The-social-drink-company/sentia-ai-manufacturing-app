# Railway Deployment Setup Guide

## Quick Fix for Environment Variable Error

The error "invalid key-value pair" occurs when environment variables are improperly formatted in Railway.

## Setting Environment Variables in Railway

1. **Go to your Railway project dashboard**
2. **Click on your service**
3. **Navigate to the "Variables" tab**
4. **Add these environment variables ONE BY ONE:**

### Required Environment Variables

```bash
# Core Configuration
NODE_ENV=production
PORT=3000

# Clerk Authentication (REQUIRED)
CLERK_SECRET_KEY=sk_test_YOUR_CLERK_SECRET_KEY
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Z3VpZGluZy1zbG90aC04Ni5jbGVyay5hY2NvdW50cy5kZXYk

# Database - Neon PostgreSQL (REQUIRED)
DATABASE_URL=postgresql://your-neon-database-url

# Unleashed API (REQUIRED for production data)
UNLEASHED_API_ID=d5313df6-db35-430c-a69e-ae27dffe0c5a
UNLEASHED_API_KEY=2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==

# AI APIs (REQUIRED for AI features)
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_KEY
CLAUDE_API_KEY=sk-ant-YOUR_CLAUDE_KEY

# Application URLs
VITE_API_BASE_URL=https://your-app.railway.app/api
CORS_ORIGINS=https://your-app.railway.app
```

### How to Add Variables in Railway:

1. **DO NOT copy-paste all variables at once**
2. **Add each variable individually:**
   - Click "New Variable"
   - Enter the KEY (e.g., `NODE_ENV`)
   - Enter the VALUE (e.g., `production`)
   - Click "Add"
3. **Repeat for each variable**

### Common Mistakes to Avoid:

- ❌ Don't paste multiple lines at once
- ❌ Don't include quotes around values
- ❌ Don't leave trailing spaces
- ❌ Don't have empty lines or spaces before variable names

### Correct Format Example:
```
KEY: UNLEASHED_API_ID
VALUE: d5313df6-db35-430c-a69e-ae27dffe0c5a
```

### After Adding Variables:

1. Railway will automatically redeploy
2. Check the build logs for any errors
3. Once deployed, visit your app URL

## Verifying Deployment

After successful deployment, you should see:
- Clerk authentication login page
- After signing in, the AI Enhanced Dashboard
- All AI systems initialized and ready

## Troubleshooting

If you still get environment variable errors:
1. Check the "Variables" tab for any blank entries
2. Remove any variables with empty keys
3. Ensure no variables have spaces in their names
4. Redeploy by clicking "Deploy" button

## Support

For Railway-specific issues, check:
- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app