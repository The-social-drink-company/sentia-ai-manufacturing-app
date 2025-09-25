import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


// MCP Server URL from environment
const MCP_SERVER_URL = import.meta.env.VITE_MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com';

export const useMCPData = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${MCP_SERVER_URL}${endpoint}`, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      if (!response.ok) {
        throw new Error(`MCP Server error: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      logError('MCP fetch error:', err);
      setError(err.message);
      // Fallback to mock data if MCP server is unavailable
      if (options.fallback) {
        setData(options.fallback);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, options.method, options.body]);

  useEffect(() => {
    fetchData();

    // Set up polling if specified
    if (options.pollInterval) {
      const interval = setInterval(fetchData, options.pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, options.pollInterval]);

  return { data, loading, error, refetch: fetchData };
};

// Hook for MCP manufacturing AI requests
export const useMCPManufacturing = () => {
  const [loading, setLoading] = useState(false);

  const requestManufacturingAI = useCallback(async (query) => {
    setLoading(true);
    try {
      const response = await fetch(`${MCP_SERVER_URL}/mcp/tools/manufacturing-ai-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          arguments: {
            query,
            context: 'dashboard'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const result = await response.json();
      toast.success('AI analysis complete');
      return result;
    } catch (err) {
      logError('MCP AI request error:', err);
      toast.error('Failed to get AI analysis');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { requestManufacturingAI, loading };
};

// Hook for MCP system status
export const useMCPStatus = () => {
  return useMCPData('/mcp/status', {
    pollInterval: 30000, // Poll every 30 seconds
    fallback: {
      status: 'offline',
      message: 'MCP server unavailable - using local data',
      services: {}
    }
  });
};

// Hook for MCP inventory optimization
export const useMCPInventoryOptimization = () => {
  const [loading, setLoading] = useState(false);

  const optimizeInventory = useCallback(async (parameters) => {
    setLoading(true);
    try {
      const response = await fetch(`${MCP_SERVER_URL}/mcp/tools/optimize-inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          arguments: parameters
        })
      });

      if (!response.ok) {
        throw new Error('Failed to optimize inventory');
      }

      const result = await response.json();
      toast.success('Inventory optimization complete');
      return result;
    } catch (err) {
      logError('MCP inventory optimization error:', err);
      toast.error('Failed to optimize inventory');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { optimizeInventory, loading };
};

// Hook for MCP demand forecasting
export const useMCPDemandForecasting = () => {
  const [loading, setLoading] = useState(false);

  const forecastDemand = useCallback(async (parameters) => {
    setLoading(true);
    try {
      const response = await fetch(`${MCP_SERVER_URL}/mcp/tools/forecast-demand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          arguments: parameters
        })
      });

      if (!response.ok) {
        throw new Error('Failed to forecast demand');
      }

      const result = await response.json();
      toast.success('Demand forecast generated');
      return result;
    } catch (err) {
      logError('MCP demand forecasting error:', err);
      toast.error('Failed to forecast demand');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { forecastDemand, loading };
};

// Hook for real-time MCP WebSocket connection
export const useMCPWebSocket = (onMessage) => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const wsUrl = MCP_SERVER_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/ws`);

    ws.onopen = () => {
      setConnected(true);
      logDebug('Connected to MCP WebSocket');
      toast.success('Connected to MCP real-time updates');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) {
          onMessage(data);
        }
      } catch (err) {
        logError('WebSocket message parse error:', err);
      }
    };

    ws.onerror = (error) => {
      logError('WebSocket error:', error);
      toast.error('MCP WebSocket connection error');
    };

    ws.onclose = () => {
      setConnected(false);
      logDebug('Disconnected from MCP WebSocket');
    };

    return () => {
      ws.close();
    };
  }, [onMessage]);

  return { connected };
};

export default useMCPData;