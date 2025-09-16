# Database Migration Script for Render PostgreSQL
# Migrates data from Railway/Neon to Render PostgreSQL

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("export", "import", "sync", "validate")]
    [string]$Operation,

    [Parameter(Mandatory=$false)]
    [string]$SourceDB = $env:DATABASE_URL,

    [Parameter(Mandatory=$false)]
    [string]$TargetDB = "",

    [Parameter(Mandatory=$false)]
    [string]$BackupFile = "sentia-db-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').sql"
)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " DATABASE MIGRATION TOOL" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Operation: $Operation" -ForegroundColor White
Write-Host ""

# Helper function to parse connection string
function Parse-ConnectionString {
    param([string]$ConnStr)

    if ($ConnStr -match "postgresql://([^:]+):([^@]+)@([^/]+)/([^?]+)") {
        return @{
            User = $matches[1]
            Password = $matches[2]
            Host = $matches[3].Split(':')[0]
            Port = if ($matches[3].Contains(':')) { $matches[3].Split(':')[1].Split('-')[0] } else { "5432" }
            Database = $matches[4]
        }
    }
    return $null
}

# Check for pg_dump and psql
function Check-PostgresTools {
    $pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
    $psql = Get-Command psql -ErrorAction SilentlyContinue

    if (-not $pgDump -or -not $psql) {
        Write-Host "PostgreSQL tools not found!" -ForegroundColor Red
        Write-Host "Please install PostgreSQL client tools:" -ForegroundColor Yellow
        Write-Host "  Windows: Download from https://www.postgresql.org/download/windows/" -ForegroundColor White
        Write-Host "  Or use: choco install postgresql" -ForegroundColor White
        return $false
    }
    return $true
}

# Export database
function Export-Database {
    param(
        [string]$ConnectionString,
        [string]$OutputFile
    )

    Write-Host "Exporting database..." -ForegroundColor Yellow

    $db = Parse-ConnectionString -ConnStr $ConnectionString
    if (-not $db) {
        Write-Host "Invalid connection string" -ForegroundColor Red
        return $false
    }

    $env:PGPASSWORD = $db.Password

    $pgDumpArgs = @(
        "-h", $db.Host,
        "-p", $db.Port,
        "-U", $db.User,
        "-d", $db.Database,
        "-f", $OutputFile,
        "--verbose",
        "--no-owner",
        "--no-acl",
        "--clean",
        "--if-exists"
    )

    Write-Host "Exporting from: $($db.Host)/$($db.Database)" -ForegroundColor Gray

    $result = & pg_dump @pgDumpArgs 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Export successful!" -ForegroundColor Green
        Write-Host "Backup saved to: $OutputFile" -ForegroundColor Green

        $size = (Get-Item $OutputFile).Length / 1MB
        Write-Host "Backup size: $([Math]::Round($size, 2)) MB" -ForegroundColor Gray
        return $true
    } else {
        Write-Host "Export failed!" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        return $false
    }
}

# Import database
function Import-Database {
    param(
        [string]$ConnectionString,
        [string]$InputFile
    )

    if (-not (Test-Path $InputFile)) {
        Write-Host "Backup file not found: $InputFile" -ForegroundColor Red
        return $false
    }

    Write-Host "Importing database..." -ForegroundColor Yellow
    Write-Host "Source file: $InputFile" -ForegroundColor Gray

    $db = Parse-ConnectionString -ConnStr $ConnectionString
    if (-not $db) {
        Write-Host "Invalid connection string" -ForegroundColor Red
        return $false
    }

    $env:PGPASSWORD = $db.Password

    $psqlArgs = @(
        "-h", $db.Host,
        "-p", $db.Port,
        "-U", $db.User,
        "-d", $db.Database,
        "-f", $InputFile,
        "--set", "ON_ERROR_STOP=on"
    )

    Write-Host "Importing to: $($db.Host)/$($db.Database)" -ForegroundColor Gray
    Write-Host "This may take several minutes..." -ForegroundColor Yellow

    $result = & psql @psqlArgs 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Import successful!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "Import failed!" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        return $false
    }
}

# Validate database
function Validate-Database {
    param(
        [string]$ConnectionString
    )

    Write-Host "Validating database..." -ForegroundColor Yellow

    $db = Parse-ConnectionString -ConnStr $ConnectionString
    if (-not $db) {
        Write-Host "Invalid connection string" -ForegroundColor Red
        return $false
    }

    $env:PGPASSWORD = $db.Password

    # Test connection
    $testQuery = "SELECT version();"
    $result = & psql -h $db.Host -p $db.Port -U $db.User -d $db.Database -c $testQuery -t 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Connection successful!" -ForegroundColor Green
        Write-Host "Database version: $result" -ForegroundColor Gray

        # Count tables
        $tableQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
        $tableCount = & psql -h $db.Host -p $db.Port -U $db.User -d $db.Database -c $tableQuery -t 2>&1
        Write-Host "Tables found: $($tableCount.Trim())" -ForegroundColor Gray

        # Count records in key tables
        $tables = @("User", "Job", "Product", "Customer", "Supplier")
        foreach ($table in $tables) {
            $countQuery = "SELECT COUNT(*) FROM `"$table`" 2>/dev/null;"
            $count = & psql -h $db.Host -p $db.Port -U $db.User -d $db.Database -c $countQuery -t 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  $table : $($count.Trim()) records" -ForegroundColor White
            }
        }

        return $true
    } else {
        Write-Host "Connection failed!" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        return $false
    }
}

# Sync databases (export + import)
function Sync-Databases {
    param(
        [string]$Source,
        [string]$Target,
        [string]$TempFile
    )

    Write-Host "Starting database sync..." -ForegroundColor Yellow
    Write-Host "This will:" -ForegroundColor White
    Write-Host "1. Export from source database" -ForegroundColor Gray
    Write-Host "2. Import to target database" -ForegroundColor Gray
    Write-Host "3. Validate the import" -ForegroundColor Gray
    Write-Host ""

    # Step 1: Export
    if (Export-Database -ConnectionString $Source -OutputFile $TempFile) {
        Write-Host ""

        # Step 2: Import
        if (Import-Database -ConnectionString $Target -InputFile $TempFile) {
            Write-Host ""

            # Step 3: Validate
            if (Validate-Database -ConnectionString $Target) {
                Write-Host ""
                Write-Host "Sync completed successfully!" -ForegroundColor Green

                # Optionally remove temp file
                Write-Host "Keep backup file? (y/n): " -NoNewline -ForegroundColor Yellow
                $keep = Read-Host
                if ($keep -ne 'y') {
                    Remove-Item $TempFile -Force
                    Write-Host "Backup file deleted" -ForegroundColor Gray
                }

                return $true
            }
        }
    }

    Write-Host "Sync failed!" -ForegroundColor Red
    return $false
}

# Main execution
if (-not (Check-PostgresTools)) {
    exit 1
}

switch ($Operation) {
    "export" {
        if (-not $SourceDB) {
            Write-Host "Source database connection string required!" -ForegroundColor Red
            Write-Host "Use: -SourceDB 'postgresql://...'" -ForegroundColor Yellow
            exit 1
        }
        Export-Database -ConnectionString $SourceDB -OutputFile $BackupFile
    }

    "import" {
        if (-not $TargetDB) {
            Write-Host "Target database connection string required!" -ForegroundColor Red
            Write-Host "Use: -TargetDB 'postgresql://...'" -ForegroundColor Yellow
            exit 1
        }
        if (-not (Test-Path $BackupFile)) {
            Write-Host "Backup file required!" -ForegroundColor Red
            Write-Host "Use: -BackupFile 'path/to/backup.sql'" -ForegroundColor Yellow
            exit 1
        }
        Import-Database -ConnectionString $TargetDB -InputFile $BackupFile
    }

    "sync" {
        if (-not $SourceDB -or -not $TargetDB) {
            Write-Host "Both source and target database connection strings required!" -ForegroundColor Red
            Write-Host "Use: -SourceDB 'postgresql://...' -TargetDB 'postgresql://...'" -ForegroundColor Yellow
            exit 1
        }
        Sync-Databases -Source $SourceDB -Target $TargetDB -TempFile $BackupFile
    }

    "validate" {
        if (-not $SourceDB) {
            Write-Host "Database connection string required!" -ForegroundColor Red
            Write-Host "Use: -SourceDB 'postgresql://...'" -ForegroundColor Yellow
            exit 1
        }
        Validate-Database -ConnectionString $SourceDB
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " OPERATION COMPLETE" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan

# Usage examples
Write-Host ""
Write-Host "Usage Examples:" -ForegroundColor Yellow
Write-Host "---------------" -ForegroundColor Gray
Write-Host "Export: .\database-migration-render.ps1 -Operation export -SourceDB 'postgresql://...'" -ForegroundColor White
Write-Host "Import: .\database-migration-render.ps1 -Operation import -TargetDB 'postgresql://...' -BackupFile 'backup.sql'" -ForegroundColor White
Write-Host "Sync: .\database-migration-render.ps1 -Operation sync -SourceDB 'postgresql://...' -TargetDB 'postgresql://...'" -ForegroundColor White
Write-Host "Validate: .\database-migration-render.ps1 -Operation validate -SourceDB 'postgresql://...'" -ForegroundColor White