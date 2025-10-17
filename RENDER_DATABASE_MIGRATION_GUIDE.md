# Render Database Migration Guide

## Complete Migration from Neon to Render PostgreSQL

---

## 🎯 NEW DATABASE ARCHITECTURE

You now have **THREE SEPARATE DATABASES** on Render:

| Environment | Database Name           | Service Name                       | Plan            | Purpose            |
| ----------- | ----------------------- | ---------------------------------- | --------------- | ------------------ |
| Development | `sentia-db-development` | `sentia-manufacturing-development` | Free            | Active development |
| Testing     | `sentia-db-testing`     | `sentia-manufacturing-testing`     | Free            | UAT testing        |
| Production  | `sentia-db-production`  | `sentia-manufacturing-production`  | Starter ($7/mo) | Live operations    |

---

## 📋 MIGRATION STEPS

### Step 1: Create Databases on Render

The `render.yaml` is already configured. Deploy it to create all databases:

```bash
# Push to GitHub to trigger database creation
git add render.yaml
git commit -m "Configure Render PostgreSQL databases for all environments"
git push origin development
```

Or create manually in Render Dashboard:

1. Go to https://dashboard.render.com
2. Click **New +** → **PostgreSQL**
3. Create three databases with these exact names:
   - `sentia-db-development`
   - `sentia-db-testing`
   - `sentia-db-production`

### Step 2: Export Data from Neon (If Needed)

If you have data to migrate:

```bash
# Export from Neon
pg_dump "postgresql://neondb_owner:password@ep-xxx.aws.neon.tech/neondb" > neon_backup.sql

# Or export specific tables
pg_dump "postgresql://..." -t users -t products > data_export.sql
```

### Step 3: Connect Services to Render Databases

#### For Development Service:

1. Go to `sentia-manufacturing-development` service
2. Go to **Environment** tab
3. Add/Update:
   ```
   DATABASE_URL → Connect to sentia-db-development (Internal)
   ```
4. Render will automatically provide the connection string

#### For Testing Service:

1. Go to `sentia-manufacturing-testing` service
2. Add:
   ```
   DATABASE_URL → Connect to sentia-db-testing (Internal)
   ```

#### For Production Service:

1. Go to `sentia-manufacturing-production` service
2. Add:
   ```
   DATABASE_URL → Connect to sentia-db-production (Internal)
   ```

### Step 4: Initialize Database Schema

For each environment, run:

```bash
# Set the DATABASE_URL for each environment
export DATABASE_URL="[Render Internal Database URL]"

# Run Prisma migrations
npx prisma generate
npx prisma db push

# Or if you have migration files
npx prisma migrate deploy
```

### Step 5: Import Data (If Migrating)

```bash
# Import to Render database
psql "[Render Database URL]" < neon_backup.sql

# Or use Render's dashboard to restore
```

---

## 🔗 DATABASE CONNECTION STRINGS

### Internal URLs (Use These for Services)

Render provides internal URLs automatically when services are in the same region:

```
# Development (Internal - automatic in render.yaml)
postgresql://sentia_dev_user:password@sentia-db-development:5432/sentia_manufacturing_dev

# Testing (Internal)
postgresql://sentia_test_user:password@sentia-db-testing:5432/sentia_manufacturing_test

# Production (Internal)
postgresql://sentia_prod_user:password@sentia-db-production:5432/sentia_manufacturing_prod
```

### External URLs (For Local Development)

Get these from Render Dashboard for local testing:

```
# Example format
postgresql://user:password@dpg-xxxxx.oregon-postgres.render.com/database
```

---

## ⚙️ UPDATE YOUR CODE

### 1. Update `.env` Files

**.env.development**

```env
DATABASE_URL=postgresql://[from sentia-db-development external URL]
```

**.env.test**

```env
DATABASE_URL=postgresql://[from sentia-db-testing external URL]
```

**.env.production**

```env
DATABASE_URL=postgresql://[from sentia-db-production external URL]
```

### 2. Update Prisma Configuration

**prisma/schema.prisma**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Remove any Neon-specific settings
}
```

### 3. Remove Neon References

Remove from your code:

- Any `@neondatabase` packages
- Neon-specific connection pooling
- References to `neon.tech` endpoints

---

## 🚀 QUICK SETUP SCRIPT

Create and run this script to set up all databases:

**setup-render-databases.ps1**

```powershell
# Setup all Render databases
Write-Host "Setting up Render databases..." -ForegroundColor Cyan

$environments = @("development", "testing", "production")

foreach ($env in $environments) {
    Write-Host "`nSetting up $env database..." -ForegroundColor Yellow

    # Get the database URL from Render (you'll need to paste these)
    $dbUrl = Read-Host "Paste the INTERNAL database URL for sentia-db-$env"

    # Run Prisma setup
    $env:DATABASE_URL = $dbUrl
    npx prisma generate
    npx prisma db push --skip-generate

    Write-Host "✅ $env database initialized" -ForegroundColor Green
}
```

---

## ✅ VERIFICATION CHECKLIST

### For Each Environment, Verify:

#### Development

- [ ] `sentia-db-development` shows as "Available" in Render
- [ ] Service connected to database (check Environment tab)
- [ ] Tables created (run `npx prisma studio`)
- [ ] Application connects successfully

#### Testing

- [ ] `sentia-db-testing` shows as "Available"
- [ ] Service connected to database
- [ ] Schema synchronized
- [ ] Test data loaded (if needed)

#### Production

- [ ] `sentia-db-production` shows as "Available"
- [ ] Using Starter plan (for backups)
- [ ] Service connected to database
- [ ] Production data migrated
- [ ] Backups configured

---

## 🔍 CONNECTION TESTING

### Test Database Connections

```javascript
// test-db-connection.js
import { PrismaClient } from '@prisma/client'

const testConnection = async (envName, dbUrl) => {
  process.env.DATABASE_URL = dbUrl
  const prisma = new PrismaClient()

  try {
    await prisma.$connect()
    console.log(`✅ ${envName} database connected`)

    // Test query
    const userCount = await prisma.user.count()
    console.log(`   Users: ${userCount}`)

    await prisma.$disconnect()
  } catch (error) {
    console.error(`❌ ${envName} connection failed:`, error.message)
  }
}

// Test all environments
testConnection('Development', 'your-dev-db-url')
testConnection('Testing', 'your-test-db-url')
testConnection('Production', 'your-prod-db-url')
```

---

## 📊 DATABASE MANAGEMENT

### Render Database Features

#### Free Plan (Dev/Test)

- 100MB storage
- 1GB RAM
- No backups
- 90-day retention

#### Starter Plan (Production)

- 1GB storage
- 256MB RAM
- Daily backups
- 7-day retention
- Point-in-time recovery

### Access Databases

#### Via Render Dashboard

1. Click on database service
2. Go to **Info** tab
3. Use **PSQL Command** to connect

#### Via CLI

```bash
# Connect to database
psql "[External Database URL]"

# List tables
\dt

# Check connections
SELECT * FROM pg_stat_activity;
```

---

## 🚨 IMPORTANT NOTES

### 1. Connection Strings

- **Internal URLs**: Use for service-to-database connections (same region)
- **External URLs**: Use for local development and external tools
- Internal connections are faster and don't count against connection limits

### 2. Migration Timing

- Migrate development first and test thoroughly
- Then migrate testing environment
- Finally migrate production during maintenance window

### 3. Connection Limits

- Free plan: 97 connections
- Starter plan: 97 connections
- Use connection pooling in production

### 4. Backups

- Free plan: No automatic backups
- Starter plan: Daily automatic backups
- Always backup before major changes

---

## 🔄 ROLLBACK PLAN

If issues occur:

1. **Keep Neon Active**: Don't delete Neon databases immediately
2. **Switch Back**: Change DATABASE_URL back to Neon if needed
3. **Export Render Data**: `pg_dump` to backup any new data
4. **Restore to Neon**: Import backup if reverting

---

## ✅ MIGRATION COMPLETE CHECKLIST

- [ ] All three Render databases created
- [ ] Services connected to correct databases
- [ ] Schema migrated (tables created)
- [ ] Data migrated (if applicable)
- [ ] Local development pointing to Render
- [ ] All environments tested
- [ ] Backup strategy in place
- [ ] Neon references removed from code
- [ ] Documentation updated

---

## 📞 SUPPORT

### Render Database Issues

- Check: https://status.render.com
- Docs: https://render.com/docs/databases
- Support: Dashboard → Help → Support

### Connection Issues

1. Verify database is "Available" status
2. Check region matches (must be same)
3. Use Internal URL for services
4. Check connection limit not exceeded

---

**Migration Status**: Ready to implement
**Estimated Time**: 30-60 minutes for all environments
**Risk Level**: Low (keeping Neon as backup)
