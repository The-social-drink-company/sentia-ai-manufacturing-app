# Create New Feature

Scaffold and implement a new feature following enterprise standards.

## Usage

When user provides a feature request, guide them through structured implementation.

## Feature Planning Phase

### 1. Requirements Gathering

Ask the user to clarify:
- **Feature Name**: What is this feature called?
- **Purpose**: What business problem does it solve?
- **User Story**: Who needs this and why?
- **Acceptance Criteria**: What defines "done"?
- **Priority**: Critical / High / Medium / Low

### 2. Technical Design

Analyze and propose:
- **Components Needed**: New React components required
- **API Endpoints**: Backend routes needed
- **Database Changes**: Schema modifications (if any)
- **External Integrations**: Third-party APIs involved
- **State Management**: Where state lives
- **Authentication**: Access control requirements

### 3. Implementation Plan

Create step-by-step plan:
```
📋 Implementation Plan: [Feature Name]

Phase 1: Backend Setup
  [ ] Create API endpoint: /api/[feature]
  [ ] Add database models (if needed)
  [ ] Implement business logic
  [ ] Add error handling
  [ ] Write API tests

Phase 2: Frontend Components
  [ ] Create main component: [FeatureName].jsx
  [ ] Add to routing in App.jsx
  [ ] Implement UI layout
  [ ] Connect to API
  [ ] Add loading/error states

Phase 3: Integration
  [ ] Add navigation menu item
  [ ] Update permissions (if needed)
  [ ] Add analytics tracking
  [ ] Update documentation

Phase 4: Testing
  [ ] Unit tests for business logic
  [ ] Component tests
  [ ] Integration tests
  [ ] Manual UAT testing

Phase 5: Deployment
  [ ] Deploy to development
  [ ] Test in dev environment
  [ ] Deploy to test for UAT
  [ ] After approval, deploy to production
```

## Implementation Process

### 1. Create Feature Branch (Optional)

```bash
git checkout development
git pull origin development
git checkout -b feature/[feature-name]
```

### 2. Backend Implementation

If API endpoints needed:

```javascript
// server/api/[feature].js
import express from 'express';
const router = express.Router();

// GET /api/[feature]
router.get('/', async (req, res) => {
  try {
    // Implementation
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

Add to server.js:
```javascript
import [feature]Routes from './server/api/[feature].js';
app.use('/api/[feature]', [feature]Routes);
```

### 3. Frontend Component

Create component structure:
```javascript
// src/components/[FeatureName].jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const [FeatureName] = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/[feature]');
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>[Feature Name]</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Feature implementation */}
        </CardContent>
      </Card>
    </div>
  );
};

export default [FeatureName];
```

### 4. Add Routing

Update src/App.jsx or routing config:
```javascript
import [FeatureName] from './components/[FeatureName]';

// Add route
<Route path="/[feature]" element={<[FeatureName] />} />
```

### 5. Add Navigation

Update Sidebar component:
```javascript
{
  name: '[Feature Name]',
  href: '/[feature]',
  icon: [IconComponent],
  current: location.pathname === '/[feature]'
}
```

## Code Quality Standards

Ensure all new code follows:

1. **ESLint Compliance**
   - Run `npm run lint` on new files
   - Fix all errors before committing
   - Use proper TypeScript types if applicable

2. **Component Standards**
   - Use functional components with hooks
   - Implement proper loading states
   - Add error boundaries
   - Include accessibility attributes

3. **API Standards**
   - RESTful endpoint design
   - Consistent error responses
   - Proper HTTP status codes
   - Request validation

4. **Documentation**
   - JSDoc comments for functions
   - README updates if needed
   - API documentation
   - Usage examples

## Testing

1. **Development Testing**
   ```bash
   npm run dev
   # Test at http://localhost:5173/[feature]
   ```

2. **Build Testing**
   ```bash
   npm run build
   npm run preview
   ```

3. **Lint Check**
   ```bash
   npm run lint
   ```

## Commit and Deploy

```bash
# Commit changes
git add .
git commit -m "feat: implement [feature name]

- Add API endpoint /api/[feature]
- Create [FeatureName] component
- Add navigation and routing
- Implement core functionality

Resolves #[issue-number]"

# Merge to development
git checkout development
git merge feature/[feature-name]
git push origin development
```

## Output Template

```
✅ FEATURE IMPLEMENTATION COMPLETE

📦 Feature: [Feature Name]

✅ Completed Tasks:
- [x] Backend API endpoint created
- [x] Frontend component implemented
- [x] Routing configured
- [x] Navigation updated
- [x] Error handling added
- [x] Loading states implemented
- [x] Lint checks passed
- [x] Manual testing complete

📁 Files Created/Modified:
- server/api/[feature].js (NEW)
- src/components/[FeatureName].jsx (NEW)
- src/App.jsx (MODIFIED)
- src/components/Sidebar.jsx (MODIFIED)

🧪 Testing:
- ✅ Development: Tested locally
- ✅ Build: Successful
- ✅ Lint: No errors

🚀 Deployment:
- Committed to development branch
- Ready for deployment with /deploy-dev

📝 Next Steps:
1. Deploy to development with /deploy-dev
2. Test in dev environment
3. If stable, deploy to test with /deploy-test
4. After UAT approval, deploy to production

📖 Documentation:
- API endpoint documented
- Component usage documented
- CHANGELOG updated (if applicable)
```

Execute feature creation following these enterprise standards.
