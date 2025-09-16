# Render PostgreSQL Migration Guide

## Complete Migration from Neon to Render PostgreSQL

This guide documents the complete migration from Neon PostgreSQL to Render's integrated PostgreSQL database service, consolidating your entire application infrastructure on a single platform.

## Migration Overview

### What Changed
- **Before**: External Neon PostgreSQL database + Render hosting
- **After**: Single Render application with integrated PostgreSQL database
- **Benefits**: Lower latency, simplified billing, unified monitoring, better integration

## Files Updated

### 1. Main Application Configuration (`render.yaml`)
```yaml
# Added integrated PostgreSQL database
databases:
  - name: sentia-db
    plan: starter  # $7/month for production (or 'free' for development)
    region: oregon
    databaseName: sentia_manufacturing
    user: sentia_admin

# Updated environment variables to use Render PostgreSQL
envVars:
  - key: DATABASE_URL
    fromDatabase:
      name: sentia-db
      property: connectionString
```

### 2. MCP Server Configuration (`mcp-server/render.yaml`)
```yaml
# Updated to use shared Render PostgreSQL
- key: DATABASE_URL
  sync: false  # Will be set from Render environment group
```

### 3. Environment Variables (`.env`)
- Removed all Neon connection strings
- Added placeholders for Render PostgreSQL connection strings
- These will be automatically populated by Render during deployment

### 4. Migration Scripts Created
- `scripts/migrate-neon-to-render.sh` (Linux/Mac)
- `scripts/migrate-neon-to-render.bat` (Windows)

## Deployment Steps

### Step 1: Deploy to Render
1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Migrate from Neon to Render PostgreSQL"
   git push origin development
   ```

2. In Render Dashboard:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Select your repository and the `render.yaml` file
   - Render will automatically create both the web service and PostgreSQL database

### Step 2: Get Database Connection String
1. Once deployment completes, go to your database service (`sentia-db`) in Render
2. Click on "Connect" button
3. Copy the "External Connection String" for migration
4. Copy the "Internal Connection String" for the MCP server

### Step 3: Migrate Data from Neon

#### For Windows Users:
```bash
cd scripts
migrate-neon-to-render.bat
```

#### For Mac/Linux Users:
```bash
cd scripts
chmod +x migrate-neon-to-render.sh
./migrate-neon-to-render.sh
```

Follow the prompts and paste your Render connection string when asked.

### Step 4: Update MCP Server Database Connection
1. In Render Dashboard, go to your MCP server service
2. Add environment variable:
   - Key: `DATABASE_URL`
   - Value: [Internal connection string from sentia-db]
3. Redeploy the MCP server

### Step 5: Verify Migration
1. Check application logs in Render Dashboard
2. Test critical features:
   - User authentication
   - Data loading
   - API endpoints
   - Dashboard functionality

## Database Plans & Pricing

### Render PostgreSQL Options

#### Free Tier (Development)
- **Cost**: $0/month
- **Storage**: 1GB
- **RAM**: 256MB
- **Limitations**: Expires after 30 days, no backups
- **Use Case**: Development and testing

#### Starter Plan (Recommended for Production)
- **Cost**: $7/month
- **Storage**: 1GB (expandable at $0.30/GB)
- **RAM**: 256MB
- **Features**: Daily backups, persistent storage
- **Use Case**: Small to medium production applications

#### Standard Plan (Scale-up Option)
- **Cost**: $25/month
- **Storage**: 15GB (expandable)
- **RAM**: 1GB
- **Features**: Point-in-time recovery, better performance
- **Use Case**: Growing applications with more data

## Post-Migration Checklist

- [ ] Application deployed successfully on Render
- [ ] PostgreSQL database created and running
- [ ] Data migrated from Neon to Render
- [ ] Application connects to new database
- [ ] All features tested and working
- [ ] MCP server using Render PostgreSQL
- [ ] Environment variables updated
- [ ] Backup of Neon data saved locally

## Monitoring & Maintenance

### Database Monitoring in Render
- Go to your database service in Render Dashboard
- Monitor metrics: CPU, Memory, Storage usage
- Set up alerts for resource usage

### Backup Strategy
1. **Automatic Backups**: Enabled on paid plans (daily)
2. **Manual Backups**: Use migration script to create local backups
3. **Keep Neon Active**: For 24-48 hours as fallback

## Rollback Plan

If issues arise:
1. Update DATABASE_URL back to Neon connection string
2. Redeploy application
3. Investigate and fix issues
4. Retry migration

## Canceling Neon

Once migration is verified (after 24-48 hours):
1. Download final backup from Neon
2. Go to [Neon Console](https://console.neon.tech)
3. Navigate to Settings → Billing
4. Cancel subscription
5. Keep local backups for 30 days

## Cost Comparison

### Previous Setup (Neon + Render)
- Neon: $0-20/month (depending on usage)
- Render Web Service: $7/month
- **Total**: $7-27/month

### New Setup (Render Only)
- Render Web Service: $7/month
- Render PostgreSQL: $7/month (Starter)
- **Total**: $14/month (fixed, predictable)

## Benefits of Consolidation

1. **Performance**: Lower latency with same-region database
2. **Simplicity**: Single platform, one invoice
3. **Integration**: Direct internal networking
4. **Monitoring**: Unified dashboard and metrics
5. **Support**: Single support channel for all issues

## Troubleshooting

### Common Issues

#### Connection Refused
- Ensure database is running in Render Dashboard
- Check connection string format
- Verify firewall/security settings

#### Migration Fails
- Check PostgreSQL client tools are installed
- Verify connection strings are correct
- Ensure sufficient permissions

#### Application Can't Connect
- Check DATABASE_URL environment variable
- Verify database is in same region as app
- Review application logs for errors

## Support Resources

- **Render Documentation**: https://render.com/docs/databases
- **Render Status**: https://status.render.com
- **Support**: support@render.com
- **Community**: https://community.render.com

---

*Migration completed on: [Date will be updated after migration]*
*Neon subscription can be canceled after: [Date + 48 hours]*