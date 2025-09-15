# Sentia Manufacturing Dashboard - Railway Deployment Script (PowerShell)
# Usage: .\deploy-railway.ps1 [development|testing|production]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "dev", "testing", "test", "production", "prod", "all")]
    [string]$Environment
)

# Railway Project Configuration
$PROJECT_ID = "6d1ca9b2-75e2-46c6-86a8-ed05161112fe"
$DEV_SERVICE_ID = "e985e174-ebed-4043-81f8-7b1ab2e86cd2"
$TEST_SERVICE_ID = "92f7cd2f-3dc7-44f4-abd9-1714003c389f"
$PROD_SERVICE_ID = "9fd67b0e-7883-4973-85a5-639d9513d343"

# Function to print colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to check if Railway CLI is installed
function Test-RailwayCLI {
    try {
        $null = Get-Command railway -ErrorAction Stop
        Write-ColorOutput "Railway CLI is installed" -Color Green
        return $true
    }
    catch {
        Write-ColorOutput "Railway CLI is not installed!" -Color Red
        Write-ColorOutput "Installing Railway CLI..." -Color Yellow
        npm install -g @railway/cli
        return $false
    }
}

# Function to load and set environment variables
function Set-RailwayVariables {
    param(
        [string]$ServiceId,
        [string]$Environment,
        [string]$EnvFile
    )

    if (Test-Path $EnvFile) {
        Write-ColorOutput "Loading environment variables from $EnvFile" -Color Green

        $envContent = Get-Content $EnvFile
        foreach ($line in $envContent) {
            # Skip comments and empty lines
            if ($line -match '^\s*#' -or [string]::IsNullOrWhiteSpace($line)) {
                continue
            }

            # Parse key=value pairs
            if ($line -match '^([^=]+)=(.*)$') {
                $key = $Matches[1].Trim()
                $value = $Matches[2].Trim()

                # Remove quotes from value
                $value = $value.Trim('"', "'")

                # Skip template variables
                if ($value -notmatch '\$\{\{.*\}\}') {
                    try {
                        # Set the environment variable in Railway
                        railway variables set "${key}=${value}" --service $ServiceId --environment $Environment 2>$null
                    }
                    catch {
                        # Silently continue on error
                    }
                }
            }
        }
    }
    else {
        Write-ColorOutput "Warning: Environment file $EnvFile not found" -Color Yellow
    }
}

# Function to deploy to specific environment
function Deploy-Environment {
    param(
        [string]$EnvName,
        [string]$ServiceId,
        [string]$Branch,
        [string]$Domain,
        [string]$EnvFile
    )

    Write-ColorOutput "`n=========================================" -Color Blue
    Write-ColorOutput "Deploying to $EnvName Environment" -Color Blue
    Write-ColorOutput "=========================================" -Color Blue

    # Check if on correct branch
    $currentBranch = git rev-parse --abbrev-ref HEAD
    if ($currentBranch -ne $Branch) {
        Write-ColorOutput "Switching to $Branch branch..." -Color Yellow
        git checkout $Branch
        git pull origin $Branch
    }

    # Set environment variables
    Set-RailwayVariables -ServiceId $ServiceId -Environment $EnvName -EnvFile $EnvFile

    # Deploy to Railway
    Write-ColorOutput "Deploying to Railway..." -Color Green
    railway up --service $ServiceId --environment $EnvName --detach

    # Get deployment status
    Write-ColorOutput "Deployment initiated for $EnvName" -Color Green
    Write-ColorOutput "URL: https://$Domain" -Color Blue

    # Wait for deployment to complete
    Write-ColorOutput "Waiting for deployment to complete..." -Color Yellow
    Start-Sleep -Seconds 10

    # Check deployment health
    Write-ColorOutput "Checking deployment health..." -Color Green
    $healthCheckUrl = "https://$Domain/api/health"

    for ($i = 1; $i -le 30; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $healthCheckUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-ColorOutput "Deployment successful! Health check passed." -Color Green
                break
            }
        }
        catch {
            if ($i -eq 30) {
                Write-ColorOutput "Health check timeout. Please check deployment manually." -Color Yellow
            }
            else {
                Write-Host "." -NoNewline
                Start-Sleep -Seconds 5
            }
        }
    }
    Write-Host ""
}

# Main deployment logic
function Main {
    # Check Railway CLI
    Test-RailwayCLI | Out-Null

    # Check if logged in to Railway
    try {
        $null = railway whoami 2>$null
    }
    catch {
        Write-ColorOutput "Please login to Railway:" -Color Yellow
        railway login
    }

    # Link to project
    Write-ColorOutput "Linking to Railway project..." -Color Green
    railway link $PROJECT_ID

    # Deploy based on environment
    switch ($Environment) {
        { $_ -in "development", "dev" } {
            Deploy-Environment -EnvName "development" `
                -ServiceId $DEV_SERVICE_ID `
                -Branch "development" `
                -Domain "sentia-manufacturing-development.up.railway.app" `
                -EnvFile ".env.development.railway"
        }
        { $_ -in "testing", "test" } {
            Deploy-Environment -EnvName "testing" `
                -ServiceId $TEST_SERVICE_ID `
                -Branch "test" `
                -Domain "sentia-manufacturing-testing.up.railway.app" `
                -EnvFile ".env.testing.railway"
        }
        { $_ -in "production", "prod" } {
            # Add confirmation for production deployment
            Write-ColorOutput "WARNING: You are about to deploy to PRODUCTION!" -Color Yellow
            $confirm = Read-Host "Are you sure? (yes/no)"
            if ($confirm -ne "yes") {
                Write-ColorOutput "Production deployment cancelled." -Color Red
                exit 0
            }
            Deploy-Environment -EnvName "production" `
                -ServiceId $PROD_SERVICE_ID `
                -Branch "production" `
                -Domain "sentia-manufacturing-production.up.railway.app" `
                -EnvFile ".env.production.railway"
        }
        "all" {
            # Deploy to all environments
            Write-ColorOutput "Deploying to all environments..." -Color Blue

            Deploy-Environment -EnvName "development" `
                -ServiceId $DEV_SERVICE_ID `
                -Branch "development" `
                -Domain "sentia-manufacturing-development.up.railway.app" `
                -EnvFile ".env.development.railway"

            Deploy-Environment -EnvName "testing" `
                -ServiceId $TEST_SERVICE_ID `
                -Branch "test" `
                -Domain "sentia-manufacturing-testing.up.railway.app" `
                -EnvFile ".env.testing.railway"

            Write-ColorOutput "Skip production deployment in 'all' mode for safety." -Color Yellow
            Write-ColorOutput "Run '.\deploy-railway.ps1 production' separately for production deployment." -Color Yellow
        }
    }

    Write-ColorOutput "`n=========================================" -Color Green
    Write-ColorOutput "Deployment Complete!" -Color Green
    Write-ColorOutput "=========================================" -Color Green
}

# Run main function
Main