# BMAD Auto-Update Agent - Windows Task Scheduler Setup
#
# This script creates a scheduled task to run the BMAD auto-update agent daily at 3:00 AM
#
# Usage:
#   Run as Administrator:
#   powershell -ExecutionPolicy Bypass -File scripts/setup-task-scheduler.ps1
#
# Options:
#   -Uninstall    Remove the scheduled task
#   -DryRun       Create task in disabled state for testing
#   -Time         Custom time (default: 03:00)

param(
    [switch]$Uninstall,
    [switch]$DryRun,
    [string]$Time = "03:00"
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$TaskName = "BMAD-Auto-Update-Daily"
$TaskDescription = "Automatically updates BMAD-METHOD framework from GitHub v6-alpha branch"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ScriptPath = Join-Path $ProjectRoot "scripts\bmad-auto-update.cjs"
$NodePath = (Get-Command node).Source
$LogPath = Join-Path $ProjectRoot "logs\bmad-updates"

# ============================================================================
# FUNCTIONS
# ============================================================================

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Remove-ScheduledTaskIfExists {
    param([string]$Name)

    $task = Get-ScheduledTask -TaskName $Name -ErrorAction SilentlyContinue
    if ($task) {
        Write-ColorOutput "Removing existing task: $Name" "Yellow"
        Unregister-ScheduledTask -TaskName $Name -Confirm:$false
        return $true
    }
    return $false
}

function New-BMADScheduledTask {
    Write-ColorOutput "`n=== BMAD Auto-Update Agent Setup ===" "Cyan"
    Write-ColorOutput "Task Name: $TaskName" "White"
    Write-ColorOutput "Schedule: Daily at $Time" "White"
    Write-ColorOutput "Script: $ScriptPath" "White"
    Write-ColorOutput "Node: $NodePath" "White"

    # Verify prerequisites
    if (!(Test-Path $ScriptPath)) {
        Write-ColorOutput "`nError: Script not found: $ScriptPath" "Red"
        exit 1
    }

    if (!(Test-Path $NodePath)) {
        Write-ColorOutput "`nError: Node.js not found. Please install Node.js v20+" "Red"
        exit 1
    }

    # Remove existing task if present
    Remove-ScheduledTaskIfExists -Name $TaskName | Out-Null

    # Create action
    $action = New-ScheduledTaskAction `
        -Execute $NodePath `
        -Argument "`"$ScriptPath`"" `
        -WorkingDirectory $ProjectRoot

    # Create trigger (daily at specified time)
    $trigger = New-ScheduledTaskTrigger `
        -Daily `
        -At $Time

    # Create settings
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RunOnlyIfNetworkAvailable `
        -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 5)

    # Create principal (run with highest privileges)
    $principal = New-ScheduledTaskPrincipal `
        -UserId $env:USERNAME `
        -LogonType S4U `
        -RunLevel Highest

    # Register task
    try {
        $task = Register-ScheduledTask `
            -TaskName $TaskName `
            -Description $TaskDescription `
            -Action $action `
            -Trigger $trigger `
            -Settings $settings `
            -Principal $principal `
            -Force

        if ($DryRun) {
            Write-ColorOutput "`n[DRY-RUN] Task created but disabled" "Yellow"
            Disable-ScheduledTask -TaskName $TaskName | Out-Null
        }

        Write-ColorOutput "`n✓ Scheduled task created successfully!" "Green"
        Write-ColorOutput "`nTask Details:" "Cyan"
        Write-ColorOutput "  Name: $TaskName" "White"
        Write-ColorOutput "  Status: $($task.State)" "White"
        Write-ColorOutput "  Next Run: $(Get-ScheduledTask -TaskName $TaskName | Get-ScheduledTaskInfo | Select-Object -ExpandProperty NextRunTime)" "White"
        Write-ColorOutput "  Log Directory: $LogPath" "White"

        Write-ColorOutput "`nUseful Commands:" "Cyan"
        Write-ColorOutput "  View task:    Get-ScheduledTask -TaskName '$TaskName'" "Gray"
        Write-ColorOutput "  Run now:      Start-ScheduledTask -TaskName '$TaskName'" "Gray"
        Write-ColorOutput "  Disable:      Disable-ScheduledTask -TaskName '$TaskName'" "Gray"
        Write-ColorOutput "  Enable:       Enable-ScheduledTask -TaskName '$TaskName'" "Gray"
        Write-ColorOutput "  Remove:       Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false" "Gray"

        return $true
    }
    catch {
        Write-ColorOutput "`nError creating scheduled task: $_" "Red"
        return $false
    }
}

function Remove-BMADScheduledTask {
    Write-ColorOutput "`n=== BMAD Auto-Update Agent Removal ===" "Cyan"

    if (Remove-ScheduledTaskIfExists -Name $TaskName) {
        Write-ColorOutput "✓ Scheduled task removed successfully!" "Green"
        return $true
    }
    else {
        Write-ColorOutput "Task not found: $TaskName" "Yellow"
        return $false
    }
}

function Test-BMADUpdateAgent {
    Write-ColorOutput "`n=== Testing BMAD Update Agent ===" "Cyan"
    Write-ColorOutput "Running in dry-run mode..." "Yellow"

    Push-Location $ProjectRoot
    try {
        & $NodePath $ScriptPath --dry-run
        $exitCode = $LASTEXITCODE

        if ($exitCode -eq 0) {
            Write-ColorOutput "`n✓ Test completed successfully!" "Green"
            return $true
        }
        else {
            Write-ColorOutput "`n✗ Test failed with exit code: $exitCode" "Red"
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

# ============================================================================
# MAIN
# ============================================================================

# Check administrator privileges
if (!(Test-Administrator)) {
    Write-ColorOutput "Error: This script requires administrator privileges" "Red"
    Write-ColorOutput "Please run PowerShell as Administrator and try again" "Yellow"
    exit 1
}

# Handle uninstall
if ($Uninstall) {
    Remove-BMADScheduledTask
    exit 0
}

# Create scheduled task
$success = New-BMADScheduledTask

if ($success) {
    Write-ColorOutput "`n=== Setup Complete ===" "Green"
    Write-ColorOutput "`nThe BMAD Auto-Update Agent is now installed and will run daily at $Time." "White"
    Write-ColorOutput "`nTo test immediately:" "Cyan"
    Write-ColorOutput "  node scripts\bmad-auto-update.js --dry-run" "Gray"
    Write-ColorOutput "`nTo run the scheduled task now:" "Cyan"
    Write-ColorOutput "  Start-ScheduledTask -TaskName '$TaskName'" "Gray"
    Write-ColorOutput "`nView logs at:" "Cyan"
    Write-ColorOutput "  $LogPath" "Gray"
}
else {
    Write-ColorOutput "`nSetup failed. Please check the error messages above." "Red"
    exit 1
}
