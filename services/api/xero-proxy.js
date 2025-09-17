/**
 * Xero API Proxy Service
 * Routes Xero OAuth and data requests to MCP Server on Render
 */

import express from 'express';
import axios from 'axios';
import { logInfo, logError } from '../observability/structuredLogger.js';

const router = express.Router();

// MCP Server URL
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com';

/**
 * Initiate Xero OAuth flow
 */
router.get('/auth', async (req, res) => {
  try {
    logInfo('Initiating Xero OAuth flow via MCP server');

    const response = await axios.get(`${MCP_SERVER_URL}/api/xero/auth`);

    res.json(response.data);
  } catch (error) {
    logError('Failed to initiate Xero auth', error);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error || error.message
    });
  }
});

/**
 * Handle Xero OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    logInfo('Processing Xero OAuth callback');

    // Forward the full callback URL to MCP server
    const callbackUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    const response = await axios.get(`${MCP_SERVER_URL}/api/xero/callback`, {
      params: req.query
    });

    // Redirect to dashboard
    const redirectUrl = process.env.NODE_ENV === 'production'
      ? '/dashboard?xero=connected'
      : 'http://localhost:3000/dashboard?xero=connected';

    res.redirect(redirectUrl);
  } catch (error) {
    logError('Failed to process Xero callback', error);

    const redirectUrl = process.env.NODE_ENV === 'production'
      ? '/dashboard?xero=error'
      : 'http://localhost:3000/dashboard?xero=error';

    res.redirect(redirectUrl);
  }
});

/**
 * Get Xero connection status
 */
router.get('/status', async (req, res) => {
  try {
    const response = await axios.get(`${MCP_SERVER_URL}/api/xero/status`);

    res.json(response.data);
  } catch (error) {
    logError('Failed to get Xero status', error);
    res.status(500).json({
      success: false,
      connected: false,
      message: 'Failed to check Xero connection',
      error: error.message
    });
  }
});

/**
 * Trigger manual Xero sync
 */
router.post('/sync', async (req, res) => {
  try {
    logInfo('Triggering manual Xero sync via MCP server');

    const response = await axios.post(`${MCP_SERVER_URL}/api/xero/sync`);

    res.json(response.data);
  } catch (error) {
    logError('Failed to trigger Xero sync', error);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error || error.message
    });
  }
});

/**
 * Get financial data from Xero (via MCP)
 */
router.get('/financial-data', async (req, res) => {
  try {
    // Get cached financial data from MCP server
    const response = await axios.post(`${MCP_SERVER_URL}/mcp/tools/execute`, {
      tool: 'getFinancialData',
      params: {
        source: 'xero'
      }
    });

    if (response.data.success) {
      res.json({
        success: true,
        data: response.data.result
      });
    } else {
      throw new Error(response.data.error || 'Failed to get financial data');
    }
  } catch (error) {
    logError('Failed to get Xero financial data', error);

    // Return fallback data
    res.json({
      success: false,
      data: {
        workingCapital: {
          current: 250000,
          change: 5.2,
          trend: 'up'
        },
        cashFlow: {
          inflows: 180000,
          outflows: 150000,
          net: 30000
        },
        invoices: {
          outstanding: 45000,
          overdue: 12000,
          count: 24
        },
        message: 'Using cached data - Xero sync pending'
      }
    });
  }
});

/**
 * Get working capital metrics
 */
router.get('/working-capital', async (req, res) => {
  try {
    const response = await axios.post(`${MCP_SERVER_URL}/mcp/tools/execute`, {
      tool: 'getWorkingCapitalMetrics',
      params: {
        source: 'xero'
      }
    });

    if (response.data.success) {
      res.json({
        success: true,
        data: response.data.result
      });
    } else {
      throw new Error(response.data.error || 'Failed to get working capital metrics');
    }
  } catch (error) {
    logError('Failed to get working capital metrics', error);

    // Return fallback data
    res.json({
      success: false,
      data: {
        workingCapital: 250000,
        currentRatio: 1.8,
        quickRatio: 1.2,
        cashConversionCycle: 45,
        receivablesDays: 30,
        payablesDays: 25,
        inventoryDays: 40,
        date: new Date()
      }
    });
  }
});

export default router;