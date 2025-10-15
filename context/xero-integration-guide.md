# Xero Custom Connection Integration Guide

This document provides comprehensive setup and configuration for Xero API integration.

## XERO CUSTOM CONNECTION INTEGRATION

### 🔄 **Migration from OAuth to Custom Connection (October 2025)**
**COMPLETED**: Migrated from complex OAuth2 flow to simplified custom connection for better reliability and maintenance.

**Previous Implementation**: OAuth2 "Web App" with redirects, callbacks, and token management
**Current Implementation**: Direct API access using Client ID/Secret with custom connection

### Custom Connection Configuration
**Required Environment Variables**:
```env
# Xero Custom Connection (Required)
XERO_CLIENT_ID=your-client-id-here
XERO_CLIENT_SECRET=your-client-secret-here
# Note: XERO_ORGANIZATION_ID is automatically retrieved after authentication
```

### How to Set Up Xero Custom Connection (Official Process)

#### Step 1: Create Custom Connection
1. **Login to Xero Developer Portal**: https://developer.xero.com/
2. **Click "New App"** → Give it a name
3. **Select "Custom connection"** as integration type
4. **Important**: Custom connections are premium and require subscription

#### Step 2: Configure Scopes and Authorizing User
1. **Select API scopes** your integration needs:
   - `accounting.transactions`
   - `accounting.reports.read`
   - `accounting.settings.read`
2. **Choose authorizing user** (who will authorize the connection)
3. **User receives email** with authorization link

#### Step 3: Customer Authorization Required
**⚠️ CRITICAL**: The Xero customer must:
1. **Purchase Custom Connection subscription** from Xero
2. **Click authorization link** in email
3. **Complete consent screen** and select organization
4. **Note**: Only organizations with Custom Connection subscription can connect

#### Step 4: Retrieve Credentials
After authorization is complete:
1. **Get Client ID**: Available on app details page
2. **Generate Client Secret**: Private - do not share
3. **Add to environment variables**

#### Step 5: Authentication Flow
Our system automatically:
1. **Exchanges credentials** for access token via `https://identity.xero.com/connect/token`
2. **Uses Client Credentials grant** (`grant_type=client_credentials`)
3. **Retrieves organization ID** automatically after authentication
4. **Sets up API access** with proper Bearer token

### API Integration Features
- **Working Capital Calculations**: Real-time balance sheet analysis
- **Financial Reports**: Profit & Loss, Cash Flow, Balance Sheet
- **Invoice Management**: Create and retrieve invoices
- **Contact Management**: Customer and supplier data
- **Item Management**: Product and service catalog

### Connection Status Endpoints
- **Health Check**: `GET /api/xero/health`
- **Connection Status**: `GET /api/xero/status`

### Architecture Benefits
- **Simplified Authentication**: No OAuth flow complexity
- **Direct API Access**: No token refresh or expiry issues
- **Better Security**: No callback URLs or redirect vulnerabilities
- **Improved Reliability**: Consistent connection state
- **Easier Development**: No browser redirects during testing

### Configuration in Different Environments

#### Development Environment
```env
XERO_CLIENT_ID=your-dev-client-id
XERO_CLIENT_SECRET=your-dev-client-secret
# Organization ID retrieved automatically after authentication
```

#### Production Environment (Render)
Add these environment variables in Render Dashboard:
```
XERO_CLIENT_ID=your-prod-client-id
XERO_CLIENT_SECRET=your-prod-client-secret
# Organization ID retrieved automatically after authentication
```

### Important Notes
- **Single Organization**: Custom connections are tied to one specific Xero organization
- **No Multi-Tenant**: Cannot access multiple organizations with one connection
- **Direct Authentication**: No user login required - uses application credentials
- **Rate Limiting**: Subject to Xero API rate limits (60 calls per minute)