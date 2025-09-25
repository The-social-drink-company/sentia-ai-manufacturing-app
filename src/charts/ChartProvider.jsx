import React, { createContext, useContext, useMemo } from 'react';
import { useTheme } from '../theming';

const ChartContext = createContext(null);

export const useChartTheme = () => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error('useChartTheme must be used within a ChartProvider');
  }
  return context;
};

// Manufacturing-focused color palettes
const MANUFACTURING_PALETTES = {
  production: [
    '#10b981', // Green - Active
    '#f59e0b', // Amber - Idle  
    '#ef4444', // Red - Down
    '#6b7280', // Gray - Maintenance
    '#3b82f6', // Blue - Setup
    '#8b5cf6', // Purple - Testing
  ],
  quality: [
    '#059669', // Dark green - Pass
    '#dc2626', // Red - Fail
    '#d97706', // Orange - Warning
    '#0ea5e9', // Cyan - In Progress
    '#7c3aed', // Violet - Review
  ],
  financial: [
    '#1e40af', // Navy - Revenue
    '#dc2626', // Red - Costs
    '#059669', // Green - Profit
    '#d97706', // Orange - Investment
    '#7c2d12', // Brown - Depreciation
    '#0891b2', // Teal - Cash Flow
  ],
  efficiency: [
    '#22c55e', // Green - High efficiency
    '#eab308', // Yellow - Medium efficiency  
    '#f97316', // Orange - Low efficiency
    '#ef4444', // Red - Critical
    '#6366f1', // Indigo - Target
  ],
  inventory: [
    '#10b981', // Green - In Stock
    '#f59e0b', // Amber - Low Stock
    '#ef4444', // Red - Out of Stock
    '#3b82f6', // Blue - On Order
    '#8b5cf6', // Purple - Reserved
    '#6b7280', // Gray - Discontinued
  ]
};

// Chart.js theme configurations
const getChartTheme = (resolvedTheme) => {
  const isDark = resolvedTheme === 'dark';
  
  return {
    // Global font settings
    font: {
      family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      size: 12,
      weight: '400'
    },
    
    // Color scheme
    colors: {
      primary: isDark ? '#3b82f6' : '#1e40af',
      secondary: isDark ? '#64748b' : '#475569',
      success: isDark ? '#10b981' : '#059669',
      warning: isDark ? '#f59e0b' : '#d97706',
      danger: isDark ? '#ef4444' : '#dc2626',
      info: isDark ? '#06b6d4' : '#0891b2',
      
      // Text colors
      textPrimary: isDark ? '#f1f5f9' : '#0f172a',
      textSecondary: isDark ? '#cbd5e1' : '#475569',
      textMuted: isDark ? '#64748b' : '#94a3b8',
      
      // Background colors
      background: isDark ? '#0f172a' : '#ffffff',
      backgroundSecondary: isDark ? '#1e293b' : '#f8fafc',
      
      // Grid and axis colors
      gridColor: isDark ? '#334155' : '#e2e8f0',
      axisColor: isDark ? '#475569' : '#cbd5e1',
      
      // Border colors
      borderColor: isDark ? '#475569' : '#d1d5db',
    },
    
    // Default Chart.js options
    defaultOptions: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: isDark ? '#cbd5e1' : '#475569',
            font: {
              family: "'Inter', sans-serif",
              size: 11,
              weight: '500'
            },
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          titleColor: isDark ? '#f1f5f9' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#475569',
          borderColor: isDark ? '#475569' : '#d1d5db',
          borderWidth: 1,
          cornerRadius: 8,
          titleFont: {
            family: "'Inter', sans-serif",
            size: 12,
            weight: '600'
          },
          bodyFont: {
            family: "'Inter', sans-serif",
            size: 11,
            weight: '400'
          },
          padding: 12,
          displayColors: true,
          boxPadding: 4
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: true,
            color: isDark ? '#334155' : '#f1f5f9',
            borderColor: isDark ? '#475569' : '#d1d5db',
          },
          ticks: {
            color: isDark ? '#94a3b8' : '#64748b',
            font: {
              family: "'Inter', sans-serif",
              size: 10,
              weight: '400'
            },
            padding: 8
          },
          title: {
            display: false,
            color: isDark ? '#cbd5e1' : '#475569',
            font: {
              family: "'Inter', sans-serif",
              size: 11,
              weight: '500'
            }
          }
        },
        y: {
          display: true,
          grid: {
            display: true,
            color: isDark ? '#334155' : '#f1f5f9',
            borderColor: isDark ? '#475569' : '#d1d5db',
          },
          ticks: {
            color: isDark ? '#94a3b8' : '#64748b',
            font: {
              family: "'Inter', sans-serif",
              size: 10,
              weight: '400'
            },
            padding: 8
          },
          title: {
            display: false,
            color: isDark ? '#cbd5e1' : '#475569',
            font: {
              family: "'Inter', sans-serif",
              size: 11,
              weight: '500'
            }
          }
        }
      },
      elements: {
        point: {
          radius: 4,
          hoverRadius: 6,
          borderWidth: 2,
          backgroundColor: isDark ? '#1e293b' : '#ffffff'
        },
        line: {
          borderWidth: 2,
          tension: 0.1,
          borderCapStyle: 'round',
          borderJoinStyle: 'round'
        },
        bar: {
          borderRadius: 4,
          borderSkipped: false,
          borderWidth: 0
        },
        arc: {
          borderWidth: 2,
          borderColor: isDark ? '#1e293b' : '#ffffff'
        }
      }
    }
  };
};

export const ChartProvider = ({ children }) => {
  const { resolvedTheme } = useTheme();
  
  const chartTheme = useMemo(() => getChartTheme(resolvedTheme), [resolvedTheme]);
  
  const contextValue = {
    theme: chartTheme,
    palettes: MANUFACTURING_PALETTES,
    resolvedTheme,
    
    // Helper functions
    getColorPalette: (type = 'production', count = 6) => {
      const palette = MANUFACTURING_PALETTES[type] || MANUFACTURING_PALETTES.production;
      return palette.slice(0, count);
    },
    
    getThemeColor: (colorName) => {
      return chartTheme.colors[colorName];
    },
    
    // Generate Chart.js options with theme
    getChartOptions: (customOptions = {}) => {
      return {
        ...chartTheme.defaultOptions,
        ...customOptions,
        plugins: {
          ...chartTheme.defaultOptions.plugins,
          ...customOptions.plugins
        },
        scales: {
          ...chartTheme.defaultOptions.scales,
          ...customOptions.scales
        }
      };
    },
    
    // Manufacturing-specific chart configurations
    getProductionChartConfig: () => ({
      colors: MANUFACTURING_PALETTES.production,
      options: {
        ...chartTheme.defaultOptions,
        plugins: {
          ...chartTheme.defaultOptions.plugins,
          title: {
            display: true,
            text: 'Production Status',
            color: chartTheme.colors.textPrimary,
            font: {
              family: "'Inter', sans-serif",
              size: 14,
              weight: '600'
            },
            padding: 20
          }
        }
      }
    }),
    
    getQualityChartConfig: () => ({
      colors: MANUFACTURING_PALETTES.quality,
      options: {
        ...chartTheme.defaultOptions,
        plugins: {
          ...chartTheme.defaultOptions.plugins,
          title: {
            display: true,
            text: 'Quality Metrics',
            color: chartTheme.colors.textPrimary,
            font: {
              family: "'Inter', sans-serif",
              size: 14,
              weight: '600'
            },
            padding: 20
          }
        }
      }
    }),
    
    getFinancialChartConfig: () => ({
      colors: MANUFACTURING_PALETTES.financial,
      options: {
        ...chartTheme.defaultOptions,
        plugins: {
          ...chartTheme.defaultOptions.plugins,
          title: {
            display: true,
            text: 'Financial Overview',
            color: chartTheme.colors.textPrimary,
            font: {
              family: "'Inter', sans-serif",
              size: 14,
              weight: '600'
            },
            padding: 20
          }
        },
        scales: {
          ...chartTheme.defaultOptions.scales,
          y: {
            ...chartTheme.defaultOptions.scales.y,
            ticks: {
              ...chartTheme.defaultOptions.scales.y.ticks,
              callback: function(value) {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(value);
              }
            }
          }
        }
      }
    })
  };
  
  return (
    <ChartContext.Provider value={contextValue}>
      {children}
    </ChartContext.Provider>
  );
};

export default ChartProvider;