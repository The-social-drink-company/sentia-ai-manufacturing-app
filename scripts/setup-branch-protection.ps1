# Setup Branch Protection Rules for Enterprise Git Workflow
# This script configures GitHub branch protection for development, test, and production branches

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " GITHUB BRANCH PROTECTION SETUP" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if gh CLI is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] GitHub CLI (gh) is not installed!" -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check authentication
Write-Host "Checking GitHub authentication..." -ForegroundColor Yellow
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Not authenticated with GitHub!" -ForegroundColor Red
    Write-Host "Run: gh auth login" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] GitHub authenticated" -ForegroundColor Green

# Repository details
$owner = "The-social-drink-company"
$repo = "sentia-manufacturing-dashboard"

Write-Host ""
Write-Host "Repository: $owner/$repo" -ForegroundColor Cyan
Write-Host ""

# Function to set branch protection
function Set-BranchProtection {
    param(
        [string]$branch,
        [int]$requiredReviews,
        [bool]$dismissStale,
        [bool]$requireUpToDate,
        [bool]$includeAdmins
    )

    Write-Host "Configuring protection for: $branch" -ForegroundColor Yellow

    $protectionJson = @{
        required_status_checks = @{
            strict = $requireUpToDate
            contexts = @("build", "test", "lint")
        }
        enforce_admins = $includeAdmins
        required_pull_request_reviews = @{
            required_approving_review_count = $requiredReviews
            dismiss_stale_reviews = $dismissStale
            require_code_owner_reviews = $false
            require_last_push_approval = $false
        }
        restrictions = $null
        allow_force_pushes = $false
        allow_deletions = $false
        block_creations = $false
        required_conversation_resolution = $true
        lock_branch = $false
        allow_fork_syncing = $false
    } | ConvertTo-Json -Depth 10

    # Save to temp file
    $tempFile = [System.IO.Path]::GetTempFileName()
    $protectionJson | Out-File -FilePath $tempFile -Encoding UTF8

    try {
        # Apply protection rules
        gh api `
            --method PUT `
            -H "Accept: application/vnd.github+json" `
            -H "X-GitHub-Api-Version: 2022-11-28" `
            "/repos/$owner/$repo/branches/$branch/protection" `
            --input $tempFile

        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Protection rules applied to $branch" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Failed to apply rules to $branch" -ForegroundColor Yellow
        }
    } finally {
        Remove-Item $tempFile -Force
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " PRODUCTION BRANCH PROTECTION" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Rules:" -ForegroundColor White
Write-Host "- Require 2 pull request reviews" -ForegroundColor Gray
Write-Host "- Dismiss stale reviews" -ForegroundColor Gray
Write-Host "- Require branches to be up to date" -ForegroundColor Gray
Write-Host "- Do not include administrators" -ForegroundColor Gray
Write-Host "- Require status checks (build, test, lint)" -ForegroundColor Gray
Write-Host ""

Set-BranchProtection -branch "production" `
    -requiredReviews 2 `
    -dismissStale $true `
    -requireUpToDate $true `
    -includeAdmins $false

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TEST BRANCH PROTECTION" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Rules:" -ForegroundColor White
Write-Host "- Require 1 pull request review" -ForegroundColor Gray
Write-Host "- Dismiss stale reviews" -ForegroundColor Gray
Write-Host "- Require branches to be up to date" -ForegroundColor Gray
Write-Host "- Do not include administrators" -ForegroundColor Gray
Write-Host ""

Set-BranchProtection -branch "test" `
    -requiredReviews 1 `
    -dismissStale $true `
    -requireUpToDate $true `
    -includeAdmins $false

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " DEVELOPMENT BRANCH PROTECTION" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Rules:" -ForegroundColor White
Write-Host "- Require 1 pull request review" -ForegroundColor Gray
Write-Host "- Do not dismiss stale reviews" -ForegroundColor Gray
Write-Host "- Require branches to be up to date" -ForegroundColor Gray
Write-Host "- Include administrators" -ForegroundColor Gray
Write-Host ""

Set-BranchProtection -branch "development" `
    -requiredReviews 1 `
    -dismissStale $false `
    -requireUpToDate $true `
    -includeAdmins $true

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ADDITIONAL SETTINGS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set default branch
Write-Host "Setting default branch to 'development'..." -ForegroundColor Yellow
gh api `
    --method PATCH `
    -H "Accept: application/vnd.github+json" `
    "/repos/$owner/$repo" `
    -f default_branch='development'

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Default branch set to development" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " BRANCH PROTECTION COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- Production: 2 reviews, strict checks" -ForegroundColor White
Write-Host "- Test: 1 review, strict checks" -ForegroundColor White
Write-Host "- Development: 1 review, standard checks" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure GitHub Actions for CI/CD" -ForegroundColor Gray
Write-Host "2. Set up webhook notifications" -ForegroundColor Gray
Write-Host "3. Add CODEOWNERS file" -ForegroundColor Gray
Write-Host "4. Configure merge strategies" -ForegroundColor Gray