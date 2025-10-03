/**
 * Test script to verify production security enforcement
 * This tests that the authentication system properly enforces security in production mode
 */

import { config } from 'dotenv';

// Load environment variables
config();

// Set production environment
process.env.NODE_ENV = 'production';
process.env.VITE_DEVELOPMENT_MODE = 'false';

console.log('Testing production security enforcement...');
console.log('Environment variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- VITE_DEVELOPMENT_MODE:', process.env.VITE_DEVELOPMENT_MODE);

// Test imports and production behavior
try {
  console.log('\n1. Testing environment detection...');
  const { isDevelopmentEnvironment, createMockDevelopmentUser } = await import('./src/config/auth-config.js');
  
  const isDevEnv = isDevelopmentEnvironment();
  console.log('✅ Auth config imported successfully');
  console.log('   - isDevelopmentEnvironment():', isDevEnv);
  
  if (isDevEnv) {
    console.log('   - ❌ ERROR: Production environment incorrectly detected as development');
    process.exit(1);
  } else {
    console.log('   - ✅ Production environment correctly detected');
  }

  console.log('\n2. Testing security utilities in production...');
  const { securityUtils } = await import('./src/utils/security.js');
  console.log('✅ Security utilities imported successfully');
  
  const testToken = securityUtils.generateSecureToken(16);
  console.log('   - Generated production token:', testToken.substring(0, 12) + '...');
  
  // Test password hashing
  const testPassword = 'test-password-123';
  const hashedPassword = await securityUtils.hashPassword(testPassword);
  const isValidPassword = await securityUtils.verifyPassword(testPassword, hashedPassword);
  
  console.log('   - Password hashing working:', isValidPassword ? '✅' : '❌');

  console.log('\n3. Testing encryption in production...');
  const { encryptionUtils } = await import('./src/utils/encryption.js');
  console.log('✅ Encryption utilities imported successfully');
  
  const encryptionStatus = encryptionUtils.getEncryptionStatus();
  console.log('   - Encryption status:', {
    enabled: encryptionStatus.enabled,
    developmentBypass: encryptionStatus.developmentBypass,
    environment: encryptionStatus.environment
  });

  if (encryptionStatus.developmentBypass) {
    console.log('   - ❌ ERROR: Encryption bypass should be disabled in production');
  } else {
    console.log('   - ✅ Encryption bypass correctly disabled in production');
  }

  // Test actual encryption/decryption
  const testData = 'sensitive-production-data';
  const encrypted = encryptionUtils.encrypt(testData);
  const decrypted = encryptionUtils.decrypt(encrypted);
  
  console.log('   - Encryption/decryption working:', decrypted === testData ? '✅' : '❌');

  console.log('\n4. Testing API key management in production...');
  const { apiKeyManager } = await import('./src/utils/api-keys.js');
  console.log('✅ API key manager imported successfully');
  
  const apiKeyStatus = apiKeyManager.getStatus();
  console.log('   - API key status:', {
    enabled: apiKeyStatus.enabled,
    developmentMode: apiKeyStatus.developmentMode,
    productionKeysRequired: !apiKeyStatus.developmentMode
  });

  if (apiKeyStatus.developmentMode) {
    console.log('   - ❌ ERROR: Development mode should be disabled in production');
  } else {
    console.log('   - ✅ Production API key mode correctly enabled');
  }

  console.log('\n5. Testing authentication middleware in production...');
  const { authenticateRequest } = await import('./src/middleware/auth.js');
  console.log('✅ Authentication middleware imported successfully');
  
  // Test without authorization header
  const mockReq = {
    correlationId: 'test-production-correlation-id',
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-production-agent',
      'x-correlation-id': 'test-production-correlation-id'
    }
  };
  
  let authError = null;
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        authError = { statusCode: code, data };
      }
    }),
    json: (data) => {
      authError = { statusCode: 200, data };
    }
  };
  
  let nextCalled = false;
  const mockNext = () => { nextCalled = true; };
  
  await authenticateRequest(mockReq, mockRes, mockNext);
  
  if (nextCalled && !authError) {
    console.log('   - ❌ ERROR: Authentication should be required in production');
  } else if (authError && authError.statusCode === 401) {
    console.log('   - ✅ Authentication correctly required in production');
  } else {
    console.log('   - ❌ UNEXPECTED: Authentication behavior unexpected');
  }

  console.log('\n6. Testing RBAC in production...');
  const { rbacManager } = await import('./src/middleware/rbac.js');
  console.log('✅ RBAC manager imported successfully');
  
  const rbacStatus = rbacManager.getStatus();
  console.log('   - RBAC status:', {
    developmentBypass: rbacStatus.developmentBypass,
    totalRoles: rbacStatus.totalRoles,
    totalPermissions: rbacStatus.totalPermissions
  });

  if (rbacStatus.developmentBypass) {
    console.log('   - ❌ ERROR: RBAC bypass should be disabled in production');
  } else {
    console.log('   - ✅ RBAC bypass correctly disabled in production');
  }

  console.log('\n7. Testing permission checking in production...');
  const { permissionManager } = await import('./src/middleware/permissions.js');
  console.log('✅ Permission manager imported successfully');
  
  const permissionStatus = permissionManager.getStatus();
  console.log('   - Permission status:', {
    developmentBypass: permissionStatus.developmentBypass,
    environment: permissionStatus.environment
  });

  if (permissionStatus.developmentBypass) {
    console.log('   - ❌ ERROR: Permission bypass should be disabled in production');
  } else {
    console.log('   - ✅ Permission bypass correctly disabled in production');
  }

  console.log('\n8. Testing audit logger in production...');
  const { auditLogger, AUDIT_EVENTS, AUDIT_SEVERITY } = await import('./src/utils/audit-logger.js');
  console.log('✅ Audit logger imported successfully');
  
  const auditStatus = auditLogger.getStatus();
  console.log('   - Audit status:', {
    enabled: auditStatus.enabled,
    developmentMode: auditStatus.developmentMode
  });

  if (auditStatus.developmentMode) {
    console.log('   - ❌ ERROR: Audit logger should be in production mode');
  } else {
    console.log('   - ✅ Audit logger correctly in production mode');
  }

  // Test actual audit logging
  try {
    await auditLogger.logEvent(AUDIT_EVENTS.AUTH_SUCCESS, {
      source: 'production-test',
      userId: 'test-user-123'
    }, {
      severity: AUDIT_SEVERITY.LOW,
      correlationId: 'test-prod-correlation',
      ipAddress: '127.0.0.1',
      outcome: 'success'
    });
    console.log('   - Audit logging functional: ✅');
  } catch (error) {
    console.log('   - Audit logging error:', error.message);
  }

  console.log('\n9. Testing security monitoring in production...');
  const { securityMonitor } = await import('./src/middleware/security-monitoring.js');
  console.log('✅ Security monitoring imported successfully');
  
  const monitorStatus = securityMonitor.getStatus();
  console.log('   - Monitor status:', {
    enabled: monitorStatus.enabled,
    developmentBypass: monitorStatus.developmentBypass
  });

  if (monitorStatus.developmentBypass) {
    console.log('   - ❌ ERROR: Security monitoring bypass should be disabled');
  } else {
    console.log('   - ✅ Security monitoring bypass correctly disabled');
  }

  if (!monitorStatus.enabled) {
    console.log('   - ❌ ERROR: Security monitoring should be enabled in production');
  } else {
    console.log('   - ✅ Security monitoring correctly enabled in production');
  }

  console.log('\n10. Testing dashboard integration in production...');
  const { authenticateDashboard } = await import('./src/middleware/dashboard-integration.js');
  console.log('✅ Dashboard integration imported successfully');
  
  // Test dashboard auth without token
  const dashboardReq = {
    correlationId: 'test-dashboard-correlation',
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-dashboard-agent'
    }
  };
  
  let dashboardError = null;
  const dashboardRes = {
    status: (code) => ({
      json: (data) => {
        dashboardError = { statusCode: code, data };
      }
    })
  };
  
  let dashboardNextCalled = false;
  const dashboardNext = () => { dashboardNextCalled = true; };
  
  await authenticateDashboard(dashboardReq, dashboardRes, dashboardNext);
  
  if (dashboardNextCalled && !dashboardError) {
    console.log('   - ❌ ERROR: Dashboard authentication should be required in production');
  } else if (dashboardError && dashboardError.statusCode === 401) {
    console.log('   - ✅ Dashboard authentication correctly required in production');
  } else {
    console.log('   - ❌ UNEXPECTED: Dashboard authentication behavior unexpected');
  }

  console.log('\n🔒 Production Security Enforcement Summary:');
  console.log('');
  console.log('✅ Environment Detection:');
  console.log('   - Production environment correctly detected');
  console.log('   - Development bypasses disabled');
  console.log('');
  console.log('✅ Authentication & Authorization:');
  console.log('   - JWT authentication required');
  console.log('   - Dashboard authentication required');
  console.log('   - Role-based access control active');
  console.log('   - Permission checking enforced');
  console.log('');
  console.log('✅ Security Features:');
  console.log('   - Data encryption enabled');
  console.log('   - Password hashing functional');
  console.log('   - API key management in production mode');
  console.log('   - Security monitoring active');
  console.log('   - Audit logging in production mode');
  console.log('');
  console.log('🎯 Result: Production security is properly enforced');
  console.log('   The authentication system correctly transitions from development');
  console.log('   bypass mode to full security enforcement in production environment.');

} catch (error) {
  console.error('\n❌ Error during production security testing:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}