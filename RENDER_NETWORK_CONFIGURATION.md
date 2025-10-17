# Render Network Configuration

## MCP Server Network Details

### Internal Network Communication (Recommended)

**Internal Address**: `mcp-server-tkyu:10000`

- All Render services in the same region (oregon) can communicate using this internal address
- **Faster**: No external network hops, lower latency
- **More Secure**: Traffic stays within Render's private network
- **Free**: No bandwidth charges for internal communication

### Public Internet Access

**Public URL**: `https://mcp-server-tkyu.onrender.com`

- Use for external API access or testing from outside Render
- SSL/TLS encrypted
- Subject to rate limits and bandwidth charges

### Static Outbound IP Addresses

When the MCP server makes requests to external services (Xero, Shopify, etc.), the requests will originate from one of these IP addresses:

- `44.229.227.142`
- `54.188.71.94`
- `52.13.128.108`

## Configuration Updates Applied

### 1. Main Application Services

All three environments (development, testing, production) have been updated to use the internal address for MCP server communication:

```yaml
# MCP Server Integration (Using internal address for better performance)
- key: MCP_SERVER_URL
  value: http://mcp-server-tkyu:10000
- key: MCP_SERVER_PUBLIC_URL
  value: https://mcp-server-tkyu.onrender.com
```

### 2. Benefits of Internal Communication

- **Performance**: ~10-50ms faster response times
- **Reliability**: No public internet routing issues
- **Cost**: Free internal bandwidth vs charged external bandwidth
- **Security**: Traffic never leaves Render's network

## External API Whitelisting

For services that require IP whitelisting, add these static IPs:

### Xero API

No whitelisting required (OAuth-based authentication)

### Unleashed ERP

If IP whitelisting is enabled in Unleashed:

1. Log into Unleashed admin panel
2. Navigate to Security Settings
3. Add the three static IPs listed above

### Shopify

No whitelisting required (API key authentication)

### Amazon SP-API

No whitelisting required (OAuth-based authentication)

### Microsoft Graph API

No whitelisting required (OAuth-based authentication)

## Service Communication Map

```
┌─────────────────────────────────────────────────────────────┐
│                      Render Network (Oregon)                 │
│                                                               │
│  ┌──────────────────┐        Internal Network               │
│  │   Development    │ ←─────────────────────┐                │
│  │   Application    │         http://       │                │
│  └──────────────────┘    mcp-server-tkyu    │                │
│                               :10000         ↓                │
│  ┌──────────────────┐                 ┌────────────┐        │
│  │     Testing      │ ←───────────────│ MCP Server │        │
│  │   Application    │                 │    (AI)    │        │
│  └──────────────────┘                 └──────┬─────┘        │
│                                               │              │
│  ┌──────────────────┐                        │              │
│  │   Production     │ ←──────────────────────┘              │
│  │   Application    │                                        │
│  └──────────────────┘                                        │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Render PostgreSQL Databases              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │Development │  │  Testing   │  │ Production │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               ↓
                     External API Calls
                  (via Static IPs above)
                               ↓
        ┌──────────────────────────────────────┐
        │         External Services            │
        │  • Xero API                          │
        │  • Unleashed ERP                     │
        │  • Shopify (UK/USA)                  │
        │  • Amazon SP-API                     │
        │  • OpenAI/Anthropic                  │
        │  • Microsoft Graph                   │
        └──────────────────────────────────────┘
```

## Testing Internal Communication

### From Main Application

To verify internal communication is working:

```javascript
// In your application code
const MCP_URL = process.env.MCP_SERVER_URL // http://mcp-server-tkyu:10000
const response = await fetch(`${MCP_URL}/health`)
```

### Health Check Endpoints

- Internal: `http://mcp-server-tkyu:10000/health`
- Public: `https://mcp-server-tkyu.onrender.com/health`

## Monitoring & Debugging

### Check Service Logs

1. Go to Render Dashboard
2. Select the service
3. Click "Logs" tab
4. Look for connection logs

### Common Issues & Solutions

#### Issue: Connection Refused on Internal Address

**Solution**: Ensure both services are in the same region (oregon)

#### Issue: CORS Errors

**Solution**: MCP server CORS_ORIGINS includes all application URLs

#### Issue: External API Blocks

**Solution**: Whitelist the static outbound IPs listed above

#### Issue: Slow Response Times

**Solution**: Verify using internal address (http://mcp-server-tkyu:10000) not public URL

## Security Considerations

1. **Internal Traffic**: Unencrypted HTTP is safe for internal communication within Render's network
2. **External Traffic**: Always use HTTPS for public endpoints
3. **API Keys**: Store securely in Render environment variables
4. **IP Whitelisting**: Use the static IPs for services that require it

## Performance Optimization

### Current Configuration (Optimized)

- Main apps → MCP Server: Internal network (fast)
- MCP Server → External APIs: Direct outbound (standard)
- Database connections: Internal network (fast)

### Bandwidth Considerations

- Internal traffic: Unlimited, free
- External traffic: Subject to Render plan limits
- Recommendation: Keep heavy data processing internal

## Next Steps

1. **Verify Deployment**: Check MCP server is running
2. **Test Internal Communication**: Confirm apps can reach MCP via internal address
3. **Monitor Performance**: Compare response times internal vs external
4. **Configure IP Whitelisting**: Add static IPs to external services if required
