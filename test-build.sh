#!/bin/bash
# Test build script to simulate Railway Nixpacks build

echo "==================================="
echo "Railway Build Simulation"
echo "==================================="
echo ""

# Step 1: Clean install dependencies
echo "[1/3] Installing dependencies..."
npm ci --prefer-offline --no-audit

# Step 2: Build the application
echo ""
echo "[2/3] Building application..."
npm run build

# Step 3: Test the serve command
echo ""
echo "[3/3] Testing production server..."
echo "Run: npm run serve"
echo ""
echo "==================================="
echo "Build simulation complete!"
echo "==================================="