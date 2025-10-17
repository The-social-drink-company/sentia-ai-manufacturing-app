# 🚀 RENDER DEPLOYMENT MASTER GUIDE

## 📦 What I've Prepared For You

### Configuration Files

- ✅ **render.yaml** - Complete infrastructure as code
- ✅ **render-env-development.txt** - Copy-paste environment variables
- ✅ **render-env-testing.txt** - Copy-paste environment variables
- ✅ **render-env-production.txt** - Copy-paste environment variables
- ✅ **render-env-mcp.txt** - MCP server variables
- ✅ **.env.render** - Local development configuration

### Scripts & Tools

- ✅ **verify-render-deployment.ps1** - Test deployments are working
- ✅ **format-render-env.ps1** - Format environment variables

### Documentation

- ✅ **RENDER_DEPLOYMENT_CHECKLIST.md** - Step-by-step deployment
- ✅ **POST_DEPLOYMENT_STEPS.md** - What to do after deployment
- ✅ **migrate-from-railway.md** - Complete migration guide

---

## 🎯 QUICK START (15 Minutes)

### Step 1: Deploy Infrastructure (2 min)

1. Open https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Select your repo: `The-social-drink-company/sentia-manufacturing-dashboard`
4. Click **"Apply"**

### Step 2: Add Environment Variables (10 min)

For each service in Render Dashboard:

#### Development Service

1. Click `sentia-manufacturing-development`
2. Go to **Environment** tab
3. Click **"Bulk Edit"**
4. Open `render-env-development.txt` in Notepad
5. **Copy ALL contents** (Ctrl+A, Ctrl+C)
6. **Paste** into Render
7. Click **"Save Changes"**

#### Repeat for:

- `sentia-manufacturing-testing` → use `render-env-testing.txt`
- `sentia-manufacturing-production` → use `render-env-production.txt`
- `sentia-mcp-server` → use `render-env-mcp.txt`

### Step 3: Wait & Verify (3 min)

Services will auto-deploy. After ~10 minutes:

```powershell
.\verify-render-deployment.ps1
```

---

## 📊 YOUR NEW INFRASTRUCTURE

### URLs

```
Development: https://sentia-manufacturing-development.onrender.com
Testing:     https://sentia-manufacturing-testing.onrender.com
Production:  https://sentia-manufacturing-production.onrender.com
MCP Server:  https://sentia-mcp-server.onrender.com (worker)
```

### Services Created

| Service       | Type       | Plan    | Cost  | RAM   | CPU |
| ------------- | ---------- | ------- | ----- | ----- | --- |
| Development   | Web        | Starter | $7/mo | 512MB | 0.5 |
| Testing       | Web        | Free    | $0    | 256MB | 0.1 |
| Production    | Web        | Starter | $7/mo | 512MB | 0.5 |
| MCP Server    | Worker     | Free    | $0    | 256MB | 0.1 |
| Dev Database  | PostgreSQL | Free\*  | $0    | -     | -   |
| Test Database | PostgreSQL | Free\*  | $0    | -     | -   |
| Prod Database | PostgreSQL | Free\*  | $0    | -     | -   |

\*Free for 90 days, then $7/month each

**Total Cost**: $14/month (first 90 days)

---

## ✅ DEPLOYMENT CHECKLIST

### Immediate (Today)

- [ ] Deploy via Blueprint
- [ ] Add environment variables to all services
- [ ] Verify deployments with script
- [ ] Test login on Development environment

### Day 1-3

- [ ] Update local .env to use Render
- [ ] Test all critical features
- [ ] Monitor logs for errors
- [ ] Update Clerk redirect URLs

### Week 1

- [ ] Update Xero OAuth URLs
- [ ] Test all API integrations
- [ ] Run UAT on Testing environment
- [ ] Document any issues

### Week 2

- [ ] Performance testing
- [ ] Security review
- [ ] Prepare production cutover plan
- [ ] Train team on Render

### Month 1

- [ ] Complete production migration
- [ ] Optimize costs
- [ ] Set up monitoring
- [ ] Decommission Railway

---

## 🛠️ TROUBLESHOOTING

### Service Won't Start

1. Check environment variables are set
2. Look at Logs tab for specific error
3. Verify DATABASE_URL is correct
4. Wait 2-3 more minutes

### 502 Bad Gateway

- Service is still deploying (wait)
- Check Logs for crash errors
- Verify all required env vars set

### Slow Performance

- First deploy takes longer
- Consider upgrading to Standard ($25/mo)
- Check if database queries are slow

### Can't Login

- Update Clerk redirect URLs
- Check CLERK_SECRET_KEY is set
- Verify VITE_CLERK_PUBLISHABLE_KEY

---

## 📞 SUPPORT

### Render Resources

- Dashboard: https://dashboard.render.com
- Documentation: https://render.com/docs
- Status Page: https://status.render.com
- Community: https://community.render.com

### Your Files

- Environment vars: `render-env-*.txt`
- Verification: Run `.\verify-render-deployment.ps1`
- Local setup: Copy `.env.render` to `.env`

---

## 🎉 SUCCESS CRITERIA

You'll know deployment is successful when:

1. ✅ All services show "Live" in Render Dashboard
2. ✅ Verification script shows all "OK"
3. ✅ Can login with Clerk authentication
4. ✅ Dashboard loads with data
5. ✅ API health checks pass

---

## 🚨 EMERGENCY ROLLBACK

If something goes wrong:

1. Railway is still running (don't delete yet!)
2. Point your app back to Railway URLs
3. Fix issues in Render development environment
4. Try again when ready

---

## 📝 NOTES

- **Database**: Currently using your existing Neon PostgreSQL (no migration needed)
- **Auto-deploy**: Enabled for dev/test, manual for production
- **SSL**: Automatic on all Render services
- **Backups**: Enable in Render Dashboard after deployment

---

**READY TO DEPLOY?**

1. Open https://dashboard.render.com
2. Follow the Quick Start above
3. Your app will be live in ~15 minutes!

**Need help?** All the answers are in the documentation files I created. The environment variables are ready to copy-paste from the `.txt` files.
