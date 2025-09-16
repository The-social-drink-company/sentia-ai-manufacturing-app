# Render Unified Deployment Guide
## Single Application with Integrated PostgreSQL & MCP Server

This guide provides complete instructions for deploying the Sentia Manufacturing Dashboard as a single, unified application on Render with integrated PostgreSQL database and MCP AI server.

---

## 🚀 Quick Start

### Prerequisites
- GitHub account with repository access
- Render account (sign up at https://render.com)
- PostgreSQL client tools (for data migration)

### One-Click Deploy
1. Push latest changes to GitHub:
   ```bash
   git add .
   git commit -m "Complete Render migration with integrated PostgreSQL"
   git push origin development
   ```

2. Deploy to Render:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository
   - Select `render.yaml` from repository root
   - Click **"Apply"**

---

## 📦 What Gets Deployed

### Single Unified Application
```
sentia-manufacturing-development
├── Web Service (Express + React)
│   ├── Frontend (Port 3000)
│   ├── Backend API (Port 5000)
│   └── MCP AI Server (Port 3001)
└── PostgreSQL Database
    └── sentia-db (Integrated)
```

### Services Included
- **Main Application**: Express server serving React frontend and API
- **MCP AI Server**: AI Central Nervous System with multi-LLM support
- **PostgreSQL Database**: Integrated Render PostgreSQL (no more Neon!)
- **Auto-SSL**: Automatic HTTPS certificates
- **CDN**: Global content delivery

---

## 🔧 Configuration Details

### Database Configuration
```yaml
databases:
  - name: sentia-db
    plan: starter        # $7/month for production
    region: oregon       # Same as application
    databaseName: sentia_manufacturing
    user: sentia_admin
```

### Environment Variables (Automatic)
- `DATABASE_URL`: Automatically injected from Render PostgreSQL
- `PORT`: Set by Render (3000)
- All API keys and secrets configured in `render.yaml`

---

## 📊 Multi-Environment Setup

### Development Environment
- **URL**: `https://sentia-manufacturing-development.onrender.com`
- **Branch**: `development`
- **Database**: `sentia-db-dev`
- **Purpose**: Active development and testing

### Testing Environment
- **URL**: `https://sentia-manufacturing-testing.onrender.com`
- **Branch**: `test`
- **Database**: `sentia-db-test`
- **Purpose**: UAT and client testing

### Production Environment
- **URL**: `https://sentia-manufacturing-production.onrender.com`
- **Branch**: `production`
- **Database**: `sentia-db-prod`
- **Purpose**: Live production system

---

## 🔄 Data Migration from Neon

### Step 1: Get Render Database URL
1. After deployment, go to Render Dashboard
2. Click on `sentia-db` database service
3. Click **"Connect"** button
4. Copy **"External Connection String"**

### Step 2: Run Migration Script

**Windows:**
```cmd
cd scripts
migrate-neon-to-render.bat
```

**Mac/Linux:**
```bash
cd scripts
chmod +x migrate-neon-to-render.sh
./migrate-neon-to-render.sh
```

### Step 3: Verify Migration
```bash
# Test connection
psql "your-render-database-url" -c "SELECT COUNT(*) FROM information_schema.tables;"

# Check application
curl https://sentia-manufacturing-development.onrender.com/health
```

---

## ✅ Deployment Verification Checklist

### Immediate Checks (5 minutes)
- [ ] Application deployed successfully
- [ ] Database created and connected
- [ ] Health endpoint responding: `/health`
- [ ] Frontend loading at root URL
- [ ] No error logs in Render Dashboard

### Functionality Checks (15 minutes)
- [ ] User authentication working (Clerk)
- [ ] Dashboard widgets loading
- [ ] API endpoints responding
- [ ] MCP AI server connected
- [ ] Data migrated successfully

### Integration Checks (30 minutes)
- [ ] Xero API connected
- [ ] Shopify stores syncing
- [ ] Real-time updates working
- [ ] File imports functioning
- [ ] Reports generating

---

## 🔍 Monitoring & Logs

### View Logs
1. Go to Render Dashboard
2. Click on your service
3. Click **"Logs"** tab
4. Use filters: `error`, `warn`, `info`

### Health Monitoring
```bash
# Application health
curl https://sentia-manufacturing-development.onrender.com/health

# MCP server status
curl https://sentia-manufacturing-development.onrender.com/api/mcp/status

# Database connectivity
curl https://sentia-manufacturing-development.onrender.com/api/health/database
```

### Metrics Dashboard
- CPU Usage: Monitor in Render Dashboard
- Memory: Keep below 512MB for Starter plan
- Database: Monitor storage and connections
- Response Time: Check P95 latency

---

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. Build Fails
```bash
# Check build logs for errors
# Common fix: Clear build cache in Render Dashboard
Settings → Clear build cache → Trigger manual deploy
```

#### 2. Database Connection Error
```javascript
// Verify DATABASE_URL is set
// Check logs for: "Database connected successfully"
// If not, manually set DATABASE_URL in environment variables
```

#### 3. MCP Server Not Responding
```bash
# Check if MCP is running
curl https://your-app.onrender.com/api/mcp/health

# Restart service if needed
# Render Dashboard → Manual Deploy
```

#### 4. Slow Performance
- Upgrade from Free to Starter plan (no spin-down)
- Check database query performance
- Enable caching with Redis

---

## 💰 Cost Optimization

### Current Setup (Recommended)
- **Web Service**: Starter ($7/month)
- **PostgreSQL**: Starter ($7/month)
- **Total**: $14/month

### Scaling Options
1. **Free Tier** (Development only)
   - Web: Free (spins down after 15 min)
   - DB: Free (expires after 30 days)
   - Total: $0/month

2. **Production** (Recommended)
   - Web: Starter ($7/month)
   - DB: Starter ($7/month)
   - Total: $14/month

3. **Scale-Up** (High traffic)
   - Web: Standard ($25/month)
   - DB: Standard ($25/month)
   - Total: $50/month

---

## 📝 Post-Deployment Tasks

### Immediate (Day 1)
- [x] Verify all deployments successful
- [x] Migrate data from Neon
- [ ] Test critical user flows
- [ ] Update DNS if using custom domain

### Short-term (Week 1)
- [ ] Monitor performance metrics
- [ ] Set up alerting rules
- [ ] Document any issues found
- [ ] Train team on Render Dashboard

### Long-term (Month 1)
- [ ] Cancel Neon subscription
- [ ] Optimize database queries
- [ ] Implement backup strategy
- [ ] Review and optimize costs

---

## 🔐 Security Checklist

- [x] All secrets in environment variables
- [x] Database SSL enforced
- [x] HTTPS enabled automatically
- [ ] Set up IP allowlisting (if needed)
- [ ] Enable 2FA on Render account
- [ ] Regular security updates

---

## 📚 Additional Resources

### Render Documentation
- [Databases](https://render.com/docs/databases)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Blueprints](https://render.com/docs/blueprint-spec)
- [Troubleshooting](https://render.com/docs/troubleshooting)

### Support Channels
- **Render Status**: https://status.render.com
- **Community Forum**: https://community.render.com
- **Support Email**: support@render.com
- **Documentation**: https://render.com/docs

---

## 🎯 Success Metrics

Your deployment is successful when:
- ✅ Application loads without errors
- ✅ All API endpoints return valid responses
- ✅ Database queries execute successfully
- ✅ MCP AI server processes requests
- ✅ Real-time features work properly
- ✅ No critical errors in logs
- ✅ Performance metrics acceptable

---

## 🚀 Next Steps

1. **Complete deployment** using this guide
2. **Verify all services** are running
3. **Migrate data** from Neon to Render
4. **Test thoroughly** before switching production
5. **Cancel Neon** after 48 hours of stability

---

*Last Updated: December 2024*
*Version: 1.0.0*
*Status: Ready for Deployment*