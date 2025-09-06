#!/bin/bash

# 24/7 Autonomous Agent System Startup Script
# This script launches the autonomous agent orchestrator that manages all agents

echo "=========================================="
echo "   24/7 AUTONOMOUS AGENT SYSTEM v2.0    "
echo "=========================================="
echo ""
echo "Starting autonomous agent orchestrator..."
echo "- Commits every 5 minutes"
echo "- Auto-fixes across all branches"
echo "- Self-healing and recovery"
echo "- Railway/Nixpacks deployment"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Check if git is configured
git config user.name > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Configuring git user..."
    git config user.name "Autonomous Agent"
    git config user.email "agent@sentia-manufacturing.ai"
fi

# Check if Railway CLI is installed (optional)
if command -v railway &> /dev/null; then
    echo "✓ Railway CLI detected"
    export RAILWAY_DEPLOYMENT=true
else
    echo "⚠ Railway CLI not found (deployment features limited)"
    export RAILWAY_DEPLOYMENT=false
fi

# Create logs directory
mkdir -p agents/logs

# Set environment variables
export NODE_ENV=${NODE_ENV:-development}
export AGENT_MODE=autonomous
export AUTO_MERGE_ENABLED=true
export CYCLE_INTERVAL=${CYCLE_INTERVAL:-300000}  # 5 minutes default

# Function to handle shutdown
cleanup() {
    echo ""
    echo "Shutting down autonomous agents..."
    kill $ORCHESTRATOR_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the orchestrator
echo "Launching orchestrator..."
cd agents
node autonomous-orchestrator.js &
ORCHESTRATOR_PID=$!

echo ""
echo "✅ Autonomous Agent System is running!"
echo "   PID: $ORCHESTRATOR_PID"
echo "   Logs: agents/logs/"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Keep script running and monitor orchestrator
while true; do
    if ! kill -0 $ORCHESTRATOR_PID 2>/dev/null; then
        echo "⚠ Orchestrator stopped unexpectedly. Restarting..."
        node autonomous-orchestrator.js &
        ORCHESTRATOR_PID=$!
        echo "✅ Orchestrator restarted (PID: $ORCHESTRATOR_PID)"
    fi
    sleep 30
done