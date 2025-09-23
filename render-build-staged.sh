#!/bin/bash

# Render Multi-Stage Build Script
# This script builds the application in stages to avoid memory issues

echo "========================================="
echo "RENDER MULTI-STAGE BUILD"
echo "========================================="
echo "Branch: $RENDER_GIT_BRANCH"
echo "Commit: $RENDER_GIT_COMMIT"
echo "Service: $RENDER_SERVICE_NAME"
echo "========================================="

# Determine deployment stage based on existing marker or environment variable
if [ -f "dist/deployment-stage.json" ]; then
  CURRENT_STAGE=$(node -p "require('./dist/deployment-stage.json').nextStage")
  echo "Found previous stage marker. Next stage: $CURRENT_STAGE"
else
  CURRENT_STAGE=${DEPLOYMENT_STAGE:-1}
  echo "Starting fresh deployment at stage: $CURRENT_STAGE"
fi

# Check if we should do staged deployment
if [ "$STAGED_DEPLOYMENT" = "true" ] || [ "$RENDER_SERVICE_NAME" = "sentia-manufacturing-development" ]; then
  echo "Using staged deployment strategy"

  # Stage 1: Core only
  if [ "$CURRENT_STAGE" = "1" ]; then
    echo "Building Stage 1: Core Infrastructure"
    export DEPLOYMENT_STAGE=1
    node deploy-stages.js

    # If successful, prepare for next stage
    if [ $? -eq 0 ]; then
      echo "Stage 1 complete. Ready for Stage 2."
    else
      echo "Stage 1 failed. Stopping deployment."
      exit 1
    fi
  fi

  # Stage 2: Essential features
  if [ "$CURRENT_STAGE" = "2" ]; then
    echo "Building Stage 2: Essential Business Features"
    export DEPLOYMENT_STAGE=2
    node deploy-stages.js

    if [ $? -eq 0 ]; then
      echo "Stage 2 complete. Ready for Stage 3."
    else
      echo "Stage 2 failed. Stopping deployment."
      exit 1
    fi
  fi

  # Stage 3: Analytics & AI
  if [ "$CURRENT_STAGE" = "3" ]; then
    echo "Building Stage 3: Analytics & AI"
    export DEPLOYMENT_STAGE=3
    node deploy-stages.js

    if [ $? -eq 0 ]; then
      echo "Stage 3 complete. Ready for Stage 4."
    else
      echo "Stage 3 failed. Stopping deployment."
      exit 1
    fi
  fi

  # Stage 4: Full enterprise
  if [ "$CURRENT_STAGE" = "4" ] || [ "$CURRENT_STAGE" = "complete" ]; then
    echo "Building Stage 4: Full Enterprise Application"
    export DEPLOYMENT_STAGE=4
    node deploy-stages.js

    if [ $? -eq 0 ]; then
      echo "Full deployment complete!"
    else
      echo "Stage 4 failed. Stopping deployment."
      exit 1
    fi
  fi

else
  # Regular full build
  echo "Using standard full build"
  NODE_OPTIONS='--max-old-space-size=4096' npm run build
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "========================================="
echo "BUILD COMPLETE"
echo "Stage: $CURRENT_STAGE"
echo "========================================="