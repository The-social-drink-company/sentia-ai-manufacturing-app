#!/bin/bash

# Optimized Install Script for Render
# Handles memory-constrained environments

echo "=== OPTIMIZED INSTALL SCRIPT ==="
echo "Starting memory-efficient package installation..."

# Set memory limits for npm
export NODE_OPTIONS="--max-old-space-size=2048"

# Clear npm cache first to free memory
echo "Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# Remove any existing node_modules to start fresh
echo "Cleaning previous installations..."
rm -rf node_modules package-lock.json 2>/dev/null || true

# Install in stages to reduce memory pressure
echo "Installing production dependencies first..."
npm install --production --no-save --prefer-offline --no-audit --loglevel=error

echo "Installing development dependencies..."
npm install --only=development --no-save --prefer-offline --no-audit --loglevel=error

# Verify installation
if [ -d "node_modules" ]; then
  echo "Dependencies installed successfully"
else
  echo "ERROR: Failed to install dependencies"
  exit 1
fi

echo "=== INSTALLATION COMPLETE ==="