#!/bin/bash

# Optimized startup script for production deployment
echo "Starting Sentia Manufacturing Dashboard with memory optimization..."

# Set production environment
export NODE_ENV=production

# Set Node.js memory options for Render Starter (512MB limit)
export NODE_OPTIONS="--max-old-space-size=384 --expose-gc"

# Build the application
echo "Building production bundle..."
npm run build

# Start server with garbage collection enabled
echo "Starting optimized server..."
node --expose-gc server-optimized.js