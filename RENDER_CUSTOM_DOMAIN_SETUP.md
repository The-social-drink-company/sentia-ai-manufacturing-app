# Render Custom Domain Setup Guide

## Overview
This guide walks through setting up custom domains for your Sentia Manufacturing Dashboard on Render.

## Prerequisites

- [ ] Domain name purchased (e.g., sentia-manufacturing.com)
- [ ] Access to domain registrar's DNS settings
- [ ] Render services deployed and running
- [ ] SSL certificate auto-provisioning enabled (default on Render)

## Domain Structure Planning

### Recommended Setup
```
Main Application:
- Production: sentia-manufacturing.com (apex) & www.sentia-manufacturing.com
- Testing: test.sentia-manufacturing.com
- Development: dev.sentia-manufacturing.com

MCP Server:
- API: mcp.sentia-manufacturing.com

Additional Services:
- API Docs: api.sentia-manufacturing.com
- Status Page: status.sentia-manufacturing.com
```

## Step 1: Add Custom Domain in Render

### For Production (Apex Domain + WWW)

1. **Go to Render Dashboard**
   - Open your production service
   - Click "Settings" → "Custom Domains"

2. **Add Apex Domain**
   - Click "Add Custom Domain"
   - Enter: `sentia-manufacturing.com`
   - Click "Save"

3. **Add WWW Subdomain**
   - Click "Add Custom Domain" again
   - Enter: `www.sentia-manufacturing.com`
   - Click "Save"

4. **Note the DNS Records**
   - Render will show required DNS records
   - Keep this page open for reference

### For Subdomains (test, dev, mcp)

Repeat the process for each service:
- `test.sentia-manufacturing.com` → sentia-manufacturing-testing service
- `dev.sentia-manufacturing.com` → sentia-manufacturing-development service
- `mcp.sentia-manufacturing.com` → sentia-mcp-server service

## Step 2: Configure DNS Records

### Common Domain Registrars

#### Namecheap
```
1. Login to Namecheap
2. Go to Domain List → Manage
3. Click "Advanced DNS"
4. Add records:

For Apex Domain:
- Type: A
- Host: @
- Value: [Render IP from dashboard]
- TTL: Automatic

For WWW:
- Type: CNAME
- Host: www
- Value: [your-service].onrender.com
- TTL: Automatic

For Subdomains:
- Type: CNAME
- Host: test
- Value: sentia-manufacturing-testing.onrender.com
- TTL: Automatic
```

#### GoDaddy
```
1. Login to GoDaddy
2. Go to My Domains → Select Domain
3. Click "DNS"
4. Add/Edit records as above
```

#### Cloudflare
```
1. Login to Cloudflare
2. Select your domain
3. Go to DNS tab
4. Add records with Proxy Status: DNS Only (gray cloud)
```

### DNS Records Configuration

```yaml
# Required DNS Records

# Production (Apex)
Type: A
Name: @
Value: 216.24.57.1  # Render's IP (verify in dashboard)
TTL: 300

# Production (WWW)
Type: CNAME
Name: www
Value: sentia-manufacturing-production.onrender.com
TTL: 300

# Testing Environment
Type: CNAME
Name: test
Value: sentia-manufacturing-testing.onrender.com
TTL: 300

# Development Environment
Type: CNAME
Name: dev
Value: sentia-manufacturing-development.onrender.com
TTL: 300

# MCP Server
Type: CNAME
Name: mcp
Value: mcp-server-tkyu.onrender.com
TTL: 300
```

## Step 3: Verify Domain Setup

### DNS Propagation Check
```powershell
# Check DNS propagation
nslookup sentia-manufacturing.com
nslookup www.sentia-manufacturing.com
nslookup test.sentia-manufacturing.com
nslookup dev.sentia-manufacturing.com
nslookup mcp.sentia-manufacturing.com

# Or use online tool
Start-Process "https://dnschecker.org/#A/sentia-manufacturing.com"
```

### Render Verification
1. Go back to Render Dashboard
2. Check "Custom Domains" section
3. Look for green checkmark ✓ next to each domain
4. SSL certificate should show "Issued"

## Step 4: Update Application Configuration

### Update Environment Variables
```yaml
# In render.yaml for each environment

# Production
- key: VITE_API_BASE_URL
  value: https://sentia-manufacturing.com/api
- key: CORS_ORIGINS
  value: https://sentia-manufacturing.com,https://www.sentia-manufacturing.com

# Testing
- key: VITE_API_BASE_URL
  value: https://test.sentia-manufacturing.com/api
- key: CORS_ORIGINS
  value: https://test.sentia-manufacturing.com

# Development
- key: VITE_API_BASE_URL
  value: https://dev.sentia-manufacturing.com/api
- key: CORS_ORIGINS
  value: https://dev.sentia-manufacturing.com
```

### Update OAuth Callbacks

#### Clerk Authentication
1. Go to Clerk Dashboard
2. Update redirect URLs:
   - `https://sentia-manufacturing.com/auth/callback`
   - `https://test.sentia-manufacturing.com/auth/callback`
   - `https://dev.sentia-manufacturing.com/auth/callback`

#### Xero Integration
1. Go to Xero Developer Portal
2. Update OAuth 2.0 redirect URIs:
   - `https://sentia-manufacturing.com/api/xero/callback`
   - `https://test.sentia-manufacturing.com/api/xero/callback`

## Step 5: SSL Certificate Configuration

### Automatic SSL (Default)
Render automatically provisions Let's Encrypt SSL certificates:
- No configuration needed
- Auto-renewal every 90 days
- Supports wildcard certificates

### Custom SSL Certificate (Optional)
If you have your own SSL certificate:

1. Go to Settings → Custom Domains
2. Click "Add Custom Certificate"
3. Paste your certificate and private key
4. Click "Save"

## Step 6: Testing Custom Domains

### Quick Test Script
```powershell
# test-custom-domains.ps1

$domains = @(
    "https://sentia-manufacturing.com",
    "https://www.sentia-manufacturing.com",
    "https://test.sentia-manufacturing.com",
    "https://dev.sentia-manufacturing.com",
    "https://mcp.sentia-manufacturing.com"
)

Write-Host "Testing Custom Domains..." -ForegroundColor Cyan

foreach ($domain in $domains) {
    Write-Host "`nTesting: $domain" -ForegroundColor Yellow

    try {
        # Test HTTPS
        $response = Invoke-WebRequest -Uri "$domain/health" -TimeoutSec 5
        Write-Host "  [OK] HTTPS Working" -ForegroundColor Green

        # Check SSL
        $request = [System.Net.HttpWebRequest]::Create($domain)
        $request.Method = "HEAD"
        $response = $request.GetResponse()
        Write-Host "  [OK] SSL Certificate Valid" -ForegroundColor Green

    } catch {
        Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

## Step 7: Redirect Configuration

### Force HTTPS
Render automatically redirects HTTP to HTTPS

### WWW to Apex (or vice versa)
Add to your application code:

```javascript
// server.js or server-render.js
app.use((req, res, next) => {
    // Redirect www to apex
    if (req.hostname === 'www.sentia-manufacturing.com') {
        return res.redirect(301, `https://sentia-manufacturing.com${req.originalUrl}`);
    }
    next();
});
```

## Troubleshooting

### Domain Not Verifying
- **Issue**: Domain shows "Pending" in Render
- **Solution**:
  1. Check DNS records are correct
  2. Wait for DNS propagation (up to 48 hours)
  3. Try removing and re-adding domain

### SSL Certificate Error
- **Issue**: Browser shows SSL warning
- **Solution**:
  1. Verify domain is verified in Render
  2. Check certificate status in dashboard
  3. Force certificate renewal if needed

### Redirect Loops
- **Issue**: Site redirects infinitely
- **Solution**:
  1. Check CORS_ORIGINS configuration
  2. Verify redirect rules in application
  3. Ensure Cloudflare proxy is disabled

## Migration Checklist

When migrating from old domain:

- [ ] Reduce TTL to 300 seconds (5 minutes) 24 hours before
- [ ] Update all environment variables with new domain
- [ ] Update OAuth callbacks
- [ ] Update API documentation
- [ ] Set up 301 redirects from old domain
- [ ] Notify users of domain change
- [ ] Monitor traffic and errors
- [ ] Keep old domain active for 6 months minimum

## Domain Management Best Practices

1. **Use Domain Aliases**
   - Keep onrender.com URLs as fallback
   - Useful for testing and debugging

2. **Monitor Domain Expiry**
   - Set calendar reminders
   - Enable auto-renewal

3. **Backup DNS Settings**
   - Export DNS records
   - Document all configurations

4. **Security Headers**
   ```javascript
   // Add to application
   app.use((req, res, next) => {
       res.setHeader('Strict-Transport-Security', 'max-age=31536000');
       res.setHeader('X-Content-Type-Options', 'nosniff');
       res.setHeader('X-Frame-Options', 'SAMEORIGIN');
       next();
   });
   ```

## Cost Considerations

- **Domain Registration**: ~$12-15/year
- **SSL Certificates**: Free with Render
- **DNS Management**: Usually free with registrar
- **Additional Domains**: No extra cost on Render

## Support Resources

- **Render Docs**: https://render.com/docs/custom-domains
- **DNS Checker**: https://dnschecker.org
- **SSL Test**: https://www.ssllabs.com/ssltest/
- **Domain Support**: Your registrar's support

---

**Note**: DNS changes can take up to 48 hours to propagate globally, though most changes are visible within 1-2 hours.