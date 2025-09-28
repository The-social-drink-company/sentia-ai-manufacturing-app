import { devLog } from '../lib/devLog.js';
import React, { createContext, useContext, useState } from 'react';
import { useSSE } from '../hooks/useSSE';
import { useQueryClient } from '@tanstack/react-query';

const SSEContext = createContext();

export const useSSEContext = () => {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error('useSSEContext must be used within an SSEProvider');
  }
  return context;
};

export const SSEProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [globalLiveUpdates, setGlobalLiveUpdates] = useState(true);
  const [connectionStats, setConnectionStats] = useState({
    eventsReceived: 0,
    lastEventTime: null,
    uptime: null
  });

  // Main SSE connection for all manufacturing events
  const mainConnection = useSSE({
    endpoint: '/api/events',
    enabled: globalLiveUpdates,
    onConnect: () => {
      setConnectionStats(prev => ({
        ...prev,
        uptime: Date.now()
      }));
    },
    onMessage: (eventType, data) => {
      setConnectionStats(prev => ({
        ...prev,
        eventsReceived: prev.eventsReceived + 1,
        lastEventTime: Date.now()
      }));

      // Global event handlers that affect multiple components
      handleGlobalSSEEvent(eventType, data, queryClient);
    },
    onError: (error) => {
      devLog.error('Global SSE connection error:', error);
    }
  });

  const value = {
    // Connection status
    isConnected: mainConnection.isConnected,
    isConnecting: mainConnection.isConnecting,
    hasError: mainConnection.hasError,
    connectionStats,
    
    // Global controls
    globalLiveUpdates,
    setGlobalLiveUpdates,
    
    // Connection management
    reconnect: mainConnection.reconnect,
    disconnect: mainConnection.disconnect
  };

  return (
    <SSEContext.Provider value={value}>
      {children}
    </SSEContext.Provider>
  );
};

// Global event handler for cross-component updates
const handleGlobalSSEEvent = (eventType, data, queryClient) => {
  switch (eventType) {
    case 'system.maintenance.start':
      // Show maintenance banner across all components
      queryClient.setQueryData(['system-status'], (old) => ({
        ...old,
        maintenance: true,
        maintenanceMessage: data.message,
        maintenanceStartTime: Date.now()
      }));
      break;

    case 'system.maintenance.end':
      queryClient.setQueryData(['system-status'], (old) => ({
        ...old,
        maintenance: false,
        maintenanceMessage: null,
        maintenanceStartTime: null
      }));
      break;

    case 'system.alert.critical':
      // Global critical alerts that should show everywhere
      queryClient.setQueryData(['global-alerts'], (old) => [
        data,
        ...(old || []).slice(0, 4)
      ]);
      break;

    case 'metrics.global.updated':
      // Update global metrics used by dashboard widgets
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-metrics'] });
      break;

    case 'inventory.critical.low':
      // Critical inventory alerts affect production planning
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['production-planning'] });
      break;

    case 'quality.batch.rejected':
      // Rejected batches affect inventory and production schedules
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['quality'] });
      break;

    case 'production.line.emergency':
      // Emergency stops affect all related systems
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['capacity-planning'] });
      break;

    case 'forecast.model.updated':
      // New forecast models affect demand planning
      queryClient.invalidateQueries({ queryKey: ['demand-forecast'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-planning'] });
      break;

    default:
      // Log unknown events for debugging
      if (import.meta.env?.DEV) {
        devLog.log('Unhandled SSE event:', eventType, data)
      }
      break;
  }
};

// Hook for showing connection status indicator
export const useSSEStatus = () => {
  const { isConnected, connectionStats, globalLiveUpdates } = useSSEContext();
  
  return {
    isConnected,
    isActive: globalLiveUpdates,
    eventsReceived: connectionStats.eventsReceived,
    lastEventTime: connectionStats.lastEventTime,
    uptime: connectionStats.uptime ? Date.now() - connectionStats.uptime : null
  };
};

// Hook for global SSE controls
export const useSSEControls = () => {
  const { 
    globalLiveUpdates, 
    setGlobalLiveUpdates, 
    reconnect, 
    disconnect 
  } = useSSEContext();

  return {
    isEnabled: globalLiveUpdates,
    enable: () => setGlobalLiveUpdates(true),
    disable: () => setGlobalLiveUpdates(false),
    toggle: () => setGlobalLiveUpdates(prev => !prev),
    reconnect,
    disconnect
  };
};
