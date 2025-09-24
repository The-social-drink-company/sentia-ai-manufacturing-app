// Dashboard layout configuration store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { DashboardLayout, DashboardLayoutState } from './types';
import { nanoid } from 'nanoid';

// Default layout configuration
const createDefaultLayout = (): DashboardLayout => ({
  id: 'default',
  name: 'Default Layout',
  isDefault: true,
  layouts: {
    lg: [
      { i: 'kpi-overview', x: 0, y: 0, w: 12, h: 2 },
      { i: 'revenue-chart', x: 0, y: 2, w: 8, h: 4 },
      { i: 'market-summary', x: 8, y: 2, w: 4, h: 4 },
      { i: 'recent-activity', x: 0, y: 6, w: 6, h: 3 },
      { i: 'performance-metrics', x: 6, y: 6, w: 6, h: 3 },
    ],
    md: [
      { i: 'kpi-overview', x: 0, y: 0, w: 10, h: 2 },
      { i: 'revenue-chart', x: 0, y: 2, w: 10, h: 4 },
      { i: 'market-summary', x: 0, y: 6, w: 5, h: 4 },
      { i: 'recent-activity', x: 5, y: 6, w: 5, h: 4 },
      { i: 'performance-metrics', x: 0, y: 10, w: 10, h: 3 },
    ],
    sm: [
      { i: 'kpi-overview', x: 0, y: 0, w: 6, h: 2 },
      { i: 'revenue-chart', x: 0, y: 2, w: 6, h: 4 },
      { i: 'market-summary', x: 0, y: 6, w: 6, h: 3 },
      { i: 'recent-activity', x: 0, y: 9, w: 6, h: 3 },
      { i: 'performance-metrics', x: 0, y: 12, w: 6, h: 3 },
    ],
    xs: [
      { i: 'kpi-overview', x: 0, y: 0, w: 4, h: 2 },
      { i: 'revenue-chart', x: 0, y: 2, w: 4, h: 4 },
      { i: 'market-summary', x: 0, y: 6, w: 4, h: 3 },
      { i: 'recent-activity', x: 0, y: 9, w: 4, h: 3 },
      { i: 'performance-metrics', x: 0, y: 12, w: 4, h: 3 },
    ],
    xxs: [
      { i: 'kpi-overview', x: 0, y: 0, w: 2, h: 2 },
      { i: 'revenue-chart', x: 0, y: 2, w: 2, h: 4 },
      { i: 'market-summary', x: 0, y: 6, w: 2, h: 3 },
      { i: 'recent-activity', x: 0, y: 9, w: 2, h: 3 },
      { i: 'performance-metrics', x: 0, y: 12, w: 2, h: 3 },
    ],
  },
  widgets: {
    'kpi-overview': { visible: true, config: { showTrend: true, showComparison: true } },
    'revenue-chart': { visible: true, config: { chartType: 'line', period: '30d' } },
    'market-summary': { visible: true, config: { showPrices: true, showVolume: true } },
    'recent-activity': { visible: true, config: { maxItems: 10, showTimestamp: true } },
    'performance-metrics': { visible: true, config: { showTargets: true, showProgress: true } },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

interface DashboardLayoutStore extends DashboardLayoutState {}

export const useDashboardLayoutStore = create<DashboardLayoutStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        currentLayout: createDefaultLayout(),
        savedLayouts: [createDefaultLayout()],
        isEditing: false,
        isDirty: false,
        isLoading: false,
        error: null,

        actions: {
          setCurrentLayout: (layout: DashboardLayout) => {
            set((state) => {
              state.currentLayout = { ...layout };
              state.isDirty = false;
              state.error = null;
            });
          },

          updateLayout: (updates: Partial<DashboardLayout>) => {
            set((state) => {
              if (state.currentLayout) {
                state.currentLayout = {
                  ...state.currentLayout,
                  ...updates,
                  updatedAt: new Date(),
                };
                state.isDirty = true;
                state.error = null;
              }
            });
          },

          saveLayout: async (name: string) => {
            const { currentLayout, savedLayouts } = get();
            
            if (!currentLayout) {
              throw new Error('No current layout to save');
            }

            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const layoutToSave: DashboardLayout = {
                ...currentLayout,
                id: currentLayout.id === 'default' ? nanoid() : currentLayout.id,
                name,
                isDefault: false,
                updatedAt: new Date(),
              };

              // In a real app, this would save to the server
              await new Promise(resolve => setTimeout(resolve, 500));

              set((state) => {
                // Remove existing layout with same ID
                state.savedLayouts = state.savedLayouts.filter(
                  layout => layout.id !== layoutToSave.id
                );
                
                // Add the new/updated layout
                state.savedLayouts.push(layoutToSave);
                
                // Update current layout
                state.currentLayout = layoutToSave;
                state.isDirty = false;
                state.isLoading = false;
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to save layout';
                state.isLoading = false;
              });
              throw error;
            }
          },

          deleteLayout: (layoutId: string) => {
            set((state) => {
              if (layoutId === 'default') {
                state.error = 'Cannot delete default layout';
                return;
              }

              state.savedLayouts = state.savedLayouts.filter(
                layout => layout.id !== layoutId
              );

              // If we're deleting the current layout, switch to default
              if (state.currentLayout?.id === layoutId) {
                state.currentLayout = state.savedLayouts.find(l => l.isDefault) || createDefaultLayout();
                state.isDirty = false;
              }

              state.error = null;
            });
          },

          resetLayout: () => {
            set((state) => {
              state.currentLayout = createDefaultLayout();
              state.isDirty = false;
              state.error = null;
            });
          },

          toggleEditMode: () => {
            set((state) => {
              state.isEditing = !state.isEditing;
            });
          },

          duplicateLayout: (layoutId: string, name: string) => {
            set((state) => {
              const sourceLayout = state.savedLayouts.find(l => l.id === layoutId);
              
              if (!sourceLayout) {
                state.error = 'Layout not found';
                return;
              }

              const duplicatedLayout: DashboardLayout = {
                ...sourceLayout,
                id: nanoid(),
                name,
                isDefault: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              state.savedLayouts.push(duplicatedLayout);
              state.error = null;
            });
          },
        },
      })),
      {
        name: 'sentia-dashboard-layout',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          currentLayout: state.currentLayout,
          savedLayouts: state.savedLayouts,
        }),
      }
    )
  )
);

// Convenience hooks
export const useCurrentLayout = () => {
  return useDashboardLayoutStore((state) => state.currentLayout);
};

export const useSavedLayouts = () => {
  return useDashboardLayoutStore((state) => state.savedLayouts);
};

export const useLayoutActions = () => {
  return useDashboardLayoutStore((state) => state.actions);
};

export const useEditMode = () => {
  return useDashboardLayoutStore((state) => ({
    isEditing: state.isEditing,
    isDirty: state.isDirty,
    toggleEditMode: state.actions.toggleEditMode,
  }));
};

export const useLayoutStatus = () => {
  return useDashboardLayoutStore((state) => ({
    isLoading: state.isLoading,
    error: state.error,
    isDirty: state.isDirty,
  }));
};

// Widget management utilities
export const useWidgetConfig = (widgetId: string) => {
  return useDashboardLayoutStore((state) => {
    const widget = state.currentLayout?.widgets[widgetId];
    return {
      visible: widget?.visible ?? false,
      config: widget?.config ?? {},
      updateWidget: (updates: { visible?: boolean; config?: Record<string, any> }) => {
        state.actions.updateLayout({
          widgets: {
            ...state.currentLayout?.widgets,
            [widgetId]: {
              visible: updates.visible ?? widget?.visible ?? true,
              config: { ...widget?.config, ...updates.config },
            },
          },
        });
      },
    };
  });
};

// Layout validation utilities
export const validateLayout = (layout: Partial<DashboardLayout>): string[] => {
  const errors: string[] = [];

  if (!layout.name || layout.name.trim().length === 0) {
    errors.push('Layout name is required');
  }

  if (layout.name && layout.name.length > 50) {
    errors.push('Layout name must be less than 50 characters');
  }

  if (!layout.layouts) {
    errors.push('Layout configuration is required');
  }

  if (layout.layouts) {
    const requiredBreakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
    for (const breakpoint of requiredBreakpoints) {
      if (!layout.layouts[breakpoint as keyof typeof layout.layouts]) {
        errors.push(`Layout for ${breakpoint} breakpoint is required`);
      }
    }
  }

  if (!layout.widgets) {
    errors.push('Widget configuration is required');
  }

  return errors;
};

// Layout comparison utilities
export const compareLayouts = (layout1: DashboardLayout, layout2: DashboardLayout): boolean => {
  // Compare layouts ignoring timestamps
  const { createdAt: c1, updatedAt: u1, ...rest1 } = layout1;
  const { createdAt: c2, updatedAt: u2, ...rest2 } = layout2;
  
  return JSON.stringify(rest1) === JSON.stringify(rest2);
};

// Layout export/import utilities
export const exportLayout = (layout: DashboardLayout): string => {
  return JSON.stringify({
    ...layout,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  }, null, 2);
};

export const importLayout = (data: string): DashboardLayout => {
  try {
    const parsed = JSON.parse(data);
    
    if (!parsed.version || parsed.version !== '1.0') {
      throw new Error('Unsupported layout version');
    }

    const { exportedAt, version, ...layout } = parsed;

    // Validate the imported layout
    const errors = validateLayout(layout);
    if (errors.length > 0) {
      throw new Error(`Invalid layout: ${errors.join(', ')}`);
    }

    return {
      ...layout,
      id: nanoid(), // Generate new ID for imported layout
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    throw new Error(`Failed to import layout: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};