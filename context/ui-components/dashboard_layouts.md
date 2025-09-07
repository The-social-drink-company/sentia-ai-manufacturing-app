# Dashboard Layouts

## Overview

This document defines the layout structures, widget configurations, and responsive design patterns for the Sentia Manufacturing Dashboard interface.

## Current Implementation Status
- **React Grid Layout**: Drag-and-drop dashboard with responsive breakpoints ✅ IMPLEMENTED
- **Widget System**: 7 core widgets with real-time updates ✅ IMPLEMENTED
- **Role-Based Access**: Admin, Manager, Operator, Viewer with granular permissions ✅ IMPLEMENTED
- **Dark/Light Themes**: Complete theming system with user preference persistence ✅ IMPLEMENTED
- **Mobile Responsive**: Touch-optimized interface with responsive breakpoints ✅ IMPLEMENTED
- **Real-time Updates**: Server-Sent Events for live data updates ✅ IMPLEMENTED

## Layout Structure

### Main Dashboard Grid System

The dashboard uses a 12-column responsive grid system with the following breakpoints:

- **Mobile (sm)**: < 640px - Single column, stacked widgets
- **Tablet (md)**: 640px - 1024px - 2-column layout  
- **Desktop (lg)**: 1024px - 1440px - 3-column layout
- **Large (xl)**: > 1440px - 4-column layout

### Layout Types

#### 1. Executive Overview Layout (Default)
```
┌─────────────────────────────────────────────────────────┐
│ KPI Strip (span 12 cols)                                │
├─────────────────────────────────────────────────────────┤
│ Working Capital │ Demand Forecast │ Stock Status        │
│ Meter (4 cols)  │ (4 cols)        │ (4 cols)           │
├─────────────────┼─────────────────┼─────────────────────┤
│ Capacity Util   │ Recent Jobs     │ System Health       │
│ (4 cols)        │ (4 cols)        │ (4 cols)           │
└─────────────────┴─────────────────┴─────────────────────┘
```

#### 2. Operational View Layout
```
┌─────────────────────────────────────────────────────────┐
│ Quick Actions Toolbar (span 12 cols)                    │
├─────────────────────────────────────────────────────────┤
│ Demand Forecast (span 8 cols)     │ Control Panel       │
│                                    │ (4 cols)           │
├────────────────────────────────────┼─────────────────────┤
│ Stock Recommendations (6 cols)     │ Capacity (6 cols)  │
└─────────────────────────────────────┴─────────────────────┘
```

#### 3. Financial Analysis Layout
```
┌─────────────────────────────────────────────────────────┐
│ Working Capital Dashboard (span 12 cols)                │
├─────────────────────────────────────────────────────────┤
│ Cash Flow Timeline │ KPI Cards      │ Risk Assessment    │
│ (6 cols)           │ (3 cols)       │ (3 cols)          │
├─────────────────────────────────────┼─────────────────────┤
│ Payment Terms Analysis (8 cols)     │ Actions (4 cols)   │
└─────────────────────────────────────┴─────────────────────┘
```

## Widget Catalog

### Core Widgets

#### 1. KPI Strip Widget
- **Purpose**: Display key performance indicators horizontally
- **Size**: 12 columns (full width)
- **Height**: 80px fixed
- **Data Sources**: Multiple API endpoints
- **Refresh**: Real-time via SSE
- **Props**:
  ```typescript
  interface KPIStripProps {
    metrics: KPIMetric[]
    timeRange: DateRange
    environment: 'development' | 'test' | 'production'
    refreshInterval?: number
  }
  ```

#### 2. Demand Forecast Widget
- **Purpose**: Show demand forecasts with confidence intervals
- **Size**: 4-8 columns (responsive)
- **Height**: 300px minimum
- **Data Sources**: `/api/forecast` endpoints
- **Refresh**: 5-minute intervals + job completion events
- **Props**:
  ```typescript
  interface ForecastWidgetProps {
    seriesId?: string[]
    horizon: number
    showModels: boolean
    scenarios: string[]
    onDrillDown: (filters: DrillDownFilters) => void
  }
  ```

#### 3. Stock Status Widget
- **Purpose**: Current vs optimal stock levels with recommendations
- **Size**: 4-6 columns
- **Height**: 350px minimum
- **Data Sources**: `/api/optimize/stock` endpoints
- **Refresh**: On optimization completion
- **Props**:
  ```typescript
  interface StockWidgetProps {
    productFilter?: string[]
    marketFilter?: string[]
    showReorderSuggestions: boolean
    riskThreshold: number
    onActionTaken: (action: StockAction) => void
  }
  ```

#### 4. Working Capital Meter Widget
- **Purpose**: Financial health indicators and cash flow status
- **Size**: 4-6 columns
- **Height**: 280px minimum
- **Data Sources**: `/api/working-capital` endpoints
- **Refresh**: Daily + on projection updates
- **Props**:
  ```typescript
  interface WorkingCapitalProps {
    currency: 'GBP' | 'EUR' | 'USD'
    timeHorizon: number
    showProjections: boolean
    alertsEnabled: boolean
    onBreachAlert: (alert: CashBreachAlert) => void
  }
  ```

#### 5. Capacity Utilization Widget
- **Purpose**: Production capacity monitoring and bottleneck identification
- **Size**: 4 columns
- **Height**: 250px minimum
- **Data Sources**: `/api/capacity` endpoints
- **Refresh**: 15-minute intervals
- **Props**:
  ```typescript
  interface CapacityWidgetProps {
    facilities: string[]
    utilizationThreshold: number
    showConstraints: boolean
    onConstraintClick: (constraint: Constraint) => void
  }
  ```

## Responsive Behavior

### Mobile (< 640px)
- Single column layout
- Widgets stack vertically
- KPI Strip collapses to accordion
- Chart interactions use touch gestures
- Sidebar becomes slide-over drawer

### Tablet (640px - 1024px)
- 2-column grid
- Widgets resize to fit available space
- Side navigation remains visible
- Touch-optimized controls

### Desktop (> 1024px)
- Full multi-column layout
- Hover states for interactive elements
- Keyboard navigation support
- Drag-and-drop enabled

## Widget Events

### Standard Events
All widgets emit these standard events:

```typescript
interface WidgetEvents {
  onLoad: (widgetId: string, loadTime: number) => void
  onError: (widgetId: string, error: Error) => void
  onResize: (widgetId: string, newSize: WidgetSize) => void
  onRefresh: (widgetId: string) => void
  onExport: (widgetId: string, format: ExportFormat) => void
}
```

### Widget-Specific Events

#### Forecast Widget
```typescript
interface ForecastEvents extends WidgetEvents {
  onModelToggle: (models: string[]) => void
  onScenarioChange: (scenario: string) => void
  onDrillDown: (filters: DrillDownFilters) => void
  onUseInOptimization: (forecastData: ForecastData) => void
}
```

#### Stock Widget
```typescript
interface StockEvents extends WidgetEvents {
  onReorderClick: (suggestions: ReorderSuggestion[]) => void
  onStockLevelChange: (changes: StockLevelChange[]) => void
  onABCClassFilter: (classes: string[]) => void
}
```

## Layout Persistence

### Saved Layouts Schema
```typescript
interface SavedLayout {
  id: string
  name: string
  userId: string
  role: UserRole
  isDefault: boolean
  layout: {
    widgets: LayoutWidget[]
    gridCols: number
    responsive: ResponsiveLayout
  }
  createdAt: Date
  updatedAt: Date
}

interface LayoutWidget {
  id: string
  type: WidgetType
  x: number
  y: number
  width: number
  height: number
  props: Record<string, any>
  visible: boolean
}
```

### Role-Based Defaults
- **Admin**: Full access to all widgets and customization
- **Manager**: Operational widgets + limited admin widgets
- **Operator**: Core operational widgets only
- **Viewer**: Read-only dashboard with essential KPIs

## Accessibility Features

### Keyboard Navigation
- Tab order follows logical flow (left-to-right, top-to-bottom)
- All interactive elements focusable
- Skip links for main content areas
- Keyboard shortcuts for common actions

### Screen Reader Support
- Semantic HTML structure
- ARIA labels and descriptions for charts
- Live regions for dynamic content updates
- Alternative text for data visualizations

### Visual Accessibility
- High contrast mode support
- Color-blind friendly palettes
- Scalable text (up to 200%)
- Focus indicators visible at 4.5:1 contrast ratio

## Performance Considerations

### Render Optimization
- Virtual scrolling for large data tables
- Memoized chart components
- Debounced resize handlers
- Intersection observer for off-screen widgets

### Data Loading
- Progressive data loading for large datasets
- Cached API responses with smart invalidation
- Optimistic updates for user interactions
- Background prefetching for likely drill-downs

## Theme Configuration

### Available Themes
1. **Light Theme** (default)
2. **Dark Theme**
3. **High Contrast**
4. **Company Brand** (custom colors)

### Theme Structure
```typescript
interface DashboardTheme {
  colors: {
    primary: string
    secondary: string
    success: string
    warning: string
    error: string
    background: string
    surface: string
    text: {
      primary: string
      secondary: string
      disabled: string
    }
  }
  typography: {
    fontFamily: string
    scale: TypographyScale
  }
  spacing: SpacingScale
  shadows: ShadowScale
}
```