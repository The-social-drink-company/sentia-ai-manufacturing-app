#!/bin/bash
# Database Migration Script: Neon to Render PostgreSQL
# This script helps migrate data from Neon to Render's integrated PostgreSQL

echo "========================================="
echo "Neon to Render PostgreSQL Migration Tool"
echo "========================================="

# Configuration
NEON_DATABASE_URL="postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
RENDER_DATABASE_URL="" # Will be provided by Render after database creation
BACKUP_DIR="./database-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/neon_backup_$TIMESTAMP.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check if pg_dump is installed
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}Error: pg_dump is not installed. Please install PostgreSQL client tools.${NC}"
    echo "Installation instructions:"
    echo "  - Windows: Download from https://www.postgresql.org/download/windows/"
    echo "  - Mac: brew install postgresql"
    echo "  - Linux: sudo apt-get install postgresql-client"
    exit 1
fi

# Check if pg_restore is installed
if ! command -v pg_restore &> /dev/null; then
    echo -e "${RED}Error: pg_restore is not installed. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

echo -e "${GREEN}Prerequisites check passed!${NC}"

# Step 2: Export from Neon
echo -e "${YELLOW}Step 2: Exporting data from Neon...${NC}"
echo "Creating backup at: $BACKUP_FILE"

# Export with custom format for flexibility
pg_dump "$NEON_DATABASE_URL" \
    --format=custom \
    --no-owner \
    --no-privileges \
    --verbose \
    --file="$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Successfully exported data from Neon!${NC}"
    echo "Backup size: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo -e "${RED}Failed to export data from Neon${NC}"
    exit 1
fi

# Step 3: Wait for Render database URL
echo -e "${YELLOW}Step 3: Render Database Setup${NC}"
echo ""
echo "Please complete these steps in Render Dashboard:"
echo "1. Deploy your application using the updated render.yaml"
echo "2. Wait for the PostgreSQL database to be created"
echo "3. Find your database connection string in Render Dashboard:"
echo "   - Go to your database service (sentia-db)"
echo "   - Click on 'Connect' button"
echo "   - Copy the 'External Connection String'"
echo ""
read -p "Enter your Render PostgreSQL connection string: " RENDER_DATABASE_URL

if [ -z "$RENDER_DATABASE_URL" ]; then
    echo -e "${RED}No connection string provided. Exiting.${NC}"
    exit 1
fi

# Step 4: Import to Render
echo -e "${YELLOW}Step 4: Importing data to Render PostgreSQL...${NC}"

# First, let's create the database schema using Prisma
echo "Running Prisma migrations..."
DATABASE_URL="$RENDER_DATABASE_URL" npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Warning: Prisma migrations failed. Attempting direct restore...${NC}"
fi

# Restore the data
pg_restore "$RENDER_DATABASE_URL" \
    --verbose \
    --no-owner \
    --no-privileges \
    --data-only \
    "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Successfully imported data to Render!${NC}"
else
    echo -e "${YELLOW}Direct restore had issues. Trying SQL format...${NC}"

    # Convert to SQL and try again
    SQL_FILE="$BACKUP_DIR/neon_backup_$TIMESTAMP.sql.txt"
    pg_restore "$BACKUP_FILE" --file="$SQL_FILE" --no-owner --no-privileges
    psql "$RENDER_DATABASE_URL" < "$SQL_FILE"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Successfully imported using SQL format!${NC}"
    else
        echo -e "${RED}Import failed. Please check the error messages above.${NC}"
        exit 1
    fi
fi

# Step 5: Verify migration
echo -e "${YELLOW}Step 5: Verifying migration...${NC}"

# Count tables in Render database
TABLE_COUNT=$(psql "$RENDER_DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

echo "Tables in Render database: $TABLE_COUNT"

if [ $TABLE_COUNT -gt 0 ]; then
    echo -e "${GREEN}Migration verification passed!${NC}"
else
    echo -e "${RED}Warning: No tables found. Please verify the migration manually.${NC}"
fi

# Step 6: Post-migration checklist
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Migration Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Post-Migration Checklist:"
echo "[ ] Test application connectivity to new database"
echo "[ ] Verify all data has been transferred correctly"
echo "[ ] Update any hardcoded connection strings in your codebase"
echo "[ ] Update environment variables in all environments (dev, test, prod)"
echo "[ ] Test critical application features"
echo "[ ] Monitor application logs for database errors"
echo ""
echo "Once everything is verified working:"
echo "1. Keep Neon running for 24-48 hours as backup"
echo "2. After confirming stability, cancel Neon subscription"
echo "3. Keep local backup file: $BACKUP_FILE"
echo ""
echo -e "${YELLOW}Important: Your backup is saved at:${NC}"
echo "$BACKUP_FILE"
echo "Keep this file safe until migration is fully verified!"