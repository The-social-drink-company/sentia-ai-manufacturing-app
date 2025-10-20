#!/bin/bash

echo "Starting CapLiquify Manufacturing Platform with migration resolution..."

# Resolve any failed migrations first
echo "Resolving failed migration 20250909_api_keys_management..."
pnpm prisma migrate resolve --rolled-back 20250909_api_keys_management || echo "Migration resolution failed or not needed"

# Deploy all migrations
echo "Deploying migrations..."
pnpm prisma migrate deploy

# Start the server
echo "Starting server..."
node server-enterprise-complete.js
