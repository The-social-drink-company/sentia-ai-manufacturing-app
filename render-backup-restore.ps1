# Render PostgreSQL Automated Backup and Restore Script
# Manages backups for all three Render PostgreSQL databases

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("backup", "restore", "schedule", "list", "cleanup")]
    [string]$Operation,

    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "testing", "production", "all")]
    [string]$Environment = "production",

    [Parameter(Mandatory=$false)]
    [string]$BackupPath = ".\backups",

    [Parameter(Mandatory=$false)]
    [string]$RestoreFile = "",

    [Parameter(Mandatory=$false)]
    [int]$RetentionDays = 30
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " RENDER POSTGRESQL BACKUP MANAGER" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Operation: $Operation" -ForegroundColor White
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host ""

# Ensure backup directory exists
if (-not (Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath | Out-Null
    Write-Host "Created backup directory: $BackupPath" -ForegroundColor Green
}

# Database configurations
$databases = @{
    development = @{
        name = "sentia-db-development"
        plan = "Free"
        backupEnabled = $false  # Free plan - no automatic backups
    }
    testing = @{
        name = "sentia-db-testing"
        plan = "Free"
        backupEnabled = $false  # Free plan - no automatic backups
    }
    production = @{
        name = "sentia-db-production"
        plan = "Starter"
        backupEnabled = $true   # Starter plan - daily automatic backups
    }
}

# Helper function to get database connection string
function Get-DatabaseConnection {
    param([string]$EnvName)

    # In production, these would be retrieved from Render API or environment variables
    # For now, prompt user if not in environment
    $envVar = "RENDER_DB_URL_" + $EnvName.ToUpper()
    $connStr = [System.Environment]::GetEnvironmentVariable($envVar)

    if (-not $connStr) {
        Write-Host "Database connection string for $EnvName not found in environment." -ForegroundColor Yellow
        Write-Host "Please enter the external connection string from Render dashboard:" -ForegroundColor Cyan
        $connStr = Read-Host
    }

    return $connStr
}

# Backup function
function Backup-Database {
    param(
        [string]$EnvName,
        [string]$BackupDir
    )

    Write-Host "Backing up $EnvName database..." -ForegroundColor Yellow

    $db = $databases[$EnvName]
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = Join-Path $BackupDir "backup-$EnvName-$timestamp.sql"

    # Check if automatic backups are available
    if ($db.backupEnabled) {
        Write-Host "  Note: $EnvName has automatic daily backups in Render (Starter plan)" -ForegroundColor Green
    } else {
        Write-Host "  Note: $EnvName requires manual backups (Free plan)" -ForegroundColor Yellow
    }

    # Get connection string
    $connStr = Get-DatabaseConnection -EnvName $EnvName

    if (-not $connStr) {
        Write-Host "  [SKIP] No connection string available" -ForegroundColor Red
        return $null
    }

    # Parse connection string
    if ($connStr -match "postgresql://([^:]+):([^@]+)@([^/]+)/([^?]+)") {
        $pgUser = $matches[1]
        $pgPass = $matches[2]
        $pgHost = $matches[3].Split(':')[0]
        $pgPort = if ($matches[3].Contains(':')) { $matches[3].Split(':')[1].Split('-')[0] } else { "5432" }
        $pgDb = $matches[4]

        $env:PGPASSWORD = $pgPass

        Write-Host "  Connecting to $pgHost..." -ForegroundColor Gray

        # Execute pg_dump
        $pgDumpArgs = @(
            "-h", $pgHost,
            "-p", $pgPort,
            "-U", $pgUser,
            "-d", $pgDb,
            "-f", $backupFile,
            "--verbose",
            "--no-owner",
            "--no-acl",
            "--clean",
            "--if-exists",
            "--format=plain",
            "--no-password"
        )

        $result = & pg_dump @pgDumpArgs 2>&1

        if ($LASTEXITCODE -eq 0) {
            $size = (Get-Item $backupFile).Length / 1MB
            Write-Host "  [SUCCESS] Backup saved: $backupFile" -ForegroundColor Green
            Write-Host "  Size: $([Math]::Round($size, 2)) MB" -ForegroundColor Gray
            return $backupFile
        } else {
            Write-Host "  [FAIL] Backup failed" -ForegroundColor Red
            Write-Host "  Error: $result" -ForegroundColor Red
            return $null
        }
    } else {
        Write-Host "  [FAIL] Invalid connection string format" -ForegroundColor Red
        return $null
    }
}

# Restore function
function Restore-Database {
    param(
        [string]$EnvName,
        [string]$BackupFile
    )

    if (-not (Test-Path $BackupFile)) {
        Write-Host "[FAIL] Backup file not found: $BackupFile" -ForegroundColor Red
        return $false
    }

    Write-Host "Restoring $EnvName database from backup..." -ForegroundColor Yellow
    Write-Host "  Source: $BackupFile" -ForegroundColor Gray

    # Safety check
    if ($EnvName -eq "production") {
        Write-Host ""
        Write-Host "WARNING: You are about to restore the PRODUCTION database!" -ForegroundColor Red
        Write-Host "This will overwrite all current data!" -ForegroundColor Red
        Write-Host "Type 'YES' to continue: " -NoNewline -ForegroundColor Yellow
        $confirm = Read-Host
        if ($confirm -ne "YES") {
            Write-Host "Restore cancelled." -ForegroundColor Yellow
            return $false
        }
    }

    # Get connection string
    $connStr = Get-DatabaseConnection -EnvName $EnvName

    if (-not $connStr) {
        Write-Host "[FAIL] No connection string available" -ForegroundColor Red
        return $false
    }

    # Parse connection string and restore
    if ($connStr -match "postgresql://([^:]+):([^@]+)@([^/]+)/([^?]+)") {
        $pgUser = $matches[1]
        $pgPass = $matches[2]
        $pgHost = $matches[3].Split(':')[0]
        $pgPort = if ($matches[3].Contains(':')) { $matches[3].Split(':')[1].Split('-')[0] } else { "5432" }
        $pgDb = $matches[4]

        $env:PGPASSWORD = $pgPass

        Write-Host "  Restoring to $pgHost/$pgDb..." -ForegroundColor Gray

        $psqlArgs = @(
            "-h", $pgHost,
            "-p", $pgPort,
            "-U", $pgUser,
            "-d", $pgDb,
            "-f", $BackupFile,
            "--set", "ON_ERROR_STOP=on",
            "--no-password"
        )

        $result = & psql @psqlArgs 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [SUCCESS] Database restored successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  [FAIL] Restore failed" -ForegroundColor Red
            Write-Host "  Error: $result" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "[FAIL] Invalid connection string format" -ForegroundColor Red
        return $false
    }
}

# Schedule backups
function Schedule-Backups {
    Write-Host "Setting up automated backups..." -ForegroundColor Yellow

    $scriptPath = $MyInvocation.MyCommand.Path
    $taskName = "Render-PostgreSQL-Backup-$Environment"

    # Create scheduled task for Windows
    $action = New-ScheduledTaskAction -Execute "powershell.exe" `
        -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`" -Operation backup -Environment $Environment"

    $trigger = New-ScheduledTaskTrigger -Daily -At "2:00AM"

    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable

    try {
        Register-ScheduledTask `
            -TaskName $taskName `
            -Action $action `
            -Trigger $trigger `
            -Settings $settings `
            -Description "Daily backup of Render PostgreSQL database for $Environment" `
            -Force

        Write-Host "[SUCCESS] Scheduled task created: $taskName" -ForegroundColor Green
        Write-Host "Backups will run daily at 2:00 AM" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Could not create scheduled task" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red

        Write-Host ""
        Write-Host "Alternative: Add to crontab (Linux/Mac) or use Task Scheduler (Windows)" -ForegroundColor Yellow
        Write-Host "Command to run: $scriptPath -Operation backup -Environment $Environment" -ForegroundColor Gray
    }
}

# List backups
function List-Backups {
    Write-Host "Available backups in $BackupPath :" -ForegroundColor Yellow
    Write-Host ""

    $backups = Get-ChildItem -Path $BackupPath -Filter "backup-*.sql" | Sort-Object LastWriteTime -Descending

    if ($backups.Count -eq 0) {
        Write-Host "No backups found." -ForegroundColor Yellow
        return
    }

    $backups | ForEach-Object {
        $size = [Math]::Round($_.Length / 1MB, 2)
        $age = (Get-Date) - $_.LastWriteTime

        $ageStr = if ($age.Days -gt 0) {
            "$($age.Days) days ago"
        } elseif ($age.Hours -gt 0) {
            "$($age.Hours) hours ago"
        } else {
            "$($age.Minutes) minutes ago"
        }

        Write-Host "$($_.Name)" -ForegroundColor White
        Write-Host "  Size: $size MB | Age: $ageStr" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "Total backups: $($backups.Count)" -ForegroundColor Cyan
    $totalSize = [Math]::Round(($backups | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    Write-Host "Total size: $totalSize MB" -ForegroundColor Cyan
}

# Cleanup old backups
function Cleanup-Backups {
    param([int]$RetentionDays)

    Write-Host "Cleaning up backups older than $RetentionDays days..." -ForegroundColor Yellow

    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    $oldBackups = Get-ChildItem -Path $BackupPath -Filter "backup-*.sql" |
                  Where-Object { $_.LastWriteTime -lt $cutoffDate }

    if ($oldBackups.Count -eq 0) {
        Write-Host "No old backups to remove." -ForegroundColor Green
        return
    }

    Write-Host "Found $($oldBackups.Count) old backups to remove:" -ForegroundColor Yellow
    $oldBackups | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Gray
        Remove-Item $_.FullName -Force
    }

    Write-Host "[SUCCESS] Removed $($oldBackups.Count) old backups" -ForegroundColor Green
}

# Main execution
switch ($Operation) {
    "backup" {
        $envsToBackup = if ($Environment -eq "all") {
            @("development", "testing", "production")
        } else {
            @($Environment)
        }

        $results = @()
        foreach ($env in $envsToBackup) {
            $backupFile = Backup-Database -EnvName $env -BackupDir $BackupPath
            $results += @{
                Environment = $env
                BackupFile = $backupFile
                Success = $null -ne $backupFile
            }
        }

        Write-Host ""
        Write-Host "Backup Summary:" -ForegroundColor Cyan
        Write-Host "---------------" -ForegroundColor Gray
        foreach ($result in $results) {
            $status = if ($result.Success) { "[SUCCESS]" } else { "[FAILED]" }
            $color = if ($result.Success) { "Green" } else { "Red" }
            Write-Host "$status $($result.Environment)" -ForegroundColor $color
        }
    }

    "restore" {
        if (-not $RestoreFile) {
            Write-Host "Please specify a backup file with -RestoreFile parameter" -ForegroundColor Red
            Write-Host ""
            List-Backups
            exit 1
        }

        $success = Restore-Database -EnvName $Environment -BackupFile $RestoreFile
        if ($success) {
            Write-Host ""
            Write-Host "Database restored successfully!" -ForegroundColor Green
        }
    }

    "schedule" {
        Schedule-Backups
    }

    "list" {
        List-Backups
    }

    "cleanup" {
        Cleanup-Backups -RetentionDays $RetentionDays
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " OPERATION COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Usage examples
if ($Operation -eq "backup") {
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Verify backup file was created" -ForegroundColor White
    Write-Host "2. Test restore to development environment" -ForegroundColor White
    Write-Host "3. Schedule automated backups with: .\$($MyInvocation.MyCommand.Name) -Operation schedule" -ForegroundColor White
}

Write-Host ""
Write-Host "Usage Examples:" -ForegroundColor Yellow
Write-Host "Backup all: .\render-backup-restore.ps1 -Operation backup -Environment all" -ForegroundColor Gray
Write-Host "Backup prod: .\render-backup-restore.ps1 -Operation backup -Environment production" -ForegroundColor Gray
Write-Host "Restore: .\render-backup-restore.ps1 -Operation restore -Environment development -RestoreFile backup-production-20240101-120000.sql" -ForegroundColor Gray
Write-Host "List: .\render-backup-restore.ps1 -Operation list" -ForegroundColor Gray
Write-Host "Schedule: .\render-backup-restore.ps1 -Operation schedule -Environment production" -ForegroundColor Gray
Write-Host "Cleanup: .\render-backup-restore.ps1 -Operation cleanup -RetentionDays 30" -ForegroundColor Gray