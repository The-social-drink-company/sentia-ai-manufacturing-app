# Setup Claude Code MCP Configuration
# This script configures Claude Code to use Render MCP Server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " CLAUDE CODE MCP CONFIGURATION SETUP" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Determine the correct path based on OS
$configPath = ""
$configFile = "claude_desktop_config.json"

if ($IsWindows -or $env:OS -match "Windows") {
    # Windows path
    $configPath = Join-Path $env:APPDATA "Claude"
    Write-Host "Detected OS: Windows" -ForegroundColor Green
} elseif ($IsMacOS -or $env:OS -match "Darwin") {
    # macOS path
    $configPath = "$HOME/Library/Application Support/Claude"
    Write-Host "Detected OS: macOS" -ForegroundColor Green
} else {
    # Linux path
    $configPath = "$HOME/.config/Claude"
    Write-Host "Detected OS: Linux" -ForegroundColor Green
}

Write-Host "Config path: $configPath" -ForegroundColor Gray
Write-Host ""

# Create directory if it doesn't exist
if (-not (Test-Path $configPath)) {
    Write-Host "Creating Claude config directory..." -ForegroundColor Yellow
    New-Item -Path $configPath -ItemType Directory -Force | Out-Null
    Write-Host "[OK] Directory created" -ForegroundColor Green
} else {
    Write-Host "[OK] Config directory exists" -ForegroundColor Green
}

# Full path to config file
$fullConfigPath = Join-Path $configPath $configFile

# Backup existing config if it exists
if (Test-Path $fullConfigPath) {
    $backupPath = "$fullConfigPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Write-Host "Backing up existing config to: $backupPath" -ForegroundColor Yellow
    Copy-Item $fullConfigPath $backupPath
    Write-Host "[OK] Backup created" -ForegroundColor Green
}

# Create the MCP configuration
$renderApiKey = if ($env:RENDER_API_KEY -and $env:RENDER_API_KEY.Trim() -ne '') { $env:RENDER_API_KEY } else { "rnd_0jchuGfcyltSaCa7AxNj5wDF7XOO" }

$config = @{
    mcpServers = @{
        render = @{
            command = "npx"
            args = @("-y", "@renderco/mcp-server-render")
            env = @{
                RENDER_API_KEY = $renderApiKey
            }
        }
    }
}

# Convert to JSON with proper formatting
$jsonConfig = $config | ConvertTo-Json -Depth 10

# Write the configuration file
Write-Host ""
Write-Host "Writing MCP configuration..." -ForegroundColor Yellow
$jsonConfig | Out-File -FilePath $fullConfigPath -Encoding UTF8
Write-Host "[OK] Configuration written to: $fullConfigPath" -ForegroundColor Green

# Display the configuration
Write-Host ""
Write-Host "Configuration content:" -ForegroundColor Yellow
Write-Host "----------------------" -ForegroundColor Gray
Get-Content $fullConfigPath
Write-Host "----------------------" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " CONFIGURATION COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. CLOSE Claude Code completely" -ForegroundColor White
Write-Host "2. Wait 5 seconds" -ForegroundColor White
Write-Host "3. REOPEN Claude Code" -ForegroundColor White
Write-Host "4. Test with: 'Using Render MCP, list all my services'" -ForegroundColor White
Write-Host ""
Write-Host "The MCP server will be automatically installed on first use." -ForegroundColor Gray
Write-Host "This may take a minute on the first run." -ForegroundColor Gray

Write-Host ""
Write-Host "Press Enter to close Claude Code and continue..." -ForegroundColor Yellow
Read-Host

# Try to close Claude Code
Write-Host "Attempting to close Claude Code..." -ForegroundColor Yellow
$claudeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*Claude*"}
if ($claudeProcesses) {
    $claudeProcesses | Stop-Process -Force
    Write-Host "[OK] Claude Code closed" -ForegroundColor Green
    Write-Host "Please wait 5 seconds, then reopen Claude Code" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Claude Code not running or couldn't be detected" -ForegroundColor Yellow
    Write-Host "Please manually close and reopen Claude Code" -ForegroundColor Yellow
}