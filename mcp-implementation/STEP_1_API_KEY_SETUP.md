# 🔑 Step 1: Render API Key Setup Guide

## Objective
Generate and securely configure Render API keys for MCP Server integration

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Admin access to Render Dashboard
- [ ] Password manager ready (1Password, LastPass, etc.)
- [ ] Access to Claude Code settings
- [ ] Secure notes application for temporary storage

---

## 🚀 Step-by-Step Instructions

### Part A: Generate Primary API Key

1. **Login to Render Dashboard**
   ```
   URL: https://dashboard.render.com
   Use your admin credentials
   ```

2. **Navigate to API Keys Section**
   ```
   Path: Account Settings → API Keys
   Or direct: https://dashboard.render.com/u/settings/api-keys
   ```

3. **Create Read-Only Production Key**
   - Click: "Create API Key"
   - Name: `MCP-PROD-READONLY-2024-12`
   - Description: "Read-only MCP access for production monitoring"
   - Click: "Create"

4. **Secure the Key**
   ```
   ⚠️ CRITICAL: The key is shown only once!

   1. Copy the key immediately
   2. Store in password manager:
      - Title: Render MCP Production Key
      - Username: MCP-PROD-READONLY-2024-12
      - Password: [paste key]
      - Notes: Read-only, rotate March 2025
   ```

### Part B: Generate Development Keys

5. **Create Development Key**
   - Click: "Create API Key" again
   - Name: `MCP-DEV-FULL-2024-12`
   - Description: "Full access MCP for development environment"
   - Store securely as above

6. **Create Testing Key**
   - Click: "Create API Key" again
   - Name: `MCP-TEST-FULL-2024-12`
   - Description: "Full access MCP for testing environment"
   - Store securely as above

---

## 🔧 Configuration

### Part C: Configure Claude Code

7. **Open Claude Code Settings**
   - In Claude Code, access settings/preferences
   - Look for MCP Servers configuration

8. **Add Render MCP Server**

Create a file at the appropriate location for your OS:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "render-production": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer rnd_XXXXXXXXXXXXXXXXXXXXX"
      }
    },
    "render-development": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer rnd_YYYYYYYYYYYYYYYYYYY"
      }
    }
  }
}
```

9. **Replace Placeholders**
   - Replace `rnd_XXXXXXXXXXXXXXXXXXXXX` with your production key
   - Replace `rnd_YYYYYYYYYYYYYYYYYYY` with your development key

10. **Save and Restart Claude Code**
    - Save the configuration file
    - Restart Claude Code completely
    - The MCP server should now be available

---

## ✅ Verification

### Part D: Test the Connection

11. **Test Query in Claude Code**

Try these queries:
```
"Using the Render MCP server, list all services"
```

Expected response: List of your Render services

```
"Show the status of sentia-manufacturing-production"
```

Expected response: Service details and health status

12. **Verify Audit Logging**

Check that queries are being logged:
```
"Show my recent MCP query history"
```

---

## 🔒 Security Validation

### Security Checklist
- [ ] Keys stored in password manager
- [ ] Keys NOT in any code files
- [ ] Keys NOT in git history
- [ ] Different keys for each environment
- [ ] Rotation reminder set for 3 months
- [ ] Access audit enabled

### Key Rotation Schedule
| Key | Created | Rotate By | Reminder Set |
|-----|---------|-----------|--------------|
| MCP-PROD-READONLY | Dec 16, 2024 | Mar 16, 2025 | [ ] |
| MCP-DEV-FULL | Dec 16, 2024 | Mar 16, 2025 | [ ] |
| MCP-TEST-FULL | Dec 16, 2024 | Mar 16, 2025 | [ ] |

---

## 🚨 Troubleshooting

### Common Issues

**Issue**: "Authentication failed"
- Solution: Check for extra spaces in the key
- Verify: Bearer token format is correct

**Issue**: "MCP server not found"
- Solution: Restart Claude Code
- Check: Configuration file location is correct

**Issue**: "Permission denied"
- Solution: Verify API key has correct permissions
- Check: Using the right key for the environment

---

## 📊 Success Criteria

You have successfully completed Step 1 when:
- [x] Three API keys generated (Prod, Test, Dev)
- [x] Keys securely stored in password manager
- [x] Claude Code configured with MCP servers
- [x] Test queries returning data
- [x] No keys exposed in code or logs

---

## 🎯 Next Steps

Once API keys are configured:
1. Proceed to Step 2: Security Audit Setup
2. Configure logging and monitoring
3. Set up pilot team access
4. Create initial query templates

---

## 📝 Documentation

Record your setup:

| Environment | Key Name | Created By | Date | Status |
|-------------|----------|------------|------|---------|
| Production | MCP-PROD-READONLY | [Your Name] | [Date] | [ ] Active |
| Development | MCP-DEV-FULL | [Your Name] | [Date] | [ ] Active |
| Testing | MCP-TEST-FULL | [Your Name] | [Date] | [ ] Active |

---

**Security Notice**: This document contains sensitive configuration information. Handle according to company security policies.