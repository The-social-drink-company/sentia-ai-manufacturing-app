import { devLog } from '../lib/devLog.js';
import { useState, useEffect, useCallback, useRef } from 'react';
// Removed Clerk dependency - using next-auth only

/**
 * Custom hook for real-time AI system data via Server-Sent Events
 * Provides live updates from all AI subsystems
 */
export const useAIRealTimeData = (options = {}) => {
  // Mock auth token for now - replace with next-auth
  const getToken = () => null;
  const [data, setData] = useState({
    mcp: { status: 'initializing', connections: [] },
    forecasting: { predictions: [], confidence: 0 },
    maintenance: { alerts: [], equipment: [] },
    quality: { inspections: [], defectRate: 0 },
    supplyChain: { inventory: [], suppliers: [] },
    digitalTwin: { simulations: [], performance: {} },
    analytics: { kpis: {}, trends: [] },
    agent: { conversations: 0, satisfaction: 0 }
  });
  
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Connect to SSE endpoint
  const connectSSE = useCallback(async () => {
    try {
      const token = await getToken();
      
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create new EventSource with auth token
      const sseUrl = `${API_BASE}/ai/sse/stream?token=${encodeURIComponent(token)}`;
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      // Connection opened
      eventSource.onopen = () => {
        setConnectionStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
        devLog.log('AI SSE connection established');
      };

      // Handle different event types
      eventSource.addEventListener('ai-status', (event) => {
        const statusData = JSON.parse(event.data);
        setData(prev => ({
          ...prev,
          ...statusData
        }));
      });

      eventSource.addEventListener('mcp-update', (event) => {
        const mcpData = JSON.parse(event.data);
        setData(prev => ({
          ...prev,
          mcp: { ...prev.mcp, ...mcpData }
        }));
      });

      eventSource.addEventListener('forecast-update', (event) => {
        const forecastData = JSON.parse(event.data);
        setData(prev => ({
          ...prev,
          forecasting: { ...prev.forecasting, ...forecastData }
        }));
      });

      eventSource.addEventListener('maintenance-alert', (event) => {
        const maintenanceData = JSON.parse(event.data);
        setData(prev => ({
          ...prev,
          maintenance: {
            ...prev.maintenance,
            alerts: [maintenanceData, ...prev.maintenance.alerts].slice(0, 10)
          }
        }));
      });

      eventSource.addEventListener('quality-inspection', (event) => {
        const qualityData = JSON.parse(event.data);
        setData(prev => ({
          ...prev,
          quality: {
            ...prev.quality,
            inspections: [qualityData, ...prev.quality.inspections].slice(0, 20),
            defectRate: qualityData.defectRate || prev.quality.defectRate
          }
        }));
      });

      eventSource.addEventListener('supply-chain-update', (event) => {
        const supplyData = JSON.parse(event.data);
        setData(prev => ({
          ...prev,
          supplyChain: { ...prev.supplyChain, ...supplyData }
        }));
      });

      eventSource.addEventListener('digital-twin-sync', (event) => {
        const twinData = JSON.parse(event.data);
        setData(prev => ({
          ...prev,
          digitalTwin: { ...prev.digitalTwin, ...twinData }
        }));
      });

      eventSource.addEventListener('analytics-update', (event) => {
        const analyticsData = JSON.parse(event.data);
        setData(prev => ({
          ...prev,
          analytics: { ...prev.analytics, ...analyticsData }
        }));
      });

      eventSource.addEventListener('agent-metrics', (event) => {
        const agentData = JSON.parse(event.data);
        setData(prev => ({
          ...prev,
          agent: { ...prev.agent, ...agentData }
        }));
      });

      // Handle errors
      eventSource.onerror = (error) => {
        devLog.error('AI SSE connection error:', error);
        setConnectionStatus('error');
        setError('Connection lost. Attempting to reconnect...');
        eventSource.close();

        // Implement exponential backoff for reconnection
        const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current += 1;

        if (reconnectAttemptsRef.current <= 5) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, backoffDelay);
        } else {
          setError('Unable to establish connection. Please refresh the page.');
        }
      };

    } catch (err) {
      devLog.error('Failed to establish AI SSE connection:', err);
      setError(err.message);
      setConnectionStatus('error');
    }
  }, [getToken, API_BASE]);

  // Disconnect SSE
  const disconnectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  // Send command to AI system
  const sendAICommand = useCallback(async (command, payload = {}) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/ai/command`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command, ...payload })
      });

      if (!response.ok) {
        throw new Error(`Command failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      devLog.error('AI command error:', err);
      throw err;
    }
  }, [getToken, API_BASE]);

  // Get specific AI system data
  const getSystemData = useCallback((system) => {
    return data[system] || null;
  }, [data]);

  // Subscribe to specific AI events
  const subscribeToEvent = useCallback((eventType, callback) => {
    if (!eventSourceRef.current) return null;

    eventSourceRef.current.addEventListener(eventType, callback);
    
    // Return unsubscribe function
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.removeEventListener(eventType, callback);
      }
    };
  }, []);

  // Effect to establish connection
  useEffect(() => {
    if (options.autoConnect !== false) {
      connectSSE();
    }

    return () => {
      disconnectSSE();
    };
  }, []);

  return {
    // Data
    data,
    connectionStatus,
    error,
    
    // Methods
    connect: connectSSE,
    disconnect: disconnectSSE,
    sendCommand: sendAICommand,
    getSystemData,
    subscribeToEvent,
    
    // System-specific getters
    mcpStatus: data.mcp,
    forecastingData: data.forecasting,
    maintenanceAlerts: data.maintenance,
    qualityMetrics: data.quality,
    supplyChainData: data.supplyChain,
    digitalTwinData: data.digitalTwin,
    analyticsData: data.analytics,
    agentMetrics: data.agent
  };
};

/**
 * Hook for AI forecasting real-time updates
 */
export const useAIForecasting = (productSKU) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const { sendCommand, subscribeToEvent } = useAIRealTimeData();

  useEffect(() => {
    const loadForecast = async () => {
      try {
        setLoading(true);
        const data = await sendCommand('generate-forecast', { productSKU });
        setForecast(data);
      } catch (err) {
        devLog.error('Forecast loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (productSKU) {
      loadForecast();
    }

    // Subscribe to forecast updates
    const unsubscribe = subscribeToEvent('forecast-update', (event) => {
      const data = JSON.parse(event.data);
      if (data.productSKU === productSKU) {
        setForecast(data);
      }
    });

    return unsubscribe;
  }, [productSKU]);

  return { forecast, loading };
};

/**
 * Hook for predictive maintenance alerts
 */
export const useMaintenanceAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const { subscribeToEvent, maintenanceAlerts } = useAIRealTimeData();

  useEffect(() => {
    // Set initial alerts
    setAlerts(maintenanceAlerts.alerts || []);
    setCriticalAlerts(maintenanceAlerts.alerts?.filter(a => a.severity === 'critical') || []);

    // Subscribe to new alerts
    const unsubscribe = subscribeToEvent('maintenance-alert', (event) => {
      const alert = JSON.parse(event.data);
      setAlerts(prev => [alert, ...prev].slice(0, 50));
      
      if (alert.severity === 'critical') {
        setCriticalAlerts(prev => [alert, ...prev].slice(0, 10));
      }
    });

    return unsubscribe;
  }, [maintenanceAlerts]);

  return { alerts, criticalAlerts };
};

/**
 * Hook for quality inspection results
 */
export const useQualityInspections = () => {
  const [inspections, setInspections] = useState([]);
  const [statistics, setStatistics] = useState({
    passRate: 0,
    defectRate: 0,
    totalInspected: 0
  });
  const { subscribeToEvent, qualityMetrics } = useAIRealTimeData();

  useEffect(() => {
    // Set initial data
    setInspections(qualityMetrics.inspections || []);
    
    // Calculate statistics
    if (qualityMetrics.inspections?.length > 0) {
      const passed = qualityMetrics.inspections.filter(i => i.passed).length;
      const total = qualityMetrics.inspections.length;
      setStatistics({
        passRate: (passed / total) * 100,
        defectRate: ((total - passed) / total) * 100,
        totalInspected: total
      });
    }

    // Subscribe to new inspections
    const unsubscribe = subscribeToEvent('quality-inspection', (event) => {
      const inspection = JSON.parse(event.data);
      setInspections(prev => [inspection, ...prev].slice(0, 100));
    });

    return unsubscribe;
  }, [qualityMetrics]);

  return { inspections, statistics };
};

export default useAIRealTimeData;
