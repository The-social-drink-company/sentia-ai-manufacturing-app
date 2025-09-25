import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { logInfo, logWarn, logError } from '../services/observability/structuredLogger.js';

const RealtimeContext = createContext(null);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

// Data stream types for manufacturing
const STREAM_TYPES = {
  PRODUCTION_METRICS: 'production_metrics',
  QUALITY_DATA: 'quality_data',
  EQUIPMENT_STATUS: 'equipment_status',
  INVENTORY_LEVELS: 'inventory_levels',
  ENERGY_CONSUMPTION: 'energy_consumption',
  WORKER_ACTIVITY: 'worker_activity',
  TEMPERATURE_SENSORS: 'temperature_sensors',
  VIBRATION_SENSORS: 'vibration_sensors',
  ALERTS_NOTIFICATIONS: 'alerts_notifications'
};

// Connection states
const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

export const RealtimeProvider = ({ children }) => {
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
  const [dataStreams, setDataStreams] = useState({});
  const [subscribers, setSubscribers] = useState(new Map());
  const [metrics, setMetrics] = useState({
    messagesReceived: 0,
    lastMessageTime: null,
    averageLatency: 0,
    connectionUptime: 0
  });
  const [alerts, setAlerts] = useState([]);
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(true);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const connectionStartTimeRef = useRef(null);
  const latencyMeasurements = useRef([]);

  const [wsEndpoint] = useState(() => {
    const env = typeof import.meta !== 'undefined' ? import.meta.env : {};
    const nodeEnv = env.MODE || env.NODE_ENV || 'development';
    return nodeEnv === 'production' 
      ? 'wss://web-production-99691282.up.railway.app/ws'
      : 'ws://localhost:3001/ws';
  });

  // Initialize real-time connection
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setConnectionState(CONNECTION_STATES.CONNECTING);
    connectionStartTimeRef.current = Date.now();

    try {
      wsRef.current = new WebSocket(wsEndpoint);

      wsRef.current.onopen = () => {
        setConnectionState(CONNECTION_STATES.CONNECTED);
        setIsRealtimeEnabled(true);
        logInfo('Real-time connection established');
        
        // Start heartbeat
        startHeartbeat();
        
        // Subscribe to all active streams
        subscribers.forEach((callbacks, streamType) => {
          if (callbacks.size > 0) {
            subscribeToStream(streamType);
          }
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          logWarn('Failed to parse WebSocket message', { error: error.message });
        }
      };

      wsRef.current.onerror = (error) => {
        logError('WebSocket error', { error });
        setConnectionState(CONNECTION_STATES.ERROR);
      };

      wsRef.current.onclose = () => {
        setConnectionState(CONNECTION_STATES.DISCONNECTED);
        setIsRealtimeEnabled(false);
        
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        
        // Attempt to reconnect
        scheduleReconnect();
      };

    } catch (error) {
      logError('Failed to create WebSocket connection', { error: error.message });
      setConnectionState(CONNECTION_STATES.ERROR);
      scheduleReconnect();
    }
  }, [wsEndpoint, subscribers]);

  // Handle incoming messages
  const handleMessage = useCallback((message) => {
    const now = Date.now();
    
    // Update metrics
    setMetrics(prev => {
      const newLatency = message.timestamp ? now - message.timestamp : 0;
      const measurements = [...latencyMeasurements.current, newLatency].slice(-100);
      latencyMeasurements.current = measurements;
      
      return {
        messagesReceived: prev.messagesReceived + 1,
        lastMessageTime: now,
        averageLatency: measurements.reduce((a, b) => a + b, 0) / measurements.length,
        connectionUptime: connectionStartTimeRef.current ? now - connectionStartTimeRef.current : 0
      };
    });

    switch (message.type) {
      case 'data':
        // Update data stream
        setDataStreams(prev => ({
          ...prev,
          [message.streamType]: {
            ...message.data,
            timestamp: now,
            streamType: message.streamType
          }
        }));

        // Notify subscribers
        const streamSubscribers = subscribers.get(message.streamType);
        if (streamSubscribers) {
          streamSubscribers.forEach(callback => {
            try {
              callback(message.data, message.streamType);
            } catch (error) {
              logWarn('Subscriber callback failed', { streamType: message.streamType, error: error.message });
            }
          });
        }
        break;

      case 'alert':
        setAlerts(prev => [{
          id: message.id || Date.now().toString(),
          type: message.alertType || 'info',
          title: message.title,
          message: message.message,
          timestamp: now,
          source: message.source,
          severity: message.severity || 'medium',
          acknowledged: false
        }, ...prev].slice(0, 100)); // Keep last 100 alerts
        break;

      case 'heartbeat':
        // Heartbeat response - connection is healthy
        break;

      case 'subscription_confirmed':
        logInfo('Stream subscription confirmed', { streamType: message.streamType });
        break;

      case 'error':
        logWarn('Real-time error received', { error: message.error });
        break;

      default:
        logWarn('Unknown message type received', { type: message.type });
    }
  }, [subscribers]);

  // Start heartbeat to keep connection alive
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now()
        }));
      }
    }, 30000); // Every 30 seconds
  }, []);

  // Schedule reconnection attempt
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setConnectionState(CONNECTION_STATES.RECONNECTING);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      logInfo('Attempting to reconnect to real-time service');
      connect();
    }, 5000); // Retry after 5 seconds
  }, [connect]);

  // Subscribe to data stream
  const subscribe = useCallback((streamType, callback) => {
    if (!Object.values(STREAM_TYPES).includes(streamType)) {
      throw new Error(`Invalid stream type: ${streamType}`);
    }

    setSubscribers(prev => {
      const updated = new Map(prev);
      if (!updated.has(streamType)) {
        updated.set(streamType, new Set());
      }
      updated.get(streamType).add(callback);
      return updated;
    });

    // Subscribe to stream if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      subscribeToStream(streamType);
    }

    // Return unsubscribe function
    return () => unsubscribe(streamType, callback);
  }, []);

  // Unsubscribe from data stream
  const unsubscribe = useCallback((streamType, callback) => {
    setSubscribers(prev => {
      const updated = new Map(prev);
      const streamSubscribers = updated.get(streamType);
      
      if (streamSubscribers) {
        streamSubscribers.delete(callback);
        
        if (streamSubscribers.size === 0) {
          updated.delete(streamType);
          
          // Unsubscribe from stream if no more subscribers
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            unsubscribeFromStream(streamType);
          }
        }
      }
      
      return updated;
    });
  }, []);

  // Send subscription message to server
  const subscribeToStream = useCallback((streamType) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        streamType,
        timestamp: Date.now()
      }));
    }
  }, []);

  // Send unsubscription message to server
  const unsubscribeFromStream = useCallback((streamType) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        streamType,
        timestamp: Date.now()
      }));
    }
  }, []);

  // Disconnect from real-time service
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setConnectionState(CONNECTION_STATES.DISCONNECTED);
    setIsRealtimeEnabled(false);
  }, []);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  // Clear acknowledged alerts
  const clearAcknowledgedAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(alert => !alert.acknowledged));
  }, []);

  // Get latest data for a stream
  const getLatestData = useCallback((streamType) => {
    return dataStreams[streamType] || null;
  }, [dataStreams]);

  // Get connection health metrics
  const getConnectionHealth = useCallback(() => {
    return {
      state: connectionState,
      isConnected: connectionState === CONNECTION_STATES.CONNECTED,
      uptime: metrics.connectionUptime,
      latency: metrics.averageLatency,
      messagesReceived: metrics.messagesReceived,
      activeSubscriptions: subscribers.size,
      lastMessageAge: metrics.lastMessageTime ? Date.now() - metrics.lastMessageTime : null
    };
  }, [connectionState, metrics, subscribers.size]);

  // Initialize connection on mount
  useEffect(() => {
    if (isRealtimeEnabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [isRealtimeEnabled, connect, disconnect]);

  const contextValue = {
    // Connection state
    connectionState,
    isConnected: connectionState === CONNECTION_STATES.CONNECTED,
    isRealtimeEnabled,
    
    // Data streams
    dataStreams,
    alerts: alerts.filter(alert => !alert.acknowledged),
    allAlerts: alerts,
    
    // Metrics
    metrics,
    
    // Methods
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    acknowledgeAlert,
    clearAcknowledgedAlerts,
    getLatestData,
    getConnectionHealth,
    
    // Constants
    STREAM_TYPES,
    CONNECTION_STATES
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};

export default RealtimeProvider;
