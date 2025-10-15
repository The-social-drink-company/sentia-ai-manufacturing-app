# Development Standards and Code Quality

This document defines code quality standards, ESLint configuration, and logging practices for the project.

## Code Standards & Guidelines

### Character Encoding
**CRITICAL**: Always use ASCII-compatible characters in:
- Console output and logging
- Error messages
- Comments and documentation
- Test output and assertions

**Avoid Unicode characters**: ✅ ❌ 🎉 ⚠️ → ← ↑ ↓ • etc.
**Use ASCII alternatives**: "PASS:" "FAIL:" "SUCCESS:" "-->" "*" etc.

**Exception**: Unicode acceptable in:
- HTML templates (properly encoded)
- JSON responses (UTF-8 encoded)
- Frontend React components (properly handled)

### File Naming
- Use `.jsx` extension for React components with JSX
- Use `.js` extension for plain JavaScript utilities
- Use PascalCase for React components
- Use camelCase for hooks, utilities, and services

## Code Quality & ESLint Configuration

### ESLint Best Practices (Lessons Learned 2025)
**CRITICAL**: Our comprehensive analysis identified key ESLint patterns:

#### Built Files Exclusion
- **NEVER lint built/dist files**: Causes 7,000+ false errors
- Update `.eslintignore` to properly exclude: `dist/`, `build/`, `*.min.js`
- Focus linting on source code only: `src/`, `api/`, `config/`, `services/`

#### Global Variables Configuration
- **Node.js Environment**: Ensure globals defined for `setTimeout`, `setInterval`, `Intl`
- **Browser Environment**: Define `window`, `document`, `localStorage`, `alert`
- **Security Plugin**: Use `plugin:security/recommended` with appropriate warnings

#### Import Patterns
- **Prefer ES modules**: Use `import/export` over `require/module.exports`
- **Node.js Timers**: Import explicitly `import { setTimeout, setInterval } from 'timers'`
- **Remove unused imports**: Clean up imports that aren't used

### Security Configuration
```json
{
  "extends": ["plugin:security/recommended"],
  "rules": {
    "security/detect-unsafe-regex": "warn",
    "security/detect-non-literal-fs-filename": "off",
    "security/detect-object-injection": "warn"
  }
}
```

## Enterprise Logging Standards

### Logging Best Practices (Mandatory)
**CRITICAL**: Based on 355+ console statements analysis:

#### Production Logging Rules
1. **NO console.log in production code**
2. **Use structured logging with levels**: `logInfo`, `logWarn`, `logError`
3. **Environment-aware logging**: Only debug logs in development
4. **Proper error objects**: Pass error objects, not just messages

#### Logging Implementation Pattern
```javascript
// Import structured logger
import { logInfo, logWarn, logError } from './services/observability/structuredLogger.js';

// Development-only logging utility
const devLog = {
  log: (...args) => { if (process.env.NODE_ENV === 'development') console.log(...args); },
  warn: (...args) => { if (process.env.NODE_ENV === 'development') console.warn(...args); },
  error: (...args) => { if (process.env.NODE_ENV === 'development') console.error(...args); }
};

// Use in code
logInfo('Operation completed', { userId, operation: 'data_sync' });
logWarn('Fallback triggered', { reason, fallbackType });
logError('Critical failure', error); // Pass error object
```

#### Acceptable Console Usage
- **Test files**: Debug output acceptable
- **Development utilities**: Environment-gated console statements
- **Setup/build scripts**: Informational output for developers

## Error Handling Standards

### Enterprise Error Patterns
Based on service layer analysis:

#### Service Layer Error Handling
```javascript
// Standard error handling pattern
try {
  const result = await apiCall();
  logInfo('API call successful', { endpoint, responseTime });
  return result;
} catch (error) {
  logError('API call failed', { 
    endpoint, 
    error: error.message, 
    stack: error.stack,
    statusCode: error.response?.status 
  });
  throw new ServiceError(`${endpoint} failed`, { cause: error });
}
```

#### Circuit Breaker Pattern
- Use circuit breaker for external API calls
- Implement fallback mechanisms
- Log state transitions for monitoring

#### Graceful Degradation
- Provide fallback data when services fail
- User-friendly error messages
- Maintain application functionality during partial failures

## Context-Driven Development

### Context Folder Structure
Following structured context references from `context/` folder:
- Use specific context folders/files when working
- Reference technical specifications for consistency
- Maintain strict context validation to prevent AI drift

### Context Folder Structure
- `context/api-documentation/` - External API documentation (Amazon SP-API, Shopify)
- `context/claude-code-docs/` - Local Claude Code documentation for reference
- `context/technical-specifications/` - Tech stack and architecture docs
- `context/business-requirements/` - Business logic and user workflows
- `context/ui-components/` - Dashboard layouts and UI specifications

## Core Development Principles
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary for the goal
- ALWAYS prefer editing existing files to creating new ones
- NEVER proactively create documentation files unless explicitly requested
- NEVER add Unicode characters in console output - use ASCII alternatives only
- Always check existing code patterns and follow the established architecture

## **CRITICAL DEPENDENCY MANAGEMENT RULE** ⚠️
**MANDATORY**: When adding any new package to `package.json`:

1. **ALWAYS run `pnpm install` immediately after adding to package.json**
2. **Verify the installation worked locally**
3. **THEN commit and push changes**

**NEVER commit package.json changes without running pnpm install first!**

```bash
# Correct workflow:
1. Add package to package.json
2. pnpm install              # MANDATORY STEP
3. Test that it works locally
4. git add -A
5. git commit -m "Add package"
6. git push
```

**Why**: Render deployments fail when package.json and pnpm-lock.yaml are out of sync. Running `pnpm install` updates the lockfile to match package.json changes.