# EMERGENCY FAKE DATA PURGE SCRIPT
# This will AGGRESSIVELY remove ALL fake data from the codebase

Write-Host "========================================" -ForegroundColor Red
Write-Host " EMERGENCY FAKE DATA PURGE IN PROGRESS" -ForegroundColor Yellow
Write-Host " This will BREAK the app - that's intentional!" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

$totalFixed = 0
$files = @()

# Find all files with Math.random()
Write-Host "Searching for ALL Math.random() instances..." -ForegroundColor Yellow
$results = Get-ChildItem -Path "src" -Recurse -Include "*.js","*.jsx","*.ts","*.tsx" | Select-String -Pattern "Math\.random\(\)" -List

foreach ($result in $results) {
    $file = $result.Path
    $files += $file
    Write-Host "Found fake data in: $file" -ForegroundColor Red
}

Write-Host ""
Write-Host "Found $($files.Count) files with fake data" -ForegroundColor Yellow
Write-Host ""

# Fix each file
foreach ($file in $files) {
    Write-Host "Fixing: $file" -ForegroundColor Cyan

    $content = Get-Content $file -Raw
    $originalLength = $content.Length

    # Replace Math.random() with errors
    $patterns = @{
        # Business logic random data
        'Math\.random\(\)\s*\*\s*\d+' = 'throw new Error("REAL DATA REQUIRED: No fake data allowed")'
        'Math\.random\(\)\s*[+\-*/]' = 'throw new Error("REAL DATA REQUIRED: Connect to real APIs")'
        '\+ Math\.random\(\)' = '+ (() => { throw new Error("REAL DATA REQUIRED") })()'
        '- Math\.random\(\)' = '- (() => { throw new Error("REAL DATA REQUIRED") })()'

        # ID generation - replace with crypto
        'Date\.now\(\)\s*\+\s*Math\.random\(\)' = 'crypto.randomUUID()'
        'Math\.random\(\)\.toString\(36\)\.substr' = 'crypto.randomUUID().substr'
        'Math\.random\(\)\.toString\(36\)\.substring' = 'crypto.randomUUID().substring'

        # Mock data generation
        'generateMock[A-Za-z]*' = 'throwRealDataRequired'
        'mockData' = 'realDataRequired'
        'fakeData' = 'realDataRequired'
        'dummyData' = 'realDataRequired'
        'sampleData' = 'realDataRequired'
    }

    $fixedContent = $content
    foreach ($pattern in $patterns.Keys) {
        $replacement = $patterns[$pattern]
        $fixedContent = $fixedContent -replace $pattern, $replacement
    }

    # If content changed, save it
    if ($fixedContent.Length -ne $originalLength) {
        Set-Content -Path $file -Value $fixedContent -NoNewline
        $totalFixed++
        Write-Host "  FIXED: Replaced fake data with errors" -ForegroundColor Green
    } else {
        Write-Host "  SKIP: No simple replacements possible" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " FAKE DATA PURGE COMPLETE" -ForegroundColor Green
Write-Host " Fixed $totalFixed files" -ForegroundColor Green
Write-Host " The app will now CRASH if it tries to use fake data" -ForegroundColor Yellow
Write-Host " This is INTENTIONAL - it forces real API connections" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green

# Now search for any remaining Math.random()
Write-Host ""
Write-Host "Verifying removal..." -ForegroundColor Yellow
$remaining = Get-ChildItem -Path "src" -Recurse -Include "*.js","*.jsx","*.ts","*.tsx" | Select-String -Pattern "Math\.random\(\)" -List

if ($remaining.Count -gt 0) {
    Write-Host ""
    Write-Host "WARNING: $($remaining.Count) files still contain Math.random()" -ForegroundColor Red
    Write-Host "These require manual inspection:" -ForegroundColor Yellow
    foreach ($result in $remaining) {
        Write-Host "  - $($result.Path)" -ForegroundColor Red
    }
} else {
    Write-Host "SUCCESS: All Math.random() instances removed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Commit these changes" -ForegroundColor White
Write-Host "2. Push to development branch" -ForegroundColor White
Write-Host "3. Connect real APIs:" -ForegroundColor White
Write-Host "   - Xero for financial data" -ForegroundColor Gray
Write-Host "   - Shopify for orders" -ForegroundColor Gray
Write-Host "   - MES/SCADA for production" -ForegroundColor Gray
Write-Host "   - LIMS for quality control" -ForegroundColor Gray
Write-Host "   - IoT sensors for real-time data" -ForegroundColor Gray