// Spacing tokens for the Sentia Manufacturing Dashboard design system

export interface SpacingScale {
  px: string;
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
  14: string;
  16: string;
  20: string;
  24: string;
  28: string;
  32: string;
  36: string;
  40: string;
  44: string;
  48: string;
  52: string;
  56: string;
  60: string;
  64: string;
  72: string;
  80: string;
  96: string;
}

// Base spacing scale using 4px base unit
export const spacing: SpacingScale = {
  px: '1px',
  0: '0px',
  1: '4px',    // 0.25rem
  2: '8px',    // 0.5rem
  3: '12px',   // 0.75rem
  4: '16px',   // 1rem
  5: '20px',   // 1.25rem
  6: '24px',   // 1.5rem
  7: '28px',   // 1.75rem
  8: '32px',   // 2rem
  9: '36px',   // 2.25rem
  10: '40px',  // 2.5rem
  11: '44px',  // 2.75rem
  12: '48px',  // 3rem
  14: '56px',  // 3.5rem
  16: '64px',  // 4rem
  20: '80px',  // 5rem
  24: '96px',  // 6rem
  28: '112px', // 7rem
  32: '128px', // 8rem
  36: '144px', // 9rem
  40: '160px', // 10rem
  44: '176px', // 11rem
  48: '192px', // 12rem
  52: '208px', // 13rem
  56: '224px', // 14rem
  60: '240px', // 15rem
  64: '256px', // 16rem
  72: '288px', // 18rem
  80: '320px', // 20rem
  96: '384px'  // 24rem
};

// Semantic spacing tokens
export interface SemanticSpacing {
  component: {
    padding: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    margin: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    gap: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
  layout: {
    section: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    container: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
  interactive: {
    focus: string;
    border: string;
  };
}

export const semanticSpacing: SemanticSpacing = {
  component: {
    padding: {
      xs: spacing[2],  // 8px
      sm: spacing[3],  // 12px
      md: spacing[4],  // 16px
      lg: spacing[6],  // 24px
      xl: spacing[8]   // 32px
    },
    margin: {
      xs: spacing[2],  // 8px
      sm: spacing[4],  // 16px
      md: spacing[6],  // 24px
      lg: spacing[8],  // 32px
      xl: spacing[12]  // 48px
    },
    gap: {
      xs: spacing[1],  // 4px
      sm: spacing[2],  // 8px
      md: spacing[3],  // 12px
      lg: spacing[4],  // 16px
      xl: spacing[6]   // 24px
    }
  },
  layout: {
    section: {
      xs: spacing[8],  // 32px
      sm: spacing[12], // 48px
      md: spacing[16], // 64px
      lg: spacing[24], // 96px
      xl: spacing[32]  // 128px
    },
    container: {
      xs: spacing[4],  // 16px
      sm: spacing[6],  // 24px
      md: spacing[8],  // 32px
      lg: spacing[12], // 48px
      xl: spacing[16]  // 64px
    }
  },
  interactive: {
    focus: spacing[1],   // 4px focus ring offset
    border: spacing.px   // 1px border width
  }
};

// Dashboard-specific spacing presets
export interface DashboardSpacing {
  widget: {
    padding: string;
    gap: string;
    margin: string;
  };
  card: {
    padding: {
      compact: string;
      comfortable: string;
      spacious: string;
    };
    gap: string;
  };
  toolbar: {
    padding: string;
    gap: string;
    height: string;
  };
  sidebar: {
    width: {
      collapsed: string;
      expanded: string;
    };
    padding: string;
  };
  header: {
    height: string;
    padding: string;
  };
  grid: {
    gap: {
      tight: string;
      normal: string;
      loose: string;
    };
    padding: string;
  };
}

export const dashboardSpacing: DashboardSpacing = {
  widget: {
    padding: spacing[6],  // 24px
    gap: spacing[4],      // 16px
    margin: spacing[2]    // 8px
  },
  card: {
    padding: {
      compact: spacing[4],     // 16px
      comfortable: spacing[6], // 24px
      spacious: spacing[8]     // 32px
    },
    gap: spacing[4] // 16px
  },
  toolbar: {
    padding: spacing[4], // 16px
    gap: spacing[3],     // 12px
    height: spacing[14]  // 56px
  },
  sidebar: {
    width: {
      collapsed: spacing[16], // 64px
      expanded: spacing[64]   // 256px
    },
    padding: spacing[4] // 16px
  },
  header: {
    height: spacing[16], // 64px
    padding: spacing[6]  // 24px
  },
  grid: {
    gap: {
      tight: spacing[2],  // 8px
      normal: spacing[4], // 16px
      loose: spacing[6]   // 24px
    },
    padding: spacing[6] // 24px
  }
};

// Responsive spacing utilities
export interface ResponsiveSpacing {
  mobile: string;
  tablet?: string;
  desktop: string;
}

export const responsiveSpacing = {
  sectionPadding: {
    mobile: spacing[6],  // 24px
    tablet: spacing[8],  // 32px
    desktop: spacing[12] // 48px
  },
  containerPadding: {
    mobile: spacing[4],  // 16px
    tablet: spacing[6],  // 24px
    desktop: spacing[8]  // 32px
  },
  cardPadding: {
    mobile: spacing[4],  // 16px
    desktop: spacing[6]  // 24px
  },
  gridGap: {
    mobile: spacing[2],  // 8px
    tablet: spacing[3],  // 12px
    desktop: spacing[4]  // 16px
  }
};

// Generate CSS variables for spacing
export const generateSpacingVariables = () => {
  const cssVariables: Record<string, string> = {};
  
  // Base spacing scale
  Object.entries(spacing).forEach(([key, value]) => {
    cssVariables[`--spacing-${key}`] = value;
  });
  
  // Semantic spacing
  Object.entries(semanticSpacing).forEach(([category, subcategories]) => {
    Object.entries(subcategories).forEach(([subcategory, values]) => {
      if (typeof values === 'string') {
        cssVariables[`--spacing-${category}-${subcategory}`] = values;
      } else {
        Object.entries(values).forEach(([size, value]) => {
          cssVariables[`--spacing-${category}-${subcategory}-${size}`] = value;
        });
      }
    });
  });
  
  // Dashboard spacing
  Object.entries(dashboardSpacing).forEach(([component, values]) => {
    Object.entries(values).forEach(([property, value]) => {
      if (typeof value === 'string') {
        cssVariables[`--spacing-dashboard-${component}-${property}`] = value;
      } else {
        Object.entries(value).forEach(([size, sizeValue]) => {
          cssVariables[`--spacing-dashboard-${component}-${property}-${size}`] = sizeValue;
        });
      }
    });
  });
  
  return cssVariables;
};

// Utility functions
export const getSpacing = (value: keyof SpacingScale) => spacing[value];

export const getSemanticSpacing = (category: keyof SemanticSpacing, subcategory: string, size?: string) => {
  const categoryValues = semanticSpacing[category];
  if (!categoryValues) return spacing[0];
  
  const subcategoryValues = (categoryValues as any)[subcategory];
  if (!subcategoryValues) return spacing[0];
  
  if (size && typeof subcategoryValues === 'object') {
    return subcategoryValues[size] || spacing[0];
  }
  
  return subcategoryValues;
};

export const getDashboardSpacing = (component: keyof DashboardSpacing, property: string, size?: string) => {
  const componentValues = dashboardSpacing[component];
  if (!componentValues) return spacing[0];
  
  const propertyValue = (componentValues as any)[property];
  if (!propertyValue) return spacing[0];
  
  if (size && typeof propertyValue === 'object') {
    return propertyValue[size] || spacing[0];
  }
  
  return propertyValue;
};