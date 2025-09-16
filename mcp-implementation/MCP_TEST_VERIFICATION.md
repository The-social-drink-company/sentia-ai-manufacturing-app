# ✅ MCP Connection Test & Verification

**Date**: December 16, 2024
**Status**: Testing Phase
**Config Location**: `C:\Users\User\AppData\Roaming\Claude\claude_desktop_config.json`

---

## 🧪 Test Sequence

### Test 1: Basic Connection
**Query to try:**
```
Using the Render MCP server, list all my services
```

**Expected Result:**
- List of your Render services
- Should include: sentia-manufacturing-production, testing, development
- MCP server: https://mcp-server-tkyu.onrender.com

**Actual Result:** [ ] Pass / [ ] Fail

---

### Test 2: Service Status Check
**Query to try:**
```
Show me the status and health of sentia-manufacturing-production
```

**Expected Result:**
- Service status (deployed/deploying/failed)
- Health check status
- Last deployment time
- Current URL

**Actual Result:** [ ] Pass / [ ] Fail

---

### Test 3: MCP AI Server Check
**Query to try:**
```
Check the status of the service running at https://mcp-server-tkyu.onrender.com
```

**Expected Result:**
- Service name: sentia-mcp-server
- Status: deployed
- Health endpoint responding
- Memory/CPU usage

**Actual Result:** [ ] Pass / [ ] Fail

---

### Test 4: Database Status
**Query to try:**
```
List all PostgreSQL databases on Render
```

**Expected Result:**
- sentia-db-production
- sentia-db-testing
- sentia-db-development

**Actual Result:** [ ] Pass / [ ] Fail

---

### Test 5: Recent Logs
**Query to try:**
```
Show me the last 10 log entries from sentia-manufacturing-production
```

**Expected Result:**
- Recent log entries
- Timestamps included
- Mix of info/warning/error logs

**Actual Result:** [ ] Pass / [ ] Fail

---

### Test 6: Deployment History
**Query to try:**
```
Show recent deployments across all services
```

**Expected Result:**
- List of recent deployments
- Service names
- Deployment status
- Timestamps

**Actual Result:** [ ] Pass / [ ] Fail

---

### Test 7: Performance Metrics
**Query to try:**
```
Show CPU and memory usage for sentia-manufacturing-production
```

**Expected Result:**
- CPU percentage
- Memory usage in MB/GB
- Recent trends

**Actual Result:** [ ] Pass / [ ] Fail

---

### Test 8: Environment Variables
**Query to try:**
```
List the environment variables configured for sentia-manufacturing-production (show only the keys, not values)
```

**Expected Result:**
- List of environment variable names
- Should include: NODE_ENV, DATABASE_URL, MCP_SERVER_URL, etc.
- Values should be hidden for security

**Actual Result:** [ ] Pass / [ ] Fail

---

## 🎯 Advanced Queries to Try

### Complex Query 1: Troubleshooting
```
Are there any errors in the production logs in the last hour? If so, show me the most common error patterns.
```

### Complex Query 2: Cross-Environment Check
```
Compare the deployment status and health of development, testing, and production environments
```

### Complex Query 3: Database Query
```
Can you check if the production database is accepting connections and show the connection pool status?
```

### Complex Query 4: Full Health Check
```
Perform a complete health check: verify all services are running, check for errors in the last hour, and show current resource usage
```

---

## ✅ Success Criteria

**MCP is fully functional when:**
- [ ] All 8 basic tests pass
- [ ] Can retrieve real-time data from services
- [ ] Logs are accessible
- [ ] Metrics are available
- [ ] No authentication errors

---

## 🚨 Common Issues & Solutions

### Issue: "MCP server not available"
**Solution:**
1. Restart Claude Code completely
2. Wait for "Installing MCP server" to complete (first run only)
3. Try query again after 1-2 minutes

### Issue: "No services found"
**Solution:**
1. Verify API key is correct
2. Check you're using the right Render account
3. Ensure services exist in Render dashboard

### Issue: "Permission denied"
**Solution:**
1. API key may not have full access
2. Create a new API key with proper permissions
3. Update config and restart

### Issue: "Timeout error"
**Solution:**
1. Check internet connection
2. Verify Render services are accessible
3. Try a simpler query first

---

## 📊 Test Results Summary

| Test # | Description | Status | Notes |
|--------|-------------|--------|-------|
| 1 | List Services | ⏳ | |
| 2 | Service Status | ⏳ | |
| 3 | MCP Server Check | ⏳ | |
| 4 | Database List | ⏳ | |
| 5 | Recent Logs | ⏳ | |
| 6 | Deployment History | ⏳ | |
| 7 | Performance Metrics | ⏳ | |
| 8 | Environment Variables | ⏳ | |

---

## 🎉 Once All Tests Pass

You'll have confirmed:
- ✅ MCP is properly configured
- ✅ Authentication is working
- ✅ All services are accessible
- ✅ Real-time data is flowing
- ✅ Ready for production use

---

## 📝 Next Steps After Verification

1. **Create additional API keys** for different access levels
2. **Set up audit logging** for compliance
3. **Configure team access** for pilot users
4. **Create automation scripts** for common tasks
5. **Document successful queries** for team reference

---

**Please run through these tests and let me know the results!**