#!/bin/bash

echo "========================================"
echo "Railway 3-Branch Deployment Script"
echo "========================================"
echo

echo "Checking Railway CLI..."
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo
echo "Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway first:"
    echo "railway login"
    exit 1
fi

echo
echo "Setting up environment variables..."
node scripts/setup-railway-env.js

echo
echo "Deploying to all environments..."
node scripts/railway-deploy.js

echo
echo "Verifying deployments..."
node scripts/verify-deployments.js

echo
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo
echo "URLs:"
echo "Development:  https://dev.sentia-manufacturing.railway.app"
echo "Testing:      https://test.sentia-manufacturing.railway.app"
echo "Production:   https://sentia-manufacturing.railway.app"
echo
