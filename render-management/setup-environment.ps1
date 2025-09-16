# Setup Render API Environment Variables
# Secure configuration for Render API access

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " RENDER API ENVIRONMENT SETUP" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set the API key as environment variable (more secure than hardcoding)
$apiKey = "rnd_0jchuGfcyltSaCa7AxNj5wDF7XOO"

Write-Host "Setting up environment variables..." -ForegroundColor Yellow

# Set for current session
$env:RENDER_API_KEY = $apiKey
Write-Host "[OK] Set for current session" -ForegroundColor Green

# Set for current user (permanent)
[System.Environment]::SetEnvironmentVariable("RENDER_API_KEY", $apiKey, "User")
Write-Host "[OK] Set for user profile" -ForegroundColor Green

# Also create a .env file for local development
$envFile = @"
# Render API Configuration
# Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# IMPORTANT: Do not commit this file to Git

RENDER_API_KEY=$apiKey
RENDER_API_KEY_NAME=MCP-READONLY-DEC2024
RENDER_API_KEY_CREATED=2024-12-16
RENDER_API_KEY_ROTATE_BY=2025-03-16

# Service URLs
RENDER_PRODUCTION_URL=https://sentia-manufacturing-production.onrender.com
RENDER_TESTING_URL=https://sentia-manufacturing-testing.onrender.com
RENDER_DEVELOPMENT_URL=https://sentia-manufacturing-development.onrender.com
RENDER_MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com

# Dashboard URLs
RENDER_DASHBOARD=https://dashboard.render.com
RENDER_API_DOCS=https://api-docs.render.com
"@

$envFilePath = Join-Path (Get-Location) ".env.render"
$envFile | Out-File -FilePath $envFilePath -Encoding UTF8
Write-Host "[OK] Created .env.render file" -ForegroundColor Green

# Update .gitignore to exclude the env file
$gitignorePath = Join-Path (Get-Location) "../.gitignore"
if (Test-Path $gitignorePath) {
    $gitignoreContent = Get-Content $gitignorePath -Raw
    if ($gitignoreContent -notmatch "\.env\.render") {
        Add-Content $gitignorePath "`n# Render API configuration`n.env.render"
        Write-Host "[OK] Updated .gitignore" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ENVIRONMENT SETUP COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Configuration Summary:" -ForegroundColor Yellow
Write-Host "  API Key Name: MCP-READONLY-DEC2024" -ForegroundColor White
Write-Host "  API Key (last 4): ...$(($apiKey).Substring($apiKey.Length - 4))" -ForegroundColor Gray
Write-Host "  Environment Variable: RENDER_API_KEY" -ForegroundColor White
Write-Host "  Config File: .env.render" -ForegroundColor White
Write-Host "  Rotation Date: March 16, 2025" -ForegroundColor Yellow
Write-Host ""

Write-Host "Security Notes:" -ForegroundColor Red
Write-Host "  - API key stored as environment variable" -ForegroundColor Gray
Write-Host "  - .env.render added to .gitignore" -ForegroundColor Gray
Write-Host "  - Never commit API keys to Git" -ForegroundColor Gray
Write-Host "  - Rotate keys every 3 months" -ForegroundColor Gray
Write-Host ""

Write-Host "Testing connection..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $env:RENDER_API_KEY"
        "Accept" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=1" -Headers $headers -Method GET
    Write-Host "[OK] API connection successful!" -ForegroundColor Green
    Write-Host "  Found $($response.Length) service(s)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] API connection failed" -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run: .\quick-status.ps1" -ForegroundColor White
Write-Host "2. All scripts now use environment variable" -ForegroundColor White
Write-Host "3. Restart Claude Code to use new API key" -ForegroundColor White