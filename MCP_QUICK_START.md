# MCP Integration Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites

- Node.js 18+ installed
- Railway CLI installed (`npm install -g @railway/cli`)
- Access to Railway project dashboard

---

## Step 1: Configure Environment (2 minutes)

### Option A: Use Configuration Script (Recommended)

```powershell
# Windows PowerShell
.\scripts\configure-api-keys.ps1 -Environment development
```

### Option B: Manual Configuration

Create `.env` file from template:

```bash
cp .env.template .env
```

Add these essential variables:

```env
# MCP Server Configuration
MCP_SERVER_URL=https://web-production-99691282.up.railway.app
MCP_SERVER_SERVICE_ID=99691282-de66-45b2-98cf-317083dd11ba
MCP_JWT_SECRET=your-secret-key-here

# Database (Required)
DATABASE_URL=postgresql://user:pass@host/db

# Authentication (Required)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## Step 2: Install Dependencies (1 minute)

```bash
npm install
```

---

## Step 3: Start Services (1 minute)

### Development Mode

```bash
# Start both frontend and backend
npm run dev

# Or start separately:
npm run dev:client  # Frontend on :3000
npm run dev:server  # Backend on :5000
```

### Production Mode

```bash
npm run build
npm start
```

---

## Step 4: Access MCP Features (1 minute)

1. **Open Dashboard**: http://localhost:3000
2. **Navigate to MCP Monitor**: http://localhost:3000/mcp-monitor
3. **Check Connection Status**: All indicators should show "Connected"

---

## 🎯 Quick Test

### Test MCP Connection

```bash
# Health check
curl http://localhost:5000/api/mcp/health

# Status check
curl http://localhost:5000/api/mcp/status
```

### Expected Response

```json
{
  "status": "ok",
  "mcp": {
    "connected": true,
    "url": "https://web-production-99691282.up.railway.app",
    "serviceId": "99691282-de66-45b2-98cf-317083dd11ba"
  }
}
```

---

## 🚂 Railway Deployment (5 minutes)

### 1. Link to Railway Project

```bash
railway link
# Select: feisty-delight
```

### 2. Configure Railway Variables

```bash
# Set MCP variables
railway variables set MCP_SERVER_URL=https://web-production-99691282.up.railway.app
railway variables set MCP_SERVER_SERVICE_ID=99691282-de66-45b2-98cf-317083dd11ba
railway variables set MCP_JWT_SECRET=$(openssl rand -base64 32)

# Set other required variables
railway variables set DATABASE_URL=$DATABASE_URL
railway variables set VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
railway variables set CLERK_SECRET_KEY=$CLERK_SECRET_KEY
```

### 3. Deploy to Railway

```bash
# Deploy current branch
railway up

# Or push to trigger auto-deploy
git push origin development
```

### 4. Monitor Deployment

```bash
# View logs
railway logs

# Check deployment status
railway status
```

---

## 📊 Key Features

### MCP Monitoring Dashboard

- **URL**: `/mcp-monitor`
- **Features**:
  - Real-time connection status
  - WebSocket monitoring
  - API synchronization status
  - Auto-sync management

### API Endpoints

| Endpoint                         | Method | Description             |
| -------------------------------- | ------ | ----------------------- |
| `/api/mcp/health`                | GET    | MCP Server health check |
| `/api/mcp/status`                | GET    | Comprehensive status    |
| `/api/mcp/sync/trigger/:service` | POST   | Trigger manual sync     |
| `/api/mcp/sync/enable`           | POST   | Enable auto-sync        |
| `/api/mcp/websocket/reconnect`   | POST   | Reconnect WebSocket     |

### Auto-Sync Services

- **Xero**: Every 30 minutes
- **Shopify**: Every 15 minutes
- **Amazon**: Every hour
- **Database**: Every 6 hours (production only)

---

## 🔧 Troubleshooting

### MCP Server Shows "Disconnected"

1. Check MCP Server URL is correct
2. Verify environment variables are loaded
3. Check network connectivity
4. Review logs: `railway logs --service 99691282`

### WebSocket Connection Fails

1. Navigate to `/mcp-monitor`
2. Click "Reconnect" in WebSocket tab
3. Check browser console for errors

### API Sync Not Working

1. Verify API keys are configured
2. Check service status in monitoring dashboard
3. Trigger manual sync: `curl -X POST http://localhost:5000/api/mcp/sync/trigger/xero`

---

## 📚 Additional Resources

- **Full Documentation**: [MCP_USER_GUIDE.md](MCP_USER_GUIDE.md)
- **Troubleshooting**: [MCP_TROUBLESHOOTING.md](MCP_TROUBLESHOOTING.md)
- **Deployment Checklist**: [MCP_DEPLOYMENT_CHECKLIST.md](MCP_DEPLOYMENT_CHECKLIST.md)

---

## 🆘 Need Help?

### Check Status

```powershell
# Run comprehensive test
.\scripts\test-mcp-integration.ps1 -Environment development
```

### View Logs

```bash
# Railway logs
railway logs --tail

# Local logs (if running)
npm run dev 2>&1 | tee debug.log
```

### Get Support

- GitHub Issues: https://github.com/The-social-drink-company/sentia-manufacturing-dashboard/issues
- Railway Support: https://railway.app/help

---

**Ready to go!** 🎉 Your MCP integration should now be operational.

**Next Steps**:

1. Configure API keys for external services (Xero, Shopify, Amazon)
2. Enable auto-sync in production
3. Set up monitoring alerts

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready
