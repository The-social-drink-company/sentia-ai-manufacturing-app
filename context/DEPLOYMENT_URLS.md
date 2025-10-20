# CapLiquify Manufacturing Platform - Deployment URLs & Health Endpoints

## Production Environment
- **Main URL:** https://sentiaprod.financeflo.ai
- **Railway URL:** https://web-production-1f10.up.railway.app
- **Health Check:** https://sentiaprod.financeflo.ai/health
- **Port:** 8080
- **Branch:** production
- **Status:** ✅ Live

## Testing Environment
- **Main URL:** https://sentiatest.financeflo.ai
- **Railway URL:** https://sentia-manufacturing-dashboard-testing.up.railway.app
- **Health Check:** https://sentiatest.financeflo.ai/health
- **Port:** 8080
- **Branch:** test
- **Status:** ✅ Live

## Development Environment
- **Main URL:** https://sentiadeploy.financeflo.ai
- **Railway URL:** https://daring-reflection-development.up.railway.app
- **Health Check:** https://sentiadeploy.financeflo.ai/health
- **Port:** 8080
- **Branch:** development
- **Status:** ✅ Live

---

## 🔍 Health Verification URLs

### Quick Health Check Links (Click to verify):

#### Production Health Checks:
- **Custom Domain:** https://sentiaprod.financeflo.ai/health
- **Railway Domain:** https://web-production-1f10.up.railway.app/health
- **Alternative Endpoint:** https://sentiaprod.financeflo.ai/healthz

#### Testing Health Checks:
- **Custom Domain:** https://sentiatest.financeflo.ai/health
- **Railway Domain:** https://sentia-manufacturing-dashboard-testing.up.railway.app/health
- **Alternative Endpoint:** https://sentiatest.financeflo.ai/healthz

#### Development Health Checks:
- **Custom Domain:** https://sentiadeploy.financeflo.ai/health
- **Railway Domain:** https://daring-reflection-development.up.railway.app/health
- **Alternative Endpoint:** https://sentiadeploy.financeflo.ai/healthz

---

## 📊 Expected Health Check Response

When you visit any health endpoint, you should receive:
```
OK
```
**HTTP Status:** 200

---

## 🚀 Application URLs

### Production Application Pages:
- **Dashboard:** https://sentiaprod.financeflo.ai/dashboard
- **AI Dashboard:** https://sentiaprod.financeflo.ai/ai-dashboard
- **Working Capital:** https://sentiaprod.financeflo.ai/working-capital
- **Admin Panel:** https://sentiaprod.financeflo.ai/admin
- **Login:** https://sentiaprod.financeflo.ai/login

### Testing Application Pages:
- **Dashboard:** https://sentiatest.financeflo.ai/dashboard
- **AI Dashboard:** https://sentiatest.financeflo.ai/ai-dashboard
- **Working Capital:** https://sentiatest.financeflo.ai/working-capital
- **Admin Panel:** https://sentiatest.financeflo.ai/admin
- **Login:** https://sentiatest.financeflo.ai/login

### Development Application Pages:
- **Dashboard:** https://sentiadeploy.financeflo.ai/dashboard
- **AI Dashboard:** https://sentiadeploy.financeflo.ai/ai-dashboard
- **Working Capital:** https://sentiadeploy.financeflo.ai/working-capital
- **Admin Panel:** https://sentiadeploy.financeflo.ai/admin
- **Login:** https://sentiadeploy.financeflo.ai/login

---

## 🔧 API Endpoints

### Production API:
- **Base URL:** https://sentiaprod.financeflo.ai/api
- **Health:** https://sentiaprod.financeflo.ai/api/health
- **AI Status:** https://sentiaprod.financeflo.ai/api/ai/status
- **Metrics:** https://sentiaprod.financeflo.ai/api/metrics

### Testing API:
- **Base URL:** https://sentiatest.financeflo.ai/api
- **Health:** https://sentiatest.financeflo.ai/api/health
- **AI Status:** https://sentiatest.financeflo.ai/api/ai/status
- **Metrics:** https://sentiatest.financeflo.ai/api/metrics

### Development API:
- **Base URL:** https://sentiadeploy.financeflo.ai/api
- **Health:** https://sentiadeploy.financeflo.ai/api/health
- **AI Status:** https://sentiadeploy.financeflo.ai/api/ai/status
- **Metrics:** https://sentiadeploy.financeflo.ai/api/metrics

---

## 🌐 Monitoring & Verification

### Browser Testing (Quick Links):
1. **Production Dashboard:** [Open Dashboard](https://sentiaprod.financeflo.ai)
2. **Testing Dashboard:** [Open Dashboard](https://sentiatest.financeflo.ai)
3. **Development Dashboard:** [Open Dashboard](https://sentiadeploy.financeflo.ai)

### Health Monitoring Script:
```bash
# Test all health endpoints
echo "Testing Production Health..."
curl -I https://sentiaprod.financeflo.ai/health

echo "Testing Testing Environment Health..."
curl -I https://sentiatest.financeflo.ai/health

echo "Testing Development Health..."
curl -I https://sentiadeploy.financeflo.ai/health
```

### Expected Response Headers:
```
HTTP/2 200
content-type: text/plain
cache-control: no-cache
```

---

## 📝 Railway Project Configuration

### Railway Project IDs:
- **Production:** sentia-manufacturing-dashboard-production
- **Testing:** courageous-insight-testing
- **Development:** sentia-manufacturing-dashboard-development

### GitHub Repository:
- **URL:** https://github.com/Capliquify/sentia-manufacturing-dashboard.git
- **Production Branch:** production
- **Testing Branch:** test
- **Development Branch:** development

### Deployment Settings:
- **Builder:** Nixpacks
- **Port:** 8080 (all environments)
- **Health Check Path:** /health
- **Health Check Timeout:** 45 seconds
- **Restart Policy:** ON_FAILURE
- **Max Retries:** 5

---

## 🔐 Database Connections

### Neon PostgreSQL Endpoints:
- **Production DB:** Via DATABASE_URL environment variable
- **Testing DB:** Via DATABASE_URL environment variable
- **Development DB:** Via DATABASE_URL environment variable

### Vector Database:
- **Extension:** pgvector
- **Dimensions:** 1536 (OpenAI embeddings)
- **Index Type:** ivfflat

---

## 📈 Performance Metrics

### Expected Performance:
- **Time to First Byte (TTFB):** < 200ms
- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Total Bundle Size:** ~1.5MB (gzipped)

### CDN & Caching:
- **Static Assets:** 1 year cache (immutable)
- **HTML Files:** No cache (must-revalidate)
- **API Responses:** No cache (real-time data)
- **Compression:** Gzip enabled

---

## 🚨 Troubleshooting URLs

If main URLs don't work, try these alternatives:

### Direct Railway URLs:
- **Production:** https://web-production-1f10.up.railway.app
- **Testing:** https://sentia-manufacturing-dashboard-testing.up.railway.app
- **Development:** https://daring-reflection-development.up.railway.app

### Railway Logs:
- Access via Railway dashboard for each environment
- Check build logs and deployment logs
- Monitor runtime logs for errors

---

## 📞 Support & Documentation

### Documentation:
- **Deployment Guide:** /DEPLOYMENT_FIX_GUIDE.md
- **Railway Config:** /railway.toml
- **Nixpacks Config:** /nixpacks.toml

### Quick Diagnostics:
1. Health check returns "OK" → ✅ Server is running
2. Dashboard loads with CSS → ✅ Static assets working
3. Login works → ✅ Clerk authentication active
4. Data loads → ✅ Database connected

---

Last Updated: 2025-09-06
Generated with Claude Code CLI