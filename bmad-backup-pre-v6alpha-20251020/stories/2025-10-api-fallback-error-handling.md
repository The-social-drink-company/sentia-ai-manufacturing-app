# BMAD-MOCK-006: API Fallback & Error Handling

**Story ID**: BMAD-MOCK-006
**Epic**: EPIC-002 (Eliminate Mock Data - Production-Ready Application)
**Sprint**: Sprint 3 - Real-Time & Error Handling
**Story Points**: 3
**Estimated Effort**: 1.5 days
**Priority**: Medium
**Status**: Ready for Development

**Created**: 2025-10-19
**Assigned To**: Development Team
**BMAD Agent Role**: Developer (`bmad dev`)

---

## 📋 Story Overview

**As a** system administrator
**I want** robust error handling for all external API integrations
**So that** the dashboard remains functional even when external services are unavailable

---

## 🎯 Business Value

**Current State (Problem)**:
- API failures crash dashboard components
- No graceful degradation when services unavailable
- Missing credentials show technical error messages
- No retry logic for transient failures
- No admin notifications for persistent failures

**Target State (Solution)**:
- API failures show user-friendly error messages
- Dashboard displays cached data during outages
- Missing credentials trigger setup wizards
- Automatic retry with exponential backoff
- Admin notifications for 3+ consecutive failures
- Health check dashboard shows API status

**Business Impact**:
- **Reliability**: Dashboard remains usable during API outages
- **User Experience**: Clear, actionable error messages
- **Proactive Monitoring**: Admin alerts for integration issues
- **Cost Efficiency**: Retry logic prevents unnecessary support tickets

---

## 🔍 Current State Analysis

### Existing Error Handling Patterns

**Current Approach** (Inconsistent across services):
```javascript
// ❌ CURRENT: Inconsistent error handling
try {
  const data = await externalAPI.fetch();
  return data;
} catch (error) {
  console.error('API failed:', error);
  return mockData; // BAD: Returns mock data as fallback
}
```

**Required Approach** (Standardized):
```javascript
// ✅ REQUIRED: Standardized error handling
try {
  const data = await externalAPI.fetch();
  await cache.set(cacheKey, data);
  return { success: true, data };
} catch (error) {
  // Try cached data first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return { success: true, data: cached, stale: true };
  }

  // Return error with classification
  return {
    success: false,
    error: error.message,
    errorType: classifyError(error),
    retryable: isRetryable(error),
    setupRequired: isMissingCredentials(error)
  };
}
```

---

## 🛠️ Technical Implementation Plan

### Phase 1: Error Classification System (0.25 days)

**1.1 Define Error Types**

**File**: `server/utils/api-errors.js` (NEW)

```javascript
/**
 * API Error Classification System
 * Categorizes errors for appropriate handling
 */

export class APIError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || 'UNKNOWN_ERROR';
    this.retryable = options.retryable !== undefined ? options.retryable : false;
    this.setupRequired = options.setupRequired || false;
    this.statusCode = options.statusCode || 500;
    this.cause = options.cause;
  }
}

export class MissingCredentialsError extends APIError {
  constructor(service, message) {
    super(message || `${service} credentials not configured`, {
      code: 'MISSING_CREDENTIALS',
      setupRequired: true,
      retryable: false,
      statusCode: 401
    });
    this.service = service;
  }
}

export class RateLimitError extends APIError {
  constructor(service, retryAfter) {
    super(`${service} API rate limit exceeded`, {
      code: 'RATE_LIMIT',
      retryable: true,
      statusCode: 429
    });
    this.service = service;
    this.retryAfter = retryAfter || 60;
  }
}

export class NetworkError extends APIError {
  constructor(service, cause) {
    super(`Network error connecting to ${service}`, {
      code: 'NETWORK_ERROR',
      retryable: true,
      statusCode: 503,
      cause
    });
    this.service = service;
  }
}

export class TimeoutError extends APIError {
  constructor(service, timeout) {
    super(`${service} API request timed out after ${timeout}ms`, {
      code: 'TIMEOUT',
      retryable: true,
      statusCode: 504
    });
    this.service = service;
    this.timeout = timeout;
  }
}

export class ValidationError extends APIError {
  constructor(service, message) {
    super(message || `Invalid data from ${service}`, {
      code: 'VALIDATION_ERROR',
      retryable: false,
      statusCode: 400
    });
    this.service = service;
  }
}

export class ServiceUnavailableError extends APIError {
  constructor(service, message) {
    super(message || `${service} service unavailable`, {
      code: 'SERVICE_UNAVAILABLE',
      retryable: true,
      statusCode: 503
    });
    this.service = service;
  }
}

/**
 * Classify raw errors into typed errors
 */
export function classifyError(error, service) {
  // Missing credentials
  if (error.message?.includes('credentials') || error.message?.includes('unauthorized')) {
    return new MissingCredentialsError(service, error.message);
  }

  // Rate limiting
  if (error.response?.status === 429 || error.code === 'ECONNRESET') {
    const retryAfter = error.response?.headers['retry-after'] || 60;
    return new RateLimitError(service, retryAfter);
  }

  // Timeout
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new TimeoutError(service, error.timeout);
  }

  // Network errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'EAI_AGAIN') {
    return new NetworkError(service, error);
  }

  // Service unavailable
  if (error.response?.status === 503 || error.response?.status === 502) {
    return new ServiceUnavailableError(service, error.message);
  }

  // Validation errors
  if (error.response?.status === 400 || error.response?.status === 422) {
    return new ValidationError(service, error.message);
  }

  // Generic API error
  return new APIError(error.message, {
    code: error.code || 'UNKNOWN_ERROR',
    statusCode: error.response?.status || 500,
    retryable: false,
    cause: error
  });
}
```

**1.2 Create Retry Logic Utility**

**File**: `server/utils/retry.js` (NEW)

```javascript
import { logWarn, logError } from './logger.js';

/**
 * Retry failed operations with exponential backoff
 */
export async function retryWithBackoff(operation, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    onRetry = null,
    shouldRetry = (error) => error.retryable
  } = options;

  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;

      // Check if error is retryable
      if (!shouldRetry(error)) {
        throw error;
      }

      // Max retries reached
      if (attempt >= maxRetries) {
        logError(`Max retries (${maxRetries}) reached for operation`);
        throw error;
      }

      // Calculate next delay with exponential backoff
      const nextDelay = Math.min(delay * backoffMultiplier, maxDelay);

      logWarn(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms:`, error.message);

      // Call onRetry callback if provided
      if (onRetry) {
        await onRetry(attempt, error, delay);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Update delay for next attempt
      delay = nextDelay;
    }
  }
}

/**
 * Retry with jitter (adds randomness to prevent thundering herd)
 */
export async function retryWithJitter(operation, options = {}) {
  return retryWithBackoff(operation, {
    ...options,
    onRetry: async (attempt, error, delay) => {
      // Add +/- 20% jitter
      const jitteredDelay = delay * (0.8 + Math.random() * 0.4);
      await new Promise(resolve => setTimeout(resolve, jitteredDelay - delay));

      if (options.onRetry) {
        await options.onRetry(attempt, error, jitteredDelay);
      }
    }
  });
}
```

---

### Phase 2: Update Services with Error Handling (0.5 days)

**2.1 Xero Service Error Handling**

**File**: [`services/xeroService.js`](../services/xeroService.js)

**Enhance Error Handling**:
```javascript
import { classifyError, MissingCredentialsError } from '../server/utils/api-errors.js';
import { retryWithBackoff } from '../server/utils/retry.js';
import redisCacheService from './redis-cache.js';

class XeroService {
  async getBalanceSheet(periods = 1) {
    const cacheKey = `xero:balance-sheet:${periods}`;

    try {
      // Validate credentials first
      if (!this.hasValidCredentials()) {
        throw new MissingCredentialsError('Xero', 'Xero not configured. Add XERO_CLIENT_ID and XERO_CLIENT_SECRET.');
      }

      // Retry with backoff
      const response = await retryWithBackoff(
        () => this.api.accountingApi.getBalanceSheet(/* ... */),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt, error, delay) => {
            logWarn(`Xero balance sheet retry ${attempt}: ${error.message} (waiting ${delay}ms)`);
          }
        }
      );

      const data = this.transformBalanceSheet(response.body);

      // Cache successful response
      await redisCacheService.set(cacheKey, data, 1800); // 30 min cache

      return {
        success: true,
        data,
        source: 'xero-api',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const classified = classifyError(error, 'Xero');

      // Try cached data if available
      const cached = await redisCacheService.get(cacheKey);
      if (cached) {
        logWarn('Xero API failed, returning cached data:', classified.message);
        return {
          success: true,
          data: cached,
          stale: true,
          source: 'cache',
          error: classified.message,
          timestamp: new Date().toISOString()
        };
      }

      // No cache available, return error
      logError('Xero balance sheet failed with no cache:', classified);
      return {
        success: false,
        error: classified.message,
        errorType: classified.code,
        retryable: classified.retryable,
        setupRequired: classified.setupRequired,
        statusCode: classified.statusCode,
        timestamp: new Date().toISOString()
      };
    }
  }

  hasValidCredentials() {
    return !!(this.config.clientId && this.config.clientSecret && this.accessToken);
  }
}
```

**2.2 Shopify Service Error Handling**

**File**: [`services/shopify-multistore.js`](../services/shopify-multistore.js)

**Similar Pattern**:
```javascript
import { classifyError } from '../server/utils/api-errors.js';
import { retryWithBackoff } from '../server/utils/retry.js';

async syncStore(storeId) {
  const store = this.stores.get(storeId);
  const cacheKey = redisCacheService.generateCacheKey('shopify', 'store', storeId);

  try {
    if (!store || !store.client) {
      throw new Error(`Store ${storeId} not found or inactive`);
    }

    const ordersResponse = await retryWithBackoff(
      () => store.client.get({ path: 'orders', query: {/* ... */} }),
      {
        maxRetries: 3,
        shouldRetry: (error) => error.response?.status === 429 || error.code === 'ECONNRESET'
      }
    );

    // ... existing processing ...

    await redisCacheService.set(cacheKey, storeData, 1800);
    return storeData;

  } catch (error) {
    const classified = classifyError(error, 'Shopify');

    // Try cached data
    const cached = await redisCacheService.get(cacheKey);
    if (cached) {
      return { ...cached, stale: true };
    }

    logError(`Shopify store ${storeId} sync failed:`, classified);
    throw classified;
  }
}
```

**2.3 Amazon/Unleashed Services**

Apply same pattern to `services/amazon-sp-api.js` and `services/unleashed-erp.js`.

---

### Phase 3: API Health Check Dashboard (0.5 days)

**3.1 Create Health Check Service**

**File**: `server/services/health-check.js` (NEW)

```javascript
import xeroService from '../../services/xeroService.js';
import shopifyMultiStoreService from '../../services/shopify-multistore.js';
import amazonSPAPIService from '../../services/amazon-sp-api.js';
import unleashedERPService from '../../services/unleashed-erp.js';
import { logDebug } from '../utils/logger.js';

class HealthCheckService {
  constructor() {
    this.services = {
      xero: {
        name: 'Xero Financial',
        service: xeroService,
        checkMethod: 'healthCheck'
      },
      shopify: {
        name: 'Shopify Multi-Store',
        service: shopifyMultiStoreService,
        checkMethod: 'getConnectionStatus'
      },
      amazon: {
        name: 'Amazon SP-API',
        service: amazonSPAPIService,
        checkMethod: null // Uses isConnected property
      },
      unleashed: {
        name: 'Unleashed ERP',
        service: unleashedERPService,
        checkMethod: 'getConnectionStatus'
      }
    };

    this.healthHistory = new Map();
    this.failureCount = new Map();
  }

  async checkAllServices() {
    const results = {};

    for (const [key, config] of Object.entries(this.services)) {
      try {
        const status = await this.checkService(key, config);
        results[key] = status;

        // Track failures
        if (!status.healthy) {
          const count = this.failureCount.get(key) || 0;
          this.failureCount.set(key, count + 1);

          // Alert on 3+ consecutive failures
          if (count + 1 >= 3) {
            await this.sendAdminAlert(key, status);
          }
        } else {
          this.failureCount.set(key, 0); // Reset on success
        }

        // Track history
        this.addToHistory(key, status);

      } catch (error) {
        results[key] = {
          healthy: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    return results;
  }

  async checkService(key, config) {
    const { name, service, checkMethod } = config;

    try {
      let status;

      if (checkMethod) {
        status = await service[checkMethod]();
      } else {
        // Fallback: check isConnected property
        status = {
          connected: service.isConnected,
          status: service.isConnected ? 'connected' : 'disconnected'
        };
      }

      return {
        healthy: status.connected || status.status === 'connected',
        name,
        status: status.status || (status.connected ? 'connected' : 'disconnected'),
        lastSync: status.lastSync || null,
        details: status,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logDebug(`Health check failed for ${name}:`, error.message);
      return {
        healthy: false,
        name,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  addToHistory(serviceKey, status) {
    if (!this.healthHistory.has(serviceKey)) {
      this.healthHistory.set(serviceKey, []);
    }

    const history = this.healthHistory.get(serviceKey);
    history.push(status);

    // Keep last 100 checks
    if (history.length > 100) {
      history.shift();
    }
  }

  async sendAdminAlert(serviceKey, status) {
    const count = this.failureCount.get(serviceKey);
    const message = `Service ${status.name} has failed ${count} consecutive health checks. Error: ${status.error}`;

    logWarn(`ADMIN ALERT: ${message}`);

    // TODO: Send email/Slack notification
    // await emailService.sendAlert('admin@example.com', message);
    // await slackService.sendAlert('#alerts', message);

    // Emit SSE alert
    // sseEmitter.emit(SSE_EVENTS.ALERT_CRITICAL, { service: serviceKey, message, count });
  }

  getHealthSummary() {
    const summary = {};

    for (const key of Object.keys(this.services)) {
      const history = this.healthHistory.get(key) || [];
      const recentChecks = history.slice(-10);

      const healthyCount = recentChecks.filter(check => check.healthy).length;
      const uptime = recentChecks.length > 0 ? (healthyCount / recentChecks.length) * 100 : 0;

      summary[key] = {
        uptime: uptime.toFixed(1) + '%',
        recentFailures: this.failureCount.get(key) || 0,
        lastCheck: history[history.length - 1] || null,
        checksPerformed: history.length
      };
    }

    return summary;
  }
}

export default new HealthCheckService();
```

**3.2 Create Health Check API Endpoint**

**File**: `server/api/health.js` (ENHANCE EXISTING)

```javascript
import express from 'express';
import healthCheckService from '../services/health-check.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/v1/health/integrations
 * Check health of all external API integrations
 */
router.get('/integrations', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const results = await healthCheckService.checkAllServices();

    res.json({
      success: true,
      data: results,
      summary: healthCheckService.getHealthSummary(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/health/integrations/:service
 * Check health of specific service
 */
router.get('/integrations/:service', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { service } = req.params;
    const config = healthCheckService.services[service];

    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Unknown service: ${service}`
      });
    }

    const status = await healthCheckService.checkService(service, config);

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
```

---

### Phase 4: Frontend Error Display (0.25 days)

**4.1 Create API Error Handler Utility**

**File**: `src/utils/api-error-handler.js` (NEW)

```javascript
/**
 * Transform backend API errors into user-friendly messages
 */
export function getUserFriendlyError(error) {
  // Check if error has classification
  if (error.errorType) {
    switch (error.errorType) {
      case 'MISSING_CREDENTIALS':
        return {
          title: 'Integration Not Configured',
          message: error.error || 'This integration requires API credentials to be configured.',
          action: 'setup',
          severity: 'info'
        };

      case 'RATE_LIMIT':
        return {
          title: 'Rate Limit Exceeded',
          message: `Too many requests. The service will retry automatically in ${error.retryAfter || 60} seconds.`,
          action: 'wait',
          severity: 'warning'
        };

      case 'TIMEOUT':
        return {
          title: 'Request Timeout',
          message: 'The request took too long to complete. Please try again.',
          action: 'retry',
          severity: 'warning'
        };

      case 'NETWORK_ERROR':
        return {
          title: 'Connection Error',
          message: 'Unable to connect to the service. Please check your internet connection.',
          action: 'retry',
          severity: 'error'
        };

      case 'SERVICE_UNAVAILABLE':
        return {
          title: 'Service Temporarily Unavailable',
          message: 'The external service is currently unavailable. Displaying cached data if available.',
          action: 'cached',
          severity: 'warning'
        };

      default:
        return {
          title: 'Unexpected Error',
          message: error.error || 'An unexpected error occurred. Please try again later.',
          action: 'retry',
          severity: 'error'
        };
    }
  }

  // Fallback for unclassified errors
  return {
    title: 'Error',
    message: error.message || 'An error occurred',
    action: 'retry',
    severity: 'error'
  };
}

/**
 * Determine if error requires setup action
 */
export function requiresSetup(error) {
  return error.setupRequired || error.errorType === 'MISSING_CREDENTIALS';
}

/**
 * Determine if error is retryable
 */
export function isRetryable(error) {
  return error.retryable || ['RATE_LIMIT', 'TIMEOUT', 'NETWORK_ERROR', 'SERVICE_UNAVAILABLE'].includes(error.errorType);
}
```

**4.2 Update Dashboard Component**

**File**: `src/pages/Dashboard.jsx`

```javascript
import { useQuery } from '@tanstack/react-query';
import { getUserFriendlyError, requiresSetup } from '../utils/api-error-handler';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';

export default function Dashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', 'executive'],
    queryFn: () => fetch('/api/v1/dashboard/executive').then(res => res.json()),
    refetchInterval: 60000,
    retry: (failureCount, error) => {
      // Don't retry on setup-required errors
      if (error.setupRequired) return false;
      // Retry up to 3 times for other errors
      return failureCount < 3;
    }
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard data..." />;
  }

  if (error || (data && !data.success)) {
    const apiError = error || data;
    const friendlyError = getUserFriendlyError(apiError);

    if (requiresSetup(apiError)) {
      // Show setup wizard
      return (
        <div className="dashboard-container">
          <IntegrationSetupWizard error={apiError} />
        </div>
      );
    }

    // Show error with retry option
    return (
      <ErrorBoundary>
        <div className="dashboard-container">
          <div className={`alert alert-${friendlyError.severity}`}>
            <h3>{friendlyError.title}</h3>
            <p>{friendlyError.message}</p>
            {friendlyError.action === 'retry' && (
              <button onClick={() => refetch()} className="btn btn-primary mt-4">
                Retry
              </button>
            )}
            {friendlyError.action === 'cached' && (
              <p className="text-sm text-gray-600 mt-2">
                Showing cached data from last successful sync
              </p>
            )}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Show stale data indicator if applicable
  const isStale = data?.data?.metadata?.stale || false;

  return (
    <div className="dashboard-container">
      {isStale && (
        <div className="alert alert-warning mb-4">
          <p>⚠️ Displaying cached data. Live data unavailable - last updated: {data.data.metadata.timestamp}</p>
        </div>
      )}

      <KPIStripWidget kpis={data.data.kpis} />
      {/* ... other dashboard components ... */}
    </div>
  );
}
```

---

### Phase 5: Testing & Documentation (0.25 days)

**5.1 Manual Testing Checklist**

```markdown
### Error Classification Testing
- [ ] Missing credentials → setup wizard displayed
- [ ] Rate limit error → retry after message shown
- [ ] Timeout error → retry button available
- [ ] Network error → connection error message
- [ ] Service unavailable → cached data displayed (if available)

### Retry Logic Testing
- [ ] Transient errors retry automatically (3 attempts)
- [ ] Exponential backoff increases delay (1s, 2s, 4s)
- [ ] Non-retryable errors fail immediately
- [ ] Retry with jitter prevents thundering herd

### Cache Fallback Testing
- [ ] API failure → cached data returned (if available)
- [ ] Stale data indicator displayed
- [ ] Cache TTL respected (30 minutes)
- [ ] No cache available → error message shown

### Health Check Dashboard Testing
- [ ] `/api/v1/health/integrations` returns all service statuses
- [ ] Admin alerts sent after 3 consecutive failures
- [ ] Health history tracked (last 100 checks)
- [ ] Uptime percentage calculated correctly

### Frontend Error Display Testing
- [ ] User-friendly error messages (no technical jargon)
- [ ] Setup wizard shown for missing credentials
- [ ] Retry button functional
- [ ] Stale data warning visible
```

**5.2 Update Documentation**

**File**: `docs/api-integration/error-handling.md`

```markdown
# API Integration Error Handling

## Error Types

### MISSING_CREDENTIALS
**Cause**: API credentials not configured
**User Action**: Complete setup wizard
**Retryable**: No

### RATE_LIMIT
**Cause**: Too many API requests
**User Action**: Wait for retry-after period
**Retryable**: Yes (automatic)

### TIMEOUT
**Cause**: Request exceeded timeout limit
**User Action**: Retry request
**Retryable**: Yes

### NETWORK_ERROR
**Cause**: Network connectivity issue
**User Action**: Check internet connection
**Retryable**: Yes

### SERVICE_UNAVAILABLE
**Cause**: External service is down
**User Action**: View cached data (if available)
**Retryable**: Yes

## Retry Strategy

- **Max Retries**: 3 attempts
- **Initial Delay**: 1 second
- **Backoff**: Exponential (2x per attempt)
- **Max Delay**: 30 seconds
- **Jitter**: ±20% randomization

## Cache Fallback

- **Cache TTL**: 30 minutes
- **Fallback**: Cached data returned on error (if available)
- **Stale Indicator**: UI shows "cached data" warning

## Health Monitoring

- **Check Interval**: Every 5 minutes
- **Failure Threshold**: 3 consecutive failures trigger alert
- **Admin Notifications**: Email + Slack (configured)
- **History Retention**: Last 100 health checks per service
```

**5.3 Deployment**

```bash
# Commit error handling
git add .
git commit -m "feat(error-handling): Complete BMAD-MOCK-006 - API fallback & error handling

- Create error classification system (7 error types)
- Implement retry logic with exponential backoff
- Add cache fallback for API failures
- Create health check dashboard
- Update services with standardized error handling
- Add user-friendly error messages in frontend
- Admin alerts for 3+ consecutive failures

Story: BMAD-MOCK-006
Sprint: Sprint 3 - Real-Time & Error Handling
Effort: 1.5 days

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to development
git push origin development
```

---

## ✅ Definition of Done

### Functional Requirements
- ✅ All API errors classified into 7 types
- ✅ Retry logic with exponential backoff (max 3 attempts)
- ✅ Cache fallback returns stale data on API failures
- ✅ Health check dashboard shows all service statuses
- ✅ Admin alerts sent after 3 consecutive failures
- ✅ User-friendly error messages (no technical jargon)
- ✅ Setup wizards for missing credentials

### Technical Requirements
- ✅ Standardized error handling across all services
- ✅ Error classification with retryable/setupRequired flags
- ✅ Cache TTL of 30 minutes for all API responses
- ✅ Health check API endpoint functional
- ✅ Error history tracking (last 100 checks)

### Testing Requirements
- ✅ Manual testing checklist passed
- ✅ Retry logic tested (3 attempts with backoff)
- ✅ Cache fallback tested (stale data returned)
- ✅ Health check tested (admin alerts triggered)

### Documentation Requirements
- ✅ Error type reference documentation
- ✅ Retry strategy documented
- ✅ Cache fallback behavior documented
- ✅ Health monitoring guide

### Deployment Requirements
- ✅ Changes deployed to development environment
- ✅ Health check dashboard accessible
- ✅ Error handling tested in production

---

## 📊 Success Metrics

### Before (No Error Handling)
- API failures: Dashboard crashes
- Missing credentials: Technical errors
- Transient failures: No retry
- Admin visibility: None

### After (Robust Error Handling)
- API failures: Cached data displayed with warning
- Missing credentials: Setup wizard shown
- Transient failures: Automatic retry (3 attempts)
- Admin visibility: Health dashboard + alerts

---

## 🔗 Related Stories

**Epic**: [EPIC-002: Eliminate Mock Data](../epics/2025-10-eliminate-mock-data-epic.md)

**Sprint 3 Stories**:
- ✅ BMAD-MOCK-005: Real-Time Data Streaming (Completed)
- ✅ BMAD-MOCK-006: API Fallback & Error Handling (This Story)
- ⏳ BMAD-MOCK-007: UI Empty States & Loading UI (2 days)

---

**Story Status**: ✅ Ready for Implementation
**Next Step**: Begin Phase 1 - Error Classification System
**Estimated Completion**: 1.5 days from start
