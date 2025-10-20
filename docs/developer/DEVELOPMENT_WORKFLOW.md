# Development Workflow

## Overview
This document outlines the development workflow, coding standards, and best practices for the CapLiquify Manufacturing Platform project.

## Table of Contents
- [Git Workflow](#git-workflow)
- [Coding Standards](#coding-standards)
- [Component Development](#component-development)
- [Testing Workflow](#testing-workflow)
- [Code Review Process](#code-review-process)
- [Release Process](#release-process)
- [Development Best Practices](#development-best-practices)

---

## Git Workflow

### Branch Strategy

We follow a **Git Flow** model with the following branches:

```
main/production     # Production-ready code
├── development     # Integration branch for features
├── feature/*       # Feature development branches
├── hotfix/*        # Critical fixes for production
├── release/*       # Release preparation branches
└── bugfix/*        # Bug fixes for development
```

**Branch Naming Convention:**
```
feature/TICKET-123-add-inventory-widget
bugfix/TICKET-456-fix-dashboard-loading
hotfix/TICKET-789-critical-security-fix
release/v1.2.0-prepare-release
```

### Development Workflow

**1. Start New Feature:**
```bash
# Sync with latest development
git checkout development
git pull origin development

# Create feature branch
git checkout -b feature/TICKET-123-add-inventory-widget

# Work on your feature...
git add .
git commit -m "feat: add inventory level widget to dashboard

- Implement real-time inventory tracking
- Add low stock alerts
- Include reorder point indicators

Closes TICKET-123"
```

**2. Keep Branch Updated:**
```bash
# Regular sync with development (daily recommended)
git checkout development
git pull origin development
git checkout feature/TICKET-123-add-inventory-widget
git rebase development

# Resolve conflicts if any
git add .
git rebase --continue
```

**3. Create Pull Request:**
```bash
# Push feature branch
git push origin feature/TICKET-123-add-inventory-widget

# Create PR through GitHub UI or CLI
gh pr create --title "feat: add inventory level widget" \
             --body "Implements real-time inventory tracking widget"
```

### Commit Message Format

We use **Conventional Commits** format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```bash
feat(dashboard): add KPI widget with real-time updates

fix(auth): resolve token expiration handling

docs: update API documentation for new endpoints

refactor(utils): simplify date formatting helpers

test(components): add unit tests for Button component

chore(deps): update dependencies to latest versions
```

**Breaking Changes:**
```bash
feat!: change API response format for better consistency

BREAKING CHANGE: API responses now include 'data' wrapper
```

---

## Coding Standards

### TypeScript Guidelines

**Interface Naming:**
```typescript
// Use PascalCase with descriptive names
interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
}

// Prefix with 'I' only for conflicting names
interface IUserService {
  getUser(id: string): Promise<User>;
}

// Props interfaces end with 'Props'
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}
```

**Type Definitions:**
```typescript
// Use type unions for constants
type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';

// Use Record for key-value mappings
type PermissionMap = Record<UserRole, string[]>;

// Use Pick/Omit for type derivations
type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
type UserSummary = Pick<User, 'id' | 'email' | 'role'>;
```

**Function Signatures:**
```typescript
// Use explicit return types for public functions
export function calculateWorkingCapital(
  currentAssets: number,
  currentLiabilities: number
): number {
  return currentAssets - currentLiabilities;
}

// Use async/await over Promises
export async function fetchUserData(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}
```

### React Component Standards

**Component Structure:**
```typescript
// 1. Imports (grouped and sorted)
import React, { useState, useEffect, useCallback } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';

// 2. Types and interfaces
interface RevenueChartProps {
  period: '30d' | '60d' | '90d';
  showComparison?: boolean;
  onPeriodChange?: (period: string) => void;
}

interface ChartData {
  date: string;
  revenue: number;
  comparison?: number;
}

// 3. Component implementation
export const RevenueChart: React.FC<RevenueChartProps> = ({
  period = '30d',
  showComparison = false,
  onPeriodChange
}) => {
  // 4. Hooks (in order)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const { data, loading, error } = useQuery({
    queryKey: ['revenue', period],
    queryFn: () => fetchRevenueData(period)
  });

  // 5. Event handlers
  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handlePeriodChange = useCallback((newPeriod: string) => {
    onPeriodChange?.(newPeriod);
  }, [onPeriodChange]);

  // 6. Effects
  useEffect(() => {
    if (data && data.length > 0) {
      setSelectedDate(data[0].date);
    }
  }, [data]);

  // 7. Early returns
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data?.length) return <EmptyState />;

  // 8. Render
  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Revenue Trend</h3>
        <PeriodSelector value={period} onChange={handlePeriodChange} />
      </div>
      
      <Chart
        data={data}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        showComparison={showComparison}
      />
    </div>
  );
};

// 9. Default export (if needed)
export default RevenueChart;
```

**Hooks Guidelines:**
```typescript
// Custom hooks start with 'use'
export function useWorkingCapital() {
  const [data, setData] = useState<WorkingCapitalData | null>(null);
  const [loading, setLoading] = useState(true);

  // Implementation...

  return { data, loading, refresh };
}

// Use useCallback for event handlers
const handleSubmit = useCallback(async (formData: FormData) => {
  setLoading(true);
  try {
    await submitData(formData);
    onSuccess?.();
  } catch (error) {
    onError?.(error);
  } finally {
    setLoading(false);
  }
}, [onSuccess, onError]);

// Use useMemo for expensive calculations
const chartData = useMemo(() => {
  return rawData?.map(item => ({
    ...item,
    formattedValue: formatCurrency(item.value)
  }));
}, [rawData]);
```

### CSS/Styling Standards

**Tailwind CSS Guidelines:**
```typescript
// Use consistent spacing scale
const spacingClasses = 'p-4 m-6 space-y-4';

// Group related classes
const buttonClasses = cn(
  // Layout
  'flex items-center justify-center',
  // Spacing  
  'px-4 py-2',
  // Typography
  'text-sm font-medium',
  // Colors
  'bg-blue-600 text-white',
  // Interaction states
  'hover:bg-blue-700 focus:ring-2 focus:ring-blue-500',
  // Responsive
  'sm:px-6 sm:py-3 sm:text-base'
);

// Use design system values
const colorClasses = {
  primary: 'bg-primary-600 text-white',
  secondary: 'bg-secondary-100 text-secondary-900',
  success: 'bg-green-600 text-white',
  warning: 'bg-yellow-500 text-yellow-900',
  error: 'bg-red-600 text-white'
};
```

**Component Styling Patterns:**
```typescript
// Use cn() utility for conditional classes
const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700',
  secondary: 'bg-gray-100 hover:bg-gray-200',
  outline: 'border border-gray-300 hover:bg-gray-50'
};

const Button = ({ variant = 'primary', disabled, className, ...props }) => (
  <button
    className={cn(
      'px-4 py-2 rounded-md font-medium transition-colors',
      buttonVariants[variant],
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}
    disabled={disabled}
    {...props}
  />
);
```

---

## Component Development

### Component Development Lifecycle

**1. Planning Phase:**
```typescript
// Create component specification
interface ComponentSpec {
  name: string;
  purpose: string;
  props: Record<string, any>;
  variants: string[];
  dependencies: string[];
  examples: string[];
}

const KPICardSpec: ComponentSpec = {
  name: 'KPICard',
  purpose: 'Display key performance indicator with trend',
  props: {
    title: 'string',
    value: 'number | string',
    change: '{ value: number, direction: "up" | "down" }',
    format: 'currency | percentage | number'
  },
  variants: ['default', 'compact', 'detailed'],
  dependencies: ['@heroicons/react', 'recharts'],
  examples: ['Revenue card', 'Customer count', 'Conversion rate']
};
```

**2. Implementation Phase:**
```typescript
// Start with TypeScript interfaces
interface KPICardProps {
  title: string;
  value: number | string;
  change?: {
    value: number;
    direction: 'up' | 'down';
    period?: string;
  };
  format?: 'currency' | 'percentage' | 'number';
  variant?: 'default' | 'compact' | 'detailed';
  loading?: boolean;
  error?: string;
  className?: string;
}

// Implement with proper error handling
export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  format = 'number',
  variant = 'default',
  loading = false,
  error,
  className
}) => {
  // Implementation with early returns
  if (loading) return <KPICardSkeleton />;
  if (error) return <KPICardError error={error} />;

  // Main implementation
  return (
    <div className={cn('bg-white rounded-lg p-6 shadow-sm', className)}>
      {/* Component content */}
    </div>
  );
};
```

**3. Testing Phase:**
```typescript
// Component tests
describe('KPICard', () => {
  it('displays title and value correctly', () => {
    render(<KPICard title="Revenue" value={125000} format="currency" />);
    
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('£125,000')).toBeInTheDocument();
  });

  it('shows trend indicator when change is provided', () => {
    render(
      <KPICard
        title="Revenue"
        value={125000}
        change={{ value: 5.2, direction: 'up' }}
      />
    );
    
    expect(screen.getByText('5.2%')).toBeInTheDocument();
    expect(screen.getByTestId('trend-up-icon')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(<KPICard title="Revenue" value={0} loading />);
    expect(screen.getByTestId('kpi-skeleton')).toBeInTheDocument();
  });
});
```

**4. Documentation Phase:**
```typescript
// Storybook stories
export default {
  title: 'Components/KPICard',
  component: KPICard,
  parameters: {
    docs: {
      description: {
        component: 'Displays key performance indicators with optional trend data'
      }
    }
  }
};

export const Default = {
  args: {
    title: 'Total Revenue',
    value: 125000,
    format: 'currency'
  }
};

export const WithTrend = {
  args: {
    title: 'Monthly Growth',
    value: 15.8,
    format: 'percentage',
    change: { value: 2.3, direction: 'up', period: 'vs last month' }
  }
};

export const Loading = {
  args: {
    title: 'Revenue',
    value: 0,
    loading: true
  }
};
```

### State Management Patterns

**Zustand Store Pattern:**
```typescript
// stores/dashboardStore.ts
interface DashboardState {
  layout: LayoutConfig;
  widgets: Widget[];
  isEditMode: boolean;
  loading: boolean;
  error: string | null;
}

interface DashboardActions {
  setEditMode: (editMode: boolean) => void;
  updateLayout: (layout: LayoutConfig) => void;
  addWidget: (widget: Widget) => void;
  removeWidget: (widgetId: string) => void;
  loadDashboard: (dashboardId: string) => Promise<void>;
  saveDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState & DashboardActions>(
  (set, get) => ({
    // Initial state
    layout: DEFAULT_LAYOUT,
    widgets: [],
    isEditMode: false,
    loading: false,
    error: null,

    // Actions
    setEditMode: (editMode) => set({ isEditMode: editMode }),
    
    updateLayout: (layout) => set({ layout }),
    
    addWidget: (widget) => set((state) => ({
      widgets: [...state.widgets, widget]
    })),
    
    removeWidget: (widgetId) => set((state) => ({
      widgets: state.widgets.filter(w => w.id !== widgetId)
    })),
    
    loadDashboard: async (dashboardId) => {
      set({ loading: true, error: null });
      try {
        const dashboard = await fetchDashboard(dashboardId);
        set({
          layout: dashboard.layout,
          widgets: dashboard.widgets,
          loading: false
        });
      } catch (error) {
        set({ error: error.message, loading: false });
      }
    },
    
    saveDashboard: async () => {
      const { layout, widgets } = get();
      try {
        await saveDashboard({ layout, widgets });
      } catch (error) {
        set({ error: error.message });
      }
    }
  })
);
```

**React Query Integration:**
```typescript
// hooks/useWorkingCapital.ts
export function useWorkingCapital(options?: UseQueryOptions) {
  return useQuery({
    queryKey: ['working-capital'],
    queryFn: fetchWorkingCapitalData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    ...options
  });
}

export function useWorkingCapitalMutations() {
  const queryClient = useQueryClient();
  
  const updateWorkingCapital = useMutation({
    mutationFn: updateWorkingCapitalData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['working-capital'] });
      toast.success('Working capital updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    }
  });
  
  return { updateWorkingCapital };
}
```

---

## Testing Workflow

### Testing Strategy

**Testing Pyramid:**
```
E2E Tests (10%)     # Playwright tests for critical user journeys
├── Integration (20%) # API endpoints, database operations  
├── Unit Tests (70%)  # Components, utilities, hooks
└── Manual Testing   # Exploratory testing, usability
```

### Unit Testing

**Component Testing with React Testing Library:**
```typescript
// components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

**Hook Testing:**
```typescript
// hooks/__tests__/useWorkingCapital.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWorkingCapital } from '../useWorkingCapital';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useWorkingCapital', () => {
  it('returns working capital data', async () => {
    const { result } = renderHook(() => useWorkingCapital(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toMatchObject({
      currentRatio: expect.any(Number),
      workingCapital: expect.any(Number)
    });
  });
});
```

**Utility Testing:**
```typescript
// utils/__tests__/format.test.ts
import { formatCurrency, formatPercentage, formatNumber } from '../format';

describe('format utilities', () => {
  describe('formatCurrency', () => {
    it('formats positive amounts correctly', () => {
      expect(formatCurrency(1234.56)).toBe('£1,234.56');
      expect(formatCurrency(0)).toBe('£0.00');
    });

    it('formats negative amounts correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-£1,234.56');
    });

    it('handles different currencies', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
    });
  });
});
```

### Integration Testing

**API Testing:**
```typescript
// api/__tests__/workingCapital.test.ts
import request from 'supertest';
import { app } from '../app';
import { prismaMock } from '../__mocks__/prisma';

describe('Working Capital API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/working-capital/overview', () => {
    it('returns working capital overview', async () => {
      prismaMock.workingCapital.findFirst.mockResolvedValue({
        id: '1',
        currentAssets: 500000,
        currentLiabilities: 250000,
        workingCapital: 250000,
        currentRatio: 2.0
      });

      const response = await request(app)
        .get('/api/working-capital/overview')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          workingCapital: 250000,
          currentRatio: 2.0
        }
      });
    });

    it('returns 401 for unauthenticated requests', async () => {
      await request(app)
        .get('/api/working-capital/overview')
        .expect(401);
    });
  });
});
```

### E2E Testing

**Playwright Tests:**
```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('displays KPI metrics correctly', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="kpi-revenue"]');
    
    // Check KPI values
    const revenueElement = page.locator('[data-testid="kpi-revenue"]');
    await expect(revenueElement).toContainText('£');
    
    const ordersElement = page.locator('[data-testid="kpi-orders"]');
    await expect(ordersElement).toBeVisible();
  });

  test('allows dashboard customization', async ({ page }) => {
    // Enter edit mode
    await page.click('[data-testid="edit-dashboard"]');
    await expect(page.locator('[data-testid="widget-controls"]')).toBeVisible();
    
    // Add new widget
    await page.click('[data-testid="add-widget"]');
    await page.click('[data-testid="widget-chart"]');
    
    // Configure widget
    await page.fill('[data-testid="widget-title"]', 'Test Chart');
    await page.click('[data-testid="save-widget"]');
    
    // Save dashboard
    await page.click('[data-testid="save-dashboard"]');
    
    // Verify widget was added
    await expect(page.locator('text=Test Chart')).toBeVisible();
  });

  test('navigates to working capital section', async ({ page }) => {
    await page.click('[data-testid="nav-working-capital"]');
    await expect(page).toHaveURL('/working-capital');
    
    // Check working capital data loads
    await page.waitForSelector('[data-testid="current-ratio"]');
    await expect(page.locator('[data-testid="current-ratio"]')).toBeVisible();
  });
});
```

### Test Data Management

**Test Fixtures:**
```typescript
// tests/fixtures/users.ts
export const testUsers = {
  admin: {
    id: '1',
    email: 'admin@test.com',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User'
  },
  manager: {
    id: '2',
    email: 'manager@test.com',
    role: 'manager',
    firstName: 'Manager',
    lastName: 'User'
  },
  viewer: {
    id: '3',
    email: 'viewer@test.com',
    role: 'viewer',
    firstName: 'Viewer',
    lastName: 'User'
  }
};

export const testWorkingCapitalData = {
  overview: {
    currentAssets: 500000,
    currentLiabilities: 250000,
    workingCapital: 250000,
    currentRatio: 2.0,
    quickRatio: 1.5
  }
};
```

**Mock Services:**
```typescript
// __mocks__/services/workingCapitalService.ts
export const mockWorkingCapitalService = {
  getOverview: jest.fn().mockResolvedValue({
    currentRatio: 2.0,
    workingCapital: 250000,
    trends: []
  }),
  
  getAccountsReceivable: jest.fn().mockResolvedValue({
    total: 300000,
    aging: {
      current: { amount: 200000, percentage: 66.7 },
      '30days': { amount: 75000, percentage: 25.0 }
    }
  })
};
```

---

## Code Review Process

### Pre-Review Checklist

Before requesting review, ensure:

**Code Quality:**
- [ ] Code follows TypeScript/React standards
- [ ] No console.log or debug statements
- [ ] All imports are used and properly organized
- [ ] No hardcoded values (use constants/config)
- [ ] Error handling is implemented
- [ ] Loading states are handled

**Testing:**
- [ ] Unit tests added/updated for new functionality
- [ ] All tests pass (`npm run test`)
- [ ] Integration tests added for API changes
- [ ] Manual testing completed

**Documentation:**
- [ ] Code is self-documenting with good variable names
- [ ] Complex logic has comments
- [ ] API changes documented
- [ ] README updated if needed

**Performance:**
- [ ] No unnecessary re-renders
- [ ] Proper memoization where needed
- [ ] Efficient database queries
- [ ] No memory leaks

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] E2E tests pass (if applicable)

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Related Issues
Closes #123, #456
```

### Review Guidelines

**For Reviewers:**

**Focus Areas:**
1. **Correctness**: Does the code do what it's supposed to do?
2. **Maintainability**: Is the code easy to understand and modify?
3. **Performance**: Are there any performance implications?
4. **Security**: Are there any security concerns?
5. **Testing**: Is the code adequately tested?

**Review Process:**
1. **Understand the Context**: Read the ticket/issue description
2. **Check Tests First**: Ensure tests cover the changes
3. **Review Implementation**: Check the actual code changes
4. **Test Locally**: Pull and test the changes if needed
5. **Provide Constructive Feedback**: Be specific and helpful

**Feedback Categories:**
- **Must Fix**: Critical issues that block merge
- **Should Fix**: Important issues that should be addressed
- **Consider**: Suggestions for improvement
- **Nitpick**: Minor style/preference issues

**Example Review Comments:**
```markdown
**Must Fix**: This function doesn't handle the error case when the API returns null.

**Should Fix**: Consider extracting this logic into a custom hook for reusability.

**Consider**: You might want to memoize this calculation since it's used in multiple places.

**Nitpick**: Consider using a more descriptive variable name than 'data'.
```

---

## Release Process

### Version Management

We use **Semantic Versioning** (SemVer):
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backwards compatible
- **Patch** (0.0.1): Bug fixes, backwards compatible

### Release Workflow

**1. Prepare Release:**
```bash
# Create release branch from development
git checkout development
git pull origin development
git checkout -b release/v1.2.0

# Update version in package.json
npm version minor  # or major/patch

# Update CHANGELOG.md
# Update documentation if needed

# Commit changes
git add .
git commit -m "chore: prepare release v1.2.0"
git push origin release/v1.2.0
```

**2. Test Release:**
```bash
# Run full test suite
npm run test
npm run test:e2e

# Build and test production version
npm run build
npm run start  # Test production build locally

# Deploy to staging for final testing
# (handled by CI/CD on push to release branch)
```

**3. Merge to Production:**
```bash
# Create PR from release branch to main
gh pr create --base main --title "Release v1.2.0"

# After approval and final testing:
git checkout main
git merge release/v1.2.0 --no-ff
git tag v1.2.0
git push origin main --tags

# Merge back to development
git checkout development
git merge main
git push origin development

# Clean up release branch
git branch -d release/v1.2.0
git push origin --delete release/v1.2.0
```

**4. Post-Release:**
```bash
# Create GitHub release with changelog
gh release create v1.2.0 --title "Release v1.2.0" --notes-file CHANGELOG.md

# Update documentation site
npm run docs:deploy

# Notify stakeholders
# Update project management tools
```

### Hotfix Process

For critical production issues:

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/v1.2.1-critical-auth-fix

# Make minimal fix
# Add tests
# Update version (patch)

# Test thoroughly
npm run test
npm run test:e2e

# Create PR directly to main
gh pr create --base main --title "Hotfix v1.2.1: Fix critical auth issue"

# After approval and merge:
git checkout main
git pull origin main
git tag v1.2.1
git push origin --tags

# Merge back to development
git checkout development
git merge main
git push origin development
```

---

## Development Best Practices

### Performance Best Practices

**React Performance:**
```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return processLargeDataSet(data);
  }, [data]);

  return <ComplexVisualization data={processedData} />;
});

// Use useCallback for event handlers
const handleSubmit = useCallback(async (formData) => {
  setLoading(true);
  try {
    await submitData(formData);
  } finally {
    setLoading(false);
  }
}, []);

// Use React.lazy for code splitting
const AdminPanel = lazy(() => import('../pages/AdminPanel'));
```

**Database Performance:**
```typescript
// Use proper indexes and query optimization
const getOrdersWithItems = async (filters) => {
  return await prisma.order.findMany({
    where: filters,
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50 // Limit results
  });
};

// Use pagination for large datasets
const getPaginatedOrders = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.order.count()
  ]);
  
  return { orders, total, pages: Math.ceil(total / limit) };
};
```

### Security Best Practices

**Input Validation:**
```typescript
// Always validate user inputs
const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'operator', 'viewer'])
});

export const updateUser = async (req, res) => {
  try {
    const validatedData = updateUserSchema.parse(req.body);
    // Process validated data...
  } catch (error) {
    return res.status(400).json({ error: 'Invalid input data' });
  }
};
```

**Authentication & Authorization:**
```typescript
// Always verify permissions
const requirePermission = (permission: string) => {
  return async (req, res, next) => {
    const user = req.auth.user;
    
    if (!hasPermission(user.role, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Use in routes
app.get('/api/admin/users', requirePermission('users.manage'), getUsersHandler);
```

### Error Handling Best Practices

**Client-Side Error Handling:**
```typescript
// Use error boundaries for React components
export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught error:', error, errorInfo);
    // Report to error tracking service
    reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Use try-catch for async operations
const handleApiCall = async () => {
  try {
    setLoading(true);
    const result = await apiCall();
    setData(result);
  } catch (error) {
    setError(error.message);
    reportError(error);
  } finally {
    setLoading(false);
  }
};
```

**Server-Side Error Handling:**
```typescript
// Centralized error handling middleware
const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  
  // Log error
  logger.error({
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.auth?.userId
  });

  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : error.message;

  res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message
    }
  });
};
```

### Documentation Best Practices

**Code Documentation:**
```typescript
/**
 * Calculates working capital metrics for a given period
 * 
 * @param currentAssets - Total current assets in base currency
 * @param currentLiabilities - Total current liabilities in base currency
 * @param previousPeriodData - Previous period data for comparison
 * @returns Object containing working capital metrics and trends
 * 
 * @example
 * ```typescript
 * const metrics = calculateWorkingCapital(500000, 200000, previousData);
 * console.log(metrics.currentRatio); // 2.5
 * ```
 */
export function calculateWorkingCapital(
  currentAssets: number,
  currentLiabilities: number,
  previousPeriodData?: WorkingCapitalData
): WorkingCapitalMetrics {
  // Implementation...
}
```

**API Documentation:**
```typescript
/**
 * @api {get} /api/working-capital/overview Get Working Capital Overview
 * @apiName GetWorkingCapitalOverview
 * @apiGroup WorkingCapital
 * @apiPermission authenticated
 * 
 * @apiParam {String} [period=30d] Time period (7d, 30d, 60d, 90d)
 * @apiParam {Boolean} [includeForcast=false] Include forecast data
 * 
 * @apiSuccess {Boolean} success Response status
 * @apiSuccess {Object} data Working capital data
 * @apiSuccess {Number} data.currentRatio Current ratio
 * @apiSuccess {Number} data.workingCapital Working capital amount
 * @apiSuccess {Object} data.breakdown Asset/liability breakdown
 * 
 * @apiError {Boolean} success False
 * @apiError {Object} error Error details
 * @apiError {String} error.message Error message
 */
```

This comprehensive development workflow ensures consistent, high-quality code and smooth collaboration across the development team.