// Border radius tokens for the Sentia Manufacturing Dashboard design system

export interface RadiusScale {
  none: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

export interface SemanticRadius {
  button: {
    sm: string;
    md: string;
    lg: string;
  };
  input: string;
  card: string;
  modal: string;
  tooltip: string;
  badge: string;
  avatar: string;
  chip: string;
}

// Base radius scale
export const radius: RadiusScale = {
  none: '0px',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px'
};

// Semantic radius assignments
export const semanticRadius: SemanticRadius = {
  button: {
    sm: radius.sm,    // 4px
    md: radius.md,    // 8px
    lg: radius.lg     // 12px
  },
  input: radius.md,      // 8px
  card: radius.lg,       // 12px
  modal: radius.xl,      // 16px
  tooltip: radius.md,    // 8px
  badge: radius.full,    // 9999px
  avatar: radius.full,   // 9999px
  chip: radius.full      // 9999px
};

// Dashboard-specific radius tokens
export interface DashboardRadius {
  widget: string;
  toolbar: string;
  sidebar: string;
  chart: string;
  notification: string;
  progressBar: string;
  statusIndicator: string;
  tab: {
    idle: string;
    active: string;
  };
}

export const dashboardRadius: DashboardRadius = {
  widget: radius.lg,           // 12px
  toolbar: radius.md,          // 8px
  sidebar: radius.none,        // 0px (typically full height)
  chart: radius.md,            // 8px
  notification: radius.lg,     // 12px
  progressBar: radius.full,    // 9999px
  statusIndicator: radius.full, // 9999px
  tab: {
    idle: radius.md,           // 8px
    active: radius.lg          // 12px
  }
};

// Component-specific radius variations
export interface ComponentRadius {
  form: {
    input: string;
    select: string;
    textarea: string;
    checkbox: string;
    radio: string;
    switch: string;
  };
  navigation: {
    navbar: string;
    breadcrumb: string;
    pagination: string;
    tab: string;
  };
  data: {
    table: string;
    tableCell: string;
    chart: string;
    metric: string;
  };
  feedback: {
    alert: string;
    toast: string;
    tooltip: string;
    popover: string;
  };
  overlay: {
    modal: string;
    drawer: string;
    dropdown: string;
  };
}

export const componentRadius: ComponentRadius = {
  form: {
    input: radius.md,        // 8px
    select: radius.md,       // 8px
    textarea: radius.md,     // 8px
    checkbox: radius.sm,     // 4px
    radio: radius.full,      // 9999px
    switch: radius.full      // 9999px
  },
  navigation: {
    navbar: radius.none,     // 0px
    breadcrumb: radius.sm,   // 4px
    pagination: radius.md,   // 8px
    tab: radius.lg          // 12px
  },
  data: {
    table: radius.lg,        // 12px
    tableCell: radius.none,  // 0px
    chart: radius.md,        // 8px
    metric: radius.lg        // 12px
  },
  feedback: {
    alert: radius.lg,        // 12px
    toast: radius.xl,        // 16px
    tooltip: radius.md,      // 8px
    popover: radius.lg       // 12px
  },
  overlay: {
    modal: radius['2xl'],    // 24px
    drawer: radius.none,     // 0px
    dropdown: radius.lg      // 12px
  }
};

// Responsive radius utilities
export interface ResponsiveRadius {
  mobile: string;
  tablet?: string;
  desktop: string;
}

export const responsiveRadius = {
  card: {
    mobile: radius.md,       // 8px
    desktop: radius.lg       // 12px
  },
  modal: {
    mobile: radius.lg,       // 12px
    desktop: radius.xl       // 16px
  },
  button: {
    mobile: radius.md,       // 8px
    desktop: radius.lg       // 12px
  }
};

// Generate CSS variables for radius
export const generateRadiusVariables = () => {
  const cssVariables: Record<string, string> = {};
  
  // Base radius scale
  Object.entries(radius).forEach(([key, value]) => {
    cssVariables[`--radius-${key}`] = value;
  });
  
  // Semantic radius
  Object.entries(semanticRadius).forEach(([key, value]) => {
    if (typeof value === 'string') {
      cssVariables[`--radius-${key}`] = value;
    } else {
      Object.entries(value).forEach(([subKey, subValue]) => {
        cssVariables[`--radius-${key}-${subKey}`] = subValue;
      });
    }
  });
  
  // Dashboard radius
  Object.entries(dashboardRadius).forEach(([key, value]) => {
    if (typeof value === 'string') {
      cssVariables[`--radius-dashboard-${key}`] = value;
    } else {
      Object.entries(value).forEach(([subKey, subValue]) => {
        cssVariables[`--radius-dashboard-${key}-${subKey}`] = subValue;
      });
    }
  });
  
  // Component radius
  Object.entries(componentRadius).forEach(([category, values]) => {
    Object.entries(values).forEach(([component, value]) => {
      cssVariables[`--radius-${category}-${component}`] = value;
    });
  });
  
  return cssVariables;
};

// Utility functions
export const getRadius = (size: keyof RadiusScale) => radius[size];

export const getSemanticRadius = (component: keyof SemanticRadius, variant?: string) => {
  const componentValue = semanticRadius[component];
  
  if (typeof componentValue === 'string') {
    return componentValue;
  }
  
  if (variant && typeof componentValue === 'object') {
    return (componentValue as any)[variant] || radius.md;
  }
  
  return radius.md;
};

export const getDashboardRadius = (component: keyof DashboardRadius, state?: string) => {
  const componentValue = dashboardRadius[component];
  
  if (typeof componentValue === 'string') {
    return componentValue;
  }
  
  if (state && typeof componentValue === 'object') {
    return (componentValue as any)[state] || radius.md;
  }
  
  return radius.md;
};

export const getComponentRadius = (category: keyof ComponentRadius, component: string) => {
  const categoryValues = componentRadius[category];
  return (categoryValues as any)[component] || radius.md;
};

// Border radius utility classes for CSS-in-JS
export const radiusUtilities = {
  rounded: (size: keyof RadiusScale) => ({
    borderRadius: radius[size]
  }),
  roundedTop: (size: keyof RadiusScale) => ({
    borderTopLeftRadius: radius[size],
    borderTopRightRadius: radius[size]
  }),
  roundedBottom: (size: keyof RadiusScale) => ({
    borderBottomLeftRadius: radius[size],
    borderBottomRightRadius: radius[size]
  }),
  roundedLeft: (size: keyof RadiusScale) => ({
    borderTopLeftRadius: radius[size],
    borderBottomLeftRadius: radius[size]
  }),
  roundedRight: (size: keyof RadiusScale) => ({
    borderTopRightRadius: radius[size],
    borderBottomRightRadius: radius[size]
  }),
  roundedTopLeft: (size: keyof RadiusScale) => ({
    borderTopLeftRadius: radius[size]
  }),
  roundedTopRight: (size: keyof RadiusScale) => ({
    borderTopRightRadius: radius[size]
  }),
  roundedBottomLeft: (size: keyof RadiusScale) => ({
    borderBottomLeftRadius: radius[size]
  }),
  roundedBottomRight: (size: keyof RadiusScale) => ({
    borderBottomRightRadius: radius[size]
  })
};

// Animation-ready radius tokens for smooth transitions
export const transitionRadius = {
  property: 'border-radius',
  duration: '150ms',
  timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
};

// Custom radius calculations for special cases
export const calculateRadius = {
  // Calculate radius for nested elements (typically 4px less than parent)
  nested: (parentRadius: string) => {
    const numericValue = parseInt(parentRadius);
    if (numericValue <= 4) return '0px';
    return `${numericValue - 4}px`;
  },
  
  // Calculate radius for pill-shaped elements
  pill: (height: string) => {
    return `calc(${height} / 2)`;
  },
  
  // Calculate responsive radius based on container size
  responsive: (baseRadius: string, containerWidth: number) => {
    const baseValue = parseInt(baseRadius);
    if (containerWidth < 640) return `${Math.max(baseValue - 4, 0)}px`;
    if (containerWidth > 1280) return `${baseValue + 4}px`;
    return baseRadius;
  }
};