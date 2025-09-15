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
   https://sentia-mcp-server.onrender.com

## API Endpoints:
- Health: https://sentia-mcp-server.onrender.com/health
- MCP Status: https://sentia-mcp-server.onrender.com/mcp/status
- AI Request: https://sentia-mcp-server.onrender.com/mcp/ai/request

## Connection from Main App:
Update these environment variables in your main services:
- MCP_SERVER_URL=https://sentia-mcp-server.onrender.com
- MCP_JWT_SECRET=[same as MCP server]
