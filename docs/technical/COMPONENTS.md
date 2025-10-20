# Component Library Documentation

## Overview
Comprehensive documentation for the CapLiquify Manufacturing Platform component library, including design system, reusable components, and usage guidelines.

## Table of Contents
- [Design System](#design-system)
- [Base Components](#base-components)
- [Layout Components](#layout-components)
- [Dashboard Components](#dashboard-components)
- [Form Components](#form-components)
- [Data Display Components](#data-display-components)
- [Navigation Components](#navigation-components)
- [Utility Components](#utility-components)
- [Hooks Library](#hooks-library)
- [Style Guide](#style-guide)

---

## Design System

### Color Palette

```css
/* Primary Colors */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;

/* Secondary Colors */
--secondary-50: #f8fafc;
--secondary-100: #f1f5f9;
--secondary-500: #64748b;
--secondary-600: #475569;
--secondary-700: #334155;

/* Status Colors */
--success-50: #f0fdf4;
--success-500: #22c55e;
--warning-50: #fffbeb;
--warning-500: #f59e0b;
--error-50: #fef2f2;
--error-500: #ef4444;

/* Neutral Colors */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-900: #111827;
```

### Typography Scale

```css
/* Font Families */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Font Sizes */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System

```css
/* Spacing Scale (rem) */
--space-0: 0;
--space-1: 0.25rem;     /* 4px */
--space-2: 0.5rem;      /* 8px */
--space-3: 0.75rem;     /* 12px */
--space-4: 1rem;        /* 16px */
--space-6: 1.5rem;      /* 24px */
--space-8: 2rem;        /* 32px */
--space-12: 3rem;       /* 48px */
--space-16: 4rem;       /* 64px */
```

### Border Radius

```css
--radius-sm: 0.125rem;   /* 2px */
--radius: 0.25rem;       /* 4px */
--radius-md: 0.375rem;   /* 6px */
--radius-lg: 0.5rem;     /* 8px */
--radius-xl: 0.75rem;    /* 12px */
--radius-full: 9999px;
```

---

## Base Components

### Button Component

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  onClick,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-primary-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <LoadingSpinner className="w-4 h-4 mr-2" />
      ) : (
        icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};
```

**Usage Examples:**
```jsx
// Basic usage
<Button onClick={() => console.log('clicked')}>
  Click me
</Button>

// With icon
<Button 
  variant="primary" 
  icon={<PlusIcon className="w-4 h-4" />}
  onClick={handleCreate}
>
  Create Order
</Button>

// Loading state
<Button loading disabled>
  Saving...
</Button>

// Destructive action
<Button variant="destructive" onClick={handleDelete}>
  Delete Item
</Button>
```

### Input Component

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helper, 
    leftIcon, 
    rightIcon, 
    fullWidth = false,
    className,
    id,
    ...props 
  }, ref) => {
    const inputId = id || useId();
    
    return (
      <div className={cn('space-y-2', fullWidth && 'w-full', className)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{leftIcon}</span>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500'
            )}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-gray-400">{rightIcon}</span>
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        
        {helper && !error && (
          <p className="text-sm text-gray-500">
            {helper}
          </p>
        )}
      </div>
    );
  }
);
```

### Badge Component

```typescript
interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  dot = false,
  children,
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-secondary-100 text-secondary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-800'
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  return (
    <span
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {dot && (
        <svg className="w-1.5 h-1.5 mr-1.5" fill="currentColor" viewBox="0 0 6 6">
          <circle cx="3" cy="3" r="3" />
        </svg>
      )}
      {children}
    </span>
  );
};
```

---

## Layout Components

### Header Component

```typescript
interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
  className
}) => {
  return (
    <div className={cn('border-b border-gray-200 pb-5', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            {breadcrumbs.map((crumb, index) => (
              <li key={index}>
                <div className="flex items-center">
                  {index > 0 && (
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 mr-4" />
                  )}
                  {crumb.href && !crumb.current ? (
                    <Link
                      to={crumb.href}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-medium',
                        crumb.current ? 'text-gray-900' : 'text-gray-500'
                      )}
                    >
                      {crumb.label}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
```

### Sidebar Component

```typescript
interface SidebarProps {
  navigation: NavigationItem[];
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
  badge?: string | number;
  children?: NavigationItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
  navigation,
  collapsed = false,
  onCollapse
}) => {
  return (
    <div
      className={cn(
        'flex flex-col bg-white border-r border-gray-200 transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <img className="w-8 h-8" src="/logo.svg" alt="Sentia" />
          {!collapsed && (
            <span className="ml-2 text-xl font-semibold text-gray-900">
              Sentia
            </span>
          )}
        </div>
        
        {onCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapse(!collapsed)}
            className="p-2"
          >
            {collapsed ? (
              <ChevronRightIcon className="w-4 h-4" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavigationLink
            key={item.name}
            item={item}
            collapsed={collapsed}
          />
        ))}
      </nav>
    </div>
  );
};

const NavigationLink: React.FC<{
  item: NavigationItem;
  collapsed: boolean;
}> = ({ item, collapsed }) => {
  const location = useLocation();
  const isCurrent = location.pathname === item.href;
  
  return (
    <Link
      to={item.href}
      className={cn(
        'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
        isCurrent
          ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <item.icon
        className={cn(
          'mr-3 w-5 h-5 flex-shrink-0',
          isCurrent ? 'text-primary-500' : 'text-gray-400'
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1">{item.name}</span>
          {item.badge && (
            <Badge variant="secondary" size="sm">
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );
};
```

---

## Dashboard Components

### Widget Container

```typescript
interface WidgetProps {
  id: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

const Widget: React.FC<WidgetProps> = ({
  id,
  title,
  subtitle,
  actions,
  loading = false,
  error,
  className,
  children
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden',
        className
      )}
      data-widget-id={id}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner className="w-6 h-6" />
          </div>
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          children
        )}
      </div>
    </div>
  );
};
```

### KPI Strip

```typescript
interface KPIMetric {
  id: string;
  label: string;
  value: string | number;
  change?: {
    value: number;
    direction: 'up' | 'down';
    period: string;
  };
  format?: 'currency' | 'percentage' | 'number';
  icon?: React.ReactNode;
}

interface KPIStripProps {
  metrics: KPIMetric[];
  className?: string;
}

const KPIStrip: React.FC<KPIStripProps> = ({ metrics, className }) => {
  const formatValue = (value: string | number, format?: string) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP'
        }).format(value);
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className={cn('grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="bg-white px-4 py-5 border border-gray-200 rounded-lg shadow-sm"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {metric.icon && (
                <div className="w-8 h-8 bg-primary-100 rounded-md flex items-center justify-center">
                  <span className="text-primary-600">{metric.icon}</span>
                </div>
              )}
            </div>
            
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {metric.label}
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {formatValue(metric.value, metric.format)}
                </dd>
              </dl>
            </div>
          </div>
          
          {metric.change && (
            <div className="mt-4 flex items-center">
              <span
                className={cn(
                  'inline-flex items-center text-sm font-medium',
                  metric.change.direction === 'up'
                    ? 'text-green-600'
                    : 'text-red-600'
                )}
              >
                {metric.change.direction === 'up' ? (
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 mr-1" />
                )}
                {Math.abs(metric.change.value)}%
              </span>
              <span className="ml-2 text-sm text-gray-500">
                vs {metric.change.period}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

### Chart Component

```typescript
interface ChartProps {
  type: 'line' | 'bar' | 'area' | 'pie' | 'donut';
  data: any[];
  config: ChartConfig;
  height?: number;
  responsive?: boolean;
  loading?: boolean;
  error?: string;
}

interface ChartConfig {
  xKey: string;
  yKey: string;
  color?: string;
  colors?: string[];
  legend?: boolean;
  grid?: boolean;
  tooltip?: boolean;
  animation?: boolean;
}

const Chart: React.FC<ChartProps> = ({
  type,
  data,
  config,
  height = 300,
  responsive = true,
  loading = false,
  error
}) => {
  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <LoadingSpinner className="w-6 h-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  const chartProps = {
    data,
    height,
    ...config
  };

  switch (type) {
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart {...chartProps}>
            {config.grid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={config.xKey} />
            <YAxis />
            {config.tooltip && <Tooltip />}
            {config.legend && <Legend />}
            <Line
              type="monotone"
              dataKey={config.yKey}
              stroke={config.color || '#3b82f6'}
              strokeWidth={2}
              dot={{ fill: config.color || '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      );

    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart {...chartProps}>
            {config.grid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={config.xKey} />
            <YAxis />
            {config.tooltip && <Tooltip />}
            {config.legend && <Legend />}
            <Bar
              dataKey={config.yKey}
              fill={config.color || '#3b82f6'}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey={config.yKey}
              nameKey={config.xKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill={config.color || '#3b82f6'}
              label
            />
            {config.tooltip && <Tooltip />}
            {config.legend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      );

    default:
      return <div>Unsupported chart type: {type}</div>;
  }
};
```

---

## Form Components

### Form Field

```typescript
interface FormFieldProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  children: React.ReactElement;
}

const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  description,
  required = false,
  children
}) => {
  const {
    formState: { errors },
    register
  } = useFormContext();

  const error = errors[name]?.message as string;
  const fieldId = `field-${name}`;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      
      {React.cloneElement(children, {
        id: fieldId,
        ...register(name, { required: required ? `${label || name} is required` : false }),
        error
      })}
    </div>
  );
};
```

### Select Component

```typescript
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  onSelectionChange?: (value: string | string[]) => void;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = 'Select option...',
  error,
  multiple = false,
  searchable = false,
  clearable = false,
  loading = false,
  onSelectionChange,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm) return options;
    
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm, searchable]);

  const handleOptionSelect = (option: SelectOption) => {
    let newSelection: string[];
    
    if (multiple) {
      if (selectedValues.includes(option.value)) {
        newSelection = selectedValues.filter(v => v !== option.value);
      } else {
        newSelection = [...selectedValues, option.value];
      }
    } else {
      newSelection = [option.value];
      setIsOpen(false);
    }
    
    setSelectedValues(newSelection);
    onSelectionChange?.(multiple ? newSelection : newSelection[0]);
  };

  return (
    <div className="relative">
      <Listbox value={selectedValues} onChange={setSelectedValues} multiple={multiple}>
        <div className="relative">
          <Listbox.Button
            className={cn(
              'relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500'
            )}
          >
            <span className="block truncate">
              {selectedValues.length === 0
                ? placeholder
                : selectedValues.map(value => 
                    options.find(opt => opt.value === value)?.label
                  ).join(', ')
              }
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {searchable && (
                <div className="px-3 py-2 border-b border-gray-200">
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
                  />
                </div>
              )}
              
              {loading ? (
                <div className="px-3 py-2 text-center">
                  <LoadingSpinner className="w-4 h-4 mx-auto" />
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-center text-gray-500">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={({ active }) =>
                      cn(
                        'relative cursor-default select-none py-2 pl-10 pr-4',
                        active ? 'bg-primary-100 text-primary-900' : 'text-gray-900',
                        option.disabled && 'opacity-50 cursor-not-allowed'
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={cn('block truncate', selected ? 'font-medium' : 'font-normal')}>
                          {option.label}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                            <CheckIcon className="h-5 w-5" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))
              )}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
```

---

## Data Display Components

### Table Component

```typescript
interface Column<T> {
  key: keyof T;
  title: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowSelection?: {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[]) => void;
  };
  sortConfig?: {
    key: keyof T;
    direction: 'asc' | 'desc';
  };
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  emptyState?: React.ReactNode;
  className?: string;
}

const Table = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  rowSelection,
  sortConfig,
  onSort,
  emptyState,
  className
}: TableProps<T>) => {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;

    const direction = sortConfig?.key === column.key && sortConfig.direction === 'asc' 
      ? 'desc' 
      : 'asc';
    
    onSort(column.key, direction);
  };

  const handleRowSelection = (rowKey: string, selected: boolean) => {
    const newSelection = selected
      ? [...selectedRows, rowKey]
      : selectedRows.filter(key => key !== rowKey);
    
    setSelectedRows(newSelection);
    rowSelection?.onChange(newSelection);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data.length && emptyState) {
    return <div>{emptyState}</div>;
  }

  return (
    <div className={cn('overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {rowSelection && (
                <th className="w-12 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length}
                    onChange={(e) => {
                      const allKeys = data.map((_, index) => index.toString());
                      setSelectedRows(e.target.checked ? allKeys : []);
                      rowSelection.onChange(e.target.checked ? allKeys : []);
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </th>
              )}
              
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer hover:bg-gray-100'
                  )}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <span className="text-gray-400">
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUpIcon className="w-4 h-4" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronUpDownIcon className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((record, index) => (
              <tr
                key={index}
                className={cn(
                  'hover:bg-gray-50',
                  selectedRows.includes(index.toString()) && 'bg-primary-50'
                )}
              >
                {rowSelection && (
                  <td className="w-12 px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(index.toString())}
                      onChange={(e) => handleRowSelection(index.toString(), e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </td>
                )}
                
                {columns.map((column) => (
                  <td key={column.key as string} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render
                      ? column.render(record[column.key], record, index)
                      : record[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="px-6 py-3 border-t border-gray-200">
          <Pagination {...pagination} />
        </div>
      )}
    </div>
  );
};
```

---

## Hooks Library

### useLocalStorage

```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}
```

### useDebounce

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### useAPI

```typescript
interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useAPI<T>(url: string, options?: RequestInit): APIState<T> & {
  refetch: () => void;
} {
  const [state, setState] = useState<APIState<T>>({
    data: null,
    loading: true,
    error: null
  });

  const { getToken } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const token = await getToken();
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options?.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setState({
        data: result.data,
        loading: false,
        error: null
      });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  }, [url, options, getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData
  };
}
```

This component library documentation provides a comprehensive guide to all reusable components, design patterns, and utility functions used throughout the CapLiquify Manufacturing Platform application.