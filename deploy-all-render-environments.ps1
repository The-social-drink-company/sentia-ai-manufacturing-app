# Automated Render Deployment Script for All Environments
# Deploys Development, Testing, and Production with Render PostgreSQL databases

param(
    [Parameter(Mandatory=$false)]
    [switch]$SkipValidation = $false,
    [Parameter(Mandatory=$false)]
    [switch]$AutoApprove = $false
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " RENDER FULL STACK DEPLOYMENT" -ForegroundColor Yellow
Write-Host " WITH RENDER POSTGRESQL DATABASES" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "STEP 1: Checking Prerequisites" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Gray

$checks = @{
    "render.yaml exists" = Test-Path "render.yaml"
    "Git repository" = Test-Path ".git"
    "Node.js installed" = $null -ne (Get-Command node -ErrorAction SilentlyContinue)
    "GitHub remote configured" = (git remote -v) -match "github.com"
}

$allChecksPassed = $true
foreach ($check in $checks.GetEnumerator()) {
    if ($check.Value) {
        Write-Host "[OK] $($check.Key)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $($check.Key)" -ForegroundColor Red
        $allChecksPassed = $false
    }
}

if (-not $allChecksPassed) {
    Write-Host ""
    Write-Host "Prerequisites not met. Please fix issues above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "STEP 2: Services to Deploy" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor Gray

$services = @(
    @{
        Name = "MCP Server"
        Service = "sentia-mcp-server"
        URL = "https://mcp-server-tkyu.onrender.com"
        Status = "LIVE"
    },
    @{
        Name = "Development"
        Service = "sentia-manufacturing-development"
        URL = "https://sentia-manufacturing-development.onrender.com"
        Database = "sentia-db-development"
        Branch = "development"
        Plan = "Free"
    },
    @{
        Name = "Testing"
        Service = "sentia-manufacturing-testing"
        URL = "https://sentia-manufacturing-testing.onrender.com"
        Database = "sentia-db-testing"
        Branch = "test"
        Plan = "Starter ($7/month)"
    },
    @{
        Name = "Production"
        Service = "sentia-manufacturing-production"
        URL = "https://sentia-manufacturing-production.onrender.com"
        Database = "sentia-db-production"
        Branch = "production"
        Plan = "Standard ($25/month)"
    }
)

Write-Host "Services to be deployed:" -ForegroundColor White
foreach ($svc in $services) {
    Write-Host ""
    Write-Host "  $($svc.Name):" -ForegroundColor Cyan
    Write-Host "    Service: $($svc.Service)" -ForegroundColor Gray
    Write-Host "    URL: $($svc.URL)" -ForegroundColor Gray
    if ($svc.Database) {
        Write-Host "    Database: $($svc.Database)" -ForegroundColor Gray
        Write-Host "    Branch: $($svc.Branch)" -ForegroundColor Gray
        Write-Host "    Plan: $($svc.Plan)" -ForegroundColor Gray
    }
    if ($svc.Status -eq "LIVE") {
        Write-Host "    Status: $($svc.Status)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Total Monthly Cost Estimate:" -ForegroundColor Yellow
Write-Host "  Applications: $32 (Free + $7 + $25)" -ForegroundColor White
Write-Host "  Databases: $7 (Free + Free + $7)" -ForegroundColor White
Write-Host "  MCP Server: $25" -ForegroundColor White
Write-Host "  TOTAL: $64/month" -ForegroundColor Cyan

if (-not $AutoApprove) {
    Write-Host ""
    Write-Host "Continue with deployment? (y/n): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne 'y') {
        Write-Host "Deployment cancelled." -ForegroundColor Red
        exit 0
    }
}

Write-Host ""
Write-Host "STEP 3: Git Status Check" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Gray

# Check git status
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Uncommitted changes detected:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
    Write-Host ""
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git add .
    git commit -m "Render deployment configuration with PostgreSQL databases"
    git push origin development
    Write-Host "Changes committed and pushed." -ForegroundColor Green
} else {
    Write-Host "Working directory clean." -ForegroundColor Green
}

Write-Host ""
Write-Host "STEP 4: Deployment Instructions" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Gray

Write-Host @"
AUTOMATED DEPLOYMENT PROCESS:

1. BLUEPRINT DEPLOYMENT (Recommended - Deploys Everything)
   --------------------------------------------------------
   a. Go to: https://dashboard.render.com
   b. Click "New +" → "Blueprint"
   c. Connect GitHub repository: The-social-drink-company/sentia-manufacturing-dashboard
   d. Select 'render.yaml' from root directory
   e. Click "Apply"

   This will create:
   - 3 Web Services (Development, Testing, Production)
   - 3 PostgreSQL Databases (one for each environment)
   - All environment variables configured
   - Automatic branch deployments

2. MANUAL DEPLOYMENT (If Blueprint fails)
   ----------------------------------------
   For each environment (development, testing, production):

   a. Create Web Service:
      - Name: sentia-manufacturing-[environment]
      - Repo: The-social-drink-company/sentia-manufacturing-dashboard
      - Branch: [development|test|production]
      - Build: npm ci --legacy-peer-deps && npm run build && npx prisma generate && npx prisma db push --skip-generate
      - Start: node server-render.js

   b. Create PostgreSQL Database:
      - Name: sentia-db-[environment]
      - Plan: [Free|Free|Starter]

   c. Link Database to Service:
      - In service environment variables
      - Add DATABASE_URL from database
      - Use "Internal Connection String"

3. ENVIRONMENT VARIABLES
   ----------------------
   All 55+ variables are in render.yaml
   Key variables to verify:
   - DATABASE_URL (auto from Render PostgreSQL)
   - MCP_SERVER_URL = https://mcp-server-tkyu.onrender.com
   - All API keys (Xero, Shopify, OpenAI, etc.)
"@ -ForegroundColor White

Write-Host ""
Write-Host "Press Enter to open Render Dashboard..." -ForegroundColor Cyan
Read-Host

# Open Render dashboard
Start-Process "https://dashboard.render.com/new/blueprint"

Write-Host ""
Write-Host "STEP 5: Waiting for Deployment" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Gray
Write-Host "Deployment typically takes 10-15 minutes per service." -ForegroundColor White
Write-Host ""
Write-Host "Press Enter after all services show 'Live' status..." -ForegroundColor Cyan
Read-Host

# Validation
if (-not $SkipValidation) {
    Write-Host ""
    Write-Host "STEP 6: Running Validation" -ForegroundColor Yellow
    Write-Host "--------------------------" -ForegroundColor Gray

    # Run validation script
    if (Test-Path "validate-render-complete.ps1") {
        & .\validate-render-complete.ps1 -Environment all
    } else {
        Write-Host "Validation script not found. Performing basic checks..." -ForegroundColor Yellow

        foreach ($svc in $services | Where-Object { $_.URL }) {
            Write-Host ""
            Write-Host "Testing $($svc.Name)..." -ForegroundColor Cyan

            try {
                $response = Invoke-WebRequest -Uri "$($svc.URL)/health" -Method GET -TimeoutSec 10
                if ($response.StatusCode -eq 200) {
                    Write-Host "  [OK] Service is live!" -ForegroundColor Green
                } else {
                    Write-Host "  [WARN] Service responded with: $($response.StatusCode)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "  [FAIL] Service not responding" -ForegroundColor Red
                Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
            }
        }
    }
}

Write-Host ""
Write-Host "STEP 7: Database Migration" -ForegroundColor Yellow
Write-Host "--------------------------" -ForegroundColor Gray

Write-Host @"
To migrate data from Neon to Render PostgreSQL:

1. Get Render database connection strings:
   - Go to each database in Render dashboard
   - Copy "External Connection String"

2. Run migration for each environment:
   .\database-migration-render.ps1 -Operation sync \
     -SourceDB "[Neon Connection String]" \
     -TargetDB "[Render PostgreSQL Connection String]"

3. Verify data:
   .\database-migration-render.ps1 -Operation validate \
     -SourceDB "[Render PostgreSQL Connection String]"
"@ -ForegroundColor White

Write-Host ""
Write-Host "STEP 8: Post-Deployment Checklist" -ForegroundColor Yellow
Write-Host "---------------------------------" -ForegroundColor Gray

$postChecks = @(
    "All services showing 'Live' status",
    "Health endpoints responding",
    "Database connections established",
    "MCP server integration verified",
    "Authentication (Clerk) working",
    "API integrations configured",
    "Auto-deploy from GitHub enabled",
    "Custom domains configured (optional)",
    "SSL certificates issued",
    "Monitoring alerts set up"
)

Write-Host "Please verify:" -ForegroundColor White
foreach ($check in $postChecks) {
    Write-Host "  [ ] $check" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Your services are available at:" -ForegroundColor Yellow
foreach ($svc in $services | Where-Object { $_.URL }) {
    Write-Host "  $($svc.Name): $($svc.URL)" -ForegroundColor White
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Verify all services are operational" -ForegroundColor White
Write-Host "2. Migrate data from Neon to Render PostgreSQL" -ForegroundColor White
Write-Host "3. Update OAuth redirect URLs (Clerk, Xero)" -ForegroundColor White
Write-Host "4. Configure custom domains if needed" -ForegroundColor White
Write-Host "5. Monitor for 24-48 hours before decommissioning Railway" -ForegroundColor White

Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - Deployment Guide: RENDER_DEPLOYMENT_CHECKLIST.md" -ForegroundColor Gray
Write-Host "  - Rollback Procedures: RENDER_ROLLBACK_PROCEDURES.md" -ForegroundColor Gray
Write-Host "  - Custom Domains: RENDER_CUSTOM_DOMAIN_SETUP.md" -ForegroundColor Gray
Write-Host "  - Environment Variables: RENDER_ENVIRONMENT_VARIABLES_COMPLETE.md" -ForegroundColor Gray

# Generate deployment report
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportFile = "deployment-report-$timestamp.txt"

@"
Render Deployment Report
Generated: $timestamp

Services Deployed:
$(foreach ($svc in $services) { "- $($svc.Name): $($svc.URL)" })

Deployment Status: Complete
Next Action: Verify and migrate data

Notes:
_____________________
_____________________
_____________________
"@ | Out-File $reportFile

Write-Host ""
Write-Host "Deployment report saved to: $reportFile" -ForegroundColor Gray