# Create Feature Branch Script
# Automates feature branch creation with proper naming and setup

param(
    [Parameter(Mandatory=$true)]
    [string]$FeatureName,

    [Parameter(Mandatory=$false)]
    [ValidateSet("feature", "bugfix", "chore")]
    [string]$BranchType = "feature",

    [Parameter(Mandatory=$false)]
    [string]$Description = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " CREATE $($BranchType.ToUpper()) BRANCH" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validate feature name
if ($FeatureName -match '[^a-zA-Z0-9-_]') {
    Write-Host "[ERROR] Feature name can only contain letters, numbers, hyphens, and underscores" -ForegroundColor Red
    exit 1
}

# Create branch name
$branchName = "$BranchType/$FeatureName"
Write-Host "Creating branch: $branchName" -ForegroundColor Yellow

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Gray

# Ensure we're on development
if ($currentBranch -ne "development") {
    Write-Host "Switching to development branch..." -ForegroundColor Yellow
    git checkout development
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to checkout development branch" -ForegroundColor Red
        exit 1
    }
}

# Pull latest changes
Write-Host "Pulling latest changes from development..." -ForegroundColor Yellow
git pull origin development
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to pull latest changes" -ForegroundColor Red
    exit 1
}

# Check if branch already exists
$existingBranch = git branch -a | Select-String $branchName
if ($existingBranch) {
    Write-Host "[ERROR] Branch '$branchName' already exists!" -ForegroundColor Red
    exit 1
}

# Create new branch
Write-Host "Creating new branch: $branchName" -ForegroundColor Yellow
git checkout -b $branchName
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to create branch" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Branch created successfully" -ForegroundColor Green

# Create initial commit if description provided
if ($Description) {
    # Create branch info file
    $branchInfoFile = ".branch-info"
    @"
Branch: $branchName
Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Author: $(git config user.name)
Description: $Description
"@ | Out-File -FilePath $branchInfoFile -Encoding UTF8

    git add $branchInfoFile
    git commit -m "$BranchType: initialize $FeatureName branch

Description: $Description"

    Write-Host "[OK] Initial commit created" -ForegroundColor Green
}

# Push to remote
Write-Host ""
Write-Host "Push branch to remote? (y/n): " -NoNewline -ForegroundColor Yellow
$push = Read-Host
if ($push -eq 'y') {
    git push -u origin $branchName
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Branch pushed to remote" -ForegroundColor Green

        # Create draft PR if gh CLI is available
        if (Get-Command gh -ErrorAction SilentlyContinue) {
            Write-Host ""
            Write-Host "Create draft Pull Request? (y/n): " -NoNewline -ForegroundColor Yellow
            $createPR = Read-Host
            if ($createPR -eq 'y') {
                $prTitle = "$BranchType: $FeatureName"
                if ($Description) {
                    $prBody = @"
## Description
$Description

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Environment variables documented
"@
                } else {
                    $prBody = "Draft PR for $branchName"
                }

                gh pr create --draft --base development --title "$prTitle" --body "$prBody"
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[OK] Draft PR created" -ForegroundColor Green
                }
            }
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " BRANCH SETUP COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Branch: $branchName" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make your changes" -ForegroundColor Gray
Write-Host "2. Commit regularly with conventional commits:" -ForegroundColor Gray
Write-Host "   git commit -m '$BranchType: add feature description'" -ForegroundColor Cyan
Write-Host "3. Push changes:" -ForegroundColor Gray
Write-Host "   git push" -ForegroundColor Cyan
Write-Host "4. Create PR when ready:" -ForegroundColor Gray
Write-Host "   gh pr create" -ForegroundColor Cyan