// Global types for state management

export interface Market {
  id: string;
  code: string;
  name: string;
  country: string;
  currency: string;
  currencySymbol: string;
  flagEmoji: string;
  timezone: string;
  region: 'UK' | 'EU' | 'US' | 'ASIA' | 'OTHER';
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  currency: string;
  numberFormat: 'US' | 'EU' | 'UK';
  timezone: string;
  compactMode: boolean;
  animations: boolean;
  notifications: {
    desktop: boolean;
    email: boolean;
    push: boolean;
    sound: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
  };
}

export interface DashboardLayout {
  id: string;
  name: string;
  isDefault: boolean;
  layouts: {
    lg: Array<{
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
      minW?: number;
      minH?: number;
      maxW?: number;
      maxH?: number;
    }>;
    md: Array<{
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
      minW?: number;
      minH?: number;
      maxW?: number;
      maxH?: number;
    }>;
    sm: Array<{
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
      minW?: number;
      minH?: number;
      maxW?: number;
      maxH?: number;
    }>;
    xs: Array<{
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
      minW?: number;
      minH?: number;
      maxW?: number;
      maxH?: number;
    }>;
    xxs: Array<{
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
      minW?: number;
      minH?: number;
      maxW?: number;
      maxH?: number;
    }>;
  };
  widgets: {
    [key: string]: {
      visible: boolean;
      config: Record<string, any>;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterPreferences {
  dateRange: {
    start: Date | null;
    end: Date | null;
    preset: string | null;
  };
  markets: string[];
  categories: string[];
  status: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  pageSize: number;
  viewMode: 'table' | 'card' | 'list';
  groupBy: string | null;
  savedFilters: Array<{
    id: string;
    name: string;
    filters: Record<string, any>;
    createdAt: Date;
  }>;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  actions?: Array<{
    label: string;
    action: string;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
  persistent: boolean;
  autoClose: boolean;
  duration: number;
  timestamp: Date;
  read: boolean;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface WebSocketMessage {
  id: string;
  type: string;
  channel: string;
  data: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error';
  lastConnected: Date | null;
  lastDisconnected: Date | null;
  reconnectAttempts: number;
  latency: number | null;
  error: string | null;
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: Date;
  ttl: number;
  tags: string[];
  size: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  lastCleanup: Date;
}

// API Response Types
export interface APIResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: Date;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  requestId: string;
}

// Data Transformation Types
export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
  source: string;
}

export interface FormattingOptions {
  locale: string;
  currency: string;
  decimals: number;
  useGrouping: boolean;
  compact: boolean;
}

export interface AggregationOptions {
  groupBy: string | string[];
  aggregations: Array<{
    field: string;
    operation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median' | 'stddev';
    alias?: string;
  }>;
  filters?: Record<string, any>;
  sort?: Array<{
    field: string;
    order: 'asc' | 'desc';
  }>;
}

// Store State Types
export interface UserPreferencesState {
  preferences: UserPreferences;
  isLoading: boolean;
  lastSynced: Date | null;
  actions: {
    updatePreferences: (updates: Partial<UserPreferences>) => void;
    resetPreferences: () => void;
    syncPreferences: () => Promise<void>;
    exportPreferences: () => string;
    importPreferences: (data: string) => void;
  };
}

export interface MarketSelectionState {
  activeMarket: Market | null;
  availableMarkets: Market[];
  recentMarkets: Market[];
  favoriteMarkets: Market[];
  isLoading: boolean;
  error: string | null;
  actions: {
    selectMarket: (market: Market) => void;
    addToFavorites: (market: Market) => void;
    removeFromFavorites: (marketId: string) => void;
    clearRecentMarkets: () => void;
    refreshMarkets: () => Promise<void>;
  };
}

export interface DashboardLayoutState {
  currentLayout: DashboardLayout | null;
  savedLayouts: DashboardLayout[];
  isEditing: boolean;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
  actions: {
    setCurrentLayout: (layout: DashboardLayout) => void;
    updateLayout: (updates: Partial<DashboardLayout>) => void;
    saveLayout: (name: string) => Promise<void>;
    deleteLayout: (layoutId: string) => void;
    resetLayout: () => void;
    toggleEditMode: () => void;
    duplicateLayout: (layoutId: string, name: string) => void;
  };
}

export interface FilterPreferencesState {
  filters: FilterPreferences;
  isDirty: boolean;
  actions: {
    updateFilters: (updates: Partial<FilterPreferences>) => void;
    saveFilter: (name: string, filters: Record<string, any>) => void;
    loadFilter: (filterId: string) => void;
    deleteFilter: (filterId: string) => void;
    clearFilters: () => void;
    resetToDefaults: () => void;
  };
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  queue: Notification[];
  settings: {
    maxNotifications: number;
    defaultDuration: number;
    enableSound: boolean;
    enableDesktop: boolean;
  };
  actions: {
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    clearByCategory: (category: string) => void;
    updateSettings: (settings: Partial<NotificationState['settings']>) => void;
  };
}