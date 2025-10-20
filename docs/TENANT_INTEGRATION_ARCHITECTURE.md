# Tenant Integration Architecture Guide

**Version**: 1.0
**Date**: October 24, 2025
**Target Audience**: Developers, System Architects, Integration Engineers
**Status**: Production-Ready

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Tenant vs System Integration Model](#tenant-vs-system-integration-model)
4. [Database Schema Design](#database-schema-design)
5. [API Architecture](#api-architecture)
6. [Frontend UI Components](#frontend-ui-components)
7. [Security & Encryption](#security--encryption)
8. [Integration Configuration Flow](#integration-configuration-flow)
9. [Supported Integrations](#supported-integrations)
10. [Developer Guide](#developer-guide)
11. [Tenant Admin Guide](#tenant-admin-guide)
12. [Troubleshooting](#troubleshooting)
13. [Best Practices](#best-practices)

---

## Executive Summary

### What is Tenant-Configurable Integration?

CapLiquify uses a **tenant-configurable integration architecture** where each tenant (customer organization) manages their own API credentials for external services. This differs from traditional SaaS where the platform provider manages global integrations.

### Key Concepts

**Tenant-Level Configuration**:
- Each tenant configures their own Xero, Shopify, Amazon, and Unleashed credentials
- Credentials stored encrypted in tenant's isolated database schema
- Zero cross-tenant data exposure risk
- Tenants control when to enable/disable integrations

**System-Level Services**:
- Integration service classes live at system level (`server/integrations/`)
- Services are stateless and initialized per-request with tenant credentials
- No global API keys stored at platform level (except for dev/testing)

### Benefits

| Benefit | Description |
|---------|-------------|
| **Data Isolation** | Each tenant's API credentials and data remain completely isolated |
| **Scalability** | No platform-wide rate limit bottlenecks (each tenant uses their own API quotas) |
| **Compliance** | Tenants maintain ownership of their third-party credentials (GDPR/SOC2 friendly) |
| **Flexibility** | Tenants can use different accounts (e.g., Xero AU vs Xero UK) |
| **Security** | Credential compromise limited to single tenant, not entire platform |

---

## Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CAPLIQUIFY PLATFORM                            │
│                                                                     │
│  ┌──────────────────────┐      ┌──────────────────────┐           │
│  │  Frontend (React)    │      │   Backend API        │           │
│  │                      │      │   (Express + Prisma) │           │
│  │  - IntegrationMgmt   │◄────►│   - API Routes       │           │
│  │  - Admin Panel       │      │   - Middleware       │           │
│  │  - Tenant Dashboard  │      │   - Services         │           │
│  └──────────────────────┘      └──────────┬───────────┘           │
│                                            │                        │
│                                            │                        │
│         ┌──────────────────────────────────┼──────────────┐        │
│         │         PostgreSQL Database      │              │        │
│         │                                  │              │        │
│         │  ┌─────────────┐    ┌───────────▼─────────┐   │        │
│         │  │   Public     │    │  tenant_abc123      │   │        │
│         │  │   Schema     │    │  (Tenant A)         │   │        │
│         │  │              │    │                     │   │        │
│         │  │  - tenants   │    │  - api_credentials  │   │        │
│         │  │  - users     │    │  - products         │   │        │
│         │  │  - audit_logs│    │  - sales            │   │        │
│         │  └─────────────┘    └─────────────────────┘   │        │
│         │                                                 │        │
│         │                      ┌──────────────────────┐  │        │
│         │                      │  tenant_xyz789       │  │        │
│         │                      │  (Tenant B)          │  │        │
│         │                      │                      │  │        │
│         │                      │  - api_credentials   │  │        │
│         │                      │  - products          │  │        │
│         │                      │  - sales             │  │        │
│         │                      └──────────────────────┘  │        │
│         └──────────────────────────────────────────────┘          │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                 ┌────────────────┼───────────────┐
                 │   External API Calls           │
                 │   (Per-Tenant Credentials)     │
                 └────────────────┬───────────────┘
                                  │
        ┌─────────────────┬───────┼──────┬─────────────────┐
        │                 │                │                │
┌───────▼─────┐  ┌────────▼──────┐  ┌────▼─────┐  ┌───────▼──────┐
│   Xero      │  │   Shopify     │  │  Amazon  │  │  Unleashed   │
│   (OAuth2)  │  │   (API Key)   │  │  SP-API  │  │  (HMAC-256)  │
│             │  │               │  │  (OAuth) │  │              │
│ Tenant A's  │  │ Tenant A's    │  │ Tenant   │  │ Tenant A's   │
│ Xero Acc    │  │ Shopify Store │  │ A's Acct │  │ Unleashed    │
└─────────────┘  └───────────────┘  └──────────┘  └──────────────┘
```

### Request Flow: Tenant API Call

```
1. Tenant Admin UI (IntegrationManagement.jsx)
   │
   ├─► POST /api/api-credentials
   │   Body: { serviceName: "xero", apiKey: "...", apiSecret: "..." }
   │
2. Backend API Route (api-credentials.routes.ts)
   │
   ├─► Middleware: tenantContext
   │   └─► Resolves: req.tenantSchema = "tenant_abc123"
   │
   ├─► Middleware: requireRole(['owner', 'admin'])
   │   └─► Checks: User has admin permissions
   │
   ├─► Encryption: encrypt(apiKey)
   │   └─► AES-256-GCM encryption with platform secret
   │
3. Database Write (tenantPrisma.executeRaw)
   │
   ├─► SET search_path TO "tenant_abc123", public
   │
   ├─► INSERT INTO api_credentials (service_name, api_key_encrypted, ...)
   │   └─► Stored in tenant_abc123.api_credentials table
   │
4. Audit Log (audit_logs table - public schema)
   │
   └─► INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, ...)
       └─► Compliance trail: "api_credentials.create by user_xyz"
```

### Integration Usage Flow

```
1. Business Process (e.g., Demand Forecasting)
   │
   ├─► Requires: Xero financial data
   │
2. Integration Service Initialization
   │
   ├─► Route: GET /api/forecasting/demand
   │
   ├─► Middleware: tenantContext
   │   └─► req.tenantSchema = "tenant_abc123"
   │
3. Credential Retrieval
   │
   ├─► SELECT api_key_encrypted FROM api_credentials
   │   WHERE service_name = 'xero' AND is_active = true
   │
   ├─► Decryption: decrypt(api_key_encrypted)
   │   └─► Plain-text API key (in-memory only)
   │
4. Service Instantiation
   │
   ├─► new XeroClient({ apiKey, apiSecret })
   │   └─► Stateless client initialized with tenant credentials
   │
5. External API Call
   │
   ├─► xeroClient.getAccountsReceivable()
   │   └─► Calls Xero API with tenant's OAuth token
   │
6. Data Processing
   │
   ├─► Merge Xero data with tenant's database records
   │
   └─► Return: Enriched financial forecast
```

---

## Tenant vs System Integration Model

### Comparison Matrix

| Aspect | **Tenant-Configurable** (CapLiquify) | **System-Level** (Traditional SaaS) |
|--------|-------------------------------------|-------------------------------------|
| **API Credentials** | Each tenant provides their own | Platform manages global credentials |
| **Data Ownership** | Tenant owns third-party account | Platform owns integration account |
| **Rate Limits** | Per-tenant limits (no shared bottleneck) | Platform-wide limits (affects all tenants) |
| **Credential Storage** | Encrypted in tenant schema | Encrypted in global config |
| **Security Risk** | Breach limited to single tenant | Breach affects all tenants |
| **Onboarding** | Tenant must configure integrations | Zero config, instant integrations |
| **Compliance** | GDPR/SOC2 friendly (tenant control) | Requires platform-level data agreements |
| **Customization** | Tenant can use different accounts/regions | One-size-fits-all configuration |
| **Cost Model** | Tenant pays for their API usage | Platform subsidizes API costs |

### Why Tenant-Configurable for CapLiquify?

**Manufacturing Context**:
- Manufacturers often have existing ERP/accounting systems (Xero, QuickBooks, Unleashed)
- Each manufacturer has unique data isolation requirements (competitive intel)
- Different regions/subsidiaries use different instances (Xero AU vs UK)

**Compliance & Trust**:
- Manufacturers hesitant to share financial credentials with SaaS platform
- Tenant-configurable = "You own your data, we just analyze it"
- Critical for enterprise sales (Fortune 500 customers demand data sovereignty)

**Scalability**:
- Traditional SaaS model: 100 tenants × 1000 API calls/day = 100K platform-wide calls
- Tenant model: Each tenant uses their own rate limits (no platform bottleneck)

---

## Database Schema Design

### Public Schema (Shared Metadata)

**Purpose**: Stores tenant registry, users, subscriptions, and cross-tenant audit logs.

```sql
-- Tenants table (master registry)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  schema_name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'tenant_abc123'
  clerk_organization_id VARCHAR(255) UNIQUE NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'starter',
  subscription_status VARCHAR(50) DEFAULT 'trial',
  trial_ends_at TIMESTAMP,
  max_users INTEGER DEFAULT 5,
  max_entities INTEGER DEFAULT 500,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- Users table (tenant association)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member', -- owner, admin, member, viewer
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs (compliance trail - public schema for cross-tenant visibility)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- e.g., 'api_credentials.create'
  entity_type VARCHAR(100), -- e.g., 'api_credential'
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tenant Schema (Isolated Data)

**Purpose**: Each tenant gets their own schema (`tenant_<uuid>`) containing all business data and credentials.

**Key Tables in Tenant Schema**:

```sql
-- API Credentials (per tenant)
-- Lives in: tenant_abc123.api_credentials
CREATE TABLE api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL, -- 'xero', 'shopify', 'amazon', 'unleashed'
  api_key TEXT NOT NULL, -- AES-256-GCM encrypted
  api_secret TEXT, -- AES-256-GCM encrypted (optional)
  oauth_access_token TEXT, -- For OAuth services like Xero
  oauth_refresh_token TEXT,
  oauth_token_expires_at TIMESTAMP,
  additional_config JSONB, -- Service-specific config (e.g., Shopify store URL)
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(service_name) -- One credential per service
);

-- Products (tenant business data)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit_price DECIMAL(10, 2) NOT NULL,
  cost_of_goods_sold DECIMAL(10, 2),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sales (tenant transactions)
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  sale_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  channel VARCHAR(50), -- 'shopify', 'amazon', 'direct'
  external_order_id VARCHAR(255), -- Shopify/Amazon order ID
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory (stock levels)
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  warehouse_location VARCHAR(100),
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_committed INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_committed) STORED,
  reorder_point INTEGER,
  reorder_quantity INTEGER,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Financial Metrics (working capital)
CREATE TABLE working_capital_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  accounts_receivable DECIMAL(12, 2),
  accounts_payable DECIMAL(12, 2),
  inventory_value DECIMAL(12, 2),
  cash_balance DECIMAL(12, 2),
  working_capital DECIMAL(12, 2) GENERATED ALWAYS AS (
    accounts_receivable + inventory_value - accounts_payable
  ) STORED,
  days_sales_outstanding DECIMAL(5, 2),
  days_inventory_outstanding DECIMAL(5, 2),
  days_payable_outstanding DECIMAL(5, 2),
  cash_conversion_cycle DECIMAL(5, 2) GENERATED ALWAYS AS (
    days_sales_outstanding + days_inventory_outstanding - days_payable_outstanding
  ) STORED,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(metric_date)
);
```

### Schema Isolation Verification

**Test Query**: Verify tenant cannot access another tenant's data

```sql
-- Connect as tenant A's user
SET search_path TO tenant_abc123, public;

-- Try to access tenant B's data (should fail)
SELECT * FROM tenant_xyz789.api_credentials;
-- ERROR: permission denied for schema tenant_xyz789

-- Try to manipulate search path (should fail if proper row-level security)
SET search_path TO tenant_xyz789, public;
SELECT * FROM api_credentials;
-- ERROR: permission denied for schema tenant_xyz789
```

---

## API Architecture

### Route Structure

**Base Path**: `/api/api-credentials`

**Authentication**: All routes require Clerk authentication + tenant context

**Authorization**: Role-based (owner/admin/member/viewer)

### Endpoints

#### 1. List API Credentials

```http
GET /api/api-credentials?page=1&limit=20&serviceName=xero&isActive=true
Authorization: Bearer <clerk-token>
```

**Access**: Owner, Admin

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "cred-123",
      "service_name": "xero",
      "api_key": "sk_****abc123", // Masked
      "api_secret": "***", // Masked
      "is_active": true,
      "last_used": "2025-10-24T10:30:00Z",
      "created_at": "2025-10-20T00:00:00Z",
      "updated_at": "2025-10-23T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 4,
    "totalPages": 1,
    "hasMore": false
  }
}
```

#### 2. Create API Credential

```http
POST /api/api-credentials
Authorization: Bearer <clerk-token>
Content-Type: application/json

{
  "serviceName": "xero",
  "apiKey": "sk_live_abc123...",
  "apiSecret": "secret_xyz789...",
  "additionalConfig": {
    "tenantId": "xero-tenant-uuid",
    "region": "AU"
  },
  "isActive": true
}
```

**Access**: Owner, Admin

**Validation**:
- `serviceName`: Required, min 1 char, max 100 chars
- `apiKey`: Required, min 1 char
- `apiSecret`: Optional
- `additionalConfig`: Optional JSON object
- `isActive`: Optional boolean (default: true)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "cred-456",
    "service_name": "xero",
    "api_key": "sk_****123", // Masked
    "api_secret": "***", // Masked
    "is_active": true,
    "created_at": "2025-10-24T14:00:00Z",
    "updated_at": "2025-10-24T14:00:00Z"
  },
  "message": "API credentials created successfully"
}
```

**Error Response** (Duplicate):
```json
{
  "success": false,
  "error": "Credentials for service 'xero' already exist",
  "code": "CONFLICT"
}
```

#### 3. Get Single Credential

```http
GET /api/api-credentials/:id
Authorization: Bearer <clerk-token>
```

**Access**: Owner, Admin

**Response**: Same as create response (masked keys)

#### 4. Reveal Actual Credentials

```http
GET /api/api-credentials/:id/reveal
Authorization: Bearer <clerk-token>
```

**Access**: Owner only (not admin!)

**Audit**: Logged to audit_logs table

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "cred-456",
    "service_name": "xero",
    "api_key": "sk_live_abc123...", // UNMASKED
    "api_secret": "secret_xyz789...", // UNMASKED
    "is_active": true
  },
  "warning": "These are sensitive credentials. Handle with care."
}
```

#### 5. Update Credential

```http
PUT /api/api-credentials/:id
Authorization: Bearer <clerk-token>
Content-Type: application/json

{
  "apiKey": "sk_live_new_key...",
  "isActive": false
}
```

**Access**: Owner, Admin

**Validation**: At least one field must be updated

**Response**: Updated credential (masked)

#### 6. Delete Credential

```http
DELETE /api/api-credentials/:id
Authorization: Bearer <clerk-token>
```

**Access**: Owner only

**Response**:
```json
{
  "success": true,
  "message": "API credentials deleted successfully"
}
```

#### 7. Test Connection

```http
POST /api/api-credentials/test-connection
Authorization: Bearer <clerk-token>
Content-Type: application/json

{
  "serviceName": "xero",
  "apiKey": "sk_test_...",
  "apiSecret": "secret_..."
}
```

**Access**: Owner, Admin

**Purpose**: Test credentials before saving

**Response** (Success):
```json
{
  "success": true,
  "message": "Connection test successful",
  "data": {
    "serviceName": "xero",
    "connectionStatus": "active",
    "testedAt": "2025-10-24T15:30:00Z"
  }
}
```

**Response** (Failure):
```json
{
  "success": false,
  "message": "Invalid API credentials",
  "error": "Connection test failed"
}
```

### Middleware Stack

**Request Pipeline**:

```javascript
router.get('/api/api-credentials',
  tenantContext,           // Step 1: Resolve tenant schema
  requireRole(['owner', 'admin']),  // Step 2: RBAC check
  asyncHandler(async (req, res) => {
    // Step 3: Business logic
  })
)
```

**1. tenantContext Middleware**:
```javascript
// server/middleware/tenantContext.js
export async function tenantContext(req, res, next) {
  // Extract Clerk organization ID from JWT
  const clerkOrgId = req.auth?.orgId

  if (!clerkOrgId) {
    return res.status(401).json({ error: 'No organization context' })
  }

  // Fetch tenant from public schema
  const tenant = await tenantPrisma.getTenantByClerkOrg(clerkOrgId)

  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' })
  }

  // Attach to request
  req.tenantId = tenant.id
  req.tenantSchema = tenant.schemaName // e.g., 'tenant_abc123'
  req.tenant = tenant

  next()
}
```

**2. requireRole Middleware**:
```javascript
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    const userRole = req.auth?.orgRole // From Clerk JWT

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole
      })
    }

    next()
  }
}
```

**3. auditLog Middleware**:
```javascript
export function auditLog(action, entityType) {
  return async (req, res, next) => {
    // Capture original res.json
    const originalJson = res.json.bind(res)

    res.json = async (data) => {
      // Log to audit_logs table (public schema)
      await tenantPrisma.getGlobalClient().auditLog.create({
        data: {
          tenantId: req.tenantId,
          userId: req.auth.userId,
          action,
          entityType,
          entityId: data.data?.id,
          newValue: data.data,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      })

      return originalJson(data)
    }

    next()
  }
}
```

---

## Frontend UI Components

### IntegrationManagement.jsx

**Purpose**: Admin panel for managing tenant's API credentials

**Features**:
- List all configured integrations
- View integration status (online/degraded/offline)
- Trigger manual sync
- Rotate API keys (with MFA)
- Update integration config (with MFA)
- View sync job history

**Component Tree**:
```
IntegrationManagement
├── IntegrationCard (sidebar - lists all integrations)
├── IntegrationDetails (main panel)
│   ├── DetailRow (status, endpoint, last sync, masked key)
│   ├── ActionButtons
│   │   ├── Trigger Sync (requires MFA)
│   │   ├── Rotate Key (requires MFA)
│   │   └── Push Config (requires MFA)
│   └── SyncJobList (recent sync history)
└── OperationalGuidance (best practices)
```

**Key Functions**:

```javascript
// Fetch integrations list
const integrationsQuery = useQuery({
  queryKey: ['admin', 'integrations'],
  queryFn: getIntegrations,
  staleTime: 60 * 1000
})

// Trigger manual sync (MFA protected)
const triggerSync = useMutation({
  mutationFn: async () => {
    const mfa = window.prompt('Enter the MFA code to authorise this action.')
    if (!mfa) throw new Error('MFA code is required')
    return triggerManualSync(selectedIntegration.id, mfa)
  },
  onSuccess: () => {
    toast.success('Manual sync triggered')
    historyQuery.refetch()
  }
})

// Rotate API key (MFA protected)
const rotateKey = useMutation({
  mutationFn: async () => {
    const confirmRotate = window.confirm(
      'Rotate integration API key? Existing credentials will stop working.'
    )
    if (!confirmRotate) return null

    const mfa = window.prompt('Enter the MFA code to authorise this action.')
    if (!mfa) throw new Error('MFA code is required')

    return rotateAPIKey(selectedIntegration.id, mfa)
  },
  onSuccess: (data) => {
    toast.success('API key rotated')
    if (data?.maskedKey) {
      window.alert(`New key issued: ${data.maskedKey}`)
    }
  }
})
```

**StatusPill Component**:
```javascript
const StatusPill = ({ status }) => {
  const palette =
    status === 'online'
      ? 'bg-green-100 text-green-700'
      : status === 'degraded'
        ? 'bg-amber-100 text-amber-700'
        : status === 'offline'
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-600'

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${palette}`}>
      {status || 'unknown'}
    </span>
  )
}
```

---

## Security & Encryption

### Encryption Algorithm

**Method**: AES-256-GCM (Galois/Counter Mode)

**Benefits**:
- Authenticated encryption (prevents tampering)
- 256-bit key strength (quantum-resistant)
- Built-in authentication tag (integrity verification)

**Implementation**:

```javascript
// server/utils/encryption.js
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY // 32 bytes (256 bits)
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // Initialization vector length

/**
 * Encrypt sensitive value
 * @param {string} plaintext - Value to encrypt
 * @returns {string} Base64-encoded encrypted value
 */
export function encrypt(plaintext) {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag().toString('hex')

  // Format: iv:authTag:encrypted
  return Buffer.from(`${iv.toString('hex')}:${authTag}:${encrypted}`).toString('base64')
}

/**
 * Decrypt encrypted value
 * @param {string} encryptedData - Base64-encoded encrypted value
 * @returns {string} Decrypted plaintext
 */
export function decrypt(encryptedData) {
  const decoded = Buffer.from(encryptedData, 'base64').toString('utf8')
  const [ivHex, authTagHex, encrypted] = decoded.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Mask sensitive value for display
 * @param {string} value - Value to mask
 * @returns {string} Masked value (e.g., "sk_****abc123")
 */
export function maskValue(value) {
  if (!value || value.length < 8) return '***'

  const prefix = value.slice(0, 3)
  const suffix = value.slice(-6)
  return `${prefix}****${suffix}`
}
```

### Key Management

**Environment Variable**:
```bash
# .env (DO NOT COMMIT)
ENCRYPTION_KEY=64-character-hex-string-generated-with-crypto-randomBytes-32
```

**Generate Key**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Rotation Strategy**:
1. Generate new encryption key
2. Decrypt all credentials with old key
3. Re-encrypt with new key
4. Update `ENCRYPTION_KEY` environment variable
5. Deploy new version
6. Verify all credentials still work

**Production Best Practices**:
- Store encryption key in AWS Secrets Manager / HashiCorp Vault
- Rotate key every 90 days
- Use separate keys for development/staging/production
- Never log decrypted values
- Audit all decrypt operations

---

## Integration Configuration Flow

### End-to-End Flow: Tenant Configures Xero

#### Step 1: Tenant Admin Accesses Integration Panel

1. Navigate to `/admin/integrations`
2. Click "Xero" integration card
3. Status shows "Not configured"

#### Step 2: Initiate OAuth Flow (for OAuth services)

**Frontend**:
```javascript
// Redirect to Xero OAuth authorization
const initiateXeroOAuth = async () => {
  const response = await fetch('/api/integrations/xero/authorize', {
    headers: { Authorization: `Bearer ${clerkToken}` }
  })
  const { authUrl } = await response.json()

  // Redirect to Xero consent screen
  window.location.href = authUrl
}
```

**Backend**:
```javascript
// server/routes/integrations.js
router.get('/xero/authorize', tenantContext, async (req, res) => {
  const { tenantId, tenantSchema } = req

  // Generate OAuth state parameter (CSRF protection)
  const state = crypto.randomBytes(16).toString('hex')

  // Store state in session or database
  await tenantPrisma.executeRaw(
    tenantSchema,
    'INSERT INTO oauth_states (state, expires_at) VALUES ($1, $2)',
    [state, new Date(Date.now() + 10 * 60 * 1000)] // 10 min expiry
  )

  // Build Xero authorization URL
  const authUrl = `https://login.xero.com/identity/connect/authorize?` +
    `response_type=code` +
    `&client_id=${process.env.XERO_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.XERO_REDIRECT_URI)}` +
    `&scope=accounting.transactions.read%20accounting.contacts.read` +
    `&state=${state}`

  res.json({ authUrl })
})
```

#### Step 3: Xero Callback

**Xero redirects to**: `https://api.capliquify.com/api/integrations/xero/callback?code=abc123&state=xyz789`

**Backend**:
```javascript
router.get('/xero/callback', tenantContext, async (req, res) => {
  const { code, state } = req.query
  const { tenantSchema } = req

  // Verify state parameter (CSRF protection)
  const [storedState] = await tenantPrisma.queryRaw(
    tenantSchema,
    'SELECT * FROM oauth_states WHERE state = $1 AND expires_at > NOW()',
    [state]
  )

  if (!storedState) {
    return res.status(400).json({ error: 'Invalid or expired state' })
  }

  // Exchange authorization code for access token
  const tokenResponse = await axios.post('https://identity.xero.com/connect/token', {
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.XERO_REDIRECT_URI,
    client_id: process.env.XERO_CLIENT_ID,
    client_secret: process.env.XERO_CLIENT_SECRET
  })

  const {
    access_token,
    refresh_token,
    expires_in // Seconds until expiry
  } = tokenResponse.data

  // Encrypt tokens
  const encryptedAccessToken = encrypt(access_token)
  const encryptedRefreshToken = encrypt(refresh_token)

  // Store in api_credentials table
  await tenantPrisma.executeRaw(
    tenantSchema,
    `INSERT INTO api_credentials (
      service_name, oauth_access_token, oauth_refresh_token, oauth_token_expires_at, is_active
    ) VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (service_name) DO UPDATE SET
      oauth_access_token = $2,
      oauth_refresh_token = $3,
      oauth_token_expires_at = $4,
      is_active = $5,
      updated_at = NOW()`,
    [
      'xero',
      encryptedAccessToken,
      encryptedRefreshToken,
      new Date(Date.now() + expires_in * 1000),
      true
    ]
  )

  // Redirect back to admin panel with success message
  res.redirect('/admin/integrations?xero=configured')
})
```

#### Step 4: Token Refresh (Background Job)

**Scheduled Task** (runs every 30 minutes):
```javascript
// server/jobs/refreshOAuthTokens.js
import cron from 'node-cron'

// Run every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('[OAuth Refresh] Starting token refresh job...')

  // Get all tenants
  const tenants = await tenantPrisma.getGlobalClient().tenant.findMany({
    where: { deletedAt: null }
  })

  for (const tenant of tenants) {
    try {
      // Check for expiring Xero tokens (expire in next 5 minutes)
      const [credential] = await tenantPrisma.queryRaw(
        tenant.schemaName,
        `SELECT * FROM api_credentials
         WHERE service_name = 'xero'
         AND is_active = true
         AND oauth_token_expires_at < NOW() + INTERVAL '5 minutes'`
      )

      if (!credential) continue

      // Decrypt refresh token
      const refreshToken = decrypt(credential.oauth_refresh_token)

      // Request new access token
      const tokenResponse = await axios.post('https://identity.xero.com/connect/token', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.XERO_CLIENT_ID,
        client_secret: process.env.XERO_CLIENT_SECRET
      })

      const { access_token, refresh_token: newRefreshToken, expires_in } = tokenResponse.data

      // Update stored tokens
      await tenantPrisma.executeRaw(
        tenant.schemaName,
        `UPDATE api_credentials SET
          oauth_access_token = $1,
          oauth_refresh_token = $2,
          oauth_token_expires_at = $3,
          updated_at = NOW()
         WHERE service_name = 'xero'`,
        [
          encrypt(access_token),
          encrypt(newRefreshToken),
          new Date(Date.now() + expires_in * 1000)
        ]
      )

      console.log(`[OAuth Refresh] Refreshed Xero token for tenant ${tenant.name}`)
    } catch (error) {
      console.error(`[OAuth Refresh] Failed for tenant ${tenant.name}:`, error.message)
    }
  }
})
```

#### Step 5: Using Credentials in Business Logic

**Example**: Fetch working capital data from Xero

```javascript
// server/routes/working-capital.js
router.get('/api/working-capital/current', tenantContext, async (req, res) => {
  const { tenantSchema } = req

  // Step 1: Retrieve Xero credentials
  const [credential] = await tenantPrisma.queryRaw(
    tenantSchema,
    `SELECT oauth_access_token, oauth_token_expires_at
     FROM api_credentials
     WHERE service_name = 'xero' AND is_active = true`
  )

  if (!credential) {
    return res.status(503).json({
      error: 'Xero integration not configured',
      message: 'Please configure Xero in Admin > Integrations'
    })
  }

  // Step 2: Check if token expired
  if (new Date(credential.oauth_token_expires_at) < new Date()) {
    return res.status(401).json({
      error: 'Xero token expired',
      message: 'Token refresh in progress. Please try again in 1 minute.'
    })
  }

  // Step 3: Decrypt access token
  const accessToken = decrypt(credential.oauth_access_token)

  // Step 4: Initialize Xero client
  const xeroClient = new XeroClient({ accessToken })

  try {
    // Step 5: Fetch accounts receivable
    const invoices = await xeroClient.accounting.getInvoices({
      where: 'Status=="AUTHORISED" OR Status=="SUBMITTED"'
    })

    const accountsReceivable = invoices.body.Invoices
      .filter(inv => inv.Type === 'ACCREC')
      .reduce((sum, inv) => sum + inv.AmountDue, 0)

    // Step 6: Fetch accounts payable
    const bills = await xeroClient.accounting.getInvoices({
      where: 'Type=="ACCPAY" AND (Status=="AUTHORISED" OR Status=="SUBMITTED")'
    })

    const accountsPayable = bills.body.Invoices
      .reduce((sum, inv) => sum + inv.AmountDue, 0)

    // Step 7: Merge with database data
    const [dbMetrics] = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT inventory_value, cash_balance
       FROM working_capital_metrics
       WHERE metric_date = CURRENT_DATE`
    )

    const workingCapital = accountsReceivable + (dbMetrics?.inventory_value || 0) - accountsPayable

    // Step 8: Update last_used timestamp
    await tenantPrisma.executeRaw(
      tenantSchema,
      `UPDATE api_credentials SET last_used = NOW() WHERE service_name = 'xero'`
    )

    res.json({
      success: true,
      data: {
        accountsReceivable,
        accountsPayable,
        inventoryValue: dbMetrics?.inventory_value || 0,
        cashBalance: dbMetrics?.cash_balance || 0,
        workingCapital,
        source: 'xero',
        lastSync: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('[Xero] API call failed:', error.message)

    // Fallback to database-only metrics
    const [dbMetrics] = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT * FROM working_capital_metrics
       WHERE metric_date = CURRENT_DATE`
    )

    if (dbMetrics) {
      res.json({
        success: true,
        data: dbMetrics,
        source: 'database',
        warning: 'Xero integration unavailable, showing database values'
      })
    } else {
      res.status(503).json({
        error: 'Working capital data unavailable',
        message: 'Xero integration failed and no database metrics found'
      })
    }
  }
})
```

---

## Supported Integrations

### 1. Xero (Accounting)

**Purpose**: Financial data for working capital analysis

**Authentication**: OAuth 2.0

**Scopes Required**:
- `accounting.transactions.read` - Read invoices, bills, payments
- `accounting.contacts.read` - Read customer/supplier data
- `accounting.reports.read` - Read financial reports

**Data Retrieved**:
- Accounts Receivable (unpaid invoices)
- Accounts Payable (unpaid bills)
- Bank transactions
- Payment terms
- DSO/DPO calculations

**Rate Limits**: 60 requests/minute per tenant

**Configuration Fields**:
```json
{
  "service_name": "xero",
  "oauth_access_token": "encrypted_token",
  "oauth_refresh_token": "encrypted_token",
  "oauth_token_expires_at": "2025-10-25T14:00:00Z",
  "additional_config": {
    "tenant_id": "xero-tenant-uuid",
    "region": "AU" // AU, UK, US
  }
}
```

**Setup Guide**: [context/xero-integration-guide.md](../context/xero-integration-guide.md)

---

### 2. Shopify (E-commerce)

**Purpose**: Sales data and inventory sync

**Authentication**: API Key (Admin API)

**Scopes Required**:
- `read_orders` - Read order history
- `read_products` - Read product catalog
- `read_inventory` - Read stock levels

**Data Retrieved**:
- Order history (past 90 days)
- Product SKU mapping
- Inventory quantities by location
- Sales by channel (online/POS)
- Customer data

**Rate Limits**: 2 requests/second per store (bucket algorithm)

**Configuration Fields**:
```json
{
  "service_name": "shopify",
  "api_key": "encrypted_admin_api_key",
  "additional_config": {
    "store_url": "acme-corp.myshopify.com",
    "api_version": "2024-10"
  }
}
```

**Multi-Store Support**: Create separate credentials for each store (UK/EU/USA)

---

### 3. Amazon SP-API (Seller Partner API)

**Purpose**: FBA inventory and sales data

**Authentication**: OAuth 2.0 + AWS IAM (hybrid)

**Scopes Required**:
- `FulfillmentInventory:Read` - FBA stock levels
- `Orders:Read` - Order metrics
- `Reports:Read` - Sales reports

**Data Retrieved**:
- FBA inventory (quantity, location)
- Order volume and revenue
- Unshipped items
- Return rates

**Rate Limits**: 5 requests/second per selling partner

**Configuration Fields**:
```json
{
  "service_name": "amazon",
  "oauth_access_token": "encrypted_lwa_token",
  "oauth_refresh_token": "encrypted_refresh_token",
  "oauth_token_expires_at": "2025-10-25T14:00:00Z",
  "additional_config": {
    "selling_partner_id": "AXXXXXXXXXXXXX",
    "marketplace_id": "ATVPDKIKX0DER", // US marketplace
    "aws_access_key_id": "AKIAIOSFODNN7EXAMPLE",
    "aws_secret_access_key": "encrypted_secret_key",
    "region": "us-east-1"
  }
}
```

**Setup Complexity**: High (requires AWS IAM role + OAuth)

---

### 4. Unleashed ERP (Manufacturing)

**Purpose**: Production data and assembly jobs

**Authentication**: HMAC-SHA256 (API ID + API Key)

**Data Retrieved**:
- Stock on hand (warehouse-level)
- Assembly jobs (production schedule)
- Bill of materials (BOM)
- Quality control alerts
- Low-stock alerts

**Rate Limits**: 200 requests/hour per account

**Configuration Fields**:
```json
{
  "service_name": "unleashed",
  "api_key": "encrypted_api_id",
  "api_secret": "encrypted_api_key",
  "additional_config": {
    "base_url": "https://api.unleashedsoftware.com"
  }
}
```

**Real-Time Updates**: Supports Server-Sent Events (SSE) for live production monitoring

---

## Developer Guide

### Adding a New Integration

**Example**: Add QuickBooks Online integration

#### Step 1: Create Integration Service Class

```javascript
// server/integrations/quickbooks.js
import axios from 'axios'

export class QuickBooksClient {
  constructor(config = {}) {
    this.accessToken = config.accessToken
    this.refreshToken = config.refreshToken
    this.realmId = config.realmId // QuickBooks company ID
    this.baseUrl = 'https://quickbooks.api.intuit.com/v3'
    this.isConfigured = !!(this.accessToken && this.realmId)
  }

  /**
   * Get Accounts Receivable
   */
  async getAccountsReceivable() {
    if (!this.isConfigured) {
      throw new Error('QuickBooks not configured')
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/company/${this.realmId}/query?query=SELECT * FROM Invoice WHERE Balance > '0'`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json'
          }
        }
      )

      const invoices = response.data.QueryResponse.Invoice || []
      const totalAR = invoices.reduce((sum, inv) => sum + parseFloat(inv.Balance), 0)

      return {
        totalAccountsReceivable: totalAR,
        invoiceCount: invoices.length,
        invoices: invoices.map(inv => ({
          id: inv.Id,
          customerName: inv.CustomerRef.name,
          amount: parseFloat(inv.TotalAmt),
          balance: parseFloat(inv.Balance),
          dueDate: inv.DueDate
        }))
      }
    } catch (error) {
      console.error('[QuickBooks] getAccountsReceivable failed:', error.message)
      throw new Error(`QuickBooks API error: ${error.message}`)
    }
  }

  /**
   * Get Accounts Payable
   */
  async getAccountsPayable() {
    // Similar implementation for bills
  }
}
```

#### Step 2: Add OAuth Routes

```javascript
// server/routes/integrations.js
router.get('/quickbooks/authorize', tenantContext, async (req, res) => {
  const state = crypto.randomBytes(16).toString('hex')

  // Store state
  await tenantPrisma.executeRaw(
    req.tenantSchema,
    'INSERT INTO oauth_states (state, expires_at) VALUES ($1, $2)',
    [state, new Date(Date.now() + 10 * 60 * 1000)]
  )

  const authUrl = `https://appcenter.intuit.com/connect/oauth2?` +
    `client_id=${process.env.QUICKBOOKS_CLIENT_ID}` +
    `&response_type=code` +
    `&scope=com.intuit.quickbooks.accounting` +
    `&redirect_uri=${encodeURIComponent(process.env.QUICKBOOKS_REDIRECT_URI)}` +
    `&state=${state}`

  res.json({ authUrl })
})

router.get('/quickbooks/callback', tenantContext, async (req, res) => {
  const { code, state, realmId } = req.query

  // Verify state
  const [storedState] = await tenantPrisma.queryRaw(
    req.tenantSchema,
    'SELECT * FROM oauth_states WHERE state = $1 AND expires_at > NOW()',
    [state]
  )

  if (!storedState) {
    return res.status(400).json({ error: 'Invalid state' })
  }

  // Exchange code for token
  const tokenResponse = await axios.post(
    'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI
    }),
    {
      auth: {
        username: process.env.QUICKBOOKS_CLIENT_ID,
        password: process.env.QUICKBOOKS_CLIENT_SECRET
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  )

  const { access_token, refresh_token, expires_in } = tokenResponse.data

  // Store credentials
  await tenantPrisma.executeRaw(
    req.tenantSchema,
    `INSERT INTO api_credentials (
      service_name, oauth_access_token, oauth_refresh_token, oauth_token_expires_at, additional_config, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (service_name) DO UPDATE SET
      oauth_access_token = $2,
      oauth_refresh_token = $3,
      oauth_token_expires_at = $4,
      additional_config = $5,
      updated_at = NOW()`,
    [
      'quickbooks',
      encrypt(access_token),
      encrypt(refresh_token),
      new Date(Date.now() + expires_in * 1000),
      JSON.stringify({ realmId }),
      true
    ]
  )

  res.redirect('/admin/integrations?quickbooks=configured')
})
```

#### Step 3: Add Business Logic Route

```javascript
// server/routes/working-capital.js
router.get('/api/working-capital/quickbooks', tenantContext, async (req, res) => {
  const { tenantSchema } = req

  // Get QuickBooks credentials
  const [credential] = await tenantPrisma.queryRaw(
    tenantSchema,
    `SELECT * FROM api_credentials WHERE service_name = 'quickbooks' AND is_active = true`
  )

  if (!credential) {
    return res.status(503).json({
      error: 'QuickBooks not configured',
      message: 'Configure QuickBooks in Admin > Integrations'
    })
  }

  // Decrypt tokens
  const accessToken = decrypt(credential.oauth_access_token)
  const { realmId } = JSON.parse(credential.additional_config)

  // Initialize client
  const qbClient = new QuickBooksClient({ accessToken, realmId })

  try {
    const [ar, ap] = await Promise.all([
      qbClient.getAccountsReceivable(),
      qbClient.getAccountsPayable()
    ])

    res.json({
      success: true,
      data: {
        accountsReceivable: ar.totalAccountsReceivable,
        accountsPayable: ap.totalAccountsPayable,
        source: 'quickbooks',
        lastSync: new Date().toISOString()
      }
    })
  } catch (error) {
    res.status(503).json({
      error: 'QuickBooks API error',
      message: error.message
    })
  }
})
```

#### Step 4: Add Frontend Integration Card

```javascript
// src/pages/admin/IntegrationManagement.jsx

// Add QuickBooks to integrations list
const defaultIntegrations = [
  { id: 'xero', name: 'Xero', vendor: 'Xero', status: 'offline' },
  { id: 'shopify', name: 'Shopify', vendor: 'Shopify', status: 'offline' },
  { id: 'amazon', name: 'Amazon SP-API', vendor: 'Amazon', status: 'offline' },
  { id: 'unleashed', name: 'Unleashed ERP', vendor: 'Unleashed', status: 'offline' },
  { id: 'quickbooks', name: 'QuickBooks Online', vendor: 'Intuit', status: 'offline' } // NEW
]
```

#### Step 5: Test Integration

```bash
# Start OAuth flow
curl http://localhost:5000/api/integrations/quickbooks/authorize \
  -H "Authorization: Bearer <clerk-token>"

# Returns: { "authUrl": "https://appcenter.intuit.com/connect/oauth2?..." }

# Complete OAuth in browser, then test API call
curl http://localhost:5000/api/working-capital/quickbooks \
  -H "Authorization: Bearer <clerk-token>"

# Returns: { "success": true, "data": { "accountsReceivable": 12500, ... } }
```

---

## Tenant Admin Guide

### How to Configure Integrations

**Target Audience**: Non-technical tenant administrators

#### Prerequisites

Before configuring integrations, ensure you have:
- **Admin or Owner role** in your CapLiquify organization
- **Active accounts** with third-party services (Xero, Shopify, etc.)
- **API access enabled** in third-party service (may require paid plan)
- **Two-factor authentication (2FA)** enabled on your CapLiquify account (required for sensitive operations)

---

### Xero Configuration

**Step 1**: Log in to CapLiquify
- Navigate to **Admin** → **Integrations**

**Step 2**: Click "Xero" integration card
- Status will show "Not configured"

**Step 3**: Click "Connect to Xero" button
- You'll be redirected to Xero's authorization page

**Step 4**: Authorize CapLiquify
- Select the Xero organization you want to connect
- Review permissions requested:
  - Read invoices and bills
  - Read contacts
  - Read financial reports
- Click "Authorise"

**Step 5**: Verify connection
- You'll be redirected back to CapLiquify
- Status should now show "Online"
- Last sync timestamp will appear

**Troubleshooting**:
- **Status shows "Degraded"**: Xero token may have expired. Click "Reconnect" to refresh.
- **Status shows "Offline"**: Check Xero account is active and API access enabled.

---

### Shopify Configuration

**Step 1**: Get Shopify Admin API Key
- In Shopify admin, go to **Settings** → **Apps and sales channels** → **Develop apps**
- Click "Create an app"
- Name it "CapLiquify Integration"
- Go to **API credentials** tab
- Copy **Admin API access token**

**Step 2**: Add credentials in CapLiquify
- Navigate to **Admin** → **Integrations** → **Shopify**
- Click "Add Credentials"
- Paste **Admin API access token**
- Enter your **Shopify store URL** (e.g., `acme-corp.myshopify.com`)
- Click "Save"

**Step 3**: Test connection
- Click "Test Connection" button
- If successful, status will show "Online"

**Multi-Store Setup**:
If you have multiple Shopify stores (UK/EU/USA), create separate API keys for each:
- UK Store: `acme-uk.myshopify.com`
- EU Store: `acme-eu.myshopify.com`
- USA Store: `acme-usa.myshopify.com`

**Rate Limits**:
Shopify allows 2 requests/second per store. CapLiquify automatically handles rate limiting.

---

### Amazon SP-API Configuration

**Complexity**: Advanced (requires AWS account + Seller Central)

**Step 1**: Register as Amazon Developer
- Go to [Seller Central](https://sellercentral.amazon.com)
- Navigate to **Apps & Services** → **Develop Apps**
- Create new app "CapLiquify Integration"

**Step 2**: Configure OAuth
- Add redirect URI: `https://api.capliquify.com/api/integrations/amazon/callback`
- Copy **LWA Client ID** and **LWA Client Secret**

**Step 3**: Create AWS IAM Role
- In AWS Console, create new IAM role
- Attach policy: `AmazonSP-APIAccess`
- Copy **AWS Access Key ID** and **Secret Access Key**

**Step 4**: Add credentials in CapLiquify
- Navigate to **Admin** → **Integrations** → **Amazon SP-API**
- Click "Connect to Amazon"
- Paste credentials:
  - LWA Client ID
  - LWA Client Secret
  - AWS Access Key ID
  - AWS Secret Access Key
  - Selling Partner ID (from Seller Central)
  - Marketplace ID (e.g., `ATVPDKIKX0DER` for US)
- Click "Authorize"

**Step 5**: Complete OAuth flow
- Authorize CapLiquify in Amazon consent screen
- Verify status shows "Online"

**Troubleshooting**:
- **401 Unauthorized**: Check AWS IAM role has correct policy attached
- **403 Forbidden**: Ensure Selling Partner ID is correct

---

### Unleashed ERP Configuration

**Step 1**: Get Unleashed API Credentials
- In Unleashed, go to **Integration** → **API Access**
- Click "Add API Access"
- Name it "CapLiquify"
- Copy **API ID** and **API Key**

**Step 2**: Add credentials in CapLiquify
- Navigate to **Admin** → **Integrations** → **Unleashed**
- Click "Add Credentials"
- Paste **API ID** (this is the "API Key" field)
- Paste **API Key** (this is the "API Secret" field)
- Click "Save"

**Step 3**: Test connection
- Click "Test Connection"
- If successful, status will show "Online"

**Rate Limits**:
Unleashed allows 200 requests/hour. CapLiquify syncs every 15 minutes to stay within limits.

**Real-Time Updates**:
Enable Server-Sent Events (SSE) for live production alerts:
- Go to **Settings** → **Notifications**
- Enable "Real-time production alerts"
- You'll receive instant alerts for:
  - Low stock (below reorder point)
  - Quality issues (yield < 95%)
  - Assembly job delays

---

### Security Best Practices

**1. Use Read-Only API Keys (where possible)**
- Xero: Grant only read permissions (not write)
- Shopify: Use "read_orders" and "read_products" scopes only
- Never grant CapLiquify write access unless absolutely necessary

**2. Enable Two-Factor Authentication**
- CapLiquify requires 2FA for:
  - Viewing unmasked API keys
  - Rotating API keys
  - Deleting integrations

**3. Rotate API Keys Regularly**
- Best practice: Rotate every 90 days
- CapLiquify will prompt you when keys are older than 90 days

**4. Monitor Audit Logs**
- Go to **Admin** → **Audit Logs**
- Review all integration credential changes
- Look for unauthorized access attempts

**5. Revoke Access Immediately on Breach**
- If you suspect credential compromise:
  1. Click "Disable" on integration (stops all API calls)
  2. Rotate API key in third-party service (Xero/Shopify/etc.)
  3. Update CapLiquify with new key
  4. Review audit logs for suspicious activity

---

## Troubleshooting

### Common Issues

#### Issue 1: "Integration not configured" Error

**Symptoms**:
```json
{
  "error": "Xero integration not configured",
  "message": "Please configure Xero in Admin > Integrations"
}
```

**Causes**:
1. API credentials never added
2. Integration was disabled
3. Credentials were deleted

**Solutions**:
1. Go to **Admin** → **Integrations**
2. Check if service status shows "Not configured"
3. Click "Add Credentials" and complete setup
4. Verify status changes to "Online"

---

#### Issue 2: "Token expired" Error

**Symptoms**:
```json
{
  "error": "Xero token expired",
  "message": "Token refresh in progress. Please try again in 1 minute."
}
```

**Causes**:
- OAuth refresh job failed
- Refresh token was revoked in Xero
- Xero app connection was deleted

**Solutions**:
1. Wait 1 minute for automatic refresh
2. If still failing, click "Reconnect" button
3. Complete OAuth flow again
4. If persistent, check Xero app connections in Xero settings

**Prevention**:
- OAuth tokens are auto-refreshed every 30 minutes
- Ensure background jobs are running (`pm2 list` should show `oauth-refresh` job)

---

#### Issue 3: Rate Limit Exceeded

**Symptoms**:
```json
{
  "error": "Rate limit exceeded. Try again in 15 minutes"
}
```

**Causes**:
- Too many API calls in short time
- Multiple users triggering manual syncs simultaneously

**Solutions**:
1. Wait for rate limit window to reset (shown in error message)
2. Disable manual syncs and rely on scheduled background syncs
3. For Unleashed: Increase sync interval from 15 to 30 minutes (Admin → Settings → Integration Sync)

**Rate Limits by Service**:
- **Xero**: 60 requests/minute per tenant
- **Shopify**: 2 requests/second per store
- **Amazon SP-API**: 5 requests/second per selling partner
- **Unleashed**: 200 requests/hour per account

---

#### Issue 4: Encrypted Data Cannot Be Decrypted

**Symptoms**:
```
Error: Failed to decrypt credential: invalid authentication tag
```

**Causes**:
- `ENCRYPTION_KEY` environment variable changed
- Database corruption
- Tampered encrypted data

**Solutions**:
1. **If ENCRYPTION_KEY was rotated**: Restore old key temporarily, decrypt all credentials, re-encrypt with new key
2. **If database corrupted**: Restore from backup
3. **If tampered**: Delete compromised credentials, re-add from scratch

**Prevention**:
- Never rotate `ENCRYPTION_KEY` without migration script
- Use immutable infrastructure (encrypt at rest with managed key service)
- Regular database backups (hourly)

---

#### Issue 5: Cross-Tenant Data Leakage (Security Critical!)

**Symptoms**:
- Tenant A sees Tenant B's products/sales
- Unexpected data in reports

**Diagnostic Query**:
```sql
-- Check current search_path
SHOW search_path;
-- Should return: tenant_abc123, public

-- Verify tenant schema
SELECT current_schema();
-- Should return: tenant_abc123
```

**Causes**:
- `tenantContext` middleware bypassed
- Hardcoded schema name in query
- SQL injection

**Solutions**:
1. **Immediate**: Disable affected tenant's access
2. **Audit**: Review all API routes for missing `tenantContext` middleware
3. **Fix**: Ensure ALL routes use `tenantContext` before business logic
4. **Verify**:
   ```javascript
   // Bad (hardcoded schema)
   await prisma.$queryRaw`SELECT * FROM tenant_abc123.products`

   // Good (dynamic schema)
   await tenantPrisma.queryRaw(req.tenantSchema, 'SELECT * FROM products')
   ```

---

### Debugging Tools

#### Enable Debug Logging

```bash
# Set environment variable
LOG_LEVEL=debug node server.js

# Or in .env
LOG_LEVEL=debug
```

**Debug Output**:
```
[tenantPrisma] Executing query in schema: tenant_abc123
[tenantPrisma] Query: SELECT * FROM api_credentials WHERE service_name = $1
[tenantPrisma] Params: ["xero"]
[Xero] API call: GET https://api.xero.com/api.xro/2.0/Invoices
[Xero] Response: 200 OK (1.2s)
```

#### Test Integration Service Directly

```javascript
// server/scripts/test-integration.js
import { XeroClient } from '../integrations/xero.js'
import { decrypt } from '../utils/encryption.js'
import { tenantPrisma } from '../services/tenantPrisma.js'

const tenantSchema = 'tenant_abc123' // Replace with actual tenant

// Get credentials
const [credential] = await tenantPrisma.queryRaw(
  tenantSchema,
  `SELECT * FROM api_credentials WHERE service_name = 'xero'`
)

if (!credential) {
  console.error('Xero not configured for this tenant')
  process.exit(1)
}

// Decrypt and test
const accessToken = decrypt(credential.oauth_access_token)
const xeroClient = new XeroClient({ accessToken })

try {
  const invoices = await xeroClient.accounting.getInvoices({ page: 1 })
  console.log(`✅ Success! Retrieved ${invoices.body.Invoices.length} invoices`)
} catch (error) {
  console.error(`❌ Error: ${error.message}`)
}

process.exit(0)
```

**Run**:
```bash
node server/scripts/test-integration.js
```

---

## Best Practices

### 1. Credential Storage

**DO**:
- ✅ Encrypt all API keys/secrets with AES-256-GCM
- ✅ Store encryption key in environment variable (never commit)
- ✅ Use separate encryption keys for dev/staging/production
- ✅ Rotate encryption key every 90 days
- ✅ Mask credentials in UI (show only last 6 characters)

**DON'T**:
- ❌ Store plaintext credentials in database
- ❌ Log decrypted credentials (even in debug mode)
- ❌ Expose credentials in API responses (except `/reveal` endpoint for owners)
- ❌ Share encryption key via Slack/email
- ❌ Use same encryption key across environments

---

### 2. OAuth Token Management

**DO**:
- ✅ Auto-refresh tokens 5 minutes before expiry
- ✅ Store refresh tokens encrypted
- ✅ Handle token revocation gracefully (show "Reconnect" button)
- ✅ Use state parameter for CSRF protection
- ✅ Verify redirect URI matches registered URI

**DON'T**:
- ❌ Wait for token expiry before refresh (race conditions)
- ❌ Store tokens in localStorage/sessionStorage (XSS risk)
- ❌ Reuse OAuth state parameter across requests
- ❌ Allow open redirect vulnerabilities

---

### 3. Rate Limiting

**DO**:
- ✅ Implement client-side rate limiting (respect API quotas)
- ✅ Use exponential backoff on rate limit errors
- ✅ Cache API responses where appropriate (e.g., product catalog)
- ✅ Batch API calls when possible (e.g., bulk invoice retrieval)
- ✅ Show user-friendly rate limit messages

**DON'T**:
- ❌ Hammer API with retries on 429 errors
- ❌ Bypass rate limits with multiple API keys
- ❌ Sync entire dataset on every request (use incremental sync)

**Example Rate Limiter**:
```javascript
class RateLimiter {
  constructor(maxRequests, perInterval) {
    this.maxRequests = maxRequests
    this.perInterval = perInterval // milliseconds
    this.requests = []
  }

  async checkLimit() {
    const now = Date.now()
    this.requests = this.requests.filter(t => now - t < this.perInterval)

    if (this.requests.length >= this.maxRequests) {
      const waitTime = this.perInterval - (now - this.requests[0])
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)}s`)
    }

    this.requests.push(now)
  }
}

// Usage
const xeroLimiter = new RateLimiter(60, 60000) // 60 req/min
await xeroLimiter.checkLimit()
await xeroClient.getInvoices()
```

---

### 4. Error Handling

**DO**:
- ✅ Return specific error messages ("Xero token expired" not "Integration error")
- ✅ Provide actionable guidance ("Click Reconnect to refresh token")
- ✅ Log errors with context (tenant ID, user ID, timestamp)
- ✅ Implement fallback to database when API unavailable
- ✅ Show graceful degradation UI ("Showing last known data from 2 hours ago")

**DON'T**:
- ❌ Expose internal error details to users ("Stack trace: at Object...")
- ❌ Return generic "500 Internal Server Error"
- ❌ Fail entire page load on single integration failure
- ❌ Retry indefinitely on persistent errors

**Example Error Response**:
```json
{
  "success": false,
  "error": "Xero token expired",
  "message": "Your Xero connection needs to be refreshed. Click 'Reconnect' in Admin > Integrations.",
  "code": "INTEGRATION_TOKEN_EXPIRED",
  "actions": [
    {
      "label": "Reconnect Xero",
      "url": "/admin/integrations?reconnect=xero"
    },
    {
      "label": "View database-only metrics",
      "url": "/working-capital?source=database"
    }
  ]
}
```

---

### 5. Audit Logging

**DO**:
- ✅ Log all credential create/update/delete operations
- ✅ Log all `/reveal` endpoint calls (viewing unmasked keys)
- ✅ Log all API key rotations
- ✅ Include IP address and user agent in logs
- ✅ Retain audit logs for minimum 1 year (compliance)

**DON'T**:
- ❌ Log decrypted credentials (even in audit logs)
- ❌ Allow users to delete audit logs
- ❌ Store audit logs in tenant schema (use public schema for cross-tenant visibility)

**Example Audit Log Entry**:
```json
{
  "id": "audit-123",
  "tenant_id": "tenant-abc",
  "user_id": "user-xyz",
  "action": "api_credentials.reveal",
  "entity_type": "api_credential",
  "entity_id": "cred-456",
  "old_value": null,
  "new_value": null, // Never log actual credentials
  "ip_address": "203.0.113.42",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-10-24T16:30:00Z"
}
```

---

### 6. Testing

**DO**:
- ✅ Test integration with real API (not just mocks)
- ✅ Test OAuth flow end-to-end in staging
- ✅ Test token refresh job in isolation
- ✅ Test rate limit handling (simulate 429 errors)
- ✅ Test schema isolation (try to access another tenant's credentials)

**DON'T**:
- ❌ Test only with mock data (real API has unexpected edge cases)
- ❌ Skip testing OAuth callback errors (invalid state, expired code)
- ❌ Assume token refresh always succeeds

**Example Integration Test**:
```javascript
// tests/integration/xero.test.js
import { describe, it, expect, beforeAll } from 'vitest'
import { tenantPrisma } from '../../server/services/tenantPrisma.js'
import { encrypt } from '../../server/utils/encryption.js'

describe('Xero Integration', () => {
  let testTenantSchema

  beforeAll(async () => {
    // Create test tenant
    const tenant = await tenantPrisma.createTenant({
      slug: 'test-xero',
      name: 'Test Xero Tenant',
      clerkOrgId: 'org_test_xero'
    })
    testTenantSchema = tenant.schemaName

    // Add Xero credentials
    await tenantPrisma.executeRaw(
      testTenantSchema,
      `INSERT INTO api_credentials (service_name, oauth_access_token, is_active)
       VALUES ($1, $2, $3)`,
      ['xero', encrypt(process.env.TEST_XERO_TOKEN), true]
    )
  })

  it('should fetch accounts receivable from Xero', async () => {
    const response = await fetch('http://localhost:5000/api/working-capital/current', {
      headers: { 'X-Test-Tenant-Schema': testTenantSchema }
    })

    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('accountsReceivable')
    expect(data.data.source).toBe('xero')
  })

  it('should prevent cross-tenant data access', async () => {
    // Create second tenant
    const tenant2 = await tenantPrisma.createTenant({
      slug: 'test-xero-2',
      name: 'Test Xero Tenant 2',
      clerkOrgId: 'org_test_xero_2'
    })

    // Try to query tenant 1's credentials from tenant 2's schema
    await expect(
      tenantPrisma.queryRaw(
        tenant2.schemaName,
        `SELECT * FROM api_credentials WHERE service_name = 'xero'`
      )
    ).rejects.toThrow()
  })
})
```

---

## Appendix

### A. Database Schema Reference

**Full schema**: See [prisma/schema-multi-tenant.prisma](../prisma/schema-multi-tenant.prisma)

**Key tables**:
- `public.tenants` - Tenant registry
- `public.users` - User-tenant association
- `public.audit_logs` - Cross-tenant audit trail
- `tenant_*.api_credentials` - Encrypted API credentials (per tenant)

---

### B. API Route Reference

**Base path**: `/api`

**Routes**:
- `GET /api/api-credentials` - List credentials
- `POST /api/api-credentials` - Create credential
- `GET /api/api-credentials/:id` - Get credential (masked)
- `GET /api/api-credentials/:id/reveal` - Reveal credential (owner only)
- `PUT /api/api-credentials/:id` - Update credential
- `DELETE /api/api-credentials/:id` - Delete credential (owner only)
- `POST /api/api-credentials/test-connection` - Test before save

**OAuth routes**:
- `GET /api/integrations/xero/authorize` - Start Xero OAuth
- `GET /api/integrations/xero/callback` - Xero OAuth callback
- `GET /api/integrations/quickbooks/authorize` - Start QuickBooks OAuth
- `GET /api/integrations/quickbooks/callback` - QuickBooks OAuth callback

---

### C. Environment Variables

```bash
# Encryption
ENCRYPTION_KEY=64-char-hex-string # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Xero OAuth
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret
XERO_REDIRECT_URI=https://api.capliquify.com/api/integrations/xero/callback

# QuickBooks OAuth
QUICKBOOKS_CLIENT_ID=your-qb-client-id
QUICKBOOKS_CLIENT_SECRET=your-qb-client-secret
QUICKBOOKS_REDIRECT_URI=https://api.capliquify.com/api/integrations/quickbooks/callback

# Amazon SP-API (platform-level for OAuth, tenants provide their own credentials)
AMAZON_LWA_CLIENT_ID=your-lwa-client-id
AMAZON_LWA_CLIENT_SECRET=your-lwa-client-secret
AMAZON_REDIRECT_URI=https://api.capliquify.com/api/integrations/amazon/callback

# Database
DATABASE_URL=postgresql://user:pass@host/capliquify_prod

# Logging
LOG_LEVEL=info # debug, info, warn, error
```

---

### D. Related Documentation

- [Multi-Tenant Setup Guide](MULTI_TENANT_SETUP_GUIDE.md) - Database architecture and schema design
- [CapLiquify Migration Guide](CAPLIQUIFY_MIGRATION_GUIDE.md) - Complete transformation roadmap
- [Xero Integration Guide](../context/xero-integration-guide.md) - Xero-specific setup
- [Phase 3 Deployment Guide](PHASE-3-AUTHENTICATION-DEPLOYMENT.md) - Authentication system
- [Phase 6 Deployment Guide](PHASE-6-STRIPE-DEPLOYMENT.md) - Billing integration

---

**Document Version**: 1.0
**Last Updated**: October 24, 2025
**Maintained By**: CapLiquify Engineering Team
**Contact**: dev@capliquify.com
