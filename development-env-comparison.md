# Environment Variables Comparison: Testing vs Development

## Variables in Testing ENV that are MISSING or DIFFERENT in Development

### 1. Variables Present in Testing but MISSING in Development
- **PORT=5000** - Testing has this, Development doesn't (though Render auto-assigns)

### 2. Variables with DIFFERENT VALUES
- **AUTO_DEPLOY_ENABLED**:
  - Testing: `true` ⚠️
  - Development: `false`

- **NODE_ENV**:
  - Testing: `test`
  - Development: `development`

- **DATABASE_URL**:
  - Testing: Uses `sentia_manufacturing_test` database
  - Development: Uses `sentia_manufacturing_dev` database

- **CORS_ORIGINS**:
  - Testing: `https://sentia-manufacturing-testing.onrender.com`
  - Development: `https://sentia-manufacturing-development.onrender.com`

- **VITE_API_BASE_URL**:
  - Testing: `https://sentia-manufacturing-testing.onrender.com/api`
  - Development: `https://sentia-manufacturing-development.onrender.com/api`

### 3. Variables in Development but NOT in Testing
Testing environment is MISSING these important variables:

#### Authentication & Security
- **CLERK_ENVIRONMENT=production**
- **CLERK_SECRET_KEY=sk_live_mzgSFm1q9VrzngMMaCTNNwPEqBmr75vVxiND1DO7wq**
- **CLERK_WEBHOOK_SECRET=whsec_iTUcbgzS5P6zJlXWQkc4zGHnw8yLGt9j**
- **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ**
- **VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ**
- **VITE_CLERK_DOMAIN=clerk.financeflo.ai**
- **VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard**
- **VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard**
- **VITE_CLERK_SIGN_IN_URL=/sign-in**
- **VITE_CLERK_SIGN_UP_URL=/sign-up**
- **JWT_SECRET="wF08R/0kITl5rsQkgJhDef9otQ/3KERqlHRnjdpKavg="**
- **SESSION_SECRET="JtjquFaltrbuQ+8YAwUEJ5kKEvn6LElVPKuBvQ0imKE="**

#### API Integrations
- **AMAZON_UK_MARKETPLACE_ID=A1F83G8C2ARO7P**
- **AMAZON_USA_MARKETPLACE_ID=ATVPDKIKX0DER**
- **ANTHROPIC_API_KEY=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**
- **OPENAI_API_KEY=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**

#### Shopify Configuration
- **SHOPIFY_UK_ACCESS_TOKEN=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**
- **SHOPIFY_UK_API_KEY=7a30cd84e7a106b852c8e0fb789de10e**
- **SHOPIFY_UK_SECRET=8b2d61745c506970c70d8c892f5f977e**
- **SHOPIFY_UK_SHOP_URL=sentiaspirits.myshopify.com**
- **SHOPIFY_USA_ACCESS_TOKEN=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**
- **SHOPIFY_USA_API_KEY=83b8903fd8b509ef8bf93d1dbcd6079c**
- **SHOPIFY_USA_SECRET=d01260e58adb00198cddddd1bd9a9490**
- **SHOPIFY_USA_SHOP_URL=us-sentiaspirits.myshopify.com**

#### Xero Configuration
- **XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B**
- **XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5**
- **XERO_REDIRECT_URI=https://sentia-manufacturing-development.onrender.com/api/xero/callback**

#### Unleashed Configuration
- **UNLEASHED_API_ID=d5313df6-db35-430c-a69e-ae27dffe0c5a**
- **UNLEASHED_API_KEY="2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ=="**
- **UNLEASHED_API_URL=https://api.unleashedsoftware.com**

#### Microsoft Configuration
- **MICROSOFT_TENANT_ID=common**

#### MCP Configuration
- **MCP_SERVER_PORT=3001** (Note: Not needed on Render as discussed)

## Summary

### Critical Missing Variables in Testing Environment
The testing environment is missing **35 critical variables** that are present in development:
- 12 Clerk/Auth variables
- 8 Shopify variables
- 3 Xero variables
- 3 Unleashed variables
- 2 Amazon Marketplace IDs
- 2 AI API Keys (OpenAI, Anthropic)
- 2 Session/JWT secrets
- 1 Microsoft Tenant ID
- 1 MCP_SERVER_PORT (not needed on Render)

### ⚠️ Important Issue
**AUTO_DEPLOY_ENABLED=true** in testing but `false` in development. This should probably be `false` in testing to prevent automatic deployments.

## Recommendations
1. Add all missing Clerk authentication variables to testing
2. Add all API integration credentials (Shopify, Xero, Unleashed)
3. Add AI service API keys (OpenAI, Anthropic)
4. Change AUTO_DEPLOY_ENABLED to false in testing
5. Ensure XERO_REDIRECT_URI uses testing URL for testing environment