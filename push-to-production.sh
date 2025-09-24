#!/bin/bash

# Production Deployment Push Script
# This script helps push the production fixes to GitHub

echo "=========================================="
echo "PUSHING PRODUCTION FIXES TO GITHUB"
echo "=========================================="

echo "Current Git Status:"
git status
echo ""

echo "Attempting to push to production branch..."
echo ""

# Attempt the push
git push origin production

if [ $? -eq 0 ]; then
    echo ""
    echo "SUCCESS: Changes pushed to GitHub!"
    echo ""
    echo "=========================================="
    echo "NEXT STEPS:"
    echo "=========================================="
    echo "1. Monitor Render dashboard for deployment"
    echo "2. Wait 2-5 minutes for deployment to complete"
    echo "3. Test: https://sentia-manufacturing-production.onrender.com/health"
    echo ""
    echo "Expected result: JSON response instead of 502 error"
    echo "=========================================="
else
    echo ""
    echo "FAILED: Could not push to GitHub"
    echo ""
    echo "Alternative options:"
    echo "1. Check your internet connection"
    echo "2. Verify GitHub credentials"
    echo "3. Try manual deployment via Render dashboard"
    echo ""
fi