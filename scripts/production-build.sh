#!/bin/bash

# Production Build Script for Render
# This script handles the production build, skipping database migrations in production

echo "=== Starting Production Build ==="
set -e  # Exit on error for critical steps

# Install dependencies
echo "Installing dependencies..."
npm ci --legacy-peer-deps

# Build the application
echo "Building Vite application..."
npx vite build

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Skip database push in production - schema already exists
echo "=== Skipping database push in production ==="
echo "Database schema is already deployed in production"
echo "If you need to update the schema, please do so manually"

echo "=== Production Build Complete ==="