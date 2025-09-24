# Promote Code Between Environments Script
# Handles promotion from dev -> test -> production with proper checks

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("test", "production")]
    [string]$TargetEnvironment,

    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false,

    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ENVIRONMENT PROMOTION" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Determine source and target branches
$sourceBranch = if ($TargetEnvironment -eq "test") { "development" } else { "test" }
$targetBranch = $TargetEnvironment

Write-Host "Promotion Path: $sourceBranch -> $targetBranch" -ForegroundColor Yellow
Write-Host ""

# Function to check service health
function Test-ServiceHealth {
    param([string]$environment)

    $url = switch($environment) {
        "development" { "https://sentia-manufacturing-development.onrender.com/health" }
        "test" { "https://sentia-manufacturing-testing.onrender.com/health" }
        "production" { "https://sentia-manufacturing-production.onrender.com/health" }
    }

    Write-Host "Checking $environment health: $url" -NoNewline
    try {
        $response = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 10
        if ($response.status -eq "healthy") {
            Write-Host " [OK]" -ForegroundColor Green
            return $true
        }
        Write-Host " [UNHEALTHY]" -ForegroundColor Yellow
        return $false
    } catch {
        Write-Host " [OFFLINE]" -ForegroundColor Red
        return $false
    }
}

# Pre-promotion checks
Write-Host "Step 1: Pre-Promotion Checks" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Gray

# Check source environment health
if (-not $Force) {
    $sourceHealth = Test-ServiceHealth -environment $sourceBranch
    if (-not $sourceHealth) {
        Write-Host "[WARN] Source environment is not healthy!" -ForegroundColor Yellow
        Write-Host "Use -Force to bypass health checks" -ForegroundColor Gray
        if (-not $Force) {
            exit 1
        }
    }
}

# Check for uncommitted changes
Write-Host "Checking for uncommitted changes..." -NoNewline
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host " [DIRTY]" -ForegroundColor Red
    Write-Host "Uncommitted changes detected!" -ForegroundColor Red
    Write-Host $gitStatus
    exit 1
}
Write-Host " [CLEAN]" -ForegroundColor Green

# Fetch latest changes
Write-Host "Fetching latest changes..." -NoNewline
git fetch --all --quiet
Write-Host " [OK]" -ForegroundColor Green

# Check if source branch is ahead
Write-Host "Checking if $sourceBranch has new changes..." -NoNewline
$ahead = git rev-list --count $targetBranch..$sourceBranch
if ($ahead -eq 0) {
    Write-Host " [NO CHANGES]" -ForegroundColor Yellow
    Write-Host "$targetBranch is already up to date with $sourceBranch" -ForegroundColor Yellow
    exit 0
}
Write-Host " [$ahead commits ahead]" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Running Tests" -ForegroundColor Yellow
Write-Host "--------------------" -ForegroundColor Gray

if (-not $SkipTests) {
    # Run tests
    Write-Host "Running unit tests..." -ForegroundColor White
    npm test -- --run
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Unit tests failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Unit tests passed" -ForegroundColor Green

    # Run lint
    Write-Host "Running linter..." -ForegroundColor White
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Linting failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Linting passed" -ForegroundColor Green

    # Build check
    Write-Host "Running build..." -ForegroundColor White
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Build successful" -ForegroundColor Green
} else {
    Write-Host "[SKIPPED] Tests skipped with -SkipTests flag" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Change Summary" -ForegroundColor Yellow
Write-Host "----------------------" -ForegroundColor Gray

# Show changes to be promoted
Write-Host "Changes to be promoted:" -ForegroundColor White
git log --oneline $targetBranch..$sourceBranch | Select-Object -First 10

Write-Host ""
Write-Host "Files changed:" -ForegroundColor White
git diff --stat $targetBranch..$sourceBranch

# UAT Checklist for production promotion
if ($TargetEnvironment -eq "production") {
    Write-Host ""
    Write-Host "Step 4: UAT Checklist" -ForegroundColor Yellow
    Write-Host "--------------------" -ForegroundColor Gray

    Write-Host @"
Please confirm UAT completion:
- [ ] All features tested and working
- [ ] No regression in existing features
- [ ] Performance acceptable
- [ ] External APIs functioning
- [ ] User permissions validated
- [ ] Client approval received
"@ -ForegroundColor White

    Write-Host ""
    Write-Host "Has UAT been completed and approved? (yes/no): " -NoNewline -ForegroundColor Yellow
    $uatConfirm = Read-Host
    if ($uatConfirm -ne "yes") {
        Write-Host "[ABORT] UAT not confirmed" -ForegroundColor Red
        exit 1
    }

    # Database backup reminder
    Write-Host ""
    Write-Host "Has production database been backed up? (yes/no): " -NoNewline -ForegroundColor Yellow
    $backupConfirm = Read-Host
    if ($backupConfirm -ne "yes") {
        Write-Host "[ABORT] Please backup production database first" -ForegroundColor Red
        Write-Host "Run: .\scripts\backup-render-database.ps1 -Environment production" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Step 5: Promotion Confirmation" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Gray

Write-Host "Ready to promote:" -ForegroundColor White
Write-Host "  From: $sourceBranch" -ForegroundColor Gray
Write-Host "  To: $targetBranch" -ForegroundColor Gray
Write-Host "  Changes: $ahead commits" -ForegroundColor Gray
Write-Host ""
Write-Host "Proceed with promotion? (yes/no): " -NoNewline -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne "yes") {
    Write-Host "[ABORT] Promotion cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 6: Executing Promotion" -ForegroundColor Yellow
Write-Host "--------------------------" -ForegroundColor Gray

# Checkout target branch
Write-Host "Checking out $targetBranch..." -ForegroundColor White
git checkout $targetBranch
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to checkout $targetBranch" -ForegroundColor Red
    exit 1
}

# Pull latest
Write-Host "Pulling latest $targetBranch..." -ForegroundColor White
git pull origin $targetBranch
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to pull $targetBranch" -ForegroundColor Red
    exit 1
}

# Merge source branch
Write-Host "Merging $sourceBranch into $targetBranch..." -ForegroundColor White
$mergeMessage = "chore: promote $sourceBranch to $targetBranch

Promoted $ahead commits from $sourceBranch to $targetBranch environment"

git merge $sourceBranch --no-ff -m $mergeMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Merge failed! Resolve conflicts and retry" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Merge successful" -ForegroundColor Green

# Tag if production
if ($TargetEnvironment -eq "production") {
    $version = (Get-Content package.json | ConvertFrom-Json).version
    $tagName = "v$version-$(Get-Date -Format 'yyyyMMdd-HHmm')"
    Write-Host "Creating release tag: $tagName" -ForegroundColor White
    git tag -a $tagName -m "Production release $tagName"
    Write-Host "[OK] Tag created" -ForegroundColor Green
}

# Push to remote
Write-Host "Pushing to remote..." -ForegroundColor White
if ($TargetEnvironment -eq "production") {
    git push origin $targetBranch --tags
} else {
    git push origin $targetBranch
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Push failed!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Pushed successfully" -ForegroundColor Green

Write-Host ""
Write-Host "Step 7: Deployment Monitoring" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Gray

# Get Render service URL
$renderUrl = switch($TargetEnvironment) {
    "test" { "https://sentia-manufacturing-testing.onrender.com" }
    "production" { "https://sentia-manufacturing-production.onrender.com" }
}

Write-Host "Deployment triggered for: $renderUrl" -ForegroundColor White
Write-Host "Render will auto-deploy from the $targetBranch branch" -ForegroundColor Gray
Write-Host ""
Write-Host "Monitor deployment at:" -ForegroundColor Yellow
Write-Host "https://dashboard.render.com" -ForegroundColor Cyan

# Wait for deployment
Write-Host ""
Write-Host "Waiting for deployment to complete (max 5 minutes)..." -ForegroundColor Yellow

$maxWait = 300 # 5 minutes
$waited = 0
$deployed = $false

while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 15
    $waited += 15

    Write-Host "Checking deployment status..." -NoNewline
    if (Test-ServiceHealth -environment $TargetEnvironment) {
        $deployed = $true
        break
    }
    Write-Host " (waiting $waited/$maxWait seconds)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($deployed) {
    Write-Host " PROMOTION SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Environment: $TargetEnvironment" -ForegroundColor White
    Write-Host "URL: $renderUrl" -ForegroundColor White
    Write-Host "Status: LIVE" -ForegroundColor Green

    if ($TargetEnvironment -eq "production") {
        Write-Host ""
        Write-Host "Post-deployment tasks:" -ForegroundColor Yellow
        Write-Host "1. Verify all features are working" -ForegroundColor Gray
        Write-Host "2. Monitor error logs" -ForegroundColor Gray
        Write-Host "3. Check performance metrics" -ForegroundColor Gray
        Write-Host "4. Notify stakeholders" -ForegroundColor Gray
        Write-Host "5. Update release notes" -ForegroundColor Gray
    }
} else {
    Write-Host " DEPLOYMENT PENDING" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Deployment is still in progress." -ForegroundColor Yellow
    Write-Host "Check status at: https://dashboard.render.com" -ForegroundColor White
}

# Return to development branch
Write-Host ""
Write-Host "Returning to development branch..." -ForegroundColor Gray
git checkout development