# Cloudflare Quick Start Guide - CapLiquify

**Time Required**: 30-60 minutes (active time) + DNS propagation (5 min - 48 hours)
**Difficulty**: Beginner-Friendly
**Goal**: Get capliquify.com fully configured with Cloudflare + Clerk

---

## 📋 Before You Start

### Required Accounts:

- [x] Cloudflare account (capliquify.com domain added)
- [ ] Clerk account
- [ ] Render account
- [ ] Password manager (to store credentials)

### Required Files:

- [x] `.env.local` exists
- [x] Documentation available

---

## 🚀 30-Minute Setup (Critical Items Only)

### Step 1: Secure Your Cloudflare Account (5 minutes)

**Why**: Your API keys were exposed in chat - must revoke immediately

#### 1.1 Revoke Exposed Keys

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Find: "Global API Key" section
3. Click: **"View"** → **"Roll"** (regenerate)
4. Confirm the roll

#### 1.2 Revoke Origin CA Key

1. Same page, find: "Origin CA Key"
2. Click: **"View"** → **"Roll"**
3. Confirm the roll

✅ **Done**: Old exposed keys are now invalid

---

### Step 2: Create DNS Management API Token (5 minutes)

**Why**: Need this for programmatic DNS management (not Global API Key!)

#### 2.1 Start Token Creation

1. Stay on: https://dash.cloudflare.com/profile/api-tokens
2. Click: **"Create Token"** (blue button, top right)

#### 2.2 Select Template

**Look for**: "Edit zone DNS" template
**Click**: "Use template" button next to it

_If you don't see it, scroll down or use "Create Custom Token" and configure manually_

#### 2.3 Configure Token

```
Token name: DNS Management - CapLiquify

Permissions:
  ✅ Zone | DNS | Edit
  ✅ Zone | Zone | Read

Zone Resources:
  ✅ Include | Specific zone | capliquify.com

Client IP Address Filtering: (leave blank)

TTL:
  Start: Today
  End: 1 year from now
```

#### 2.4 Create and Save

1. Click: **"Continue to summary"**
2. Review settings
3. Click: **"Create Token"**
4. **COPY THE TOKEN** (shown only once!)
   - It will look like: `AbCdEf123456...` (40+ characters)
5. **Save to password manager**

#### 2.5 Update .env.local

1. Open: `C:\Projects\The-social-drink-companycapliquify-ai-dashboard-app\capliquify-ai-dashboard-app\.env.local`
2. Find line 47:
   ```bash
   CLOUDFLARE_API_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
3. Replace with your actual token:
   ```bash
   CLOUDFLARE_API_TOKEN=AbCdEf123456your_actual_token_here
   ```
4. **Save file** (Ctrl+S)

✅ **Done**: API token created and saved

---

### Step 3: Get Zone ID and Account ID (2 minutes)

**Why**: Needed for programmatic access to your domain

#### 3.1 Navigate to Domain

1. Go to: https://dash.cloudflare.com
2. Click on: **capliquify.com** (in the list)

#### 3.2 Find IDs in Right Sidebar

Look at the **right sidebar** on the Overview page:

```
┌─────────────────────┐
│ API                 │
├─────────────────────┤
│ Zone ID             │
│ abc123def456...     │
│ [Click to copy]     │
│                     │
│ Account ID          │
│ xyz789ghi012...     │
│ [Click to copy]     │
└─────────────────────┘
```

#### 3.3 Update .env.local

1. Copy **Zone ID** (click to copy button)
2. Open `.env.local`
3. Line 50:
   ```bash
   CLOUDFLARE_ZONE_ID=your_zone_id_here_32_characters
   ```
4. Copy **Account ID** (click to copy)
5. Line 51:
   ```bash
   CLOUDFLARE_ACCOUNT_ID=your_account_id_here_32_characters
   ```
6. Line 52:
   ```bash
   CLOUDFLARE_EMAIL=dudley@capliquify.com
   ```
7. **Save file** (Ctrl+S)

✅ **Done**: Cloudflare configuration complete in `.env.local`

---

### Step 4: Create Clerk Production Instance (10 minutes)

**Why**: Need Clerk for user authentication on CapLiquify

#### 4.1 Create Application

1. Go to: https://dashboard.clerk.com
2. Click: **"Create application"** (or use existing)
3. Name: **CapLiquify Production**
4. Click: **"Create application"**

#### 4.2 Configure Application Domain

1. In Clerk dashboard, go to: **Settings** → **Domains**
2. Click: **"Add domain"** or **"Production"**
3. Enter: `auth.capliquify.com`
4. Click: **"Add domain"**

#### 4.3 Choose Primary Application

When prompted:

**"Is this the primary application for capliquify.com or a secondary application?"**

**✅ SELECT**: **"Primary application"**

**Why?**:

- Clerk API: `clerk.capliquify.com` (clean)
- Emails: `@capliquify.com` (professional)

**❌ DO NOT** select "Secondary application" - gives you nested URLs

#### 4.4 Get API Keys

1. Go to: **API Keys** section (left sidebar)
2. Find **Production** keys
3. Copy **Publishable Key** (starts with `pk_live_`)
4. Copy **Secret Key** (starts with `sk_live_` - click "Show")

#### 4.5 Update .env.local

1. Open `.env.local`
2. Line 16:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_actual_key_here
   ```
3. Line 17:
   ```bash
   CLERK_SECRET_KEY=sk_live_your_actual_key_here
   ```
4. **Save file** (Ctrl+S)
5. **Save keys to password manager**

#### 4.6 Get Clerk DNS Target

1. In Clerk dashboard, go to: **Settings** → **Domains**
2. Find the CNAME target for `clerk.capliquify.com`
3. It will look like: `your-instance.clerk.accounts.dev`
4. **Write this down** - you'll need it in Step 6

✅ **Done**: Clerk instance created and configured

---

### Step 5: Get Render Service URL (2 minutes)

**Why**: Need this for DNS records pointing to your app

#### 5.1 Find Your Service

1. Go to: https://dashboard.render.com
2. Find your CapLiquify service
3. Copy the service URL
   - Format: `your-app-name.onrender.com`
   - Example: `capliquify-dashboard.onrender.com`
4. **Write this down** - you'll need it in Step 6

✅ **Done**: Render URL obtained

---

### Step 6: Add DNS Records (8 minutes)

**Why**: Connect your domain to Clerk and Render

#### 6.1 Navigate to DNS

1. Go to: https://dash.cloudflare.com
2. Click on: **capliquify.com**
3. Click: **DNS** (left sidebar)
4. Click: **Records** tab

#### 6.2 Add Record #1: Root Domain

```
Type: CNAME
Name: @  (or leave blank if @ not allowed)
Target: your-render-app.onrender.com  (from Step 5)
Proxy status: ✅ Proxied (Orange cloud)
TTL: Auto
```

**Click**: "Save"

#### 6.3 Add Record #2: WWW Subdomain

```
Type: CNAME
Name: www
Target: your-render-app.onrender.com  (same as above)
Proxy status: ✅ Proxied (Orange cloud)
TTL: Auto
```

**Click**: "Save"

#### 6.4 Add Record #3: Clerk Auth Subdomain

```
Type: CNAME
Name: auth
Target: accounts.clerk.com
Proxy status: ⭕ DNS only (Gray cloud) ⬅️ IMPORTANT!
TTL: Auto
```

**CRITICAL**: Click the **orange cloud** to turn it **gray** (DNS only)!

**Click**: "Save"

#### 6.5 Add Record #4: Clerk API Subdomain

```
Type: CNAME
Name: clerk
Target: your-instance.clerk.accounts.dev  (from Step 4.6)
Proxy status: ⭕ DNS only (Gray cloud) ⬅️ IMPORTANT!
TTL: Auto
```

**CRITICAL**: Click the **orange cloud** to turn it **gray** (DNS only)!

**Click**: "Save"

✅ **Done**: All 4 DNS records added

---

### Step 7: Configure SSL/TLS (3 minutes)

**Why**: Ensure secure HTTPS connections

#### 7.1 Set SSL Mode

1. In Cloudflare dashboard, click: **SSL/TLS** (left sidebar)
2. Click: **Overview** tab
3. Select: **"Full (strict)"**
   - Encrypts traffic end-to-end
   - Validates Render's SSL certificate
4. Wait for it to save (green checkmark)

#### 7.2 Set Minimum TLS Version

1. Click: **Edge Certificates** tab
2. Find: "Minimum TLS Version"
3. Select: **"TLS 1.2"**
4. Find: "Always Use HTTPS"
5. Toggle: **ON**

#### 7.3 Enable HSTS

1. Same page, scroll down
2. Find: "HTTP Strict Transport Security (HSTS)"
3. Click: **"Enable HSTS"**
4. Settings:
   ```
   Max Age: 12 months (31536000 seconds)
   Include subdomains: ✅ ON
   Preload: ✅ ON
   ```
5. **Read the warning** (this is permanent!)
6. If you're sure, click: **"Next"** → **"Confirm"**

✅ **Done**: SSL/TLS configured

---

## ⏳ Wait for DNS Propagation (5 min - 48 hours)

**Typical time**: 5-15 minutes
**Maximum time**: 48 hours

### Check Propagation Status:

#### Windows Command Prompt:

```cmd
nslookup capliquify.com
nslookup www.capliquify.com
nslookup auth.capliquify.com
nslookup clerk.capliquify.com
```

#### Online Tool:

https://www.whatsmydns.net/#CNAME/capliquify.com

**When ready**: All domains should resolve to correct targets

---

## ✅ Verification Checklist

After DNS propagates, verify everything works:

### DNS Resolution

- [ ] `nslookup capliquify.com` returns Cloudflare IPs
- [ ] `nslookup www.capliquify.com` returns Cloudflare IPs
- [ ] `nslookup auth.capliquify.com` returns Clerk IPs
- [ ] `nslookup clerk.capliquify.com` returns Clerk IPs

### SSL Certificates

Visit in browser (should all show valid SSL lock icon):

- [ ] https://capliquify.com
- [ ] https://www.capliquify.com
- [ ] https://auth.capliquify.com

### Cloudflare Dashboard

- [ ] DNS records all show "Proxied" or "DNS only" correctly
- [ ] SSL/TLS set to "Full (strict)"
- [ ] HSTS enabled
- [ ] No error messages

### .env.local File

- [ ] `CLOUDFLARE_API_TOKEN` has real token (not XXXX)
- [ ] `CLOUDFLARE_ZONE_ID` has 32-character ID
- [ ] `CLOUDFLARE_ACCOUNT_ID` has 32-character ID
- [ ] `CLOUDFLARE_EMAIL` is your email
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` starts with `pk_live_`
- [ ] `CLERK_SECRET_KEY` starts with `sk_live_`

---

## 🚨 Common Issues & Quick Fixes

### Issue: "Can't find 'Edit zone DNS' template"

**Solution**: Use "Create Custom Token" instead:

1. Click "Create Custom Token"
2. Permissions: Zone → DNS → Edit
3. Permissions: Zone → Zone → Read
4. Resources: Include → Specific zone → capliquify.com

### Issue: "DNS records not resolving"

**Solution**: Wait longer (up to 48 hours) or:

1. Clear browser cache
2. Flush DNS: `ipconfig /flushdns` (Windows)
3. Try incognito/private browsing

### Issue: "SSL certificate error"

**Solution**:

1. Check SSL mode is "Full (strict)"
2. Wait 5-10 minutes after changing
3. Verify Render app has valid SSL

### Issue: "Clerk authentication not working"

**Solution**:

1. Verify `auth` and `clerk` records have **Proxy OFF** (gray cloud)
2. Check CNAME targets match Clerk dashboard
3. Wait for DNS propagation

### Issue: "Can't find Zone ID / Account ID"

**Solution**:

1. Go to capliquify.com in Cloudflare dashboard
2. Look at **right sidebar** (not main content area)
3. Scroll down to "API" section
4. Should see Zone ID and Account ID there

---

## 🎯 What's Next?

Once setup is complete:

### 1. Test Local Development

```bash
cd C:\Projects\The-social-drink-companycapliquify-ai-dashboard-app\capliquify-ai-dashboard-app
pnpm install
pnpm run dev
```

### 2. Update Render Environment Variables

1. Go to: https://dashboard.render.com
2. Select your service
3. Click: **Environment** tab
4. Add the same variables from `.env.local`:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ZONE_ID`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_EMAIL`

### 3. Deploy to Production

```bash
git push origin main
```

Render will auto-deploy with new environment variables.

### 4. Test Authentication

1. Visit: https://capliquify.com
2. Click "Sign In"
3. Should redirect to: https://auth.capliquify.com
4. Create account / Sign in
5. Should redirect back to dashboard

---

## 📱 Mobile-Friendly Checklist

Use this on your phone while working:

```
✅ = Done | ⏳ = In Progress | ❌ = Not Started

Step 1: Secure Cloudflare
⏳ Revoke Global API Key
⏳ Revoke Origin CA Key

Step 2: Create API Token
⏳ Create "Edit zone DNS" token
⏳ Copy token to password manager
⏳ Add token to .env.local line 47

Step 3: Get IDs
⏳ Get Zone ID from dashboard
⏳ Get Account ID from dashboard
⏳ Add to .env.local lines 50-52

Step 4: Clerk Setup
⏳ Create Clerk instance
⏳ Set domain: auth.capliquify.com
⏳ Choose "Primary application"
⏳ Get API keys
⏳ Add to .env.local lines 16-17
⏳ Note Clerk DNS target

Step 5: Get Render URL
⏳ Find service in Render dashboard
⏳ Copy service URL

Step 6: Add DNS Records
⏳ Record #1: @ → Render (Proxied)
⏳ Record #2: www → Render (Proxied)
⏳ Record #3: auth → Clerk (DNS only!)
⏳ Record #4: clerk → Clerk (DNS only!)

Step 7: SSL/TLS
⏳ Set to "Full (strict)"
⏳ Minimum TLS 1.2
⏳ Enable HSTS

Step 8: Wait
⏳ Wait for DNS propagation (5-60 min)

Step 9: Verify
⏳ Test DNS resolution
⏳ Check SSL certificates
⏳ Verify all records correct
```

---

## 🆘 Get Help

- **Cloudflare docs**: https://developers.cloudflare.com/
- **Clerk docs**: https://clerk.com/docs
- **Render docs**: https://render.com/docs
- **Full setup guide**: [docs/CLOUDFLARE_SETUP.md](docs/CLOUDFLARE_SETUP.md)
- **Status report**: [CLOUDFLARE_STATUS_REPORT.md](CLOUDFLARE_STATUS_REPORT.md)
- **Security guide**: [SECURITY.md](SECURITY.md)

---

**Good luck! You've got this! 🚀**

**Estimated total time**: 30-40 minutes active work + waiting for DNS
