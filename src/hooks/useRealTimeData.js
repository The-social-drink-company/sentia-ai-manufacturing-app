import { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


// Get API URL from environment or default
const API_URL = import.meta.env.VITE_API_BASE_URL || null;

// Connection state enum
const ConnectionState = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting'
};

/**
 * Custom hook for managing Socket.io connection with authentication
 */
const useSocketConnection = (namespace) => {
  const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED);
  const [socket, setSocket] = useState(null);
  const { getToken } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000);

  useEffect(() => {
    let socketInstance = null;

    const connect = async () => {
      try {
        setConnectionState(ConnectionState.CONNECTING);
        const token = await getToken();

        socketInstance = io(`${API_URL}${namespace}`, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: maxReconnectAttempts,
          reconnectionDelay: reconnectDelay.current,
          reconnectionDelayMax: 10000,
          timeout: 20000
        });

        socketInstance.on('connect', () => {
          setConnectionState(ConnectionState.CONNECTED);
          reconnectAttempts.current = 0;
          reconnectDelay.current = 1000;
          logDebug(`Connected to ${namespace} WebSocket`);
        });

        socketInstance.on('disconnect', (reason) => {
          setConnectionState(ConnectionState.DISCONNECTED);
          logDebug(`Disconnected from ${namespace}: ${reason}`);
        });

        socketInstance.on('connect_error', (error) => {
          setConnectionState(ConnectionState.ERROR);
          logError(`Connection error in ${namespace}:`, error.message);
        });

        socketInstance.on('reconnecting', (attemptNumber) => {
          setConnectionState(ConnectionState.RECONNECTING);
          reconnectAttempts.current = attemptNumber;
          // Exponential backoff
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, 10000);
        });

        setSocket(socketInstance);
      } catch (error) {
        logError(`Failed to connect to ${namespace}:`, error);
        setConnectionState(ConnectionState.ERROR);
      }
    };

    connect();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [namespace, getToken]);

  return { socket, connectionState };
};

/**
 * Hook for real-time production metrics
 */
export const useProductionMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [realTimeStats, setRealTimeStats] = useState(null);
  const { socket, connectionState } = useSocketConnection('/production');

  useEffect(() => {
    if (!socket) return;

    // Subscribe to metrics updates
    socket.emit('subscribe:metrics');

    // Handle initial data
    socket.on('metrics:initial', (data) => {
      setMetrics(data.metrics);
      setRealTimeStats(data.realTime);
    });

    // Handle real-time updates
    socket.on('metrics:update', (data) => {
      setMetrics(data.metrics);
      setRealTimeStats(data.realTime);
    });

    // Handle instant updates
    socket.on('metrics:realtime', (data) => {
      setRealTimeStats(prev => ({
        ...prev,
        ...data,
        lastUpdate: new Date()
      }));
    });

    return () => {
      socket.off('metrics:initial');
      socket.off('metrics:update');
      socket.off('metrics:realtime');
    };
  }, [socket]);

  return { metrics, realTimeStats, connectionState };
};

/**
 * Hook for real-time production schedule
 */
export const useProductionSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const { socket, connectionState } = useSocketConnection('/production');

  useEffect(() => {
    if (!socket) return;

    socket.emit('subscribe:schedule');

    socket.on('schedule:initial', (data) => {
      setSchedule(data);
    });

    socket.on('schedule:update', (data) => {
      setSchedule(data);
    });

    return () => {
      socket.off('schedule:initial');
      socket.off('schedule:update');
    };
  }, [socket]);

  return { schedule, connectionState };
};

/**
 * Hook for real-time inventory levels
 */
export const useInventoryLevels = () => {
  const [levels, setLevels] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const { socket, connectionState } = useSocketConnection('/inventory');

  useEffect(() => {
    if (!socket) return;

    socket.emit('subscribe:levels');

    socket.on('levels:initial', (data) => {
      setLevels(data);
    });

    socket.on('levels:update', (data) => {
      setLevels(data);
    });

    socket.on('levels:realtime', (data) => {
      setLevels(prev => {
        const updated = [...prev];
        const index = updated.findIndex(item => item.sku === data.sku);
        if (index !== -1) {
          updated[index] = { ...updated[index], ...data };
        } else {
          updated.push(data);
        }
        return updated;
      });
    });

    socket.on('alerts:inventory', (alertData) => {
      setAlerts(alertData);
      // Auto-clear alerts after 30 seconds
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => !alertData.includes(a)));
      }, 30000);
    });

    return () => {
      socket.off('levels:initial');
      socket.off('levels:update');
      socket.off('levels:realtime');
      socket.off('alerts:inventory');
    };
  }, [socket]);

  return { levels, alerts, connectionState };
};

/**
 * Hook for real-time quality data
 */
export const useQualityMetrics = () => {
  const [defects, setDefects] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const { socket, connectionState } = useSocketConnection('/quality');

  useEffect(() => {
    if (!socket) return;

    socket.emit('subscribe:defects');

    socket.on('defects:initial', (data) => {
      setDefects(data);
    });

    socket.on('defects:update', (data) => {
      setDefects(data);
    });

    socket.on('alerts:quality', (alertData) => {
      setAlerts(alertData);
      // Auto-clear alerts after 30 seconds
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => !alertData.includes(a)));
      }, 30000);
    });

    return () => {
      socket.off('defects:initial');
      socket.off('defects:update');
      socket.off('alerts:quality');
    };
  }, [socket]);

  return { defects, alerts, connectionState };
};

/**
 * Hook for real-time maintenance data
 */
export const useMaintenanceSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const { socket, connectionState } = useSocketConnection('/maintenance');

  useEffect(() => {
    if (!socket) return;

    socket.emit('subscribe:schedule');
    socket.emit('subscribe:alerts');

    socket.on('schedule:update', (data) => {
      setSchedule(data);
    });

    socket.on('alerts:maintenance', (alertData) => {
      setAlerts(alertData);
    });

    return () => {
      socket.off('schedule:update');
      socket.off('alerts:maintenance');
    };
  }, [socket]);

  return { schedule, alerts, connectionState };
};

/**
 * Hook for aggregated real-time notifications
 */
export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const { levels: inventoryLevels, alerts: inventoryAlerts } = useInventoryLevels();
  const { defects, alerts: qualityAlerts } = useQualityMetrics();
  const { alerts: maintenanceAlerts } = useMaintenanceSchedule();

  useEffect(() => {
    const allNotifications = [
      ...inventoryAlerts.map(a => ({ ...a, source: 'inventory', id: `inv-${Date.now()}-${0;
      return priority[a.type] - priority[b.type];
    });

    setNotifications(allNotifications);
  }, [inventoryAlerts, qualityAlerts, maintenanceAlerts]);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return { notifications, dismissNotification };
};

/**
 * Hook for connection status across all namespaces
 */
export const useWebSocketStatus = () => {
  const production = useSocketConnection('/production');
  const inventory = useSocketConnection('/inventory');
  const quality = useSocketConnection('/quality');
  const maintenance = useSocketConnection('/maintenance');

  const isConnected =
    production.connectionState === ConnectionState.CONNECTED ||
    inventory.connectionState === ConnectionState.CONNECTED ||
    quality.connectionState === ConnectionState.CONNECTED ||
    maintenance.connectionState === ConnectionState.CONNECTED;

  const isReconnecting =
    production.connectionState === ConnectionState.RECONNECTING ||
    inventory.connectionState === ConnectionState.RECONNECTING ||
    quality.connectionState === ConnectionState.RECONNECTING ||
    maintenance.connectionState === ConnectionState.RECONNECTING;

  return {
    isConnected,
    isReconnecting,
    namespaces: {
      production: production.connectionState,
      inventory: inventory.connectionState,
      quality: quality.connectionState,
      maintenance: maintenance.connectionState
    }
  };
};

// Main real-time data hook that combines all data sources
export const useRealTimeData = () => {
  const production = useProductionMetrics();
  const schedule = useProductionSchedule();
  const inventory = useInventoryLevels();
  const quality = useQualityMetrics();
  const maintenance = useMaintenanceSchedule();
  const notifications = useRealTimeNotifications();
  const status = useWebSocketStatus();

  return {
    production,
    schedule,
    inventory,
    quality,
    maintenance,
    notifications,
    status,
    isConnected: status.isConnected,
    isReconnecting: status.isReconnecting
  };
};

export { ConnectionState };