# Configure API Keys for Railway Production Environment
# This script helps set up all required API keys for production

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "testing", "production")]
    [string]$Environment,

    [Parameter()]
    [switch]$CheckOnly
)

# Service IDs for Railway
$ServiceIds = @{
    development = "e985e174-ebed-4043-81f8-7b1ab2e86cd2"
    testing = "92f7cd2f-3dc7-44f4-abd9-1714003c389f"
    production = "9fd67b0e-7883-4973-85a5-639d9513d343"
}

$ServiceId = $ServiceIds[$Environment]

Write-Host "=========================================" -ForegroundColor Blue
Write-Host "API Key Configuration for $Environment" -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Blue
Write-Host "Service ID: $ServiceId" -ForegroundColor Cyan
Write-Host ""

# Required API Keys
$RequiredKeys = @{
    # Authentication
    "VITE_CLERK_PUBLISHABLE_KEY" = @{
        Description = "Clerk public key for authentication"
        Example = "pk_live_..."
        Required = $true
        Sensitive = $false
    }
    "CLERK_SECRET_KEY" = @{
        Description = "Clerk secret key for backend"
        Example = "sk_live_..."
        Required = $true
        Sensitive = $true
    }

    # Database
    "DATABASE_URL" = @{
        Description = "Neon PostgreSQL connection string"
        Example = "postgresql://user:pass@host/database?sslmode=require"
        Required = $true
        Sensitive = $true
    }

    # Xero Integration
    "XERO_CLIENT_ID" = @{
        Description = "Xero OAuth2 Client ID"
        Example = "ABCDEF1234567890"
        Required = $true
        Sensitive = $false
    }
    "XERO_CLIENT_SECRET" = @{
        Description = "Xero OAuth2 Client Secret"
        Example = "xero_secret_key_here"
        Required = $true
        Sensitive = $true
    }
    "XERO_TENANT_ID" = @{
        Description = "Xero Organization Tenant ID"
        Example = "abc-123-def-456"
        Required = $true
        Sensitive = $false
    }

    # Shopify Integration
    "SHOPIFY_API_KEY" = @{
        Description = "Shopify API Key"
        Example = "shppa_1234567890"
        Required = $true
        Sensitive = $false
    }
    "SHOPIFY_API_SECRET" = @{
        Description = "Shopify API Secret"
        Example = "shpss_abcdef123456"
        Required = $true
        Sensitive = $true
    }
    "SHOPIFY_STORE_DOMAIN" = @{
        Description = "Shopify store domain"
        Example = "yourstore.myshopify.com"
        Required = $true
        Sensitive = $false
    }
    "SHOPIFY_ACCESS_TOKEN" = @{
        Description = "Shopify Access Token"
        Example = "shpat_1234567890"
        Required = $true
        Sensitive = $true
    }

    # Amazon SP-API
    "AMAZON_SP_API_KEY" = @{
        Description = "Amazon Selling Partner API Key"
        Example = "AKIA..."
        Required = $false
        Sensitive = $false
    }
    "AMAZON_SP_API_SECRET" = @{
        Description = "Amazon SP-API Secret"
        Example = "aws_secret_key"
        Required = $false
        Sensitive = $true
    }

    # AI Services
    "OPENAI_API_KEY" = @{
        Description = "OpenAI API Key for GPT-4"
        Example = "sk-..."
        Required = $false
        Sensitive = $true
    }
    "ANTHROPIC_API_KEY" = @{
        Description = "Anthropic API Key for Claude"
        Example = "sk-ant-..."
        Required = $false
        Sensitive = $true
    }

    # Security
    "SESSION_SECRET" = @{
        Description = "Session encryption secret (generate random 64+ chars)"
        Example = "GENERATE_RANDOM_64_CHAR_STRING"
        Required = $true
        Sensitive = $true
    }
    "JWT_SECRET" = @{
        Description = "JWT signing secret (generate random 64+ chars)"
        Example = "GENERATE_RANDOM_64_CHAR_STRING"
        Required = $true
        Sensitive = $true
    }
    "MCP_JWT_SECRET" = @{
        Description = "MCP Server JWT secret"
        Example = "mcp_secret_key"
        Required = $true
        Sensitive = $true
    }
}

# Function to generate random secret
function New-RandomSecret {
    param([int]$Length = 64)

    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    $secret = ""
    $random = New-Object System.Random

    for ($i = 0; $i -lt $Length; $i++) {
        $secret += $chars[$random.Next($chars.Length)]
    }

    return $secret
}

# Function to check if key is set
function Test-ApiKey {
    param(
        [string]$KeyName,
        [string]$ServiceId,
        [string]$Environment
    )

    try {
        $result = railway variables get $KeyName --service $ServiceId --environment $Environment 2>$null
        return $result -ne $null -and $result -ne ""
    }
    catch {
        return $false
    }
}

# Function to set API key
function Set-ApiKey {
    param(
        [string]$KeyName,
        [string]$Value,
        [string]$ServiceId,
        [string]$Environment
    )

    try {
        railway variables set "$KeyName=$Value" --service $ServiceId --environment $Environment
        return $true
    }
    catch {
        Write-Host "  Failed to set $KeyName" -ForegroundColor Red
        return $false
    }
}

if ($CheckOnly) {
    Write-Host "Checking API Key Configuration..." -ForegroundColor Yellow
    Write-Host ""

    $missingRequired = @()
    $missingOptional = @()

    foreach ($key in $RequiredKeys.Keys) {
        $keyInfo = $RequiredKeys[$key]
        $isSet = Test-ApiKey -KeyName $key -ServiceId $ServiceId -Environment $Environment

        if ($isSet) {
            Write-Host "[✓] $key" -ForegroundColor Green
        }
        else {
            if ($keyInfo.Required) {
                Write-Host "[✗] $key (REQUIRED)" -ForegroundColor Red
                Write-Host "    $($keyInfo.Description)" -ForegroundColor Gray
                $missingRequired += $key
            }
            else {
                Write-Host "[○] $key (optional)" -ForegroundColor Yellow
                Write-Host "    $($keyInfo.Description)" -ForegroundColor Gray
                $missingOptional += $key
            }
        }
    }

    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host "Summary" -ForegroundColor Blue
    Write-Host "=========================================" -ForegroundColor Blue

    if ($missingRequired.Count -eq 0) {
        Write-Host "✓ All required API keys are configured!" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Missing $($missingRequired.Count) required keys:" -ForegroundColor Red
        foreach ($key in $missingRequired) {
            Write-Host "  - $key" -ForegroundColor Red
        }
    }

    if ($missingOptional.Count -gt 0) {
        Write-Host "○ Missing $($missingOptional.Count) optional keys" -ForegroundColor Yellow
    }
}
else {
    Write-Host "Interactive API Key Configuration" -ForegroundColor Yellow
    Write-Host "Press Enter to skip optional keys" -ForegroundColor Gray
    Write-Host ""

    $updates = @{}

    foreach ($key in $RequiredKeys.Keys) {
        $keyInfo = $RequiredKeys[$key]
        $isSet = Test-ApiKey -KeyName $key -ServiceId $ServiceId -Environment $Environment

        if ($isSet) {
            Write-Host "[✓] $key already configured" -ForegroundColor Green
            $update = Read-Host "  Update? (y/N)"

            if ($update -eq 'y' -or $update -eq 'Y') {
                $isSet = $false
            }
        }

        if (-not $isSet) {
            Write-Host ""
            Write-Host "$key" -ForegroundColor Cyan
            Write-Host "  $($keyInfo.Description)" -ForegroundColor Gray
            Write-Host "  Example: $($keyInfo.Example)" -ForegroundColor DarkGray

            # Auto-generate secrets
            if ($key -in @("SESSION_SECRET", "JWT_SECRET", "MCP_JWT_SECRET")) {
                $generate = Read-Host "  Generate random secret? (Y/n)"

                if ($generate -ne 'n' -and $generate -ne 'N') {
                    $value = New-RandomSecret -Length 64
                    Write-Host "  Generated: $($value.Substring(0, 20))..." -ForegroundColor Green
                    $updates[$key] = $value
                    continue
                }
            }

            if ($keyInfo.Sensitive) {
                $value = Read-Host "  Enter value" -AsSecureString
                $value = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($value))
            }
            else {
                $value = Read-Host "  Enter value"
            }

            if ($value -and $value -ne "") {
                $updates[$key] = $value
            }
            elseif ($keyInfo.Required) {
                Write-Host "  Warning: Required key not set!" -ForegroundColor Red
            }
        }
    }

    if ($updates.Count -gt 0) {
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Blue
        Write-Host "Applying Configuration" -ForegroundColor Blue
        Write-Host "=========================================" -ForegroundColor Blue

        $success = 0
        $failed = 0

        foreach ($key in $updates.Keys) {
            Write-Host "Setting $key..." -ForegroundColor Yellow -NoNewline

            if (Set-ApiKey -KeyName $key -Value $updates[$key] -ServiceId $ServiceId -Environment $Environment) {
                Write-Host " ✓" -ForegroundColor Green
                $success++
            }
            else {
                Write-Host " ✗" -ForegroundColor Red
                $failed++
            }
        }

        Write-Host ""
        Write-Host "Configuration complete!" -ForegroundColor Green
        Write-Host "  Success: $success" -ForegroundColor Green
        if ($failed -gt 0) {
            Write-Host "  Failed: $failed" -ForegroundColor Red
        }

        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Restart the service to apply changes:" -ForegroundColor Gray
        Write-Host "   railway restart --service $ServiceId --environment $Environment" -ForegroundColor Cyan
        Write-Host "2. Verify configuration:" -ForegroundColor Gray
        Write-Host "   .\scripts\test-mcp-integration.ps1 -Environment $Environment" -ForegroundColor Cyan
    }
    else {
        Write-Host ""
        Write-Host "No changes made." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Blue
Write-Host "Railway Dashboard Links" -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Blue
Write-Host "Project: https://railway.app/project/6d1ca9b2-75e2-46c6-86a8-ed05161112fe" -ForegroundColor Gray
Write-Host "Service: https://railway.app/project/6d1ca9b2-75e2-46c6-86a8-ed05161112fe/service/$ServiceId" -ForegroundColor Gray
Write-Host "Variables: https://railway.app/project/6d1ca9b2-75e2-46c6-86a8-ed05161112fe/service/$ServiceId/variables" -ForegroundColor Gray