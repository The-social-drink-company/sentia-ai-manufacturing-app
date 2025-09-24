# Render and SSH Key Configuration

## Important: How Render Actually Works

**Render does NOT use SSH keys for deployment!** Render automatically pulls from your GitHub repository.

## Your Service Details
- **Service ID**: srv-d34fefur433s73cifuv0
- **Service URL**: https://mcp-server-tkyu.onrender.com

## When You Need SSH Keys

### 1. GitHub Deploy Key (Optional)
Only needed if you want extra security or if the repo becomes private.

**Steps:**
1. Go to: https://github.com/The-social-drink-company/sentia-manufacturing-dashboard/settings/keys
2. Click "Add deploy key"
3. Title: `MCP Server Deploy Key`
4. Paste this public key:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPh/LJC8YepvDJsEJBotiSeBcZ4nGFzr97H9uv+G2UO5 mcp-server@sentia-manufacturing
```
5. Check "Allow write access" if the MCP server needs to push changes

### 2. For MCP Server to Access Other Services

If your MCP server needs to SSH into other services, add the private key as an environment variable:

1. Go to: https://dashboard.render.com/web/srv-d34fefur433s73cifuv0
2. Click "Environment" in the left sidebar
3. Add environment variable:
   - **Key**: `MCP_SSH_PRIVATE_KEY`
   - **Value**: The private key content from ~/.ssh/mcp_server_key

Then in your MCP server code, you can use it like:
```javascript
// Write the key to a file when needed
const fs = require('fs');
const sshKey = process.env.MCP_SSH_PRIVATE_KEY;
if (sshKey) {
  fs.writeFileSync('/tmp/ssh_key', sshKey, { mode: 0o600 });
  // Use the key for SSH operations
}
```

## What Render Uses Instead

Render uses:
1. **Automatic Git sync** - Pulls from GitHub automatically
2. **Deploy hooks** - Webhooks from GitHub trigger deployments
3. **Build and start commands** - Defined in render.yaml or service settings

## Current Render Configuration

Your MCP server is configured with:
- **Auto-deploy**: Yes (from development branch)
- **Build Command**: `cd mcp-server && npm install`
- **Start Command**: `cd mcp-server && npm start`

## No Action Required

Since Render automatically deploys from GitHub, you don't need to configure SSH keys for deployment. The SSH key is only useful if:
1. You make the GitHub repo private
2. Your MCP server needs to SSH into other servers
3. You want to add an extra layer of security with deploy keys