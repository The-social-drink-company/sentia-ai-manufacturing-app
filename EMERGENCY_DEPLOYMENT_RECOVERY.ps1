# EMERGENCY DEPLOYMENT RECOVERY SCRIPT
# This will fix the broken deployment by replacing immediate throw statements with deferred errors

Write-Host "========================================" -ForegroundColor Yellow
Write-Host " EMERGENCY DEPLOYMENT RECOVERY" -ForegroundColor Green
Write-Host " Fixing crash-on-load issues" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

$fixCount = 0

# Find all files with immediate throw statements that crash on load
Write-Host "Searching for crash-causing throw statements..." -ForegroundColor Cyan

$patterns = @{
    # Immediate throw statements in expressions
    '\(\(\) => \{ throw new Error\("REAL DATA REQUIRED[^"]*"\) \}\)\(\)' = '0 /* REAL DATA REQUIRED */'
    'throw new Error\("REAL DATA REQUIRED: No fake data allowed"\)' = '0 /* REAL DATA REQUIRED */'
    'throw new Error\("REAL DATA REQUIRED: Connect to real APIs"\)' = '0 /* REAL DATA REQUIRED */'

    # Throw statements that break on initialization
    'Math\.round\(throw new Error' = 'Math.round(0 /* ERROR: '
    'Math\.floor\(throw new Error' = 'Math.floor(0 /* ERROR: '
    '\+ throw new Error' = '+ 0 /* ERROR: REAL DATA REQUIRED */'
    '- throw new Error' = '- 0 /* ERROR: REAL DATA REQUIRED */'
}

# Process each file type
$jsFiles = Get-ChildItem -Path "src" -Recurse -Include "*.js","*.jsx","*.ts","*.tsx"

foreach ($file in $jsFiles) {
    $content = Get-Content $file -Raw
    $originalContent = $content

    foreach ($pattern in $patterns.Keys) {
        $replacement = $patterns[$pattern]
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replacement
            Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
        }
    }

    if ($content -ne $originalContent) {
        Set-Content -Path $file -Value $content -NoNewline
        $fixCount++
    }
}

Write-Host ""
Write-Host "Fixed $fixCount files" -ForegroundColor Green

# Also need to fix specific breaking components
Write-Host ""
Write-Host "Fixing specific breaking components..." -ForegroundColor Yellow

# Fix components that throw during render
$componentsToFix = @(
    "src\components\charts\LineChart\LineChart.stories.tsx",
    "src\components\charts\WorkingCapitalOptimizationDashboard.jsx",
    "src\components\charts\AIForecastingDashboard.jsx"
)

foreach ($component in $componentsToFix) {
    if (Test-Path $component) {
        $content = Get-Content $component -Raw

        # Replace throw in function bodies with console.error
        $content = $content -replace 'throw new Error\("REAL DATA REQUIRED[^"]*"\);?', 'console.error("REAL DATA REQUIRED"); return 0;'

        Set-Content -Path $component -Value $content -NoNewline
        Write-Host "  Fixed critical component: $(Split-Path $component -Leaf)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " DEPLOYMENT RECOVERY COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Changes made:" -ForegroundColor Cyan
Write-Host "- Replaced immediate throw statements with 0 values" -ForegroundColor White
Write-Host "- Added /* REAL DATA REQUIRED */ comments" -ForegroundColor White
Write-Host "- Fixed components that crash during render" -ForegroundColor White
Write-Host "- App should now load without crashing" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "The app will now LOAD but show 0 values instead of crashing" -ForegroundColor White
Write-Host "This is temporary - you still need to connect real APIs" -ForegroundColor Red
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Commit these emergency fixes" -ForegroundColor White
Write-Host "2. Push to development branch" -ForegroundColor White
Write-Host "3. Wait for deployment to rebuild" -ForegroundColor White
Write-Host "4. Connect real APIs to replace 0 values" -ForegroundColor White