# Render Database Setup Script
# Initializes all three Render PostgreSQL databases

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "testing", "production", "all")]
    [string]$Environment = "all"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Render PostgreSQL Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

function Setup-Database {
    param([string]$EnvName)

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Setting up $EnvName database" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    $dbName = "sentia-db-$EnvName"

    Write-Host "`nDatabase: $dbName" -ForegroundColor Yellow
    Write-Host @"

IMPORTANT: You need to:
1. Go to https://dashboard.render.com
2. Find the database: $dbName
3. Click on it and go to 'Info' tab
4. Copy the INTERNAL Database URL (for service connections)
   OR External Database URL (for local testing)

"@ -ForegroundColor Cyan

    $useExternal = Read-Host "Will you use External URL for local testing? (y/n)"

    if ($useExternal -eq "y") {
        Write-Host "`nPaste the EXTERNAL Database URL from Render:" -ForegroundColor Yellow
    } else {
        Write-Host "`nPaste the INTERNAL Database URL from Render:" -ForegroundColor Yellow
    }

    $dbUrl = Read-Host "Database URL"

    if ([string]::IsNullOrWhiteSpace($dbUrl)) {
        Write-Host "No URL provided, skipping $EnvName" -ForegroundColor Red
        return
    }

    # Set environment variable
    $env:DATABASE_URL = $dbUrl

    Write-Host "`n1. Generating Prisma Client..." -ForegroundColor Yellow
    try {
        npx prisma generate
        Write-Host "   ✅ Prisma client generated" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Failed to generate Prisma client: $_" -ForegroundColor Red
        return
    }

    Write-Host "`n2. Creating database schema..." -ForegroundColor Yellow
    try {
        npx prisma db push --skip-generate
        Write-Host "   ✅ Database schema created" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Failed to create schema: $_" -ForegroundColor Red
        Write-Host "   This might be a connection issue. Check:" -ForegroundColor Yellow
        Write-Host "   - Database is 'Available' in Render" -ForegroundColor Yellow
        Write-Host "   - URL is correct and complete" -ForegroundColor Yellow
        Write-Host "   - Network connectivity" -ForegroundColor Yellow
        return
    }

    Write-Host "`n3. Seeding initial data (if seed file exists)..." -ForegroundColor Yellow
    try {
        npx prisma db seed 2>$null
        Write-Host "   ✅ Database seeded" -ForegroundColor Green
    } catch {
        Write-Host "   ℹ️ No seed file or seeding skipped" -ForegroundColor Gray
    }

    Write-Host "`n4. Testing connection..." -ForegroundColor Yellow
    node -e @"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.`$connect()
  .then(() => {
    console.log('   ✅ Connection successful');
    return prisma.`$disconnect();
  })
  .catch(err => {
    console.error('   ❌ Connection failed:', err.message);
  });
"@

    Write-Host "`n✅ $EnvName database setup complete!" -ForegroundColor Green
    Write-Host "Database URL saved for this session" -ForegroundColor Gray

    # Save to .env file for convenience
    $saveToFile = Read-Host "`nSave to .env.$EnvName file? (y/n)"
    if ($saveToFile -eq "y") {
        $envFile = ".env.$EnvName"
        @"
# Render PostgreSQL Database
DATABASE_URL=$dbUrl
NODE_ENV=$EnvName
"@ | Set-Content $envFile
        Write-Host "Saved to $envFile" -ForegroundColor Green
    }
}

# Main execution
if ($Environment -eq "all") {
    Write-Host "`nSetting up ALL databases..." -ForegroundColor Cyan
    Write-Host "You'll need the database URLs from Render Dashboard" -ForegroundColor Yellow

    Setup-Database -EnvName "development"
    Setup-Database -EnvName "testing"
    Setup-Database -EnvName "production"

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "All Database Setup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan

} else {
    Setup-Database -EnvName $Environment
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host @"

1. Update your services in Render Dashboard:
   - Each service should use its corresponding database
   - Use INTERNAL URLs for service-to-database connections

2. Verify connections:
   - Development: https://sentia-manufacturing-development.onrender.com/health
   - Testing: https://sentia-manufacturing-testing.onrender.com/health
   - Production: https://sentia-manufacturing-production.onrender.com/health

3. Deploy services:
   - Trigger manual deploy after database connection

4. Monitor logs:
   - Check for "Database connected successfully" message

"@ -ForegroundColor White

Write-Host "Run 'npx prisma studio' to view your database tables" -ForegroundColor Cyan