# Component Library API Documentation

**BMAD-UI-002**: Component Library Structure
**Created**: 2025-10-19
**Version**: 1.0

This document provides API documentation for the Sentia Manufacturing Dashboard component library.

---

## Import Structure

All components can be imported using barrel exports for cleaner code:

```javascript
// Dashboard Components
import { KPICard, KPIGrid, WorkingCapitalCard } from '@/components/dashboard';

// Layout Components
import { DashboardHeader, DashboardSidebar, Sidebar } from '@/components/layout';

// Widget Components
import { KPIWidget, DataTableWidget, StockLevelsWidget } from '@/components/widgets';

// UI Components (Custom + shadcn/ui)
import { CustomCard, Button, Dialog, Input } from '@/components/ui';
```

---

## Dashboard Components (`@/components/dashboard`)

### KPICard

**Purpose**: Display a single Key Performance Indicator with gradient background, trend indicator, and icon.

**Props**:
```typescript
interface KPICardProps {
  icon?: string;          // Emoji or icon character (e.g., "💰", "📊")
  value: string | number; // KPI value to display
  label: string;          // KPI label/title
  gradient?: string;      // Tailwind gradient class (e.g., "bg-gradient-revenue")
  trend?: {
    value: number;        // Percentage change (e.g., 15.3)
    direction: 'up' | 'down' | 'neutral'; // Trend direction
  };
  valueFormat?: 'currency' | 'number' | 'percentage' | 'raw'; // Format type
}
```

**Usage Example**:
```javascript
<KPICard
  icon="💰"
  value={1234567}
  label="Annual Revenue"
  gradient="bg-gradient-revenue"
  trend={{ value: 12.5, direction: 'up' }}
  valueFormat="currency"
/>
```

**Design Tokens**:
- Gradients: `bg-gradient-revenue`, `bg-gradient-units`, `bg-gradient-margin`, `bg-gradient-wc`
- Colors: Primary blue (#3B82F6) → Secondary purple (#8B5CF6)

---

### KPIGrid

**Purpose**: Display multiple KPI cards in a responsive grid layout.

**Props**:
```typescript
interface KPIGridProps {
  kpis: KPICardProps[];  // Array of KPI configurations
  columns?: 2 | 3 | 4;   // Number of columns (default: auto-responsive)
}
```

**Usage Example**:
```javascript
<KPIGrid
  kpis={[
    { icon: "💰", value: 1234567, label: "Revenue", gradient: "bg-gradient-revenue" },
    { icon: "📦", value: 45000, label: "Units Sold", gradient: "bg-gradient-units" },
    { icon: "📊", value: 32.5, label: "Margin %", gradient: "bg-gradient-margin" }
  ]}
/>
```

**Responsive Behavior**:
- Mobile: 1 column
- Tablet (md): 2 columns
- Desktop (lg): 3-4 columns based on `kpis.length`

---

### WorkingCapitalCard

**Purpose**: Display working capital analysis with optimization recommendations.

**Props**:
```typescript
interface WorkingCapitalCardProps {
  data: {
    currentWC: number;              // Current working capital amount
    daysCCC: number;                // Cash conversion cycle in days
    optimizationPotential: number;  // Potential optimization amount
    percentOfRevenue: number;       // Working capital as % of revenue
  };
}
```

**Usage Example**:
```javascript
<WorkingCapitalCard
  data={{
    currentWC: 869000,
    daysCCC: 43.6,
    optimizationPotential: 150000,
    percentOfRevenue: 8.1
  }}
/>
```

---

## Layout Components (`@/components/layout`)

### DashboardHeader

**Purpose**: Top navigation header with user menu, notifications, and system status.

**Props**:
```typescript
interface DashboardHeaderProps {
  title?: string;        // Optional page title override
  showNotifications?: boolean;  // Show notification bell (default: true)
  showUserMenu?: boolean;       // Show user dropdown (default: true)
}
```

**Usage Example**:
```javascript
<DashboardHeader
  title="Enterprise Dashboard"
  showNotifications={true}
  showUserMenu={true}
/>
```

---

### DashboardSidebar

**Purpose**: Left navigation sidebar with collapsible menu items.

**Props**:
```typescript
interface DashboardSidebarProps {
  collapsed?: boolean;   // Start in collapsed state (default: false)
  onCollapse?: (collapsed: boolean) => void; // Callback on collapse toggle
}
```

**Usage Example**:
```javascript
const [collapsed, setCollapsed] = useState(false);

<DashboardSidebar
  collapsed={collapsed}
  onCollapse={setCollapsed}
/>
```

---

### Sidebar

**Purpose**: Generic sidebar component (legacy, use DashboardSidebar for new code).

**Props**:
```typescript
interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}
```

---

## Widget Components (`@/components/widgets`)

### KPIWidget

**Purpose**: Widget wrapper for dashboard grid system (react-grid-layout).

**Props**:
```typescript
interface KPIWidgetProps {
  id: string;            // Unique widget ID
  title: string;         // Widget title
  children: React.ReactNode;  // Widget content
  onRemove?: () => void; // Optional remove callback
  onRefresh?: () => void; // Optional refresh callback
}
```

**Usage Example**:
```javascript
<KPIWidget
  id="revenue-kpi"
  title="Revenue Overview"
  onRefresh={() => fetchRevenueData()}
>
  <KPICard {...revenueData} />
</KPIWidget>
```

---

### DataTableWidget

**Purpose**: Display tabular data with sorting, filtering, and pagination.

**Props**:
```typescript
interface DataTableWidgetProps {
  data: any[];           // Table data array
  columns: {
    key: string;         // Data key
    label: string;       // Column header
    sortable?: boolean;  // Enable sorting (default: true)
    format?: (value: any) => string; // Optional formatter
  }[];
  pageSize?: number;     // Rows per page (default: 10)
}
```

**Usage Example**:
```javascript
<DataTableWidget
  data={orders}
  columns={[
    { key: 'id', label: 'Order ID', sortable: true },
    { key: 'amount', label: 'Amount', format: (v) => `£${v.toFixed(2)}` },
    { key: 'status', label: 'Status' }
  ]}
  pageSize={20}
/>
```

---

### StockLevelsWidget

**Purpose**: Display current inventory levels with reorder alerts.

**Props**:
```typescript
interface StockLevelsWidgetProps {
  showAlerts?: boolean;  // Show low stock alerts (default: true)
  refreshInterval?: number; // Auto-refresh interval in ms (default: 30000)
}
```

**Usage Example**:
```javascript
<StockLevelsWidget
  showAlerts={true}
  refreshInterval={60000}
/>
```

---

## UI Components (`@/components/ui`)

This library combines **custom components** (aliased with `Custom` prefix) and **shadcn/ui components** (standard names).

### Custom Components

All custom components are exported with a `Custom` prefix to avoid conflicts:

```javascript
import { CustomCard, CustomBadge, CustomButton } from '@/components/ui';
```

#### CustomCard

**Props**:
```typescript
interface CustomCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: string;  // Tailwind gradient class
}
```

**Subcomponents**: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

#### CustomBadge

**Props**:
```typescript
interface CustomBadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}
```

#### CustomButton

**Props**:
```typescript
interface CustomButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}
```

---

### shadcn/ui Components

Full library of accessible, customizable components:

**Available Components**:
- `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- `Alert`, `AlertTitle`, `AlertDescription`
- `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`
- `Badge` (shadcn variant)
- `Button` (shadcn variant)
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
- `Checkbox`
- `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`
- `DropdownMenu`, `DropdownMenuItem`
- `Form`, `FormField`, `FormItem`, `FormLabel`
- `Input`, `Textarea`
- `Label`
- `Popover`, `PopoverTrigger`, `PopoverContent`
- `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`
- `Separator`
- `Sheet`, `SheetTrigger`, `SheetContent`
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Toast`, `ToastAction`
- `Tooltip`, `TooltipTrigger`, `TooltipContent`

**Usage Example**:
```javascript
import { Dialog, DialogTrigger, DialogContent, Input } from '@/components/ui';

<Dialog>
  <DialogTrigger>Open Settings</DialogTrigger>
  <DialogContent>
    <Input placeholder="Enter value..." />
  </DialogContent>
</Dialog>
```

**Documentation**: See [shadcn/ui docs](https://ui.shadcn.com) for complete component API reference.

---

## Design System Integration

All components follow the **BMAD-UI-001 Design Tokens**:

### Color Gradients
```javascript
// KPI Card Gradients
bg-gradient-revenue   // Blue → Purple (#3B82F6 → #8B5CF6)
bg-gradient-units     // Green → Blue (#10B981 → #3B82F6)
bg-gradient-margin    // Amber → Orange (#F59E0B → #F97316)
bg-gradient-wc        // Purple → Pink (#8B5CF6 → #EC4899)
bg-gradient-hero      // Hero section (multi-stop gradient)
```

### Typography Scale
```javascript
text-xs   // 12px - Small labels
text-sm   // 14px - Body text small
text-base // 16px - Body text
text-lg   // 18px - Subheadings
text-xl   // 20px - Section titles
text-2xl  // 24px - Page titles
text-3xl  // 30px - Large headings
```

### Spacing System
```javascript
// 4px base unit
p-1  // 4px padding
p-2  // 8px padding
p-4  // 16px padding
p-6  // 24px padding
p-8  // 32px padding
```

### Color Palette
```javascript
// Primary (Blue)
bg-primary-500  // #3B82F6

// Secondary (Purple)
bg-secondary-500  // #8B5CF6

// Slate (Dark theme)
bg-slate-800  // #1E293B (sidebar)

// Status Colors
text-success-500  // #22C55E
text-warning-500  // #F59E0B
text-error-500    // #EF4444
text-info-500     // #06B6D4
```

---

## Best Practices

### 1. Use Barrel Exports
```javascript
// ✅ Good - Clean imports
import { KPICard, KPIGrid } from '@/components/dashboard';

// ❌ Avoid - Individual imports
import KPICard from '@/components/dashboard/KPICard';
import KPIGrid from '@/components/dashboard/KPIGrid';
```

### 2. Apply Design Tokens
```javascript
// ✅ Good - Use design system gradients
<KPICard gradient="bg-gradient-revenue" />

// ❌ Avoid - Inline gradients
<KPICard className="bg-gradient-to-r from-blue-500 to-purple-500" />
```

### 3. Prefer Custom Components for Consistency
```javascript
// ✅ Good - Custom components match design system
import { CustomButton } from '@/components/ui';
<CustomButton variant="primary">Submit</CustomButton>

// ⚠️ Use shadcn when extensive customization needed
import { Button } from '@/components/ui';
<Button variant="outline" size="lg">Advanced</Button>
```

### 4. Component Composition
```javascript
// ✅ Good - Compose widgets from smaller components
<KPIWidget id="revenue" title="Revenue Overview">
  <KPIGrid kpis={[...]} />
</KPIWidget>

// ❌ Avoid - Monolithic components
<RevenueOverviewWidget />
```

---

## Testing Components

### Unit Testing Example
```javascript
import { render, screen } from '@testing-library/react';
import { KPICard } from '@/components/dashboard';

test('KPICard renders value correctly', () => {
  render(
    <KPICard
      value={1234567}
      label="Revenue"
      valueFormat="currency"
    />
  );

  expect(screen.getByText('£1,234,567')).toBeInTheDocument();
  expect(screen.getByText('Revenue')).toBeInTheDocument();
});
```

### Integration Testing Example
```javascript
import { render, screen } from '@testing-library/react';
import { KPIGrid } from '@/components/dashboard';

test('KPIGrid renders multiple KPIs', () => {
  const kpis = [
    { value: 100, label: "KPI 1" },
    { value: 200, label: "KPI 2" },
    { value: 300, label: "KPI 3" }
  ];

  render(<KPIGrid kpis={kpis} />);

  expect(screen.getByText('KPI 1')).toBeInTheDocument();
  expect(screen.getByText('KPI 2')).toBeInTheDocument();
  expect(screen.getByText('KPI 3')).toBeInTheDocument();
});
```

---

## Change Log

### Version 1.0 (2025-10-19)
- **BMAD-UI-002**: Initial component library structure
- Created barrel exports for dashboard, layout, widgets, ui
- Documented core component APIs
- Integrated design tokens from BMAD-UI-001

---

## Future Enhancements

### Planned (EPIC-UI-001)
- **BMAD-UI-009**: Enhanced chart components with real-time updates
- **BMAD-UI-011**: Advanced table filtering and search
- **BMAD-UI-013**: Drag-and-drop dashboard customization
- **BMAD-UI-018**: WCAG 2.1 AA accessibility compliance audit

### Under Consideration
- Storybook integration for visual component documentation
- TypeScript migration for full type safety
- Component performance benchmarking
- Accessibility testing automation

---

**Document Status**: ✅ COMPLETE
**Last Updated**: 2025-10-19
**Maintained By**: BMAD Dev Team
**Framework**: BMAD-METHOD v6a Phase 4 (Implementation)
