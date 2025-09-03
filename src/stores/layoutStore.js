import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const DEFAULT_LAYOUTS = {
  admin: {
    lg: [
      { i: 'kpi-strip', x: 0, y: 0, w: 12, h: 2, minH: 2, maxH: 2 },
      { i: 'working-capital', x: 0, y: 2, w: 4, h: 6, minH: 4 },
      { i: 'demand-forecast', x: 4, y: 2, w: 4, h: 6, minH: 4 },
      { i: 'stock-status', x: 8, y: 2, w: 4, h: 6, minH: 4 },
      { i: 'capacity-util', x: 0, y: 8, w: 4, h: 4, minH: 3 },
      { i: 'recent-jobs', x: 4, y: 8, w: 4, h: 4, minH: 3 },
      { i: 'system-health', x: 8, y: 8, w: 4, h: 4, minH: 3 }
    ],
    md: [
      { i: 'kpi-strip', x: 0, y: 0, w: 8, h: 2, minH: 2, maxH: 2 },
      { i: 'working-capital', x: 0, y: 2, w: 4, h: 6, minH: 4 },
      { i: 'demand-forecast', x: 4, y: 2, w: 4, h: 6, minH: 4 },
      { i: 'stock-status', x: 0, y: 8, w: 4, h: 6, minH: 4 },
      { i: 'capacity-util', x: 4, y: 8, w: 4, h: 4, minH: 3 },
      { i: 'recent-jobs', x: 0, y: 14, w: 4, h: 4, minH: 3 },
      { i: 'system-health', x: 4, y: 12, w: 4, h: 4, minH: 3 }
    ],
    sm: [
      { i: 'kpi-strip', x: 0, y: 0, w: 4, h: 3, minH: 3 },
      { i: 'working-capital', x: 0, y: 3, w: 4, h: 8, minH: 6 },
      { i: 'demand-forecast', x: 0, y: 11, w: 4, h: 8, minH: 6 },
      { i: 'stock-status', x: 0, y: 19, w: 4, h: 8, minH: 6 },
      { i: 'capacity-util', x: 0, y: 27, w: 4, h: 6, minH: 4 },
      { i: 'recent-jobs', x: 0, y: 33, w: 4, h: 6, minH: 4 },
      { i: 'system-health', x: 0, y: 39, w: 4, h: 6, minH: 4 }
    ]
  },
  manager: {
    lg: [
      { i: 'kpi-strip', x: 0, y: 0, w: 12, h: 2, minH: 2, maxH: 2 },
      { i: 'demand-forecast', x: 0, y: 2, w: 8, h: 6, minH: 4 },
      { i: 'control-panel', x: 8, y: 2, w: 4, h: 6, minH: 4 },
      { i: 'stock-status', x: 0, y: 8, w: 6, h: 5, minH: 4 },
      { i: 'capacity-util', x: 6, y: 8, w: 6, h: 5, minH: 4 }
    ],
    md: [
      { i: 'kpi-strip', x: 0, y: 0, w: 8, h: 2, minH: 2, maxH: 2 },
      { i: 'demand-forecast', x: 0, y: 2, w: 8, h: 6, minH: 4 },
      { i: 'control-panel', x: 0, y: 8, w: 4, h: 6, minH: 4 },
      { i: 'stock-status', x: 4, y: 8, w: 4, h: 6, minH: 4 },
      { i: 'capacity-util', x: 0, y: 14, w: 8, h: 4, minH: 3 }
    ],
    sm: [
      { i: 'kpi-strip', x: 0, y: 0, w: 4, h: 3, minH: 3 },
      { i: 'demand-forecast', x: 0, y: 3, w: 4, h: 8, minH: 6 },
      { i: 'control-panel', x: 0, y: 11, w: 4, h: 6, minH: 4 },
      { i: 'stock-status', x: 0, y: 17, w: 4, h: 8, minH: 6 },
      { i: 'capacity-util', x: 0, y: 25, w: 4, h: 6, minH: 4 }
    ]
  },
  operator: {
    lg: [
      { i: 'kpi-strip', x: 0, y: 0, w: 12, h: 2, minH: 2, maxH: 2 },
      { i: 'stock-status', x: 0, y: 2, w: 6, h: 6, minH: 4 },
      { i: 'capacity-util', x: 6, y: 2, w: 6, h: 6, minH: 4 },
      { i: 'recent-jobs', x: 0, y: 8, w: 12, h: 4, minH: 3 }
    ],
    md: [
      { i: 'kpi-strip', x: 0, y: 0, w: 8, h: 2, minH: 2, maxH: 2 },
      { i: 'stock-status', x: 0, y: 2, w: 8, h: 6, minH: 4 },
      { i: 'capacity-util', x: 0, y: 8, w: 8, h: 6, minH: 4 },
      { i: 'recent-jobs', x: 0, y: 14, w: 8, h: 4, minH: 3 }
    ],
    sm: [
      { i: 'kpi-strip', x: 0, y: 0, w: 4, h: 3, minH: 3 },
      { i: 'stock-status', x: 0, y: 3, w: 4, h: 8, minH: 6 },
      { i: 'capacity-util', x: 0, y: 11, w: 4, h: 6, minH: 4 },
      { i: 'recent-jobs', x: 0, y: 17, w: 4, h: 6, minH: 4 }
    ]
  },
  viewer: {
    lg: [
      { i: 'kpi-strip', x: 0, y: 0, w: 12, h: 2, minH: 2, maxH: 2 },
      { i: 'demand-forecast', x: 0, y: 2, w: 6, h: 8, minH: 6 },
      { i: 'stock-status', x: 6, y: 2, w: 6, h: 8, minH: 6 }
    ],
    md: [
      { i: 'kpi-strip', x: 0, y: 0, w: 8, h: 2, minH: 2, maxH: 2 },
      { i: 'demand-forecast', x: 0, y: 2, w: 8, h: 8, minH: 6 },
      { i: 'stock-status', x: 0, y: 10, w: 8, h: 8, minH: 6 }
    ],
    sm: [
      { i: 'kpi-strip', x: 0, y: 0, w: 4, h: 3, minH: 3 },
      { i: 'demand-forecast', x: 0, y: 3, w: 4, h: 8, minH: 6 },
      { i: 'stock-status', x: 0, y: 11, w: 4, h: 8, minH: 6 }
    ]
  }
}

const WIDGET_PERMISSIONS = {
  admin: ['kpi-strip', 'working-capital', 'demand-forecast', 'stock-status', 'capacity-util', 'recent-jobs', 'system-health', 'control-panel'],
  manager: ['kpi-strip', 'demand-forecast', 'stock-status', 'capacity-util', 'recent-jobs', 'control-panel'],
  operator: ['kpi-strip', 'stock-status', 'capacity-util', 'recent-jobs'],
  viewer: ['kpi-strip', 'demand-forecast', 'stock-status']
}

export const useLayoutStore = create(
  persist(
    (set, get) => ({
      // Layout state
      currentLayout: {},
      savedLayouts: {},
      currentBreakpoint: 'lg',
      isEditing: false,
      
      // Theme and preferences
      theme: 'light',
      sidebarCollapsed: false,
      gridSnap: true,
      
      // Widget visibility and permissions
      visibleWidgets: [],
      widgetSettings: {},
      
      // Actions
      setLayout: (breakpoint, layout) => set((state) => ({
        currentLayout: {
          ...state.currentLayout,
          [breakpoint]: layout
        }
      })),
      
      saveLayout: (name, layout, role) => set((state) => ({
        savedLayouts: {
          ...state.savedLayouts,
          [`${role}_${name}`]: {
            name,
            role,
            layout,
            createdAt: new Date().toISOString(),
            isDefault: false
          }
        }
      })),
      
      loadLayout: (layoutKey) => {
        const state = get()
        const savedLayout = state.savedLayouts[layoutKey]
        if (savedLayout) {
          set({ currentLayout: savedLayout.layout })
        }
      },
      
      deleteLayout: (layoutKey) => set((state) => {
        const newSavedLayouts = { ...state.savedLayouts }
        delete newSavedLayouts[layoutKey]
        return { savedLayouts: newSavedLayouts }
      }),
      
      setBreakpoint: (breakpoint) => set({ currentBreakpoint: breakpoint }),
      
      setEditing: (isEditing) => set({ isEditing }),
      
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),
      
      setTheme: (theme) => set({ theme }),
      
      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
      })),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      toggleGridSnap: () => set((state) => ({
        gridSnap: !state.gridSnap
      })),
      
      initializeLayout: (userRole) => {
        const state = get()
        const defaultLayout = DEFAULT_LAYOUTS[userRole] || DEFAULT_LAYOUTS.viewer
        const visibleWidgets = WIDGET_PERMISSIONS[userRole] || WIDGET_PERMISSIONS.viewer
        
        set({
          currentLayout: defaultLayout,
          visibleWidgets,
          widgetSettings: visibleWidgets.reduce((acc, widget) => ({
            ...acc,
            [widget]: { visible: true, minimized: false }
          }), {})
        })
      },
      
      updateWidgetSettings: (widgetId, settings) => set((state) => ({
        widgetSettings: {
          ...state.widgetSettings,
          [widgetId]: {
            ...state.widgetSettings[widgetId],
            ...settings
          }
        }
      })),
      
      toggleWidgetVisibility: (widgetId) => set((state) => ({
        widgetSettings: {
          ...state.widgetSettings,
          [widgetId]: {
            ...state.widgetSettings[widgetId],
            visible: !state.widgetSettings[widgetId]?.visible
          }
        }
      })),
      
      resetLayout: (userRole) => {
        const defaultLayout = DEFAULT_LAYOUTS[userRole] || DEFAULT_LAYOUTS.viewer
        const visibleWidgets = WIDGET_PERMISSIONS[userRole] || WIDGET_PERMISSIONS.viewer
        
        set({
          currentLayout: defaultLayout,
          visibleWidgets,
          widgetSettings: visibleWidgets.reduce((acc, widget) => ({
            ...acc,
            [widget]: { visible: true, minimized: false }
          }), {}),
          isEditing: false
        })
      },
      
      // Keyboard shortcut state
      shortcutsEnabled: true,
      toggleShortcuts: () => set((state) => ({
        shortcutsEnabled: !state.shortcutsEnabled
      })),
      
      // Export and sharing
      generateShareableLayout: () => {
        const state = get()
        return {
          layout: state.currentLayout,
          theme: state.theme,
          widgetSettings: state.widgetSettings,
          timestamp: new Date().toISOString()
        }
      },
      
      importLayout: (layoutData) => {
        set({
          currentLayout: layoutData.layout,
          theme: layoutData.theme || 'light',
          widgetSettings: layoutData.widgetSettings || {}
        })
      }
    }),
    {
      name: 'sentia-dashboard-layout',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        savedLayouts: state.savedLayouts,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        gridSnap: state.gridSnap,
        widgetSettings: state.widgetSettings,
        shortcutsEnabled: state.shortcutsEnabled
      })
    }
  )
)