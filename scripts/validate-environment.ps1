# Environment Variable Validation Script
# Validates all required environment variables for MCP integration

param(
    [string]$Environment = "development",
    [switch]$Fix = $false,
    [switch]$GenerateSecrets = $false
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   MCP Environment Variable Validation" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Define required variables by category
$requiredVariables = @{
    "Core" = @(
        "NODE_ENV",
        "DATABASE_URL",
        "PORT"
    )
    "Authentication" = @(
        "VITE_CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
        "SESSION_SECRET",
        "JWT_SECRET"
    )
    "MCP Integration" = @(
        "MCP_SERVER_URL",
        "MCP_SERVER_SERVICE_ID",
        "MCP_JWT_SECRET"
    )
    "External APIs" = @(
        "XERO_CLIENT_ID",
        "XERO_CLIENT_SECRET",
        "SHOPIFY_API_KEY",
        "SHOPIFY_API_SECRET",
        "AMAZON_SP_API_KEY",
        "AMAZON_SP_API_SECRET"
    )
    "Optional Services" = @(
        "UNLEASHED_API_ID",
        "UNLEASHED_API_KEY",
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "REDIS_URL",
        "SENTRY_DSN"
    )
    "Auto-Sync Configuration" = @(
        "AUTO_SYNC_ENABLED",
        "XERO_SYNC_INTERVAL",
        "SHOPIFY_SYNC_INTERVAL",
        "AMAZON_SYNC_INTERVAL",
        "DATABASE_SYNC_INTERVAL"
    )
}

# Environment-specific defaults
$environmentDefaults = @{
    "development" = @{
        "NODE_ENV" = "development"
        "PORT" = "5000"
        "MCP_SERVER_URL" = "https://web-production-99691282.up.railway.app"
        "MCP_SERVER_SERVICE_ID" = "99691282-de66-45b2-98cf-317083dd11ba"
        "AUTO_SYNC_ENABLED" = "false"
        "XERO_SYNC_INTERVAL" = "*/30 * * * *"
        "SHOPIFY_SYNC_INTERVAL" = "*/15 * * * *"
        "AMAZON_SYNC_INTERVAL" = "*/60 * * * *"
        "DATABASE_SYNC_INTERVAL" = "0 */6 * * *"
    }
    "testing" = @{
        "NODE_ENV" = "test"
        "PORT" = "5000"
        "MCP_SERVER_URL" = "https://web-production-99691282.up.railway.app"
        "MCP_SERVER_SERVICE_ID" = "99691282-de66-45b2-98cf-317083dd11ba"
        "AUTO_SYNC_ENABLED" = "false"
    }
    "production" = @{
        "NODE_ENV" = "production"
        "PORT" = "5000"
        "MCP_SERVER_URL" = "https://web-production-99691282.up.railway.app"
        "MCP_SERVER_SERVICE_ID" = "99691282-de66-45b2-98cf-317083dd11ba"
        "AUTO_SYNC_ENABLED" = "true"
        "XERO_SYNC_INTERVAL" = "*/30 * * * *"
        "SHOPIFY_SYNC_INTERVAL" = "*/15 * * * *"
        "AMAZON_SYNC_INTERVAL" = "*/60 * * * *"
        "DATABASE_SYNC_INTERVAL" = "0 */6 * * *"
    }
}

# Function to generate secure random secret
function Generate-Secret {
    param([int]$Length = 32)

    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    return $secret
}

# Function to check if variable exists
function Test-EnvVariable {
    param([string]$Name)

    $value = [System.Environment]::GetEnvironmentVariable($Name)
    return -not [string]::IsNullOrWhiteSpace($value)
}

# Function to get variable value
function Get-EnvVariable {
    param([string]$Name)

    return [System.Environment]::GetEnvironmentVariable($Name)
}

# Load environment file if exists
$envFile = ".env.$Environment.railway"
if (-not (Test-Path $envFile)) {
    $envFile = ".env"
}

if (Test-Path $envFile) {
    Write-Host "Loading environment from: $envFile" -ForegroundColor Gray
    $envContent = Get-Content $envFile
    foreach ($line in $envContent) {
        if ($line -match '^\s*([^#=]+)\s*=\s*(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if (-not (Test-EnvVariable $key)) {
                [System.Environment]::SetEnvironmentVariable($key, $value)
            }
        }
    }
}

Write-Host ""
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray
Write-Host ""

# Track validation results
$missingRequired = @()
$missingOptional = @()
$totalChecked = 0
$totalFound = 0

# Validate each category
foreach ($category in $requiredVariables.Keys) {
    Write-Host "$category Variables:" -ForegroundColor Cyan

    $isOptional = $category -eq "Optional Services"

    foreach ($var in $requiredVariables[$category]) {
        $totalChecked++
        $exists = Test-EnvVariable $var

        if ($exists) {
            $totalFound++
            $value = Get-EnvVariable $var

            # Mask sensitive values
            if ($var -like "*SECRET*" -or $var -like "*KEY*" -or $var -like "*PASSWORD*" -or $var -like "*TOKEN*") {
                if ($value.Length -gt 8) {
                    $maskedValue = $value.Substring(0, 4) + "****" + $value.Substring($value.Length - 4)
                } else {
                    $maskedValue = "****"
                }
            } else {
                $maskedValue = $value
            }

            Write-Host "  [OK] $var = $maskedValue" -ForegroundColor Green
        } else {
            if ($isOptional) {
                Write-Host "  [--] $var (optional)" -ForegroundColor Gray
                $missingOptional += $var
            } else {
                Write-Host "  [!!] $var - MISSING" -ForegroundColor Red
                $missingRequired += $var
            }
        }
    }
    Write-Host ""
}

# Summary
Write-Host "================================================" -ForegroundColor Gray
Write-Host "Validation Summary" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Gray
Write-Host ""
Write-Host "Total Variables Checked: $totalChecked" -ForegroundColor White
Write-Host "Variables Found: $totalFound" -ForegroundColor Green
Write-Host "Required Missing: $($missingRequired.Count)" -ForegroundColor $(if ($missingRequired.Count -gt 0) { "Red" } else { "Green" })
Write-Host "Optional Missing: $($missingOptional.Count)" -ForegroundColor Gray
Write-Host ""

# Generate fixes if requested
if ($Fix -and $missingRequired.Count -gt 0) {
    Write-Host "Generating fixes for missing variables..." -ForegroundColor Yellow
    Write-Host ""

    $envOutput = @()

    foreach ($var in $missingRequired) {
        # Check if we have a default value
        if ($environmentDefaults[$Environment].ContainsKey($var)) {
            $value = $environmentDefaults[$Environment][$var]
            Write-Host "  Setting $var = $value (default)" -ForegroundColor Gray
            $envOutput += "$var=$value"
        }
        # Generate secrets if requested
        elseif ($GenerateSecrets -and ($var -like "*SECRET*" -or $var -like "*JWT*")) {
            $value = Generate-Secret
            Write-Host "  Generating $var = [generated secret]" -ForegroundColor Gray
            $envOutput += "$var=$value"
        }
        else {
            Write-Host "  $var = [NEEDS MANUAL CONFIGURATION]" -ForegroundColor Yellow
            $envOutput += "# $var=YOUR_VALUE_HERE"
        }
    }

    # Save to file
    $outputFile = ".env.$Environment.generated"
    $envOutput | Out-File -FilePath $outputFile -Encoding UTF8
    Write-Host ""
    Write-Host "Generated configuration saved to: $outputFile" -ForegroundColor Green
    Write-Host "Review and copy needed values to your .env file" -ForegroundColor Yellow
}

# Railway-specific validation
if ($Environment -ne "local") {
    Write-Host ""
    Write-Host "Railway Configuration Check:" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Gray

    try {
        $railwayStatus = & railway status 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Railway CLI connected" -ForegroundColor Green

            # Check if variables are set in Railway
            Write-Host ""
            Write-Host "  Checking Railway variables..." -ForegroundColor Gray

            $railwayVars = & railway variables 2>&1
            $mcpConfigured = $railwayVars | Select-String "MCP_SERVER"

            if ($mcpConfigured) {
                Write-Host "  [OK] MCP variables configured in Railway" -ForegroundColor Green
            } else {
                Write-Host "  [!!] MCP variables not found in Railway" -ForegroundColor Red
                Write-Host "       Run: railway variables set MCP_SERVER_URL=..." -ForegroundColor Yellow
            }
        } else {
            Write-Host "  [!!] Railway CLI not connected" -ForegroundColor Red
            Write-Host "       Run: railway link" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  [!!] Railway CLI not installed" -ForegroundColor Red
        Write-Host "       Install: npm install -g @railway/cli" -ForegroundColor Yellow
    }
}

# Exit code based on validation
if ($missingRequired.Count -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: All required variables are configured!" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host ""
    Write-Host "FAILURE: Missing $($missingRequired.Count) required variables" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix:" -ForegroundColor Yellow
    Write-Host "  1. Run with -Fix flag to generate defaults" -ForegroundColor Gray
    Write-Host "  2. Run with -GenerateSecrets to create secure secrets" -ForegroundColor Gray
    Write-Host "  3. Configure API keys manually in .env file" -ForegroundColor Gray
    Write-Host ""
    exit 1
}