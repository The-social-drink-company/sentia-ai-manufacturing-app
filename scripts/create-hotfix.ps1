# Create and Deploy Hotfix Script
# Handles emergency fixes for production issues

param(
    [Parameter(Mandatory=$true)]
    [string]$FixDescription,

    [Parameter(Mandatory=$true)]
    [ValidateSet("critical", "high", "medium")]
    [string]$Severity,

    [Parameter(Mandatory=$false)]
    [switch]$AutoDeploy = $false,

    [Parameter(Mandatory=$false)]
    [switch]$SkipBackport = $false
)

Write-Host "========================================" -ForegroundColor Red
Write-Host " HOTFIX PROCEDURE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Validate fix description for branch naming
$branchSafeName = $FixDescription -replace '[^a-zA-Z0-9-]', '-' -replace '--+', '-'
$hotfixBranch = "hotfix/$branchSafeName"

Write-Host "Severity: $Severity" -ForegroundColor $(if ($Severity -eq "critical") {"Red"} elseif ($Severity -eq "high") {"Yellow"} else {"White"})
Write-Host "Description: $FixDescription" -ForegroundColor White
Write-Host "Branch: $hotfixBranch" -ForegroundColor Cyan
Write-Host ""

# Severity-based approval requirements
$requiredApprovals = switch($Severity) {
    "critical" { 1 }
    "high" { 2 }
    "medium" { 2 }
}

$maxDeployTime = switch($Severity) {
    "critical" { "1 hour" }
    "high" { "4 hours" }
    "medium" { "Next deployment window" }
}

Write-Host "Approval Requirements:" -ForegroundColor Yellow
Write-Host "  Required Approvals: $requiredApprovals" -ForegroundColor Gray
Write-Host "  Max Deploy Time: $maxDeployTime" -ForegroundColor Gray
Write-Host ""

# Step 1: Create hotfix branch from production
Write-Host "Step 1: Creating Hotfix Branch" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Gray

# Save current branch
$originalBranch = git branch --show-current
Write-Host "Current branch: $originalBranch" -ForegroundColor Gray

# Checkout production
Write-Host "Checking out production branch..." -ForegroundColor White
git checkout production
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to checkout production branch" -ForegroundColor Red
    exit 1
}

# Pull latest production
Write-Host "Pulling latest production..." -ForegroundColor White
git pull origin production
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to pull production" -ForegroundColor Red
    exit 1
}

# Create hotfix branch
Write-Host "Creating hotfix branch: $hotfixBranch" -ForegroundColor White
git checkout -b $hotfixBranch
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to create hotfix branch" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Hotfix branch created" -ForegroundColor Green

# Create hotfix tracking file
$hotfixInfo = @"
HOTFIX INFORMATION
==================
Branch: $hotfixBranch
Severity: $Severity
Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Author: $(git config user.name)
Description: $FixDescription

Required Approvals: $requiredApprovals
Max Deploy Time: $maxDeployTime
"@

$hotfixFile = ".hotfix-info"
$hotfixInfo | Out-File -FilePath $hotfixFile -Encoding UTF8

git add $hotfixFile
git commit -m "hotfix: initialize $Severity severity hotfix

Issue: $FixDescription
Severity: $Severity"

Write-Host ""
Write-Host "Step 2: Apply Fix" -ForegroundColor Yellow
Write-Host "-----------------" -ForegroundColor Gray

if (-not $AutoDeploy) {
    Write-Host @"
Hotfix branch created. Now you need to:

1. Apply your fix to the code
2. Test the fix locally
3. Commit your changes:
   git add .
   git commit -m "hotfix: $FixDescription"

4. Push the hotfix branch:
   git push -u origin $hotfixBranch

5. Create a Pull Request:
   gh pr create --base production --title "HOTFIX [$Severity]: $FixDescription"

6. Get $requiredApprovals approval(s)

7. Merge and deploy:
   .\scripts\deploy-hotfix.ps1 -Branch "$hotfixBranch"

"@ -ForegroundColor White

    Write-Host "Ready to start fixing? (Press Enter to continue)" -ForegroundColor Yellow
    Read-Host

    # Open VS Code if available
    if (Get-Command code -ErrorAction SilentlyContinue) {
        Write-Host "Opening VS Code..." -ForegroundColor Cyan
        code .
    }
} else {
    Write-Host "[AUTO-DEPLOY MODE] Waiting for fix to be applied..." -ForegroundColor Yellow
    Write-Host "Make your changes and press Enter when ready to continue" -ForegroundColor White
    Read-Host

    # Check for changes
    $changes = git status --porcelain
    if (-not $changes) {
        Write-Host "[WARN] No changes detected!" -ForegroundColor Yellow
        Write-Host "Abort hotfix? (y/n): " -NoNewline -ForegroundColor Yellow
        $abort = Read-Host
        if ($abort -eq 'y') {
            git checkout $originalBranch
            git branch -D $hotfixBranch
            exit 0
        }
    }

    # Commit changes
    Write-Host "Committing changes..." -ForegroundColor White
    git add .
    git commit -m "hotfix: $FixDescription

Severity: $Severity
Auto-deployed: true"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to commit changes" -ForegroundColor Red
        exit 1
    }

    # Push to remote
    Write-Host "Pushing hotfix branch..." -ForegroundColor White
    git push -u origin $hotfixBranch
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to push hotfix branch" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "Step 3: Deploy to Production" -ForegroundColor Yellow
    Write-Host "---------------------------" -ForegroundColor Gray

    if ($Severity -eq "critical") {
        Write-Host "[CRITICAL] Bypassing normal approval process due to severity" -ForegroundColor Red

        # Merge directly to production
        Write-Host "Merging hotfix to production..." -ForegroundColor White
        git checkout production
        git merge $hotfixBranch --no-ff -m "hotfix: emergency deployment for $Severity issue

$FixDescription

Bypassed normal approval due to critical severity"

        # Tag the hotfix
        $hotfixTag = "hotfix-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        git tag -a $hotfixTag -m "Hotfix: $FixDescription"

        # Push to production
        Write-Host "Deploying to production..." -ForegroundColor White
        git push origin production --tags

        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Hotfix deployed to production" -ForegroundColor Green
        }
    } else {
        # Create PR for review
        Write-Host "Creating Pull Request for review..." -ForegroundColor White

        if (Get-Command gh -ErrorAction SilentlyContinue) {
            $prBody = @"
## HOTFIX: $FixDescription

**Severity**: $Severity
**Required Approvals**: $requiredApprovals
**Max Deploy Time**: $maxDeployTime

## Changes Made
[Describe the fix here]

## Testing
- [ ] Fix tested locally
- [ ] No regression in other features
- [ ] Production-ready

## Rollback Plan
If this fix causes issues, rollback by:
1. Revert the merge commit
2. Deploy previous version
"@

            gh pr create `
                --base production `
                --title "HOTFIX [$Severity]: $FixDescription" `
                --body "$prBody" `
                --label "hotfix,$Severity"

            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] Pull Request created" -ForegroundColor Green
                Write-Host "Get $requiredApprovals approval(s) and merge to deploy" -ForegroundColor Yellow
            }
        }
    }

    if (-not $SkipBackport) {
        Write-Host ""
        Write-Host "Step 4: Backport to Development" -ForegroundColor Yellow
        Write-Host "-------------------------------" -ForegroundColor Gray

        # Backport to development
        Write-Host "Backporting fix to development branch..." -ForegroundColor White
        git checkout development
        git pull origin development

        Write-Host "Merging hotfix into development..." -ForegroundColor White
        git merge $hotfixBranch --no-ff -m "hotfix: backport from production

$FixDescription

Backported from $hotfixBranch"

        if ($LASTEXITCODE -eq 0) {
            git push origin development
            Write-Host "[OK] Hotfix backported to development" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Failed to backport automatically" -ForegroundColor Yellow
            Write-Host "Manual backport required!" -ForegroundColor Yellow
        }

        # Backport to test if exists
        Write-Host "Backporting fix to test branch..." -ForegroundColor White
        git checkout test
        git pull origin test

        Write-Host "Merging hotfix into test..." -ForegroundColor White
        git merge $hotfixBranch --no-ff -m "hotfix: backport from production

$FixDescription

Backported from $hotfixBranch"

        if ($LASTEXITCODE -eq 0) {
            git push origin test
            Write-Host "[OK] Hotfix backported to test" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Failed to backport to test" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " HOTFIX PROCEDURE COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create incident report
$incidentReport = @"
# Incident Report

**Date**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Severity**: $Severity
**Branch**: $hotfixBranch

## Issue Description
$FixDescription

## Resolution
[To be filled after fix is deployed]

## Root Cause
[To be determined]

## Prevention Measures
[To be determined]

## Timeline
- Issue Detected: $(Get-Date -Format "HH:mm:ss")
- Hotfix Started: $(Get-Date -Format "HH:mm:ss")
- Fix Deployed: [Pending]
- Issue Resolved: [Pending]

## Affected Systems
- [ ] Production API
- [ ] Production Database
- [ ] User Interface
- [ ] External Integrations

## Lessons Learned
[To be filled after incident review]
"@

$reportFile = "incident-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"
$incidentReport | Out-File -FilePath "docs/incidents/$reportFile" -Encoding UTF8

Write-Host "Incident report created: docs/incidents/$reportFile" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
if ($AutoDeploy -and $Severity -eq "critical") {
    Write-Host "1. Monitor production deployment" -ForegroundColor White
    Write-Host "2. Verify fix is working" -ForegroundColor White
    Write-Host "3. Update incident report" -ForegroundColor White
    Write-Host "4. Schedule post-mortem review" -ForegroundColor White
} else {
    Write-Host "1. Apply and test your fix" -ForegroundColor White
    Write-Host "2. Get required approvals ($requiredApprovals)" -ForegroundColor White
    Write-Host "3. Deploy to production" -ForegroundColor White
    Write-Host "4. Verify fix is working" -ForegroundColor White
    Write-Host "5. Update incident report" -ForegroundColor White
}

# Return to original branch
if ($originalBranch -and $originalBranch -ne $hotfixBranch) {
    Write-Host ""
    Write-Host "Returning to $originalBranch branch..." -ForegroundColor Gray
    git checkout $originalBranch
}