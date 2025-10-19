# Cloudflare Setup Guide for CapLiquify

**Purpose**: Secure configuration of Cloudflare for the CapLiquify domain with Clerk authentication and Render hosting.

**Domains**:
- Main Website: `capliquify.com` (hosted on Render)
- Authentication: `auth.capliquify.com` (Clerk)
- Clerk API: `clerk.capliquify.com` (Clerk)

---

## ⚠️ Security Best Practices

### Critical Rules:

1. **NEVER use Global API Key** - Use API Tokens with minimal permissions instead
2. **NEVER commit API keys** - Store only in `.env.local` (already gitignored)
3. **Use API Tokens** - Create specific tokens for each integration with least-privilege access
4. **Enable 2FA** - Protect your Cloudflare account with two-factor authentication
5. **Review Audit Logs** - Regularly check for unauthorized access or changes

### Why Not Global API Key?

| Feature | Global API Key | API Token (Recommended) |
|---------|---------------|------------------------|
| **Scope** | Full account access | Limited to specific zones/permissions |
| **Security** | High risk if compromised | Lower risk - can be scoped |
| **Rotation** | Requires manual update everywhere | Easy to rotate per-service |
| **Audit** | Hard to track which service made changes | Clear attribution |
| **Best Practice** | ❌ Deprecated | ✅ Recommended |

---

## Phase 1: Create API Token (Recommended)

### Step 1: Access API Tokens

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**

### Step 2: Configure Token Permissions

**For DNS Management (CapLiquify Setup)**:

```
Token Name: DNS Management - CapLiquify
Permissions:
  - Zone → DNS → Edit
  - Zone → Zone → Read

Zone Resources:
  - Include → Specific zone → capliquify.com

IP Address Filtering (Optional):
  - Add your server IP addresses for extra security

TTL:
  - Recommended: 1 year (rotate annually)
```

### Step 3: Save Token Securely

1. **Copy** the generated token (shown only once)
2. **Add** to `.env.local` (NEVER commit this file):
   ```bash
   CLOUDFLARE_API_TOKEN=your_token_here
   ```
3. **Store** in password manager (1Password, LastPass, etc.)
4. Click **"Continue to summary"**

---

## Phase 2: DNS Configuration

### Required DNS Records

Add these records in Cloudflare Dashboard → DNS → Records:

#### 1. Main Website (Render)

```dns
Type: CNAME
Name: @
Target: capliquify-app.onrender.com
Proxy: ✅ ON (Orange cloud)
TTL: Auto
```

```dns
Type: CNAME
Name: www
Target: capliquify-app.onrender.com
Proxy: ✅ ON (Orange cloud)
TTL: Auto
```

#### 2. Clerk Authentication Subdomain

```dns
Type: CNAME
Name: auth
Target: accounts.clerk.com
Proxy: ⭕ OFF (Gray cloud - DNS only)
TTL: Auto
```

**Important**: Clerk subdomains **must have Proxy OFF**. The orange cloud must be gray.

#### 3. Clerk API Subdomain

```dns
Type: CNAME
Name: clerk
Target: [clerk-provided-url].clerk.accounts.dev
Proxy: ⭕ OFF (Gray cloud - DNS only)
TTL: Auto
```

**Note**: Clerk will provide the exact target URL in their dashboard after you configure your application domain.

### Why Proxy ON/OFF Matters:

| Subdomain | Proxy Status | Reason |
|-----------|--------------|--------|
| `capliquify.com` | ✅ ON | DDoS protection, CDN, caching |
| `www.capliquify.com` | ✅ ON | Same as root domain |
| `auth.capliquify.com` | ⭕ OFF | Clerk needs direct DNS resolution |
| `clerk.capliquify.com` | ⭕ OFF | Clerk API requires DNS-only |

---

## Phase 3: SSL/TLS Configuration

### Step 1: SSL/TLS Encryption Mode

1. Go to: **SSL/TLS** → **Overview**
2. Select: **Full (strict)**

```
Full (strict):
- Encrypts traffic between visitors and Cloudflare
- Encrypts traffic between Cloudflare and Render
- Validates Render's SSL certificate
```

### Step 2: Minimum TLS Version

1. Go to: **SSL/TLS** → **Edge Certificates**
2. Set **Minimum TLS Version**: `TLS 1.2`
3. Enable **Always Use HTTPS**: ✅ ON

### Step 3: HSTS (HTTP Strict Transport Security)

1. Go to: **SSL/TLS** → **Edge Certificates**
2. Enable **HSTS**:
   - **Max-Age**: 12 months (31536000 seconds)
   - **Include subdomains**: ✅ ON
   - **Preload**: ✅ ON (after testing)

---

## Phase 4: Email Verification Setup

To send verification emails from `@capliquify.com`:

### Step 1: Add Email Routing Records

Clerk will provide SPF, DKIM, and DMARC records. Add them in **DNS → Records**:

```dns
Type: TXT
Name: @
Content: v=spf1 include:_spf.clerk.com ~all
TTL: Auto
```

```dns
Type: TXT
Name: clerk._domainkey
Content: [DKIM record provided by Clerk]
TTL: Auto
```

```dns
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=quarantine; rua=mailto:dmarc@capliquify.com
TTL: Auto
```

### Step 2: Verify Domain in Clerk

1. Go to Clerk Dashboard → **Email & SMS** → **Email settings**
2. Add domain: `capliquify.com`
3. Follow verification steps
4. Wait for DNS propagation (5-15 minutes, up to 48 hours)

---

## Phase 5: Security Settings

### Recommended Cloudflare Security Rules

1. **Go to**: **Security** → **Settings**

2. **Security Level**: Medium

3. **Challenge Passage**: 30 minutes

4. **Browser Integrity Check**: ✅ ON

### Firewall Rules (Optional but Recommended)

Create a firewall rule to block suspicious traffic:

```
Rule Name: Block suspicious requests
Expression:
  (cf.threat_score gt 10) or
  (http.user_agent contains "bot" and not cf.verified_bot)

Action: Challenge (CAPTCHA)
```

### Rate Limiting

Protect login endpoints:

```
Rule Name: Rate limit auth endpoints
If incoming requests match:
  - URI Path contains /api/auth
  - URI Path contains /api/clerk

Characteristics:
  - IP Address

Rate: 10 requests per minute

Action: Block for 1 hour
```

---

## Phase 6: Verify Configuration

### DNS Propagation Check

1. **Check main domain**:
   ```bash
   nslookup capliquify.com
   ```

2. **Check auth subdomain**:
   ```bash
   nslookup auth.capliquify.com
   ```

3. **Check clerk subdomain**:
   ```bash
   nslookup clerk.capliquify.com
   ```

### SSL Certificate Verification

Visit each URL in a browser:
- https://capliquify.com - Should show valid SSL
- https://www.capliquify.com - Should show valid SSL
- https://auth.capliquify.com - Should show valid SSL (Clerk)

### Cloudflare Analytics

1. Go to: **Analytics** → **Traffic**
2. Wait 24 hours for initial data
3. Monitor traffic patterns

---

## Common Issues & Troubleshooting

### Issue: "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"

**Solution**: Ensure Render has a valid SSL certificate and Cloudflare SSL mode is "Full (strict)"

### Issue: "DNS_PROBE_FINISHED_NXDOMAIN"

**Solution**:
1. Check DNS records are correct
2. Wait for DNS propagation (up to 48 hours)
3. Clear browser DNS cache

### Issue: Clerk authentication not working

**Solution**:
1. Verify `auth` and `clerk` subdomains have Proxy OFF (gray cloud)
2. Check CNAME targets match Clerk dashboard
3. Verify in Clerk dashboard that domain is verified

### Issue: Email verification not working

**Solution**:
1. Check SPF, DKIM, and DMARC records are correct
2. Verify domain in Clerk dashboard
3. Test with https://mxtoolbox.com/spf.aspx

---

## API Token Rotation Schedule

**Security Best Practice**: Rotate API tokens regularly

| Token Type | Rotation Frequency | Last Rotated | Next Rotation |
|-----------|-------------------|--------------|---------------|
| DNS Management | Annually | - | - |
| API Access | Quarterly | - | - |
| Webhook Tokens | Monthly | - | - |

### How to Rotate API Token

1. Create new token with same permissions
2. Update `.env.local` with new token
3. Update Render environment variables
4. Test all integrations work
5. Revoke old token after 48 hours

---

## Security Checklist

Before going live with CapLiquify:

- [ ] API Token created with minimal permissions (not Global API Key)
- [ ] 2FA enabled on Cloudflare account
- [ ] All DNS records configured correctly
- [ ] SSL/TLS set to "Full (strict)"
- [ ] HSTS enabled with proper settings
- [ ] Email verification records added and verified
- [ ] Firewall rules configured
- [ ] Rate limiting enabled for auth endpoints
- [ ] `.env.local` contains real credentials (not committed to git)
- [ ] `.gitignore` excludes all `.env*` files
- [ ] Audit logs reviewed for suspicious activity
- [ ] DNS propagation verified
- [ ] SSL certificates verified
- [ ] All subdomains loading correctly

---

## Emergency Procedures

### If API Token is Compromised

1. **Immediately revoke** the compromised token at https://dash.cloudflare.com/profile/api-tokens
2. **Review audit logs** for unauthorized changes
3. **Create new token** with same permissions
4. **Update all services** using the old token
5. **Document incident** and timeline

### If Domain is Compromised

1. **Enable "Under Attack Mode"** in Cloudflare dashboard
2. **Review all DNS records** for unauthorized changes
3. **Check SSL certificates** for unauthorized issuance
4. **Contact Cloudflare support**: https://support.cloudflare.com
5. **Reset all API tokens** immediately

---

## Additional Resources

- **Cloudflare Docs**: https://developers.cloudflare.com/
- **API Token Docs**: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- **Clerk Docs**: https://clerk.com/docs
- **DNS Setup Guide**: https://developers.cloudflare.com/dns/
- **SSL/TLS Guide**: https://developers.cloudflare.com/ssl/

---

## Support

- **Cloudflare Support**: https://support.cloudflare.com
- **Clerk Support**: https://clerk.com/support
- **Render Support**: https://render.com/docs/support
