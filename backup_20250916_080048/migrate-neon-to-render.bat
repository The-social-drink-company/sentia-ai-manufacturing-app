@echo off
REM Database Migration Script: Neon to Render PostgreSQL (Windows)
REM This script helps migrate data from Neon to Render's integrated PostgreSQL

echo =========================================
echo Neon to Render PostgreSQL Migration Tool
echo =========================================

REM Configuration
set NEON_DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
set RENDER_DATABASE_URL=
set BACKUP_DIR=.\database-backups
set TIMESTAMP=%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\neon_backup_%TIMESTAMP%.dump

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo.
echo Step 1: Checking prerequisites...

REM Check if pg_dump is available
where pg_dump >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: pg_dump is not installed. Please install PostgreSQL client tools.
    echo Download from: https://www.postgresql.org/download/windows/
    echo Make sure to add PostgreSQL bin directory to your PATH
    pause
    exit /b 1
)

REM Check if pg_restore is available
where pg_restore >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: pg_restore is not installed. Please install PostgreSQL client tools.
    pause
    exit /b 1
)

echo Prerequisites check passed!

REM Step 2: Export from Neon
echo.
echo Step 2: Exporting data from Neon...
echo Creating backup at: %BACKUP_FILE%

pg_dump "%NEON_DATABASE_URL%" --format=custom --no-owner --no-privileges --verbose --file="%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo Successfully exported data from Neon!
    for %%A in ("%BACKUP_FILE%") do echo Backup size: %%~zA bytes
) else (
    echo Failed to export data from Neon
    pause
    exit /b 1
)

REM Step 3: Get Render database URL
echo.
echo Step 3: Render Database Setup
echo.
echo Please complete these steps in Render Dashboard:
echo 1. Deploy your application using the updated render.yaml
echo 2. Wait for the PostgreSQL database to be created
echo 3. Find your database connection string in Render Dashboard:
echo    - Go to your database service (sentia-db)
echo    - Click on 'Connect' button
echo    - Copy the 'External Connection String'
echo.
set /p RENDER_DATABASE_URL=Enter your Render PostgreSQL connection string:

if "%RENDER_DATABASE_URL%"=="" (
    echo No connection string provided. Exiting.
    pause
    exit /b 1
)

REM Step 4: Import to Render
echo.
echo Step 4: Importing data to Render PostgreSQL...

REM Run Prisma migrations first
echo Running Prisma migrations...
set DATABASE_URL=%RENDER_DATABASE_URL%
call npx prisma migrate deploy

if %ERRORLEVEL% NEQ 0 (
    echo Warning: Prisma migrations failed. Attempting direct restore...
)

REM Restore the data
pg_restore "%RENDER_DATABASE_URL%" --verbose --no-owner --no-privileges --data-only "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo Successfully imported data to Render!
) else (
    echo Direct restore had issues. Trying SQL format...

    REM Convert to SQL and try again
    set SQL_FILE=%BACKUP_DIR%\neon_backup_%TIMESTAMP%.sql
    pg_restore "%BACKUP_FILE%" --file="%SQL_FILE%" --no-owner --no-privileges
    psql "%RENDER_DATABASE_URL%" < "%SQL_FILE%"

    if %ERRORLEVEL% EQU 0 (
        echo Successfully imported using SQL format!
    ) else (
        echo Import failed. Please check the error messages above.
        pause
        exit /b 1
    )
)

REM Step 5: Verify migration
echo.
echo Step 5: Verifying migration...

REM Count tables in Render database
for /f "tokens=*" %%i in ('psql "%RENDER_DATABASE_URL%" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"') do set TABLE_COUNT=%%i

echo Tables in Render database: %TABLE_COUNT%

echo.
echo =========================================
echo Migration Complete!
echo =========================================
echo.
echo Post-Migration Checklist:
echo [ ] Test application connectivity to new database
echo [ ] Verify all data has been transferred correctly
echo [ ] Update any hardcoded connection strings in your codebase
echo [ ] Update environment variables in all environments (dev, test, prod)
echo [ ] Test critical application features
echo [ ] Monitor application logs for database errors
echo.
echo Once everything is verified working:
echo 1. Keep Neon running for 24-48 hours as backup
echo 2. After confirming stability, cancel Neon subscription
echo 3. Keep local backup file: %BACKUP_FILE%
echo.
echo Important: Your backup is saved at:
echo %BACKUP_FILE%
echo Keep this file safe until migration is fully verified!

pause