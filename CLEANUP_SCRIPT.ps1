# Enterprise Codebase Cleanup Script
# Removes all Railway and Neon artifacts
# Creates backup before deletion

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "ENTERPRISE CODEBASE CLEANUP" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Create backup directory
$backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "Creating backup in $backupDir..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Railway files to remove (38 files)
$railwayFiles = @(
    # Configuration files
    "railway.toml",
    "railway.json",
    "mcp-server/railway.toml",
    "mcp-server/railway.json",
    "config/production/railway.production.toml",

    # Scripts
    "deploy-railway.bat",
    "deploy-railway.sh",
    "deploy-railway.ps1",
    "scripts/deploy-to-railway.ps1",
    "scripts/deploy-mcp-railway.ps1",
    "scripts/configure-railway-dev.ps1",
    "scripts/monitor-railway-health.ps1",
    "scripts/set-railway-variables.ps1",
    "scripts/set-railway-vars-batch.ps1",
    "scripts/test-railway-config.ps1",
    "scripts/test-railway.sh",
    "scripts/verify-railway-deployment.ps1",
    "scripts/auto-fix-railway.js",
    "scripts/fix-railway-env.js",
    "validate-railway-deployment.js",

    # Services
    "services/railwayMCPService.js",
    "tests/autonomous/railway-mcp-health-tests.js",

    # Documentation
    "fix-railway-env.md",
    "migrate-from-railway.md",
    "context/deployment-configs/railway-deployment-guide.md",
    "context/deployment-configs/railway_configuration.md",
    "context/deployment-configs/railway_setup.md",
    "mcp-server/RAILWAY_DEPLOYMENT_FIX.md",
    "mcp-server/RAILWAY_ENV_VARIABLES.md",
    "CRITICAL_RAILWAY_ISSUE_ANALYSIS.md",
    "DEFINITIVE_RAILWAY_FAILURE_PROOF.md",
    "DETAILED_RAILWAY_DEPLOYMENT_INSTRUCTIONS.md"
)

# Railway pattern files
$railwayPatterns = @(
    "RAILWAY_*.txt",
    "RAILWAY_*.md",
    "mcp-server/RAILWAY_*.txt",
    "mcp-server/RAILWAY_*.md"
)

# Neon files to remove (6 files)
$neonFiles = @(
    "services/database/neonConnection.js",
    "services/database/neonConfig.js",
    "tests/database/neonConfig.test.js",
    "neon-scripts.cjs",
    "scripts/migrate-neon-to-render.sh",
    "scripts/migrate-neon-to-render.bat"
)

# Obsolete files to remove
$obsoletePatterns = @(
    "*TRUTHFUL_VERIFICATION*",
    "*URGENT_FIX*",
    "*CRITICAL_SETUP*",
    "*EMERGENCY*",
    "*TEMPORARY*",
    "*OLD_*",
    "*BACKUP_*",
    "*_old.*",
    "*_backup.*"
)

# Remove railway-self-healing-service folder
$railwayFolder = "railway-self-healing-service"

Write-Host ""
Write-Host "Files to be removed:" -ForegroundColor Red
Write-Host "===================" -ForegroundColor Red

$totalFiles = 0

# Process Railway files
Write-Host "`n[Railway Files]" -ForegroundColor Yellow
foreach ($file in $railwayFiles) {
    if (Test-Path $file) {
        Write-Host "  - $file" -ForegroundColor Gray
        Copy-Item $file "$backupDir\" -Force -ErrorAction SilentlyContinue
        $totalFiles++
    }
}

# Process Railway pattern files
foreach ($pattern in $railwayPatterns) {
    $files = Get-ChildItem -Path . -Filter $pattern -Recurse -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Write-Host "  - $($file.FullName)" -ForegroundColor Gray
        Copy-Item $file.FullName "$backupDir\" -Force -ErrorAction SilentlyContinue
        $totalFiles++
    }
}

# Process Railway folder
if (Test-Path $railwayFolder) {
    Write-Host "  - $railwayFolder/ (entire folder)" -ForegroundColor Gray
    Copy-Item $railwayFolder "$backupDir\" -Recurse -Force -ErrorAction SilentlyContinue
    $totalFiles++
}

# Process Neon files
Write-Host "`n[Neon Files]" -ForegroundColor Yellow
foreach ($file in $neonFiles) {
    if (Test-Path $file) {
        Write-Host "  - $file" -ForegroundColor Gray
        Copy-Item $file "$backupDir\" -Force -ErrorAction SilentlyContinue
        $totalFiles++
    }
}

# Process obsolete files
Write-Host "`n[Obsolete Files]" -ForegroundColor Yellow
foreach ($pattern in $obsoletePatterns) {
    $files = Get-ChildItem -Path . -Filter $pattern -Recurse -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        if ($file.FullName -notlike "*$backupDir*") {
            Write-Host "  - $($file.Name)" -ForegroundColor Gray
            Copy-Item $file.FullName "$backupDir\" -Force -ErrorAction SilentlyContinue
            $totalFiles++
        }
    }
}

Write-Host ""
Write-Host "Total files to remove: $totalFiles" -ForegroundColor Red
Write-Host ""

# Confirm deletion
$confirm = Read-Host "Do you want to proceed with deletion? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Cleanup cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Removing files..." -ForegroundColor Red

# Delete Railway files
foreach ($file in $railwayFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force -ErrorAction SilentlyContinue
        Write-Host "Removed: $file" -ForegroundColor Green
    }
}

# Delete Railway pattern files
foreach ($pattern in $railwayPatterns) {
    $files = Get-ChildItem -Path . -Filter $pattern -Recurse -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
        Write-Host "Removed: $($file.Name)" -ForegroundColor Green
    }
}

# Delete Railway folder
if (Test-Path $railwayFolder) {
    Remove-Item $railwayFolder -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Removed: $railwayFolder/" -ForegroundColor Green
}

# Delete Neon files
foreach ($file in $neonFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force -ErrorAction SilentlyContinue
        Write-Host "Removed: $file" -ForegroundColor Green
    }
}

# Delete obsolete files
foreach ($pattern in $obsoletePatterns) {
    $files = Get-ChildItem -Path . -Filter $pattern -Recurse -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        if ($file.FullName -notlike "*$backupDir*") {
            Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
            Write-Host "Removed: $($file.Name)" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup created in: $backupDir" -ForegroundColor Cyan
Write-Host "Railway/Neon artifacts removed: $totalFiles files" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run 'git status' to review changes" -ForegroundColor White
Write-Host "2. Commit the cleanup: git commit -m 'chore: Remove Railway/Neon artifacts'" -ForegroundColor White
Write-Host "3. Continue with enterprise implementation plan" -ForegroundColor White