# Migration from Railway to Render

## Phase 1: Parallel Running (Current Stage)
Keep Railway running while setting up Render to ensure zero downtime.

### Database Migration Options

#### Option A: Continue Using Neon (Recommended for Now)
- **No migration needed** - Already configured in environment variables
- Your Neon databases will work with Render immediately
- Database URLs remain the same

#### Option B: Migrate to Render PostgreSQL (Optional Later)
```bash
# 1. Export data from Neon
pg_dump "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require" > neon_backup.sql

# 2. Get Render database URL from dashboard
# Go to Database service → Connection → Internal Database URL

# 3. Import to Render database
psql "YOUR_RENDER_DATABASE_URL" < neon_backup.sql

# 4. Update DATABASE_URL in Render environment variables
```

## Phase 2: Update DNS and External Services

### Update OAuth Redirect URLs

#### Clerk Dashboard (https://dashboard.clerk.com)
Add Render URLs to allowed origins:
- `https://sentia-manufacturing-development.onrender.com`
- `https://sentia-manufacturing-testing.onrender.com`
- `https://sentia-manufacturing-production.onrender.com`

#### Xero App Settings (https://developer.xero.com)
Add redirect URIs:
- `https://sentia-manufacturing-development.onrender.com/api/xero/callback`
- `https://sentia-manufacturing-testing.onrender.com/api/xero/callback`
- `https://sentia-manufacturing-production.onrender.com/api/xero/callback`

#### Shopify App Settings
Update app URLs if using custom app:
- App URL: `https://sentia-manufacturing-production.onrender.com`
- Redirect URLs: Add Render URLs

### Update Webhook URLs

If you have webhooks configured:
- Xero webhooks → Point to Render URLs
- Shopify webhooks → Update to Render endpoints
- Any other service webhooks → Update accordingly

## Phase 3: Testing Checklist

### Before Switching Production

- [ ] Development environment fully functional on Render
- [ ] All API integrations working (Xero, Shopify, etc.)
- [ ] Database connections stable
- [ ] Authentication working (Clerk)
- [ ] File uploads working (if applicable)
- [ ] Background jobs running (MCP server)
- [ ] Performance acceptable (page load times)

### User Acceptance Testing (UAT)

Run full UAT on Render testing environment:
- [ ] Login/logout flows
- [ ] Dashboard widgets loading
- [ ] Data import functionality
- [ ] Export functionality
- [ ] What-If Analysis page
- [ ] Working Capital page
- [ ] All navigation working
- [ ] Real-time updates (SSE)

## Phase 4: Production Cutover

### Cutover Steps (When Ready)

1. **Notify Users** (if applicable)
   - Schedule maintenance window
   - Inform about URL change

2. **Final Data Sync**
   ```bash
   # If using separate databases, do final sync
   pg_dump RAILWAY_DB > final_backup.sql
   psql RENDER_DB < final_backup.sql
   ```

3. **Update DNS** (if using custom domain)
   - Point domain to Render
   - Update SSL certificates

4. **Update Documentation**
   - README.md with new URLs
   - Internal documentation
   - Client documentation

5. **Monitor Closely**
   - Watch error logs
   - Monitor performance
   - Check all integrations

## Phase 5: Decommission Railway

### After Successful Migration (Wait 1-2 weeks)

1. **Backup Everything**
   ```bash
   # Final Railway backup
   pg_dump RAILWAY_DATABASE_URL > railway_final_archive.sql

   # Export environment variables
   railway variables > railway_variables_backup.json
   ```

2. **Download Logs**
   - Export Railway deployment logs
   - Save any important metrics

3. **Cancel Railway Services**
   - Stop all services
   - Cancel subscription
   - Delete project (after confirming backups)

## Rollback Plan

If issues occur with Render:

1. **Immediate Rollback**
   - Railway is still running (if in parallel phase)
   - Update DNS back to Railway
   - Notify users of temporary URL change

2. **Data Rollback**
   ```bash
   # If data was modified on Render
   pg_dump RENDER_DB > render_state.sql
   psql RAILWAY_DB < render_state.sql
   ```

3. **Fix Issues**
   - Identify what went wrong
   - Fix in development first
   - Re-test thoroughly

## Cost Comparison

### Current (Railway)
- Unknown/Variable pricing
- Potential for unexpected bills
- Complex pricing model

### New (Render)
- Development: $7/month (Starter)
- Testing: $0/month (Free)
- Production: $7/month (Starter)
- MCP Server: $0/month (Free)
- **Total: $14/month** (predictable)

### Savings
- More predictable costs
- Better free tier
- No surprise charges
- Clear upgrade path

## Support Contacts

### Render Support
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs
- Status: https://status.render.com
- Community: https://community.render.com

### Migration Help
- GitHub Issues: Create issue in your repo
- Render Community: Post questions
- Documentation: Check Render migration guides

## Timeline

### Suggested Migration Schedule
- **Day 1-2**: Setup Render, deploy all environments ✅
- **Day 3-5**: Add environment variables, test basic functionality
- **Day 6-7**: Update OAuth/webhooks, test integrations
- **Week 2**: Run parallel, monitor stability
- **Week 3**: UAT on Render testing environment
- **Week 4**: Production cutover (with rollback ready)
- **Week 6**: Decommission Railway (after stable period)

---

**Remember**: Take your time with migration. Running parallel for a few weeks costs a bit more but ensures zero downtime and gives confidence in the new platform.