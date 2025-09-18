#!/bin/bash

# Fix Render Deployment Script
# This script handles Prisma database migration issues

echo "🔧 Starting Render deployment fix..."

# Option 1: Accept data loss for development environment (quick fix)
if [ "$NODE_ENV" = "development" ] || [ "$NODE_ENV" = "test" ]; then
  echo "📝 Development/Test environment detected - accepting data loss for schema changes"
  npx prisma db push --accept-data-loss --skip-generate
else
  # Option 2: Use migrations for production (safer)
  echo "🚀 Production environment - using safe migration strategy"

  # Create migration if it doesn't exist
  npx prisma migrate deploy --schema=./prisma/schema.prisma || {
    echo "⚠️ Migration failed, attempting to resolve conflicts..."

    # Reset the database (only if absolutely necessary and authorized)
    if [ "$ALLOW_DB_RESET" = "true" ]; then
      echo "🔄 Resetting database (authorized by ALLOW_DB_RESET flag)"
      npx prisma migrate reset --force --skip-seed
    else
      echo "❌ Database has conflicts that require manual resolution"
      echo "Options:"
      echo "1. Set ALLOW_DB_RESET=true to reset the database"
      echo "2. Manually resolve duplicate values in the database"
      echo "3. Use npx prisma db push --accept-data-loss for development"
      exit 1
    fi
  }
fi

echo "✅ Database schema updated successfully"

# Continue with the regular build process
echo "🏗️ Continuing with application startup..."
node server.js