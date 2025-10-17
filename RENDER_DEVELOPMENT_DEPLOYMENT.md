# Render Development Deployment Guide

## Quick Start - Deploy to sentia-manufacturing-development.onrender.com

### Prerequisites

- GitHub repository connected
- Render account with API key: `rnd_mYUAytWRkb2Pj5GJROqNYubYt25J`
- Node.js application ready for deployment

## Step 1: Initial Service Creation (One-time Setup)

### Via Render Dashboard (Recommended for First Time)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository:
   - Repository: `The-social-drink-company/sentia-manufacturing-dashboard`
   - Branch: `development`

4. Configure the service:

   ```
   Name: sentia-manufacturing-development
   Region: Oregon (US West)
   Branch: development
   Root Directory: (leave empty)
   Environment: Node
   Build Command: npm ci --legacy-peer-deps && npm run build
   Start Command: node server.js
   ```

5. Set Plan: **Free** (or your preferred plan)

6. Click **"Advanced"** to add environment variables

7. Click **"Create Web Service"**

## Step 2: Environment Variables Configuration

### Option A: Manual Dashboard Setup

1. Go to your service in Render Dashboard
2. Navigate to **Environment** tab
3. Add each variable from `render-vars-DEVELOPMENT.txt`

### Option B: Using PowerShell Script (Windows)

```powershell
# Run the deployment script
.\render-deploy-development.ps1
```

### Option C: Using Bash Script (Mac/Linux)

```bash
# Make script executable
chmod +x render-setup-development.sh

# Run the setup script
./render-setup-development.sh
```

## Step 3: Deploy Your Application

### Automatic Deployment (Recommended)

- Any push to the `development` branch will automatically trigger a deployment
- This is enabled by default when you connect your GitHub repository

### Manual Deployment via Dashboard

1. Go to your service in [Render Dashboard](https://dashboard.render.com)
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Manual Deployment via Script

```powershell
# Windows
.\render-deploy-development.ps1

# Mac/Linux
./render-setup-development.sh
```

## Step 4: Monitor Deployment

### Check Deployment Status

1. Dashboard: https://dashboard.render.com
2. Look for your service: `sentia-manufacturing-development`
3. Check the **Events** tab for deployment progress

### Verify Deployment

Once deployed, verify your application is running:

- **Application URL**: https://sentia-manufacturing-development.onrender.com
- **Health Check**: https://sentia-manufacturing-development.onrender.com/health
- **API Endpoint**: https://sentia-manufacturing-development.onrender.com/api

## Environment Variables Reference

### Core Configuration

```
NODE_ENV=development
PORT=3000
CORS_ORIGINS=https://sentia-manufacturing-development.onrender.com
```

### Database (Neon PostgreSQL)

```
DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

### Authentication (Clerk)

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
```

### Feature Flags (Development)

```
ENABLE_AUTONOMOUS_TESTING=true
AUTO_FIX_ENABLED=true
AUTO_DEPLOY_ENABLED=true
```

## Troubleshooting

### Build Failures

If the build fails, check:

1. **Logs** in Render Dashboard → Events
2. Ensure all dependencies are in `package.json`
3. Verify build command: `npm ci --legacy-peer-deps && npm run build`

### Application Not Starting

1. Check start command: `node server.js`
2. Verify PORT environment variable is set
3. Check application logs in Dashboard

### Database Connection Issues

1. Verify DATABASE_URL is correctly formatted
2. Ensure SSL mode is set: `?sslmode=require`
3. Check Neon database is accessible

### Health Check Failing

1. Ensure `/health` endpoint returns 200 status
2. Check server.js implements health endpoint
3. Verify application is listening on correct PORT

## Deployment Workflow

### Development Branch Workflow

```
1. Make changes locally
2. Test locally: npm run dev
3. Commit changes: git add . && git commit -m "message"
4. Push to GitHub: git push origin development
5. Render automatically deploys (or trigger manually)
6. Verify at: https://sentia-manufacturing-development.onrender.com
```

## API Endpoints

Once deployed, your API will be available at:

- Base URL: `https://sentia-manufacturing-development.onrender.com`
- API: `https://sentia-manufacturing-development.onrender.com/api`
- Health: `https://sentia-manufacturing-development.onrender.com/health`

## Security Notes

- API Key is stored in scripts: `rnd_mYUAytWRkb2Pj5GJROqNYubYt25J`
- Keep this key secure and don't commit to public repositories
- Use environment variables for sensitive data
- Enable HTTPS (automatic on Render)

## Support & Resources

- [Render Documentation](https://render.com/docs)
- [Render Status Page](https://status.render.com)
- [Render Community](https://community.render.com)
- Service Dashboard: https://dashboard.render.com

## Next Steps

1. ✅ Service created on Render
2. ✅ Environment variables configured
3. ✅ Initial deployment successful
4. 🔄 Set up continuous deployment from GitHub
5. 📊 Monitor performance and logs
6. 🔒 Configure custom domain (optional)

---

Last Updated: September 2025
Deployment Target: sentia-manufacturing-development.onrender.com
