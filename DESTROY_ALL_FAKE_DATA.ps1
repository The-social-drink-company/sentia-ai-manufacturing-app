# DESTROY ALL FAKE DATA - AGGRESSIVE REMOVAL SCRIPT
# This will replace ALL Math.random() business logic with errors

Write-Host "================================================" -ForegroundColor Red
Write-Host " DESTROYING ALL FAKE DATA GENERATION" -ForegroundColor Yellow
Write-Host " REPLACING WITH REAL DATA REQUIREMENTS" -ForegroundColor Red
Write-Host "================================================" -ForegroundColor Red
Write-Host ""

$replacements = @{
    # Compliance fake data
    "Math.floor\(Math.random\(\) \* 20\) \+ 80" = "0 /* COMPLIANCE DATA MUST COME FROM REAL AUDIT SYSTEMS */"
    "Math.random\(\) \* 180" = "0 /* AUDIT DATES MUST BE REAL */"

    # Sensor fake data
    "Math.random\(\) \* 10" = "0 /* VIBRATION DATA MUST COME FROM REAL SENSORS */"
    "45 \+ Math.random\(\) \* 20" = "0 /* TEMPERATURE DATA MUST COME FROM REAL SENSORS */"
    "Math.random\(\) \* 20" = "0 /* SENSOR DATA MUST BE REAL */"

    # Production fake data
    "Math.floor\(Math.random\(\) \* 100\) \+ 200" = "0 /* PRODUCTION UNITS MUST COME FROM REAL MES SYSTEMS */"
    "Math.random\(\) \* 100" = "0 /* EFFICIENCY DATA MUST BE REAL */"

    # Financial fake data
    "Math.random\(\) \* 1000" = "0 /* FINANCIAL VALUES MUST COME FROM REAL ACCOUNTING SYSTEMS */"
    "Math.random\(\) \* 10000" = "0 /* ROW COUNTS MUST BE REAL */"

    # Energy fake data
    "100 \+ Math.random\(\) \* 50" = "0 /* ENERGY CONSUMPTION MUST COME FROM REAL METERS */"
}

# Files to aggressively clean
$criticalFiles = @(
    "src\compliance\GlobalComplianceSystem.jsx",
    "src\ai\components\PredictiveAnalytics.jsx",
    "src\lib\dbOptimization.js",
    "src\realtime\components\LiveMetricsDashboard.jsx",
    "src\components\analytics\AdvancedAnalyticsDashboard.jsx",
    "src\services\ManufacturingAnalyticsService.js",
    "src\components\forecasting\DemandForecasting.jsx",
    "src\services\QualityControlService.js",
    "src\components\dashboard\ManufacturingDashboard.jsx",
    "src\components\financial\CurrencyExposureDashboard.tsx",
    "src\components\supply-chain\SupplierReliabilityScoring.tsx"
)

$totalDestroyed = 0

foreach ($file in $criticalFiles) {
    $filePath = Join-Path -Path "." -ChildPath $file

    if (Test-Path $filePath) {
        Write-Host "Destroying fake data in: $file" -ForegroundColor Yellow

        $content = Get-Content $filePath -Raw
        $originalLength = $content.Length

        # Apply all replacements
        foreach ($pattern in $replacements.Keys) {
            $replacement = $replacements[$pattern]
            $matches = [regex]::Matches($content, $pattern)

            if ($matches.Count -gt 0) {
                $content = [regex]::Replace($content, $pattern, $replacement)
                Write-Host "  Destroyed $($matches.Count) instances of: $pattern" -ForegroundColor Red
                $totalDestroyed += $matches.Count
            }
        }

        # Also replace generic Math.random() with errors
        $genericPattern = "Math\.random\(\)"
        $genericMatches = [regex]::Matches($content, $genericPattern)

        if ($genericMatches.Count -gt 0) {
            # Check context to determine replacement
            $lines = $content -split "`n"
            for ($i = 0; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match $genericPattern) {
                    # Analyze what the random data is for
                    if ($lines[$i] -match "(revenue|cost|price|amount|value|financial)") {
                        $lines[$i] = $lines[$i] -replace $genericPattern, "(() => { throw new Error('FINANCIAL DATA MUST COME FROM REAL ACCOUNTING SYSTEMS - NO FAKE DATA'); })()"
                    }
                    elseif ($lines[$i] -match "(sensor|temperature|vibration|pressure|humidity)") {
                        $lines[$i] = $lines[$i] -replace $genericPattern, "(() => { throw new Error('SENSOR DATA MUST COME FROM REAL IOT DEVICES - NO FAKE DATA'); })()"
                    }
                    elseif ($lines[$i] -match "(production|units|efficiency|output|capacity)") {
                        $lines[$i] = $lines[$i] -replace $genericPattern, "(() => { throw new Error('PRODUCTION DATA MUST COME FROM REAL MES/SCADA SYSTEMS - NO FAKE DATA'); })()"
                    }
                    elseif ($lines[$i] -match "(quality|defect|reject|compliance|audit)") {
                        $lines[$i] = $lines[$i] -replace $genericPattern, "(() => { throw new Error('QUALITY DATA MUST COME FROM REAL QMS SYSTEMS - NO FAKE DATA'); })()"
                    }
                    elseif ($lines[$i] -match "(forecast|prediction|demand|trend)") {
                        $lines[$i] = $lines[$i] -replace $genericPattern, "(() => { throw new Error('FORECAST DATA MUST COME FROM REAL AI/ML MODELS - NO FAKE DATA'); })()"
                    }
                    else {
                        $lines[$i] = $lines[$i] -replace $genericPattern, "(() => { throw new Error('ALL DATA MUST BE REAL - NO Math.random() FAKE DATA ALLOWED'); })()"
                    }
                }
            }
            $content = $lines -join "`n"

            Write-Host "  Destroyed $($genericMatches.Count) generic Math.random() calls" -ForegroundColor Red
            $totalDestroyed += $genericMatches.Count
        }

        # Save the cleaned file
        Set-Content -Path $filePath -Value $content -NoNewline
        Write-Host "  File saved with fake data destroyed" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host " FAKE DATA DESTRUCTION COMPLETE" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "DESTROYED: $totalDestroyed instances of fake data generation" -ForegroundColor Red
Write-Host ""
Write-Host "The application will now CRASH if it tries to use fake data." -ForegroundColor Yellow
Write-Host "All components MUST connect to real data sources:" -ForegroundColor Yellow
Write-Host "  - Financial data: Xero API" -ForegroundColor White
Write-Host "  - Production data: MES/SCADA systems" -ForegroundColor White
Write-Host "  - Sensor data: IoT devices" -ForegroundColor White
Write-Host "  - Quality data: QMS systems" -ForegroundColor White
Write-Host "  - Forecast data: AI/ML models" -ForegroundColor White
Write-Host ""
Write-Host "NO FAKE DATA WILL BE TOLERATED!" -ForegroundColor Red