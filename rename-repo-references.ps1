# Repository Renaming Script
# Updates all references from sentia-ai-manufacturing-app to capliquify-ai-dashboard-app

Write-Host "🔄 Repository Renaming Script" -ForegroundColor Cyan
Write-Host "From: sentia-ai-manufacturing-app" -ForegroundColor Yellow
Write-Host "To:   capliquify-ai-dashboard-app" -ForegroundColor Green
Write-Host ""

# Define replacement patterns
$replacements = @(
    @{
        From = "sentia-ai-manufacturing-app"
        To = "capliquify-ai-dashboard-app"
        Description = "Repository name"
    },
    @{
        From = "github.com/The-social-drink-company/sentia-ai-manufacturing-app"
        To = "github.com/The-social-drink-company/capliquify-ai-dashboard-app"
        Description = "GitHub URL"
    }
)

# Files to exclude (backups and archives)
$excludePaths = @(
    "*/bmad-backup-*/*",
    "*/backups/*",
    "*/node_modules/*",
    "*/dist/*",
    "*/.git/*",
    "*/bmad-backups/*"
)

# File patterns to include
$filePatterns = @("*.md", "*.json", "*.yml", "*.yaml", "*.js", "*.ts", "*.tsx", "*.jsx")

$totalFilesProcessed = 0
$totalReplacements = 0

foreach ($pattern in $filePatterns) {
    Write-Host "📁 Processing $pattern files..." -ForegroundColor Cyan

    $files = Get-ChildItem -Path . -Filter $pattern -Recurse -File | Where-Object {
        $filePath = $_.FullName
        $exclude = $false
        foreach ($excludePath in $excludePaths) {
            if ($filePath -like $excludePath) {
                $exclude = $true
                break
            }
        }
        -not $exclude
    }

    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue

        if ($null -eq $content) { continue }

        $modified = $false
        $newContent = $content

        foreach ($replacement in $replacements) {
            if ($newContent -match [regex]::Escape($replacement.From)) {
                $newContent = $newContent -replace [regex]::Escape($replacement.From), $replacement.To
                $modified = $true
            }
        }

        if ($modified) {
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
            $totalFilesProcessed++
            $totalReplacements += ($content.Length - $newContent.Length) / 10  # Rough estimate
            Write-Host "  ✅ Updated: $($file.Name)" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "✨ Renaming Complete!" -ForegroundColor Green
Write-Host "   Files updated: $totalFilesProcessed" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Review changes: git diff" -ForegroundColor White
Write-Host "   2. Verify: git remote -v" -ForegroundColor White
Write-Host "   3. Commit: git add . && git commit -m 'refactor(repo): Rename to capliquify-ai-dashboard-app'" -ForegroundColor White
Write-Host "   4. Push: git push origin main" -ForegroundColor White
