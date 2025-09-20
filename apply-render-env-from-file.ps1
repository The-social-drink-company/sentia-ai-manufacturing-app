# Apply Render Environment Variables from .env File
# This script parses the provided .env file and applies all variables to Render

param(
    [string]$EnvFile = "C:\Users\User\OneDrive - Q&A ERP Solutions (Pty) Ltd (1)\185 - Working Capital Production SaaS App\Final implementation reports - fixes still needed\render-environment-variables-complete.env",
    [string]$ServiceId = "srv-ctg8hkpu0jms73ab8m00",
    [string]$ApiKey = ""
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "RENDER ENVIRONMENT VARIABLES UPDATER" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if file exists
if (!(Test-Path $EnvFile)) {
    Write-Host "ERROR: Environment file not found: $EnvFile" -ForegroundColor Red
    exit 1
}

# Get API key if not provided
if ($ApiKey -eq "") {
    $ApiKey = Read-Host -Prompt "Enter your Render API Key"
}

# API configuration
$API_BASE = "https://api.render.com/v1"
$headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Accept" = "application/json"
    "Content-Type" = "application/json"
}

Write-Host "Reading environment file..." -ForegroundColor Yellow
$envVars = @{}
$skippedLines = 0
$processedLines = 0

# Parse the .env file
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()

    # Skip comments and empty lines
    if ($line -eq "" -or $line.StartsWith("#")) {
        $skippedLines++
        return
    }

    # Parse KEY=VALUE format
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
        $processedLines++
    }
}

Write-Host "Found $processedLines environment variables to set" -ForegroundColor Green
Write-Host "Skipped $skippedLines comment/empty lines" -ForegroundColor Gray
Write-Host ""

# Test API connection first
Write-Host "Testing Render API connection..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-RestMethod -Uri "$API_BASE/services/$ServiceId" -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "SUCCESS: Connected to Render API" -ForegroundColor Green
    Write-Host "Service Name: $($testResponse.service.name)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "ERROR: Failed to connect to Render API" -ForegroundColor Red
    Write-Host "Details: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. Your API key is correct" -ForegroundColor Yellow
    Write-Host "2. Service ID is correct: $ServiceId" -ForegroundColor Yellow
    exit 1
}

# Update environment variables
Write-Host "Updating environment variables..." -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host ""

$successCount = 0
$failCount = 0
$errors = @()

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]

    Write-Host -NoNewline "Setting $key... "

    $body = @{
        key = $key
        value = $value
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$API_BASE/services/$ServiceId/env-vars" -Method PUT -Headers $headers -Body $body -ErrorAction Stop
        Write-Host "OK" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "FAILED" -ForegroundColor Red
        $failCount++
        $errors += @{Key=$key; Error=$_.ToString()}
    }
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "UPDATE SUMMARY:" -ForegroundColor Cyan
Write-Host "  Successful: $successCount" -ForegroundColor Green
Write-Host "  Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) {"Red"} else {"Gray"})
Write-Host ""

# Show errors if any
if ($errors.Count -gt 0) {
    Write-Host "ERRORS:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $($error.Key): $($error.Error)" -ForegroundColor Red
    }
    Write-Host ""
}

# Trigger deployment if successful
if ($successCount -gt 0) {
    Write-Host "Triggering new deployment..." -ForegroundColor Yellow

    try {
        $deployBody = @{} | ConvertTo-Json
        $deployResponse = Invoke-RestMethod -Uri "$API_BASE/services/$ServiceId/deploys" -Method POST -Headers $headers -Body $deployBody -ErrorAction Stop
        Write-Host "SUCCESS: Deployment triggered!" -ForegroundColor Green
        Write-Host "Deploy ID: $($deployResponse.id)" -ForegroundColor Cyan
        Write-Host "Monitor at: https://dashboard.render.com/web/$ServiceId/deploys/$($deployResponse.id)" -ForegroundColor Cyan
        Write-Host ""

        # Offer to monitor
        $monitor = Read-Host "Would you like to monitor the deployment? (Y/N)"
        if ($monitor -eq "Y" -or $monitor -eq "y") {
            Write-Host ""
            Write-Host "Starting deployment monitor..." -ForegroundColor Yellow
            & ".\monitor-production.ps1" -CheckInterval 20 -MaxAttempts 30
        }
    } catch {
        Write-Host "WARNING: Failed to trigger deployment" -ForegroundColor Yellow
        Write-Host "You may need to manually trigger from Render Dashboard" -ForegroundColor Yellow
        Write-Host "Error: $_" -ForegroundColor Gray
    }
} else {
    Write-Host "No variables were updated. Please check the errors above." -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Process complete!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan