# Render Environment Variables Formatter Script
# This script formats the JSON environment variables for easy copying to Render Dashboard

$jsonFile = "render-env-complete.json"
$envData = Get-Content $jsonFile | ConvertFrom-Json

function Format-EnvVars {
    param (
        [Parameter(Mandatory=$true)]
        [PSCustomObject]$envVars,
        [Parameter(Mandatory=$true)]
        [string]$envName
    )

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " $envName Environment Variables" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nCopy everything below for Render Bulk Edit:" -ForegroundColor Green
    Write-Host "----------------------------------------" -ForegroundColor Gray

    $output = @()
    foreach ($property in $envVars.PSObject.Properties) {
        $output += "$($property.Name)=$($property.Value)"
    }

    $formatted = $output -join "`n"
    Write-Host $formatted

    # Save to file
    $fileName = "render-env-$($envName.ToLower()).txt"
    $formatted | Out-File -FilePath $fileName -Encoding UTF8
    Write-Host "`nSaved to $fileName" -ForegroundColor Green
    Write-Host "----------------------------------------" -ForegroundColor Gray
}

# Format each environment
Format-EnvVars -envVars $envData.development -envName "DEVELOPMENT"
Format-EnvVars -envVars $envData.testing -envName "TESTING"
Format-EnvVars -envVars $envData.production -envName "PRODUCTION"
Format-EnvVars -envVars $envData.mcp_server -envName "MCP_SERVER"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " ✓ All environment files created!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Go to Render Dashboard" -ForegroundColor White
Write-Host "2. Click on each service" -ForegroundColor White
Write-Host "3. Go to Environment tab" -ForegroundColor White
Write-Host "4. Click 'Bulk Edit'" -ForegroundColor White
Write-Host "5. Copy contents from the .txt files" -ForegroundColor White
Write-Host "6. Paste and Save" -ForegroundColor White
Write-Host "`nFiles created:" -ForegroundColor Green
Write-Host "- render-env-development.txt" -ForegroundColor White
Write-Host "- render-env-testing.txt" -ForegroundColor White
Write-Host "- render-env-production.txt" -ForegroundColor White
Write-Host "- render-env-mcp_server.txt" -ForegroundColor White