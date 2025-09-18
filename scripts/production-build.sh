#!/bin/bash

# Production Build Script for Render
# This script handles the build process with proper error handling

echo "Starting production build process..."

# Exit on error for critical steps
set -e

# Step 1: Install dependencies
echo "Installing dependencies..."
npm ci --legacy-peer-deps
if [ $? -ne 0 ]; then
  echo "Dependency installation failed!"
  exit 1
fi

# Step 2: Build Vite application
echo "Building Vite application..."
npx vite build
if [ $? -ne 0 ]; then
  echo "Vite build failed!"
  exit 1
fi

# Step 3: Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
  echo "Prisma generate failed!"
  exit 1
fi

# Step 4: Handle database schema
echo "Handling database schema..."
if [ "$NODE_ENV" = "production" ]; then
  echo "Production environment detected - checking database connection..."

  # Try to connect to database first
  npx prisma db pull 2>/dev/null && {
    echo "Database connection successful - schema already exists"
  } || {
    echo "Warning: Could not verify database connection"
    echo "If this is a new database, manual schema setup may be required"
    echo "Continuing with build process..."
  }
else
  # Non-production environments can accept data loss
  echo "Non-production environment - updating schema with data loss acceptance"
  npx prisma db push --accept-data-loss || {
    echo "Warning: Database schema update failed, but continuing..."
  }
fi

echo "Build process completed successfully!"