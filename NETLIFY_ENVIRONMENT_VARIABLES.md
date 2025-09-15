# 🔐 Netlify Environment Variables Configuration

## 📋 **COMPLETE ENVIRONMENT VARIABLES LIST**

Configure these environment variables in your Netlify dashboard under:
**Site Settings → Environment Variables → Add Variable**

---

## 🏗️ **CORE APPLICATION SETTINGS**

### **Application Environment**
```bash
NODE_ENV=production
VITE_APP_ENV=production
VITE_APP_NAME=Sentia Manufacturing Dashboard
VITE_APP_VERSION=1.0.5
```

### **API Configuration**
```bash
VITE_API_BASE_URL=https://web-production-1f10.up.railway.app
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3
```

---

## 🔑 **AUTHENTICATION & SECURITY**

### **Clerk Authentication**
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_[your-clerk-publishable-key]
CLERK_SECRET_KEY=sk_test_[your-clerk-secret-key]
```

### **Security Configuration**
```bash
SECRET_KEY=7a91c84993193fe2592863a924eefff4b39fe51bc656fb6475c227d7b969c6fb
VITE_ENCRYPTION_KEY=[your-encryption-key]
VITE_JWT_SECRET=[your-jwt-secret]
```

---

## 🗄️ **DATABASE CONFIGURATION**

### **Neon PostgreSQL (All Environments)**
```bash
# Development Database
VITE_DEV_DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Test Database
VITE_TEST_DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Production Database
VITE_DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-broad-resonance-ablmx6yo-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## 🤖 **AI SERVICES INTEGRATION**

### **OpenAI Configuration**
```bash
VITE_OPENAI_API_KEY=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
VITE_OPENAI_API_BASE=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-4
VITE_OPENAI_MAX_TOKENS=4000
```

### **Claude AI Configuration**
```bash
VITE_CLAUDE_API_KEY=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
VITE_CLAUDE_API_BASE=https://api.anthropic.com
VITE_CLAUDE_MODEL=claude-3-sonnet-20240229
VITE_CLAUDE_MAX_TOKENS=4000
```

---

## 🛍️ **E-COMMERCE INTEGRATIONS**

### **Shopify USA Store**
```bash
VITE_SHOPIFY_USA_API_KEY=83b8903fd8b509ef8bf93d1dbcd6079c
VITE_SHOPIFY_USA_SECRET=d01260e58adb00198cddddd1bd9a9490
VITE_SHOPIFY_USA_ACCESS_TOKEN=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
VITE_SHOPIFY_USA_SHOP_URL=us-sentiaspirits.myshopify.com
```

### **Shopify UK Store**
```bash
VITE_SHOPIFY_UK_API_KEY=7a30cd84e7a106b852c8e0fb789de10e
VITE_SHOPIFY_UK_SECRET=8b2d61745c506970c70d8c892f5f977e
VITE_SHOPIFY_UK_ACCESS_TOKEN=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
VITE_SHOPIFY_UK_SHOP_URL=sentiaspirits.myshopify.com
```

### **Amazon SP-API**
```bash
VITE_AMAZON_SP_API_CLIENT_ID=[your-amazon-client-id]
VITE_AMAZON_SP_API_CLIENT_SECRET=[your-amazon-client-secret]
VITE_AMAZON_SP_API_REFRESH_TOKEN=[your-amazon-refresh-token]
VITE_AMAZON_UK_MARKETPLACE_ID=A1F83G8C2ARO7P
VITE_AMAZON_USA_MARKETPLACE_ID=ATVPDKIKX0DER
```

---

## 📊 **BUSINESS INTEGRATIONS**

### **Unleashed Software API**
```bash
VITE_UNLEASHED_API_ID=d5313df6-db35-430c-a69e-ae27dffe0c5a
VITE_UNLEASHED_API_KEY=2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==
VITE_UNLEASHED_API_URL=https://api.unleashedsoftware.com
```

### **Xero Accounting API**
```bash
VITE_XERO_API_KEY=9C0CAB921C134476A249E48BBECB8C4B
VITE_XERO_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
VITE_XERO_API_BASE=https://api.xero.com
```

---

## 📧 **EMAIL & COMMUNICATION**

### **Microsoft Email Integration**
```bash
VITE_MS_EMAIL_ADMIN=admin@app.sentiaspirits.com
VITE_MS_EMAIL_DATA=data@app.sentiaspirits.com
VITE_MS_API_KEY=peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM
VITE_MS_API_SECRET=c16d6fba-0e6b-45ea-a016-eb697ff7a7ae
```

### **Slack Integration**
```bash
VITE_SLACK_BOT_TOKEN=xoxb-5909652898375-9457338164149-OGj9D5ptv8r3GQ7h2soAXRZY
VITE_SLACK_WEBHOOK_URL=[your-slack-webhook-url]
VITE_SLACK_CHANNEL=#general
```

---

## 🌐 **CORS & DOMAIN CONFIGURATION**

### **CORS Settings**
```bash
VITE_CORS_ORIGINS=http://localhost:3000,http://localhost:5000,https://sentiadeploy.financeflo.ai,https://your-netlify-domain.netlify.app
VITE_ALLOWED_DOMAINS=sentiaspirits.com,financeflo.ai,netlify.app
```

### **Domain Configuration**
```bash
VITE_FRONTEND_URL=https://your-netlify-domain.netlify.app
VITE_BACKEND_URL=https://web-production-1f10.up.railway.app
VITE_CDN_URL=https://your-netlify-domain.netlify.app
```

---

## 🚀 **DEPLOYMENT & PERFORMANCE**

### **Build Configuration**
```bash
NODE_VERSION=18
NPM_VERSION=9
VITE_BUILD_MODE=production
VITE_SOURCEMAP=false
VITE_MINIFY=true
```

### **Performance Settings**
```bash
VITE_CACHE_DURATION=3600
VITE_API_CACHE_TTL=300
VITE_STATIC_CACHE_TTL=86400
VITE_CDN_CACHE_TTL=31536000
```

---

## 📊 **MONITORING & ANALYTICS**

### **Application Monitoring**
```bash
VITE_SENTRY_DSN=[your-sentry-dsn]
VITE_ANALYTICS_ID=[your-analytics-id]
VITE_HOTJAR_ID=[your-hotjar-id]
VITE_GTM_ID=[your-google-tag-manager-id]
```

### **Performance Monitoring**
```bash
VITE_PERFORMANCE_MONITORING=true
VITE_ERROR_REPORTING=true
VITE_REAL_USER_MONITORING=true
```

---

## 🔧 **FEATURE FLAGS**

### **Enterprise Features**
```bash
VITE_ENABLE_AI_FORECASTING=true
VITE_ENABLE_ADVANCED_ANALYTICS=true
VITE_ENABLE_REAL_TIME_MONITORING=true
VITE_ENABLE_ENTERPRISE_SECURITY=true
VITE_ENABLE_MULTI_TENANT=true
```

### **Integration Toggles**
```bash
VITE_ENABLE_SHOPIFY_INTEGRATION=true
VITE_ENABLE_AMAZON_INTEGRATION=true
VITE_ENABLE_XERO_INTEGRATION=true
VITE_ENABLE_UNLEASHED_INTEGRATION=true
VITE_ENABLE_SLACK_NOTIFICATIONS=true
```

---

## ⚠️ **SECURITY NOTES**

### **🔒 Critical Security Variables (Keep Secret):**
- All API keys and secrets
- Database URLs with credentials
- JWT secrets and encryption keys
- OAuth tokens and refresh tokens

### **✅ Safe to Expose (VITE_ prefixed):**
- Public API endpoints
- Feature flags
- Non-sensitive configuration
- Public domain names

### **🛡️ Best Practices:**
1. **Never commit secrets** to version control
2. **Use different keys** for development/production
3. **Rotate keys regularly** (every 90 days)
4. **Monitor usage** of all API keys
5. **Use least privilege** access for all integrations

---

## 📋 **NETLIFY CONFIGURATION STEPS**

### **1. Access Environment Variables:**
1. Go to your Netlify site dashboard
2. Click "Site settings"
3. Navigate to "Environment variables"
4. Click "Add variable"

### **2. Add Variables:**
- **Key**: Variable name (e.g., `VITE_OPENAI_API_KEY`)
- **Value**: Variable value (e.g., your actual API key)
- **Scopes**: Select "All deploy contexts" or specific environments

### **3. Deploy:**
After adding all variables, trigger a new deployment:
- Go to "Deploys" tab
- Click "Trigger deploy" → "Deploy site"

---

## 🎯 **PRIORITY ORDER**

### **Essential (Must Have):**
1. `NODE_ENV=production`
2. `VITE_API_BASE_URL`
3. `VITE_CLERK_PUBLISHABLE_KEY`
4. `VITE_DATABASE_URL`

### **Important (Core Features):**
5. OpenAI and Claude API keys
6. Shopify integration variables
7. Unleashed API credentials
8. CORS configuration

### **Optional (Enhanced Features):**
9. Xero integration
10. Slack notifications
11. Amazon SP-API
12. Monitoring and analytics

**Start with Essential variables and add others as needed for specific features!** 🌟

