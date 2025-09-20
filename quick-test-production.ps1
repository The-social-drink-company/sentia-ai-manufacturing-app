# Quick Production Test Script
Write-Host "Testing Production Status..." -ForegroundColor Yellow
Write-Host ""

$urls = @(
    "https://sentia-manufacturing-production.onrender.com/health",
    "https://sentia-manufacturing-production.onrender.com/api/status",
    "https://sentia-manufacturing-production.onrender.com"
)

foreach ($url in $urls) {
    Write-Host -NoNewline "Testing $url ... "
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "OK (200)" -ForegroundColor Green
        } else {
            Write-Host "Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq 502) {
            Write-Host "502 Bad Gateway" -ForegroundColor Red
        } else {
            Write-Host "Error: $status" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "If all show 502, environment variables need to be added." -ForegroundColor Yellow
Write-Host "If showing 200, production is operational!" -ForegroundColor Green