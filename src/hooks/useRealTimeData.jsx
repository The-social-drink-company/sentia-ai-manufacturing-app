import { useState, useEffect, useCallback, useRef } from 'react';
import { logInfo, logError, logWarn } from '../services/observability/structuredLogger.js';

/**
 * Real-Time Data Hook
 * Provides WebSocket and Server-Sent Events integration for real-time manufacturing data
 */

export const useRealTimeData = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [data, setData] = useState({});
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const wsRef = useRef(null);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second

  // Configuration
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';
  const SSE_URL = import.meta.env.VITE_SSE_URL || 'http://localhost:5000/api/events';

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      logInfo('Connecting to WebSocket', { url: WS_URL });
      
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        logInfo('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setData(prevData => ({
            ...prevData,
            [message.type]: {
              ...message.data,
              timestamp: new Date().toISOString(),
            }
          }));
          setLastUpdate(new Date().toISOString());
          logInfo('WebSocket message received', { type: message.type });
        } catch (error) {
          logError('Failed to parse WebSocket message', error);
        }
      };

      ws.onclose = (event) => {
        logWarn('WebSocket disconnected', { code: event.code, reason: event.reason });
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts.current);
          reconnectAttempts.current++;
          
          logInfo('Scheduling WebSocket reconnection', { 
            attempt: reconnectAttempts.current, 
            delay 
          });
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else {
          setError('Maximum reconnection attempts reached');
          logError('WebSocket reconnection failed', { attempts: reconnectAttempts.current });
        }
      };

      ws.onerror = (error) => {
        logError('WebSocket error', error);
        setError('WebSocket connection error');
      };

    } catch (error) {
      logError('Failed to create WebSocket connection', error);
      setError('Failed to create WebSocket connection');
    }
  }, [WS_URL]);

  // Server-Sent Events connection
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    try {
      logInfo('Connecting to Server-Sent Events', { url: SSE_URL });
      
      const eventSource = new EventSource(SSE_URL);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        logInfo('Server-Sent Events connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setData(prevData => ({
            ...prevData,
            [message.type]: {
              ...message.data,
              timestamp: new Date().toISOString(),
            }
          }));
          setLastUpdate(new Date().toISOString());
          logInfo('SSE message received', { type: message.type });
        } catch (error) {
          logError('Failed to parse SSE message', error);
        }
      };

      eventSource.onerror = (error) => {
        logError('Server-Sent Events error', error);
        setError('Server-Sent Events connection error');
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      logError('Failed to create Server-Sent Events connection', error);
      setError('Failed to create Server-Sent Events connection');
    }
  }, [SSE_URL]);

  // Disconnect all connections
  const disconnect = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Close Server-Sent Events
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectAttempts.current = 0;
    
    logInfo('All real-time connections closed');
  }, []);

  // Send message via WebSocket
  const sendMessage = useCallback((type, payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data: payload,
        timestamp: new Date().toISOString(),
      };
      
      wsRef.current.send(JSON.stringify(message));
      logInfo('WebSocket message sent', { type, payload });
      return true;
    } else {
      logWarn('WebSocket not connected, cannot send message', { type });
      return false;
    }
  }, []);

  // Subscribe to specific data types
  const subscribe = useCallback((dataType, callback) => {
    const unsubscribe = () => {
      // Remove callback from data updates
      setData(prevData => {
        const newData = { ...prevData };
        if (newData[dataType]) {
          delete newData[dataType].callback;
        }
        return newData;
      });
    };

    // Add callback to data
    setData(prevData => ({
      ...prevData,
      [dataType]: {
        ...prevData[dataType],
        callback,
      }
    }));

    return unsubscribe;
  }, []);

  // Get specific data type
  const getData = useCallback((dataType) => {
    return data[dataType] || null;
  }, [data]);

  // Connection status info
  const getConnectionStatusInfo = useCallback(() => {
    switch (connectionStatus) {
      case 'connected':
        return {
          status: 'connected',
          color: 'green',
          message: 'Real-time Connected',
          icon: '✓',
        };
      case 'connecting':
        return {
          status: 'connecting',
          color: 'yellow',
          message: 'Connecting...',
          icon: '⟳',
        };
      case 'disconnected':
      default:
        return {
          status: 'disconnected',
          color: 'red',
          message: error || 'Real-time Disconnected',
          icon: '✗',
        };
    }
  }, [connectionStatus, error]);

  // Initialize connections
  useEffect(() => {
    // Try WebSocket first, fallback to SSE
    connectWebSocket();
    
    // Also connect to SSE for redundancy
    setTimeout(() => {
      connectSSE();
    }, 1000);

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connectWebSocket, connectSSE, disconnect]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause connections
        logInfo('Page hidden, pausing real-time connections');
      } else {
        // Page is visible, resume connections
        logInfo('Page visible, resuming real-time connections');
        if (!isConnected) {
          connectWebSocket();
          connectSSE();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, connectWebSocket, connectSSE]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      logInfo('Network online, reconnecting real-time data');
      if (!isConnected) {
        connectWebSocket();
        connectSSE();
      }
    };

    const handleOffline = () => {
      logWarn('Network offline, disconnecting real-time data');
      disconnect();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected, connectWebSocket, connectSSE, disconnect]);

  return {
    // Connection status
    isConnected,
    connectionStatus,
    error,
    lastUpdate,
    
    // Data
    data,
    getData,
    
    // Connection management
    connect: connectWebSocket,
    disconnect,
    
    // Messaging
    sendMessage,
    subscribe,
    
    // Status helpers
    getConnectionStatusInfo,
  };
};

export default useRealTimeData;