#!/bin/bash

# Clean Railway Deployment Script
# This script ensures clean environment variables

echo "Starting clean deployment process..."

# Check if running in Railway environment
if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    echo "Running in Railway environment: $RAILWAY_ENVIRONMENT"
    
    # List all environment variables (for debugging)
    echo "Environment variables check:"
    env | grep -E "^(NODE_ENV|VITE_|CLERK_|UNLEASHED_)" | sort
    
    # Check for critical variables
    if [ -z "$VITE_CLERK_PUBLISHABLE_KEY" ]; then
        echo "WARNING: VITE_CLERK_PUBLISHABLE_KEY is not set"
    else
        echo "✓ VITE_CLERK_PUBLISHABLE_KEY is set"
    fi
    
    if [ -z "$UNLEASHED_API_ID" ]; then
        echo "WARNING: UNLEASHED_API_ID is not set"
    else
        echo "✓ UNLEASHED_API_ID is set"
    fi
    
    if [ -z "$UNLEASHED_API_KEY" ]; then
        echo "WARNING: UNLEASHED_API_KEY is not set"
    else
        echo "✓ UNLEASHED_API_KEY is set"
    fi
fi

# Build the application
echo "Building application..."
npm ci && npm run build

# Start the server
echo "Starting server..."
npm run serve