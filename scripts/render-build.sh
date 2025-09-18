#!/bin/bash

# Render Build Script
# This script handles the build process for Render deployment

echo "Starting Render build process..."

# Exit on error
set -e

# Check if we're in production environment
if [ "$NODE_ENV" = "production" ]; then
  echo "Production environment detected"
fi

# Step 1: Build the Vite application
echo "Building Vite application..."
npx vite build
if [ $? -ne 0 ]; then
  echo "Vite build failed!"
  exit 1
fi

# Step 2: Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
  echo "Prisma generate failed!"
  exit 1
fi

# Step 3: Push database schema (with data loss acceptance for dev/test)
echo "Updating database schema..."
if [ "$NODE_ENV" = "production" ]; then
  echo "Production environment - using safe migration"
  npx prisma migrate deploy || {
    echo "Migration failed, attempting db push with data loss acceptance"
    npx prisma db push --accept-data-loss
  }
else
  echo "Non-production environment - accepting data loss"
  npx prisma db push --accept-data-loss
fi

if [ $? -ne 0 ]; then
  echo "Database update failed!"
  exit 1
fi

echo "Build process completed successfully!"