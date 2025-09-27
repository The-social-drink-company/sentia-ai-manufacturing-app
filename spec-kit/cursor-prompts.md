# Cursor Prompts for Spec-Driven Development

**Purpose**: Ready-to-use prompts for implementing features using SpecKit methodology
**Created**: 2025-09-22
**Usage**: Copy relevant prompts into Cursor when implementing new features

## 🎯 Specification Repository Prompts

### Create New Feature Specification

```prompt
Create a new feature specification for [FEATURE NAME] following the SpecKit template at spec-kit/templates/spec-template.md.

Requirements:
1. Focus on WHAT users need and WHY, not HOW to implement
2. Mark any ambiguities with [NEEDS CLARIFICATION: question]
3. Include testable acceptance criteria
4. Define key entities if data is involved
5. Ensure all requirements are measurable

Context:
- This is for a manufacturing dashboard application
- Users include Admin, Manager, Operator, Viewer roles
- Must integrate with existing navigation and authentication

Output the specification to: spec-kit/specs/[FEATURE_NUMBER]-[feature-name]/spec.md
```

### Update Existing Specification

```prompt
Update the specification at spec-kit/specs/[FEATURE]/spec.md to include:
[NEW REQUIREMENTS]

Rules:
1. Maintain existing requirement numbering
2. Add new requirements with next sequential numbers
3. Update acceptance scenarios if needed
4. Mark any ambiguities with [NEEDS CLARIFICATION]
5. Update the execution status checklist
```

## 💻 Implementation Repository Prompts

### Generate Implementation from Specification

```prompt
Read the specification at spec-kit/specs/[FEATURE]/spec.md and generate the implementation following these rules:

Architecture:
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL with Prisma
- Auth: Clerk integration
- State: Zustand for complex state

Implementation order:
1. Create contract tests first
2. Create API endpoints with validation
3. Create React components with memoization
4. Add navigation integration
5. Implement real-time updates via SSE

Patterns to follow:
- Use the existing navigation structure in src/components/layout/Sidebar.jsx
- Follow the API pattern in server.js
- Use the structured logging from services/observability/structuredLogger.js
- Apply memoization for performance
- Handle errors with user feedback

Do NOT:
- Add console.log statements
- Create mock data (use real APIs)
- Over-abstract simple features
- Skip error handling
```

### Add New Dashboard Widget

```prompt
Create a new dashboard widget for [WIDGET PURPOSE] that:

1. Follows the pattern in src/components/widgets/
2. Uses the existing widget props interface
3. Implements real-time updates via useSSE hook
4. Includes loading and error states
5. Is responsive using Tailwind classes
6. Uses memoization for performance

Widget requirements:
- Data source: [API ENDPOINT]
- Update frequency: [REAL-TIME/POLLING/STATIC]
- User interactions: [LIST INTERACTIONS]
- Role restrictions: [ROLES THAT CAN VIEW]

Include:
- Component file: src/components/widgets/[WidgetName].jsx
- API integration: Update server.js endpoint
- Navigation: Add to dashboard grid
- Tests: Create widget.test.jsx
```

### Implement API Endpoint

```prompt
Create a new API endpoint for [FEATURE] following the existing patterns:

Server-side (server.js):
```javascript
// Add to server.js
app.get('/api/[endpoint]', authenticateUser, async (req, res) => {
  try {
    // Input validation
    // Role-based access check
    // Database query via Prisma
    // Structured logging
    // Return formatted response
  } catch (error) {
    logError('[Endpoint] failed', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

Client-side integration:
```javascript
// Add to services/api/[feature]Service.js
export const fetch[Feature] = async () => {
  const response = await apiClient.get('/[endpoint]');
  return response.data;
};
```

Include:
- Input validation
- Error handling
- Structured logging
- Role-based access control
- Real-time update trigger if needed
```

### Add Navigation Item

```prompt
Add a new navigation item for [FEATURE] to the sidebar:

1. Update src/components/layout/Sidebar.jsx:
   - Add to navigationItems array in correct section
   - Import required Heroicon
   - Add route path
   - Include role restrictions if needed

2. Create route in src/App.jsx:
   - Add lazy import if component is large
   - Add Route component
   - Include route guards if needed

3. Add keyboard shortcut:
   - Update useKeyboardShortcuts hook
   - Add to shortcuts documentation
   - Follow pattern: G+[LETTER]

Example:
```javascript
{
  section: 'Financial Management',
  items: [
    {
      to: '/[feature-path]',
      icon: [IconName],
      label: '[Feature Label]',
      roles: ['admin', 'manager'],
      shortcut: 'G+[X]'
    }
  ]
}
```
```

### Optimize Component Performance

```prompt
Optimize the React component at [PATH] for performance:

1. Add memoization:
```javascript
import { memo, useMemo, useCallback } from 'react';

const [ComponentName] = memo(({ props }) => {
  // Component logic
});
```

2. Optimize expensive computations:
```javascript
const computedValue = useMemo(() => {
  return expensiveComputation(data);
}, [data]);
```

3. Memoize event handlers:
```javascript
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

4. Lazy load if large:
```javascript
const [Component] = lazy(() => import('./[Component]'));
```

5. Add loading states:
```javascript
<Suspense fallback={<LoadingSpinner />}>
  <Component />
</Suspense>
```
```

### Fix Security Vulnerability

```prompt
Fix the security vulnerability in [COMPONENT/FILE]:

1. Run security audit:
```bash
npm audit
npm audit fix
```

2. If breaking changes needed:
   - Document in SECURITY.md
   - Find alternative package
   - Update implementation

3. Security checklist:
   - [ ] No hardcoded secrets
   - [ ] Input validation added
   - [ ] XSS protection enabled
   - [ ] CSRF tokens implemented
   - [ ] Rate limiting active
   - [ ] CSP headers configured

4. Update Content Security Policy if needed:
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "script-src": ["'self'", "[TRUSTED_DOMAIN]"]
    }
  }
}));
```
```

### Implement Test Coverage

```prompt
Create comprehensive tests for [FEATURE/COMPONENT]:

1. Unit tests (Vitest):
```javascript
// [component].test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { [Component] } from './[Component]';

describe('[Component]', () => {
  it('should render correctly', () => {
    render(<[Component] />);
    expect(screen.getByText('[Expected Text]')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    const handleClick = vi.fn();
    render(<[Component] onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

2. Integration tests:
```javascript
// Test API integration
// Test database operations
// Test authentication flow
```

3. E2E tests (Playwright):
```javascript
// Test complete user workflows
// Test across different user roles
```
```

### Deploy Feature to Environment

```prompt
Deploy the [FEATURE] to [ENVIRONMENT]:

1. Pre-deployment checklist:
   - [ ] All tests passing
   - [ ] No console.log statements
   - [ ] Security audit clean
   - [ ] Performance optimized
   - [ ] Documentation updated

2. Commit with proper message:
```bash
git add -A
git commit -m "[TYPE]: [Description]

- [Detailed change 1]
- [Detailed change 2]

Spec: specs/[feature-number]-[feature-name]"
```

3. Create PR:
```bash
gh pr create --base [target-branch] --head [feature-branch] \
  --title "[TYPE]: [Feature name]" \
  --body "## Summary

  Implements [FEATURE] as specified in specs/[feature-number]

  ## Changes
  - [Change 1]
  - [Change 2]

  ## Test Plan
  - [ ] Unit tests pass
  - [ ] Integration tests pass
  - [ ] Manual testing complete

  Spec: specs/[feature-number]-[feature-name]"
```

4. Merge and deploy:
```bash
gh pr merge [PR_NUMBER] --merge --admin
```
```

## 🔄 Refactoring Prompts

### Refactor to SpecKit Standards

```prompt
Refactor the existing code at [PATH] to follow SpecKit standards:

1. Extract business logic to specifications
2. Separate concerns:
   - UI components (presentation only)
   - Services (API calls)
   - Stores (state management)
   - Utils (pure functions)

3. Apply patterns:
   - Memoization for performance
   - Error boundaries for stability
   - Structured logging
   - Environment-aware configuration

4. Remove:
   - Console.log statements
   - Hardcoded values
   - Mock data in production code
   - Unused imports and code

5. Add:
   - Proper TypeScript types
   - Error handling
   - Loading states
   - Test coverage
```

### Extract Reusable Component

```prompt
Extract the code at [PATH] into a reusable component:

1. Create new component file:
```javascript
// src/components/shared/[ComponentName].jsx
export const [ComponentName] = memo(({
  // Define clear props interface
}) => {
  // Component logic
});
```

2. Make it configurable:
   - Accept props for customization
   - Use composition over configuration
   - Provide sensible defaults

3. Add documentation:
   - JSDoc comments
   - Usage examples
   - Props description

4. Create tests:
   - Unit tests for all props
   - Integration tests for common uses
```

## 📝 Documentation Prompts

### Generate Feature Documentation

```prompt
Generate documentation for [FEATURE] including:

1. User documentation (markdown):
   - Feature overview
   - How to access
   - Step-by-step usage
   - Screenshots/examples
   - Troubleshooting

2. Technical documentation:
   - Architecture overview
   - API endpoints
   - Data models
   - Integration points
   - Configuration options

3. Deployment notes:
   - Environment variables
   - Dependencies
   - Migration steps
   - Rollback procedure

Output to: docs/features/[feature-name].md
```

### Create API Documentation

```prompt
Document the API endpoint at [ENDPOINT]:

```markdown
## [ENDPOINT NAME]

**Endpoint**: `[METHOD] /api/[path]`
**Authentication**: Required
**Roles**: [admin, manager, operator, viewer]

### Request

```json
{
  "param1": "string",
  "param2": "number"
}
```

### Response

**Success (200)**:
```json
{
  "data": {},
  "message": "Success"
}
```

**Error (4xx/5xx)**:
```json
{
  "error": "Error message",
  "details": {}
}
```

### Examples

```bash
curl -X [METHOD] \
  https://api.example.com/[path] \
  -H "Authorization: Bearer [token]" \
  -d '{"param1": "value"}'
```
```
```

## 🚀 Quick Fixes

### Fix Navigation Not Working

```prompt
The navigation to [ROUTE] is not working. Fix by:

1. Check route definition in App.jsx
2. Verify link in Sidebar.jsx
3. Ensure component exports correctly
4. Add lazy loading if needed
5. Check role-based access
6. Verify navigation function calls
```

### Fix Real-time Updates

```prompt
Real-time updates are not working for [FEATURE]. Fix by:

1. Check SSE endpoint in server.js
2. Verify useSSE hook implementation
3. Ensure event names match
4. Check CORS configuration
5. Verify connection handling
6. Add error recovery
```

### Fix Authentication Issues

```prompt
Users cannot access [FEATURE]. Fix authentication by:

1. Check Clerk configuration
2. Verify role assignments
3. Update route guards
4. Check token validation
5. Verify environment variables
6. Test with different user roles
```

---

## Usage Tips

1. **Always reference the specification first** - Read spec before implementing
2. **Follow existing patterns** - Check similar features for consistency
3. **Test incrementally** - Don't wait until the end to test
4. **Commit frequently** - Small, focused commits are better
5. **Document decisions** - Explain WHY, not just WHAT

These prompts are starting points. Customize them based on your specific feature requirements and architectural decisions.