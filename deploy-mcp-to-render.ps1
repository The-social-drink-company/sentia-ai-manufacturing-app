# Deploy MCP Server to Render
# Clones Railway MCP configuration to Render

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   DEPLOYING MCP SERVER TO RENDER" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

# Your Render API Key
$RENDER_API_KEY = "rnd_mYUAytWRkb2Pj5GJROqNYubYt25J"

Write-Host "`n[STEP 1] Preparing MCP Server for Render..." -ForegroundColor Green

# Create MCP server render.yaml
$mcpRenderYaml = @"
services:
  # MCP Server - Enterprise AI Central Nervous System
  - type: web
    name: sentia-mcp-server
    runtime: node
    region: oregon
    plan: standard # $25/month for production reliability

    repo: https://github.com/The-social-drink-company/sentia-manufacturing-dashboard
    branch: development
    rootDir: mcp-server

    buildCommand: npm install
    startCommand: npm start

    healthCheckPath: /health

    envVars:
      # Core Configuration
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: LOG_LEVEL
        value: info

      # JWT Configuration
      - key: JWT_SECRET
        generateValue: true

      # AI Services - Claude (Anthropic)
      - key: ANTHROPIC_API_KEY
        value: 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

      # AI Services - OpenAI
      - key: OPENAI_API_KEY
        value: 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

      # Google AI (Optional)
      - key: GOOGLE_AI_API_KEY
        sync: false

      # Local LLM Configuration (Optional)
      - key: LOCAL_LLM_ENDPOINT
        value: http://localhost:11434
      - key: LOCAL_LLM_MODEL
        value: llama2

      # Database Connection (Shared with main app)
      - key: DATABASE_URL
        value: postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require

      # External Service APIs (For unified interface)
      - key: XERO_CLIENT_ID
        value: 9C0CAB921C134476A249E48BBECB8C4B
      - key: XERO_CLIENT_SECRET
        value: f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5

      - key: SHOPIFY_UK_API_KEY
        value: 7a30cd84e7a106b852c8e0fb789de10e
      - key: SHOPIFY_UK_ACCESS_TOKEN
        value: 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
      - key: SHOPIFY_UK_SHOP_URL
        value: sentiaspirits.myshopify.com

      - key: AMAZON_UK_MARKETPLACE_ID
        value: A1F83G8C2ARO7P
      - key: AMAZON_USA_MARKETPLACE_ID
        value: ATVPDKIKX0DER

      - key: UNLEASHED_API_ID
        value: d5313df6-db35-430c-a69e-ae27dffe0c5a
      - key: UNLEASHED_API_KEY
        value: 2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==

      # CORS Settings
      - key: CORS_ORIGINS
        value: https://sentia-manufacturing-development.onrender.com,https://sentia-manufacturing-testing.onrender.com,https://sentia-manufacturing-production.onrender.com

      # WebSocket Configuration
      - key: ENABLE_WEBSOCKET
        value: true
      - key: WS_HEARTBEAT_INTERVAL
        value: 30000

      # Redis Cache (Optional)
      - key: REDIS_URL
        sync: false

      # Feature Flags
      - key: ENABLE_AI_FEATURES
        value: true
      - key: ENABLE_VECTOR_DB
        value: true
      - key: ENABLE_DECISION_ENGINE
        value: true
"@

# Save MCP render.yaml
$mcpRenderYaml | Out-File -FilePath "mcp-server\render.yaml" -Encoding UTF8
Write-Host "Created mcp-server/render.yaml" -ForegroundColor Green

Write-Host "`n[STEP 2] Creating deployment script for MCP..." -ForegroundColor Green

# Create deployment instructions
$deployInstructions = @"
# MCP Server Deployment to Render

## Quick Deploy Steps:

1. **Push MCP configuration to GitHub**
   - The mcp-server folder already exists in your repo
   - render.yaml has been added with all configurations

2. **Deploy via Render Dashboard**
   - Go to https://dashboard.render.com
   - Click "New +" -> "Web Service"
   - Connect repository: The-social-drink-company/sentia-manufacturing-dashboard
   - Set root directory: mcp-server
   - Render will detect render.yaml automatically

3. **Service will be available at:**
   https://sentia-ai-manufacturing-app.onrender.com

## API Endpoints:
- Health: https://sentia-ai-manufacturing-app.onrender.com/health
- MCP Status: https://sentia-ai-manufacturing-app.onrender.com/mcp/status
- AI Request: https://sentia-ai-manufacturing-app.onrender.com/mcp/ai/request

## Connection from Main App:
Update these environment variables in your main services:
- MCP_SERVER_URL=https://sentia-ai-manufacturing-app.onrender.com
- MCP_JWT_SECRET=[same as MCP server]
"@

$deployInstructions | Out-File -FilePath "MCP_RENDER_DEPLOYMENT.md" -Encoding UTF8
Write-Host "Created MCP_RENDER_DEPLOYMENT.md" -ForegroundColor Green

Write-Host "`n[STEP 3] Updating main application to connect to Render MCP..." -ForegroundColor Green

# Update main app render.yaml to point to new MCP server
$mainAppUpdate = @{
    "MCP_SERVER_URL" = "https://sentia-ai-manufacturing-app.onrender.com"
    "MCP_ENABLE_WEBSOCKET" = "true"
    "MCP_SERVER_PORT" = "3001"
}

Write-Host "Main app should use these environment variables:" -ForegroundColor Yellow
foreach ($key in $mainAppUpdate.Keys) {
    Write-Host "  $key = $($mainAppUpdate[$key])" -ForegroundColor Cyan
}

Write-Host "`n[STEP 4] Committing changes..." -ForegroundColor Green

# Stage and commit changes
git add mcp-server/render.yaml MCP_RENDER_DEPLOYMENT.md 2>$null
git commit -m "feat: Configure MCP server for Render deployment - Clone Railway MCP configuration - Add all AI service integrations - Configure for enterprise deployment" 2>$null
git push origin development 2>$null

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   MCP SERVER READY FOR DEPLOYMENT" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Click 'New +' -> 'Web Service'" -ForegroundColor White
Write-Host "3. Select your repository" -ForegroundColor White
Write-Host "4. Set root directory to: mcp-server" -ForegroundColor White
Write-Host "5. Click 'Create Web Service'" -ForegroundColor White

Write-Host "`nYour MCP server will be available at:" -ForegroundColor Green
Write-Host "https://sentia-ai-manufacturing-app.onrender.com" -ForegroundColor Cyan

Write-Host "`nPress Enter to open Render Dashboard..." -ForegroundColor Yellow
Read-Host

Start-Process "https://dashboard.render.com/create/web"