# Secrets Management Strategy for Sentia MCP Server

## Overview

This document outlines the comprehensive secrets management strategy for the CapLiquify MCP Server, ensuring secure storage, rotation, and access control for all sensitive credentials and configuration data.

## Security Principles

### 1. Zero-Trust Architecture
- No hardcoded secrets in code or configuration files
- All secrets encrypted at rest and in transit
- Principle of least privilege access
- Regular rotation and audit trails

### 2. Defense in Depth
- Multiple layers of security controls
- Encrypted storage with key separation
- Network-level security controls
- Application-level validation

### 3. Compliance & Governance
- SOC2 Type II compliance
- GDPR data protection requirements
- Regular security audits and penetration testing
- Comprehensive audit logging

## Secrets Classification

### Critical Secrets (Tier 1)
- Database credentials
- JWT signing keys
- Encryption master keys
- API keys for external services
- SSL/TLS certificates

### Sensitive Secrets (Tier 2)
- Integration API tokens
- Webhook secrets
- Authentication tokens
- Monitoring credentials

### Internal Secrets (Tier 3)
- Inter-service communication keys
- Cache credentials
- Log aggregation tokens

## Storage Solutions

### Production Environment (Render)

#### Render Environment Variables (Encrypted)
```bash
# Critical secrets stored as encrypted environment variables
RENDER_SECRET_JWT_SECRET=<encrypted-value>
RENDER_SECRET_DATABASE_PASSWORD=<encrypted-value>
RENDER_SECRET_ENCRYPTION_MASTER_KEY=<encrypted-value>

# Access via Render Dashboard > Service > Environment > Add Secret
```

#### External Secrets Manager Integration
```yaml
# HashiCorp Vault Integration (Optional)
vault:
  enabled: false  # Enable for enterprise deployments
  address: "https://vault.company.com"
  auth:
    method: "kubernetes"
    role: "sentia-mcp-server"
  secrets:
    database:
      path: "secret/sentia/database"
      key: "credentials"
    integrations:
      path: "secret/sentia/integrations"
      key: "api-keys"
```

### Development Environment

#### Local Development
```bash
# .env.example (template - never commit actual values)
# Copy to .env.local and fill with development values

# Database
DATABASE_URL=postgresql://dev_user:dev_pass@localhost:5432/sentia_dev

# JWT Secrets (development only)
JWT_SECRET=development-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret

# External API Keys (use test/sandbox keys)
XERO_CLIENT_ID=your-xero-test-client-id
XERO_CLIENT_SECRET=your-xero-test-secret

# Encryption (development key)
ENCRYPTION_KEY=development-aes-256-key-32-bytes
```

## Secrets Rotation Strategy

### Automated Rotation Schedule
```yaml
rotation_schedule:
  critical_secrets:
    jwt_signing_key:
      frequency: "90 days"
      method: "rolling"
      notification: "7 days before"
      
    database_password:
      frequency: "180 days"
      method: "manual"
      notification: "14 days before"
      
    encryption_master_key:
      frequency: "365 days"
      method: "manual"
      notification: "30 days before"
      
  api_keys:
    frequency: "90 days"
    method: "automated"
    notification: "7 days before"
    
  certificates:
    frequency: "365 days"
    method: "automated"
    notification: "30 days before"
```

### Rotation Implementation
```javascript
// Automatic key rotation service
class SecretRotationService {
  constructor() {
    this.rotationSchedule = new Map();
    this.notificationService = new NotificationService();
  }
  
  async rotateSecret(secretName, newValue) {
    // 1. Generate new secret value
    const newSecret = await this.generateSecretValue(secretName);
    
    // 2. Update in secrets store
    await this.updateSecretStore(secretName, newSecret);
    
    // 3. Update application configuration
    await this.updateApplicationConfig(secretName, newSecret);
    
    // 4. Validate new secret works
    await this.validateSecretRotation(secretName);
    
    // 5. Clean up old secret after grace period
    setTimeout(() => {
      this.cleanupOldSecret(secretName);
    }, this.gracePeriod);
    
    // 6. Log rotation event
    await this.auditLogger.logSecretRotation(secretName);
  }
}
```

## Access Control and RBAC

### Role-Based Access Matrix
```yaml
roles:
  system_admin:
    secrets_access:
      - all_secrets: ["read", "write", "rotate"]
      - audit_logs: ["read"]
    
  deployment_engineer:
    secrets_access:
      - environment_config: ["read", "write"]
      - application_secrets: ["read"]
      - rotation_status: ["read"]
    
  developer:
    secrets_access:
      - development_secrets: ["read"]
      - test_environment: ["read", "write"]
    
  monitoring_system:
    secrets_access:
      - monitoring_credentials: ["read"]
      - health_check_keys: ["read"]
```

### Kubernetes RBAC Configuration
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: sentia-manufacturing
  name: secrets-manager
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list", "create", "update", "patch"]
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: secrets-manager-binding
  namespace: sentia-manufacturing
subjects:
- kind: ServiceAccount
  name: sentia-mcp-secrets-manager
  namespace: sentia-manufacturing
roleRef:
  kind: Role
  name: secrets-manager
  apiGroup: rbac.authorization.k8s.io
```

## Encryption Standards

### Encryption at Rest
```javascript
// AES-256-GCM encryption for sensitive data
class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keySize = 32; // 256 bits
    this.ivSize = 16;  // 128 bits
    this.tagSize = 16; // 128 bits
  }
  
  encrypt(plaintext, key) {
    const iv = crypto.randomBytes(this.ivSize);
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('sentia-mcp-server'));
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }
  
  decrypt(encryptedData, key) {
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAAD(Buffer.from('sentia-mcp-server'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### Key Management
```javascript
// Key derivation and management
class KeyManagementService {
  constructor() {
    this.masterKey = this.deriveMasterKey();
    this.keyCache = new Map();
  }
  
  deriveMasterKey() {
    const password = process.env.MASTER_PASSWORD;
    const salt = process.env.ENCRYPTION_SALT;
    
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
  }
  
  deriveSecretKey(purpose, version = 1) {
    const info = `${purpose}-v${version}`;
    return crypto.hkdfSync('sha256', this.masterKey, null, info, 32);
  }
}
```

## Monitoring and Alerting

### Security Events to Monitor
```yaml
monitoring:
  secret_access:
    - unauthorized_access_attempts
    - successful_secret_retrievals
    - failed_decryption_attempts
    - rotation_events
    - key_generation_events
    
  anomaly_detection:
    - unusual_access_patterns
    - high_frequency_secret_requests
    - access_from_unexpected_sources
    - failed_authentication_clusters
    
  compliance_events:
    - audit_log_access
    - configuration_changes
    - privilege_escalation_attempts
    - data_export_events
```

### Alert Configuration
```javascript
// Security alerts for secrets management
const securityAlerts = {
  criticalAlerts: [
    {
      name: 'UnauthorizedSecretAccess',
      condition: 'failed_secret_access > 5 in 5m',
      severity: 'critical',
      action: 'immediate_response'
    },
    {
      name: 'MasterKeyCompromise',
      condition: 'master_key_usage_anomaly',
      severity: 'critical',
      action: 'emergency_rotation'
    }
  ],
  
  warningAlerts: [
    {
      name: 'UpcomingSecretExpiration',
      condition: 'secret_expires_in < 7d',
      severity: 'warning',
      action: 'schedule_rotation'
    }
  ]
};
```

## Backup and Recovery

### Secrets Backup Strategy
```yaml
backup:
  frequency: "daily"
  retention: "90 days"
  encryption: "AES-256-GCM"
  storage:
    primary: "render-volumes"
    secondary: "encrypted-s3-bucket"
    
  recovery_testing:
    frequency: "monthly"
    automated: true
    validation: "full-system-test"
```

### Disaster Recovery Procedures
```markdown
# Secrets Recovery Procedures

## Scenario 1: Lost Master Key
1. Stop all services immediately
2. Activate backup master key from secure vault
3. Re-encrypt all secrets with new master key
4. Update application configurations
5. Restart services and validate functionality
6. Generate new master key for future use

## Scenario 2: Compromised API Keys
1. Identify compromised keys from audit logs
2. Generate replacement keys with external services
3. Update secrets store with new keys
4. Trigger emergency rotation for affected secrets
5. Monitor for unauthorized access attempts
6. Update access logs and incident reports

## Scenario 3: Database Credential Compromise
1. Create new database user with identical permissions
2. Update connection strings in secrets store
3. Test connectivity with new credentials
4. Remove old database user
5. Force application restart to use new credentials
6. Monitor database access logs for anomalies
```

## Compliance and Audit

### Audit Requirements
```yaml
audit_requirements:
  log_retention: "7 years"
  log_integrity: "cryptographic_hashing"
  access_logging: "all_secret_operations"
  
  compliance_standards:
    - "SOC2 Type II"
    - "GDPR Article 32"
    - "ISO 27001"
    - "PCI DSS Level 1"
    
  audit_frequency:
    internal: "quarterly"
    external: "annually"
    penetration_testing: "bi-annually"
```

### Audit Trail Example
```json
{
  "timestamp": "2025-10-04T12:00:00Z",
  "event_type": "secret_access",
  "user_id": "system:sentia-mcp-server",
  "secret_name": "database_credentials",
  "operation": "read",
  "source_ip": "10.0.0.15",
  "user_agent": "sentia-mcp-server/3.0.0",
  "success": true,
  "encryption_key_version": "v2",
  "correlation_id": "abc123-def456-ghi789"
}
```

## Implementation Checklist

### Phase 1: Basic Secrets Management
- [ ] Configure Render environment variables encryption
- [ ] Implement local development secrets management
- [ ] Set up basic secret rotation for JWT keys
- [ ] Configure audit logging for secret access
- [ ] Implement encryption at rest for sensitive data

### Phase 2: Advanced Security Controls
- [ ] Deploy RBAC for secrets access
- [ ] Implement automated secret rotation
- [ ] Set up security monitoring and alerting
- [ ] Configure backup and recovery procedures
- [ ] Conduct initial security audit

### Phase 3: Enterprise Compliance
- [ ] Integrate with external secrets manager (if required)
- [ ] Implement advanced threat detection
- [ ] Set up compliance reporting
- [ ] Conduct penetration testing
- [ ] Obtain security certifications

## Emergency Contacts

### Security Incident Response Team
- **Primary Contact**: Security Team Lead
- **Secondary Contact**: Infrastructure Team Lead
- **Escalation Contact**: CTO/Security Officer

### External Resources
- **Render Support**: Secrets management issues
- **Security Consultant**: Compliance and audit support
- **Legal Team**: Breach notification requirements

---

*This document is classified as CONFIDENTIAL and should only be accessed by authorized personnel. Regular review and updates are required to maintain effectiveness.*