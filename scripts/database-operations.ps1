# Sentia Manufacturing Dashboard - Database Operations Script
# Handles migrations, backups, and database maintenance

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("migrate", "backup", "restore", "seed", "reset", "status", "maintenance")]
    [string]$Operation,

    [Parameter()]
    [ValidateSet("development", "testing", "production")]
    [string]$Environment = "development",

    [Parameter()]
    [string]$BackupFile,

    [Parameter()]
    [switch]$Force
)

# Load environment variables
$envFile = ".env.$Environment.railway"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$' -and $_ -notmatch '^#') {
            $key = $Matches[1].Trim()
            $value = $Matches[2].Trim().Trim('"', "'")
            if ($value -notmatch '\$\{\{.*\}\}') {
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
}

# Get database URL
$DATABASE_URL = [Environment]::GetEnvironmentVariable("DATABASE_URL", "Process")

if (-not $DATABASE_URL) {
    Write-Host "ERROR: DATABASE_URL not found for $Environment environment" -ForegroundColor Red
    exit 1
}

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to run Prisma commands
function Invoke-Prisma {
    param(
        [string]$Command
    )

    $env:DATABASE_URL = $DATABASE_URL
    npx prisma $Command
}

# Function to run PostgreSQL commands
function Invoke-Postgres {
    param(
        [string]$Command,
        [string]$File
    )

    if ($File) {
        psql $DATABASE_URL -f $File
    }
    else {
        psql $DATABASE_URL -c $Command
    }
}

# Migrate operation
function Invoke-Migrate {
    Write-ColorOutput "Running database migrations for $Environment..." -Color Yellow

    # Generate Prisma client
    Write-ColorOutput "Generating Prisma client..." -Color Cyan
    Invoke-Prisma "generate"

    # Run migrations
    Write-ColorOutput "Applying migrations..." -Color Cyan
    Invoke-Prisma "migrate deploy"

    Write-ColorOutput "Migrations completed successfully!" -Color Green
}

# Backup operation
function Invoke-Backup {
    Write-ColorOutput "Creating database backup for $Environment..." -Color Yellow

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = "backups"

    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }

    $backupFile = "$backupDir\backup_${Environment}_${timestamp}.sql"

    Write-ColorOutput "Backing up to: $backupFile" -Color Cyan

    # Create backup
    $command = "pg_dump '$DATABASE_URL' --no-owner --no-acl --clean --if-exists"

    if ($Environment -eq "production") {
        # For production, exclude sensitive tables if needed
        $command += " --exclude-table=audit_logs"
    }

    Invoke-Expression "$command > $backupFile"

    if ($LASTEXITCODE -eq 0) {
        $size = (Get-Item $backupFile).Length / 1MB
        Write-ColorOutput "Backup created successfully! Size: $([math]::Round($size, 2)) MB" -Color Green

        # Compress backup
        Write-ColorOutput "Compressing backup..." -Color Cyan
        Compress-Archive -Path $backupFile -DestinationPath "$backupFile.zip"
        Remove-Item $backupFile

        Write-ColorOutput "Backup compressed: $backupFile.zip" -Color Green
    }
    else {
        Write-ColorOutput "Backup failed!" -Color Red
        exit 1
    }
}

# Restore operation
function Invoke-Restore {
    if (-not $BackupFile) {
        Write-ColorOutput "ERROR: BackupFile parameter required for restore operation" -Color Red
        exit 1
    }

    if (-not (Test-Path $BackupFile)) {
        Write-ColorOutput "ERROR: Backup file not found: $BackupFile" -Color Red
        exit 1
    }

    if ($Environment -eq "production" -and -not $Force) {
        Write-ColorOutput "WARNING: You are about to restore the PRODUCTION database!" -Color Yellow
        Write-ColorOutput "This will DELETE all existing data!" -Color Red
        $confirm = Read-Host "Type 'RESTORE PRODUCTION' to confirm"

        if ($confirm -ne "RESTORE PRODUCTION") {
            Write-ColorOutput "Restore cancelled" -Color Yellow
            exit 0
        }
    }

    Write-ColorOutput "Restoring database for $Environment from $BackupFile..." -Color Yellow

    # Extract if compressed
    if ($BackupFile -like "*.zip") {
        Write-ColorOutput "Extracting backup..." -Color Cyan
        $extractPath = $BackupFile -replace ".zip", ""
        Expand-Archive -Path $BackupFile -DestinationPath (Split-Path $BackupFile) -Force
        $BackupFile = $extractPath
    }

    # Restore database
    psql $DATABASE_URL -f $BackupFile

    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "Database restored successfully!" -Color Green

        # Run migrations to ensure schema is up to date
        Write-ColorOutput "Running migrations to update schema..." -Color Cyan
        Invoke-Migrate
    }
    else {
        Write-ColorOutput "Restore failed!" -Color Red
        exit 1
    }
}

# Seed operation
function Invoke-Seed {
    Write-ColorOutput "Seeding database for $Environment..." -Color Yellow

    if ($Environment -eq "production" -and -not $Force) {
        Write-ColorOutput "WARNING: Seeding production database is not recommended!" -Color Red
        $confirm = Read-Host "Are you sure? (yes/no)"

        if ($confirm -ne "yes") {
            Write-ColorOutput "Seed cancelled" -Color Yellow
            exit 0
        }
    }

    # Run seed script
    Write-ColorOutput "Running seed script..." -Color Cyan
    Invoke-Prisma "db seed"

    Write-ColorOutput "Database seeded successfully!" -Color Green
}

# Reset operation
function Invoke-Reset {
    if ($Environment -eq "production") {
        Write-ColorOutput "ERROR: Cannot reset production database!" -Color Red
        Write-ColorOutput "Use restore operation instead" -Color Yellow
        exit 1
    }

    Write-ColorOutput "Resetting database for $Environment..." -Color Yellow
    Write-ColorOutput "This will DELETE all data and recreate the schema!" -Color Red

    if (-not $Force) {
        $confirm = Read-Host "Are you sure? (yes/no)"

        if ($confirm -ne "yes") {
            Write-ColorOutput "Reset cancelled" -Color Yellow
            exit 0
        }
    }

    # Reset database
    Write-ColorOutput "Resetting database..." -Color Cyan
    Invoke-Prisma "migrate reset --force"

    Write-ColorOutput "Database reset successfully!" -Color Green
}

# Status operation
function Invoke-Status {
    Write-ColorOutput "Checking database status for $Environment..." -Color Yellow

    # Check connection
    Write-ColorOutput "`nConnection Test:" -Color Cyan
    try {
        Invoke-Postgres "SELECT version();" | Out-String
        Write-ColorOutput "✓ Database connection successful" -Color Green
    }
    catch {
        Write-ColorOutput "✗ Database connection failed" -Color Red
        exit 1
    }

    # Check migration status
    Write-ColorOutput "`nMigration Status:" -Color Cyan
    Invoke-Prisma "migrate status"

    # Check database size
    Write-ColorOutput "`nDatabase Size:" -Color Cyan
    $sizeQuery = @"
SELECT
    pg_database.datname as database,
    pg_size_pretty(pg_database_size(pg_database.datname)) as size
FROM pg_database
WHERE datname = current_database();
"@
    Invoke-Postgres $sizeQuery

    # Check table counts
    Write-ColorOutput "`nTable Record Counts:" -Color Cyan
    $countQuery = @"
SELECT
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC
LIMIT 10;
"@
    Invoke-Postgres $countQuery

    # Check active connections
    Write-ColorOutput "`nActive Connections:" -Color Cyan
    $connectionQuery = @"
SELECT
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active,
    count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity
WHERE datname = current_database();
"@
    Invoke-Postgres $connectionQuery
}

# Maintenance operation
function Invoke-Maintenance {
    Write-ColorOutput "Running database maintenance for $Environment..." -Color Yellow

    if ($Environment -eq "production" -and -not $Force) {
        Write-ColorOutput "WARNING: Running maintenance on production database" -Color Yellow
        Write-ColorOutput "This may temporarily affect performance" -Color Yellow
        $confirm = Read-Host "Continue? (yes/no)"

        if ($confirm -ne "yes") {
            Write-ColorOutput "Maintenance cancelled" -Color Yellow
            exit 0
        }
    }

    # Analyze tables
    Write-ColorOutput "Analyzing tables..." -Color Cyan
    Invoke-Postgres "ANALYZE;"

    # Vacuum database
    Write-ColorOutput "Running VACUUM..." -Color Cyan
    Invoke-Postgres "VACUUM ANALYZE;"

    # Reindex if needed
    Write-ColorOutput "Checking index health..." -Color Cyan
    $indexQuery = @"
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexrelid > 16384
ORDER BY pg_relation_size(indexrelid) DESC;
"@

    $unusedIndexes = Invoke-Postgres $indexQuery
    if ($unusedIndexes) {
        Write-ColorOutput "Found unused indexes that could be removed:" -Color Yellow
        Write-Output $unusedIndexes
    }

    # Check for bloat
    Write-ColorOutput "Checking for table bloat..." -Color Cyan
    $bloatQuery = @"
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
"@

    $bloat = Invoke-Postgres $bloatQuery
    if ($bloat) {
        Write-ColorOutput "Tables with dead tuples:" -Color Yellow
        Write-Output $bloat
    }

    Write-ColorOutput "Database maintenance completed!" -Color Green
}

# Main execution
Write-ColorOutput "=========================================" -Color Blue
Write-ColorOutput "Sentia Database Operations" -Color Blue
Write-ColorOutput "=========================================" -Color Blue
Write-ColorOutput "Environment: $Environment" -Color Cyan
Write-ColorOutput "Operation: $Operation" -Color Cyan
Write-ColorOutput "" -Color White

switch ($Operation) {
    "migrate" { Invoke-Migrate }
    "backup" { Invoke-Backup }
    "restore" { Invoke-Restore }
    "seed" { Invoke-Seed }
    "reset" { Invoke-Reset }
    "status" { Invoke-Status }
    "maintenance" { Invoke-Maintenance }
    default {
        Write-ColorOutput "ERROR: Unknown operation: $Operation" -Color Red
        exit 1
    }
}

Write-ColorOutput "" -Color White
Write-ColorOutput "=========================================" -Color Blue
Write-ColorOutput "Operation completed successfully!" -Color Green
Write-ColorOutput "=========================================" -Color Blue