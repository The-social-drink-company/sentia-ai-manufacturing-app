// React hooks for WebSocket integration

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getWebSocketManager, type WebSocketManager } from '../lib/websocket';
import { queryKeys, invalidateQueries } from '../lib/queryClient';
import { useNotificationStore } from '../stores/notificationStore';
import { createNotification } from '../stores/notificationStore';
import type { WebSocketMessage, ConnectionState } from '../stores/types';

// WebSocket hook options
interface UseWebSocketOptions {
  url?: string;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

// Main WebSocket hook
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastConnected: null,
    lastDisconnected: null,
    reconnectAttempts: 0,
    latency: null,
    error: null,
  });

  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const queryClient = useQueryClient();

  // Initialize WebSocket manager
  useEffect(() => {
    if (!options.enabled && options.enabled !== undefined) {
      return;
    }

    const wsManager = getWebSocketManager({
      url: options.url,
      reconnectInterval: options.reconnectInterval,
      maxReconnectAttempts: options.maxReconnectAttempts,
    });

    wsManagerRef.current = wsManager;

    // Set up event listeners
    const handleConnectionStateChange = (state: ConnectionState) => {
      setConnectionState(state);
    };

    const handleConnect = () => {
      console.log('WebSocket connected');
      options.onConnect?.();
    };

    const handleDisconnect = () => {
      console.log('WebSocket disconnected');
      options.onDisconnect?.();
    };

    const handleError = (error: any) => {
      console.error('WebSocket error:', error);
      options.onError?.(error);
    };

    const handleMessage = (message: WebSocketMessage) => {
      options.onMessage?.(message);
    };

    // Register listeners
    wsManager.on('connectionStateChanged', handleConnectionStateChange);
    wsManager.on('connected', handleConnect);
    wsManager.on('disconnected', handleDisconnect);
    wsManager.on('error', handleError);
    wsManager.on('message', handleMessage);

    // Connect
    wsManager.connect().catch(error => {
      console.error('Failed to connect WebSocket:', error);
    });

    // Cleanup
    return () => {
      wsManager.off('connectionStateChanged', handleConnectionStateChange);
      wsManager.off('connected', handleConnect);
      wsManager.off('disconnected', handleDisconnect);
      wsManager.off('error', handleError);
      wsManager.off('message', handleMessage);
    };
  }, [options.enabled, options.url]);

  // Send message
  const sendMessage = useCallback((type: string, channel: string, data: any, priority = 'medium' as const) => {
    if (wsManagerRef.current) {
      return wsManagerRef.current.send(type, channel, data, priority);
    }
    return Promise.reject(new Error('WebSocket not connected'));
  }, []);

  // Subscribe to channel
  const subscribe = useCallback((
    channel: string,
    callback: (message: WebSocketMessage) => void,
    subscribeOptions?: {
      filter?: (message: WebSocketMessage) => boolean;
      priority?: 'low' | 'medium' | 'high' | 'critical';
    }
  ) => {
    if (wsManagerRef.current) {
      return wsManagerRef.current.subscribe(channel, callback, subscribeOptions);
    }
    return '';
  }, []);

  // Unsubscribe from channel
  const unsubscribe = useCallback((subscriptionId: string) => {
    if (wsManagerRef.current) {
      wsManagerRef.current.unsubscribe(subscriptionId);
    }
  }, []);

  return {
    connectionState,
    sendMessage,
    subscribe,
    unsubscribe,
    isConnected: connectionState.status === 'connected',
    isConnecting: connectionState.status === 'connecting',
    isDisconnected: connectionState.status === 'disconnected',
    subscriptionCount: wsManagerRef.current?.getSubscriptionCount() || 0,
    queueStatus: wsManagerRef.current?.getQueueStatus() || { length: 0, size: 0 },
  };
}

// Market data subscription hook
export function useMarketDataSubscription(marketIds: string[] = [], enabled: boolean = true) {
  const subscriptionIds = useRef<string[]>([]);
  const queryClient = useQueryClient();
  
  const { subscribe, unsubscribe, isConnected } = useWebSocket({
    enabled,
    onConnect: () => {
      // Invalidate market data queries when reconnecting
      invalidateQueries.markets();
    },
  });

  useEffect(() => {
    if (!enabled || !isConnected || marketIds.length === 0) {
      return;
    }

    // Subscribe to market price updates
    const priceSubscriptionId = subscribe(
      'market-prices',
      (message: WebSocketMessage) => {
        const { marketId, price, change, volume } = message.data;
        
        // Update React Query cache
        queryClient.setQueriesData(
          { queryKey: queryKeys.markets.prices(marketId) },
          (oldData: any) => {
            if (!oldData) return oldData;
            
            return {
              ...oldData,
              currentPrice: price,
              change: change,
              volume: volume,
              lastUpdated: new Date(message.timestamp),
            };
          }
        );

        // Invalidate related queries
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.markets.status(marketId) 
        });
      },
      {
        filter: (message) => marketIds.includes(message.data.marketId),
        priority: 'high',
      }
    );

    // Subscribe to market status updates
    const statusSubscriptionId = subscribe(
      'market-status',
      (message: WebSocketMessage) => {
        const { marketId, status, nextSession } = message.data;
        
        // Update React Query cache
        queryClient.setQueriesData(
          { queryKey: queryKeys.markets.status(marketId) },
          (oldData: any) => ({
            ...oldData,
            isOpen: status === 'open',
            status,
            nextSession,
            lastUpdated: new Date(message.timestamp),
          })
        );
      },
      {
        filter: (message) => marketIds.includes(message.data.marketId),
        priority: 'medium',
      }
    );

    subscriptionIds.current = [priceSubscriptionId, statusSubscriptionId];

    // Send subscription requests to server
    marketIds.forEach(marketId => {
      subscribe(`market-${marketId}`, () => {}, { priority: 'high' });
    });

    return () => {
      subscriptionIds.current.forEach(id => unsubscribe(id));
      subscriptionIds.current = [];
    };
  }, [marketIds, enabled, isConnected, subscribe, unsubscribe, queryClient]);

  return {
    isSubscribed: subscriptionIds.current.length > 0,
    subscriptionCount: subscriptionIds.current.length,
  };
}

// Dashboard data subscription hook
export function useDashboardSubscription(widgetIds: string[] = [], enabled: boolean = true) {
  const subscriptionIds = useRef<string[]>([]);
  const queryClient = useQueryClient();
  
  const { subscribe, unsubscribe, isConnected, sendMessage } = useWebSocket({
    enabled,
  });

  useEffect(() => {
    if (!enabled || !isConnected || widgetIds.length === 0) {
      return;
    }

    const subscriptionId = subscribe(
      'dashboard-updates',
      (message: WebSocketMessage) => {
        const { widgetId, data, timestamp } = message.data;
        
        // Update widget data in React Query cache
        queryClient.setQueriesData(
          { queryKey: queryKeys.dashboard.data(widgetId) },
          (oldData: any) => ({
            ...oldData,
            ...data,
            lastUpdated: new Date(timestamp),
          })
        );
      },
      {
        filter: (message) => widgetIds.includes(message.data.widgetId),
        priority: 'medium',
      }
    );

    subscriptionIds.current = [subscriptionId];

    // Subscribe to specific widget data streams
    widgetIds.forEach(widgetId => {
      sendMessage('subscribe', 'dashboard-widget-data', { widgetId }, 'medium');
    });

    return () => {
      subscriptionIds.current.forEach(id => unsubscribe(id));
      subscriptionIds.current = [];
      
      // Unsubscribe from widget data streams
      widgetIds.forEach(widgetId => {
        sendMessage('unsubscribe', 'dashboard-widget-data', { widgetId }, 'low');
      });
    };
  }, [widgetIds, enabled, isConnected, subscribe, unsubscribe, sendMessage, queryClient]);

  return {
    isSubscribed: subscriptionIds.current.length > 0,
    subscriptionCount: subscriptionIds.current.length,
  };
}

// Notification subscription hook
export function useNotificationSubscription(enabled: boolean = true) {
  const notificationStore = useNotificationStore();
  
  const { subscribe, unsubscribe, isConnected } = useWebSocket({
    enabled,
  });

  useEffect(() => {
    if (!enabled || !isConnected) {
      return;
    }

    const subscriptionId = subscribe(
      'notifications',
      (message: WebSocketMessage) => {
        const notification = message.data;
        
        // Add notification to store
        notificationStore.actions.addNotification({
          type: notification.type || 'info',
          title: notification.title,
          message: notification.message,
          priority: notification.priority || 'medium',
          category: notification.category || 'general',
          persistent: notification.persistent || false,
          autoClose: notification.autoClose !== false,
          duration: notification.duration || 5000,
        });
      },
      {
        priority: 'high',
      }
    );

    return () => {
      unsubscribe(subscriptionId);
    };
  }, [enabled, isConnected, subscribe, unsubscribe, notificationStore.actions]);

  return {
    isSubscribed: isConnected,
  };
}

// System alerts subscription hook
export function useSystemAlertsSubscription(enabled: boolean = true) {
  const notificationStore = useNotificationStore();
  
  const { subscribe, unsubscribe, isConnected } = useWebSocket({
    enabled,
  });

  useEffect(() => {
    if (!enabled || !isConnected) {
      return;
    }

    const subscriptionId = subscribe(
      'system-alerts',
      (message: WebSocketMessage) => {
        const alert = message.data;
        
        // Show critical system alerts as notifications
        if (alert.severity === 'critical' || alert.severity === 'high') {
          notificationStore.actions.addNotification(
            createNotification.error(
              `System Alert: ${alert.title}`,
              alert.message,
              {
                category: 'system',
                priority: 'critical',
                persistent: true,
                autoClose: false,
                metadata: alert.metadata,
              }
            )
          );
        }
      },
      {
        priority: 'critical',
      }
    );

    return () => {
      unsubscribe(subscriptionId);
    };
  }, [enabled, isConnected, subscribe, unsubscribe, notificationStore.actions]);

  return {
    isSubscribed: isConnected,
  };
}

// Real-time analytics subscription hook
export function useAnalyticsSubscription(metrics: string[] = [], enabled: boolean = true) {
  const subscriptionIds = useRef<string[]>([]);
  const queryClient = useQueryClient();
  
  const { subscribe, unsubscribe, isConnected } = useWebSocket({
    enabled,
  });

  useEffect(() => {
    if (!enabled || !isConnected || metrics.length === 0) {
      return;
    }

    const subscriptionId = subscribe(
      'analytics-updates',
      (message: WebSocketMessage) => {
        const { metric, data, timestamp } = message.data;
        
        // Update analytics data in React Query cache
        queryClient.setQueriesData(
          { queryKey: queryKeys.analytics.all },
          (oldData: any) => {
            if (!oldData) return oldData;
            
            return {
              ...oldData,
              [metric]: {
                ...oldData[metric],
                ...data,
                lastUpdated: new Date(timestamp),
              },
            };
          }
        );
      },
      {
        filter: (message) => metrics.includes(message.data.metric),
        priority: 'medium',
      }
    );

    subscriptionIds.current = [subscriptionId];

    return () => {
      subscriptionIds.current.forEach(id => unsubscribe(id));
      subscriptionIds.current = [];
    };
  }, [metrics, enabled, isConnected, subscribe, unsubscribe, queryClient]);

  return {
    isSubscribed: subscriptionIds.current.length > 0,
    subscriptionCount: subscriptionIds.current.length,
  };
}

// Graceful degradation hook for falling back to polling
export function usePollingFallback(
  queryKey: readonly unknown[],
  pollInterval: number = 30000,
  enabled: boolean = true
) {
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsPolling(false);
      return;
    }

    if (!isConnected) {
      console.log('WebSocket disconnected, enabling polling fallback');
      setIsPolling(true);
      
      const interval = setInterval(() => {
        queryClient.refetchQueries({ queryKey });
      }, pollInterval);

      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    } else {
      setIsPolling(false);
    }
  }, [isConnected, enabled, pollInterval, queryKey, queryClient]);

  return {
    isPolling,
    isUsingWebSocket: isConnected && !isPolling,
  };
}

// Connection monitoring hook
export function useConnectionMonitor() {
  const { connectionState, isConnected } = useWebSocket();
  const [connectionHistory, setConnectionHistory] = useState<Array<{
    timestamp: Date;
    status: ConnectionState['status'];
    latency?: number;
  }>>([]);

  useEffect(() => {
    setConnectionHistory(prev => [
      ...prev.slice(-50), // Keep last 50 entries
      {
        timestamp: new Date(),
        status: connectionState.status,
        latency: connectionState.latency || undefined,
      },
    ]);
  }, [connectionState.status, connectionState.latency]);

  const getConnectionQuality = (): 'excellent' | 'good' | 'poor' | 'disconnected' => {
    if (!isConnected) return 'disconnected';
    
    const latency = connectionState.latency;
    if (latency === null) return 'good';
    
    if (latency < 100) return 'excellent';
    if (latency < 300) return 'good';
    return 'poor';
  };

  const getUptimePercentage = (): number => {
    const recentHistory = connectionHistory.slice(-20); // Last 20 status changes
    if (recentHistory.length === 0) return 0;
    
    const connectedCount = recentHistory.filter(h => h.status === 'connected').length;
    return (connectedCount / recentHistory.length) * 100;
  };

  return {
    connectionState,
    connectionHistory,
    connectionQuality: getConnectionQuality(),
    uptimePercentage: getUptimePercentage(),
    averageLatency: connectionHistory
      .filter(h => h.latency)
      .reduce((sum, h, _, arr) => sum + (h.latency || 0) / arr.length, 0),
  };
}