# System Configuration Technical Specifications

## Overview
This document defines the technical architecture for system configuration management, including settings hierarchy, encryption strategies, and approval workflows for the Admin Portal.

## Configuration Hierarchy

### 1. Environment Variables (.env)
**Priority**: Highest
**Source**: Environment files, Railway environment variables
**Use Case**: Infrastructure configuration, secrets, deployment-specific settings

```bash
# Core Application
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Authentication
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_DEVELOPMENT_MODE=false  # true=bypass auth, false=full Clerk auth

# Admin Portal Configuration
ADMIN_REQUIRE_STEP_UP=true
ENV_EDIT_MODE=proposal-only  # read-only|proposal-only|full
LOG_TAIL_SAMPLE_RATE=0.1
ERROR_GROUP_WINDOW_MIN=15

# Feature Flags (Environment Level)
FEATURE_FORECASTING_BETA=true
FEATURE_WC_OPTIMIZER=false
FEATURE_ADMIN_PORTAL=true

# Security
CSRF_SECRET=...
SESSION_SECRET=...
ENCRYPTION_KEY=...

# External Integrations
SHOPIFY_APP_SECRET=...
AMAZON_SP_API_SECRET=...
XERO_CLIENT_SECRET=...
```

### 2. System_Settings Table
**Priority**: Medium
**Source**: Database (admin-configurable)
**Use Case**: Application behavior, feature toggles, user preferences

```sql
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,  -- 'app', 'feature_flags', 'integrations'
    key VARCHAR(100) NOT NULL,
    value TEXT,                     -- Encrypted if sensitive
    value_type VARCHAR(20) NOT NULL DEFAULT 'string', -- string|number|boolean|json
    is_encrypted BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false, -- Safe to display in UI
    environment VARCHAR(20) NOT NULL, -- development|test|production
    description TEXT,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(category, key, environment)
);

-- Indexes
CREATE INDEX idx_system_settings_category ON system_settings(category, environment);
CREATE INDEX idx_system_settings_key ON system_settings(key, environment);
```

### 3. Feature_Flags Table
**Priority**: Medium
**Source**: Database (admin-configurable)
**Use Case**: Runtime feature toggling, A/B testing, rollout control

```sql
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_roles TEXT[], -- ['admin', 'manager'] or NULL for all
    environment VARCHAR(20) NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(flag_key, environment)
);

-- Indexes
CREATE INDEX idx_feature_flags_key ON feature_flags(flag_key, environment);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(is_enabled, environment);
```

### 4. Default Values (Code)
**Priority**: Lowest
**Source**: Application code constants
**Use Case**: Fallback values, initial configuration

## Encryption Strategy

### Encryption Key Management
- **Development**: Fixed key in .env file
- **Test**: Rotating key with 30-day lifecycle
- **Production**: Hardware Security Module (HSM) or Railway secrets

### Encrypted Fields
```javascript
const ENCRYPTED_SETTINGS = [
    'integrations.shopify.app_secret',
    'integrations.amazon.client_secret',
    'integrations.xero.client_secret',
    'auth.oauth_client_secret',
    'smtp.password',
    'webhook.signing_secret'
];

const MASKED_DISPLAY_REGEX = /^(.{2}).*(.{2})$/;
```

### Encryption Implementation
```javascript
import crypto from 'crypto';

class SettingsEncryption {
    constructor(key) {
        this.algorithm = 'aes-256-gcm';
        this.key = crypto.scryptSync(key, 'salt', 32);
    }
    
    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(this.algorithm, this.key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }
    
    decrypt(encryptedText) {
        const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        const decipher = crypto.createDecipher(this.algorithm, this.key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
```

## Configuration Access Patterns

### 1. Configuration Service
```javascript
class ConfigurationService {
    constructor(db, cache, encryption) {
        this.db = db;
        this.cache = cache;
        this.encryption = encryption;
    }
    
    async get(category, key, environment = process.env.NODE_ENV) {
        // 1. Check cache
        const cacheKey = `config:${environment}:${category}:${key}`;
        let value = await this.cache.get(cacheKey);
        
        if (value !== null) return this.deserializeValue(value);
        
        // 2. Check database
        const setting = await this.db.query(`
            SELECT value, value_type, is_encrypted 
            FROM system_settings 
            WHERE category = $1 AND key = $2 AND environment = $3
        `, [category, key, environment]);
        
        if (setting.rows.length > 0) {
            const row = setting.rows[0];
            let rawValue = row.value;
            
            if (row.is_encrypted) {
                rawValue = this.encryption.decrypt(rawValue);
            }
            
            value = this.deserializeValue(rawValue, row.value_type);
            
            // Cache for 5 minutes
            await this.cache.setex(cacheKey, 300, JSON.stringify({
                value,
                type: row.value_type
            }));
            
            return value;
        }
        
        // 3. Check environment variables
        const envValue = process.env[`${category.toUpperCase()}_${key.toUpperCase()}`];
        if (envValue !== undefined) {
            value = this.deserializeValue(envValue);
            await this.cache.setex(cacheKey, 300, JSON.stringify({ value, type: 'string' }));
            return value;
        }
        
        // 4. Return default
        return this.getDefault(category, key);
    }
    
    async set(category, key, value, options = {}) {
        const {
            environment = process.env.NODE_ENV,
            valueType = this.inferType(value),
            isEncrypted = this.shouldEncrypt(category, key),
            description = null,
            userId = null
        } = options;
        
        let serializedValue = this.serializeValue(value, valueType);
        
        if (isEncrypted) {
            serializedValue = this.encryption.encrypt(serializedValue);
        }
        
        await this.db.query(`
            INSERT INTO system_settings 
            (category, key, value, value_type, is_encrypted, environment, description, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (category, key, environment)
            DO UPDATE SET 
                value = EXCLUDED.value,
                value_type = EXCLUDED.value_type,
                is_encrypted = EXCLUDED.is_encrypted,
                description = EXCLUDED.description,
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()
        `, [category, key, serializedValue, valueType, isEncrypted, environment, description, userId]);
        
        // Clear cache
        const cacheKey = `config:${environment}:${category}:${key}`;
        await this.cache.del(cacheKey);
        
        // Clear category cache
        await this.cache.del(`config:${environment}:${category}:*`);
    }
    
    shouldEncrypt(category, key) {
        const fullKey = `${category}.${key}`;
        return ENCRYPTED_SETTINGS.includes(fullKey) || 
               key.includes('secret') || 
               key.includes('password') || 
               key.includes('token');
    }
}
```

### 2. Feature Flag Service
```javascript
class FeatureFlagService {
    constructor(db, cache) {
        this.db = db;
        this.cache = cache;
    }
    
    async isEnabled(flagKey, userId = null, userRole = null, environment = process.env.NODE_ENV) {
        const cacheKey = `flag:${environment}:${flagKey}`;
        let flag = await this.cache.get(cacheKey);
        
        if (!flag) {
            const result = await this.db.query(`
                SELECT is_enabled, rollout_percentage, target_roles
                FROM feature_flags 
                WHERE flag_key = $1 AND environment = $2
            `, [flagKey, environment]);
            
            if (result.rows.length === 0) return false;
            
            flag = result.rows[0];
            await this.cache.setex(cacheKey, 60, JSON.stringify(flag)); // Cache 1 min
        } else {
            flag = JSON.parse(flag);
        }
        
        if (!flag.is_enabled) return false;
        
        // Role targeting
        if (flag.target_roles && flag.target_roles.length > 0) {
            if (!userRole || !flag.target_roles.includes(userRole)) {
                return false;
            }
        }
        
        // Rollout percentage
        if (flag.rollout_percentage < 100) {
            if (!userId) return false;
            
            // Consistent hash-based rollout
            const hash = crypto.createHash('sha256')
                .update(`${flagKey}:${userId}`)
                .digest('hex');
            const percentage = parseInt(hash.substring(0, 8), 16) % 100;
            
            return percentage < flag.rollout_percentage;
        }
        
        return true;
    }
    
    async toggle(flagKey, enabled, options = {}) {
        const {
            environment = process.env.NODE_ENV,
            userId = null,
            rolloutPercentage = enabled ? 100 : 0,
            changeNote = null
        } = options;
        
        const oldValue = await this.db.query(`
            SELECT is_enabled, rollout_percentage FROM feature_flags 
            WHERE flag_key = $1 AND environment = $2
        `, [flagKey, environment]);
        
        await this.db.query(`
            UPDATE feature_flags 
            SET is_enabled = $1, rollout_percentage = $2, updated_by = $3, updated_at = NOW()
            WHERE flag_key = $4 AND environment = $5
        `, [enabled, rolloutPercentage, userId, flagKey, environment]);
        
        // Clear cache
        await this.cache.del(`flag:${environment}:${flagKey}`);
        
        // Audit log
        await this.auditLog({
            action: 'FEATURE_FLAG_TOGGLED',
            userId,
            details: {
                flag_key: flagKey,
                environment,
                old_value: oldValue.rows[0],
                new_value: { is_enabled: enabled, rollout_percentage: rolloutPercentage },
                change_note: changeNote
            }
        });
    }
}
```

## Environment-Specific Behavior

### Development Environment
```javascript
const developmentConfig = {
    envEditMode: 'full',
    requireStepUp: false,
    allowDangerousOperations: true,
    auditLogLevel: 'debug',
    encryptionRequired: false,
    backupAllowed: true,
    migrationAutoRun: true
};
```

### Test Environment
```javascript
const testConfig = {
    envEditMode: 'full',
    requireStepUp: false,
    allowDangerousOperations: true,
    auditLogLevel: 'info',
    encryptionRequired: true,
    backupAllowed: true,
    migrationAutoRun: false
};
```

### Production Environment
```javascript
const productionConfig = {
    envEditMode: 'proposal-only',
    requireStepUp: true,
    allowDangerousOperations: false,
    auditLogLevel: 'warn',
    encryptionRequired: true,
    backupAllowed: false, // Runbook links only
    migrationAutoRun: false
};
```

## Approval Workflow System

### 1. Change Proposals Table
```sql
CREATE TABLE change_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_type VARCHAR(50) NOT NULL, -- 'env_var', 'maintenance', 'migration'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    proposed_changes JSONB NOT NULL,
    current_values JSONB,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'medium', -- low|medium|high|critical
    environment VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending|approved|rejected|implemented
    proposed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    implemented_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    implemented_at TIMESTAMP,
    rejection_reason TEXT
);
```

### 2. Approval Workflow Service
```javascript
class ApprovalWorkflowService {
    async createProposal(type, changes, options = {}) {
        const {
            title,
            description,
            environment = 'production',
            userId,
            riskLevel = this.assessRisk(changes)
        } = options;
        
        const currentValues = await this.getCurrentValues(changes);
        
        const proposal = await this.db.query(`
            INSERT INTO change_proposals 
            (proposal_type, title, description, proposed_changes, current_values, 
             risk_level, environment, proposed_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `, [type, title, description, JSON.stringify(changes), 
            JSON.stringify(currentValues), riskLevel, environment, userId]);
        
        // Notify approvers
        await this.notifyApprovers(proposal.rows[0].id, riskLevel);
        
        return proposal.rows[0].id;
    }
    
    async approveProposal(proposalId, userId, options = {}) {
        const { implementImmediately = false, scheduledFor = null } = options;
        
        await this.db.query(`
            UPDATE change_proposals 
            SET status = 'approved', approved_by = $1, approved_at = NOW()
            WHERE id = $2 AND status = 'pending'
        `, [userId, proposalId]);
        
        if (implementImmediately) {
            return await this.implementProposal(proposalId, userId);
        }
        
        return { status: 'approved', scheduled_for: scheduledFor };
    }
    
    async implementProposal(proposalId, userId) {
        const proposal = await this.getProposal(proposalId);
        
        if (proposal.status !== 'approved') {
            throw new Error('Proposal must be approved before implementation');
        }
        
        try {
            // Begin transaction
            await this.db.query('BEGIN');
            
            // Apply changes based on proposal type
            switch (proposal.proposal_type) {
                case 'env_var':
                    await this.applyEnvironmentVariableChanges(proposal.proposed_changes);
                    break;
                case 'maintenance':
                    await this.applyMaintenanceChanges(proposal.proposed_changes);
                    break;
                case 'migration':
                    await this.applyDatabaseMigration(proposal.proposed_changes);
                    break;
            }
            
            // Mark as implemented
            await this.db.query(`
                UPDATE change_proposals 
                SET status = 'implemented', implemented_by = $1, implemented_at = NOW()
                WHERE id = $2
            `, [userId, proposalId]);
            
            await this.db.query('COMMIT');
            
            // Audit log
            await this.auditLog({
                action: 'PROPOSAL_IMPLEMENTED',
                userId,
                details: {
                    proposal_id: proposalId,
                    type: proposal.proposal_type,
                    changes: proposal.proposed_changes
                }
            });
            
            return { status: 'implemented' };
            
        } catch (error) {
            await this.db.query('ROLLBACK');
            throw error;
        }
    }
}
```

## Security Considerations

### Access Control
- Environment variable access restricted by NODE_ENV
- Sensitive values always encrypted at rest
- Masked display in UI (show first 2 and last 2 characters)
- API key scoping and expiration
- Rate limiting on configuration endpoints

### Audit Trail
- All configuration changes logged
- User attribution and reasoning required
- Immutable audit log (append-only)
- Correlation IDs for tracking related changes

### Validation
- Schema validation for all configuration values
- Range checking for numerical settings
- Regex validation for formatted strings
- Dependency validation (feature flag prerequisites)

### Emergency Procedures
- Emergency admin override capability
- Configuration rollback mechanisms
- Circuit breaker for critical system settings
- Manual configuration bypass for emergencies

## Performance Optimization

### Caching Strategy
- Redis-based caching with TTL
- Cache invalidation on updates
- Bulk cache warming on startup
- Cache versioning for consistency

### Database Optimization
- Indexed queries for common access patterns
- Connection pooling for high concurrency
- Read replicas for non-critical reads
- Query optimization with EXPLAIN analysis

### Memory Management
- Configuration value size limits
- JSON parsing optimization
- Lazy loading of large configurations
- Memory usage monitoring and alerting