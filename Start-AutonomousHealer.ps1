# SENTIA AUTONOMOUS 24/7 SELF-HEALING SYSTEM
# PowerShell Launcher Script
# Version 4.0

# Set error action preference
$ErrorActionPreference = "Continue"

# Display banner
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "       SENTIA AUTONOMOUS 24/7 SELF-HEALING SYSTEM" -ForegroundColor Green
Write-Host "                     Version 4.0" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "    [ACTIVATING AUTONOMOUS REPAIR MODE]" -ForegroundColor Yellow
Write-Host ""
Write-Host "    Features:" -ForegroundColor White
Write-Host "    - Automatic 502 Bad Gateway recovery" -ForegroundColor Gray
Write-Host "    - Database connection auto-repair" -ForegroundColor Gray
Write-Host "    - Environment variable injection" -ForegroundColor Gray
Write-Host "    - Intelligent error pattern learning" -ForegroundColor Gray
Write-Host "    - Automatic build and deployment" -ForegroundColor Gray
Write-Host "    - 24/7 unattended operation" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:NODE_ENV = "production"
$env:AUTO_FIX_ENABLED = "true"
$env:AUTO_DEPLOY_ENABLED = "true"
$env:AUTO_RESTART_ENABLED = "true"
$env:ENABLE_LEARNING = "true"

# Render configuration
$env:RENDER_DEV_URL = "https://sentia-manufacturing-development.onrender.com"
$env:RENDER_TEST_URL = "https://sentia-manufacturing-testing.onrender.com"
$env:RENDER_PROD_URL = "https://sentia-manufacturing-production.onrender.com"
$env:MCP_SERVER_URL = "https://mcp-server-tkyu.onrender.com"

# Create logs directory
if (-not (Test-Path "logs\self-healing")) {
    New-Item -ItemType Directory -Path "logs\self-healing" -Force | Out-Null
}

# Function to start the healer
function Start-Healer {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Starting Autonomous Healer..." -ForegroundColor Green

    # Log startup
    Add-Content -Path "logs\self-healing\startup.log" -Value "[$timestamp] Starting Autonomous Healer..."

    try {
        # Start the Node.js process
        $process = Start-Process -FilePath "node" -ArgumentList "scripts/autonomous-24-7-healer.js" -PassThru -NoNewWindow -Wait

        # Check exit code
        if ($process.ExitCode -ne 0) {
            Write-Host "[WARNING] Healer exited with code: $($process.ExitCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "[ERROR] Failed to start healer: $_" -ForegroundColor Red
        Add-Content -Path "logs\self-healing\errors.log" -Value "[$timestamp] Error: $_"
    }
}

# Main loop with auto-restart
$restartCount = 0
$maxRestarts = 100  # Prevent infinite restart loops

while ($true) {
    Start-Healer

    $restartCount++

    if ($restartCount -ge $maxRestarts) {
        Write-Host "[CRITICAL] Maximum restart limit reached!" -ForegroundColor Red
        Write-Host "Manual intervention required." -ForegroundColor Red
        break
    }

    Write-Host ""
    Write-Host "[AUTO-RESTART] Healer stopped. Restart #$restartCount" -ForegroundColor Yellow
    Write-Host "Restarting in 10 seconds..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to abort" -ForegroundColor Gray
    Write-Host ""

    Start-Sleep -Seconds 10
}

Write-Host ""
Write-Host "Autonomous Healer has stopped." -ForegroundColor Red
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")