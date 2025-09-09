#!/usr/bin/env node

/**
 * MCP (Model Context Protocol) Server for Xero Integration
 * Provides secure, standardized access to Xero API for the manufacturing dashboard
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

class MCPServer {
  constructor() {
    this.app = express();
    this.port = process.env.MCP_SERVER_PORT || 6002;
    this.mainServerUrl = process.env.MAIN_SERVER_URL || 'http://localhost:5001';
    this.llmApiKey = process.env.OPENAI_API_KEY || process.env.CLAUDE_API_KEY;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors({
      origin: [
        'https://sentia-manufacturing-dashboard-development.up.railway.app',
        'https://sentia-manufacturing-dashboard-testing.up.railway.app',
        'https://sentia-manufacturing-dashboard-production.up.railway.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ],
      credentials: true
    }));
    
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        service: 'mcp-server',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // MCP Server status
    this.app.get('/mcp/status', (req, res) => {
      res.json({
        mcp: {
          status: 'connected',
          protocol: 'mcp-1.0',
          capabilities: ['xero-integration', 'financial-data', 'real-time-sync']
        },
        xero: {
          status: this.isXeroConfigured() ? 'configured' : 'not-configured',
          lastSync: new Date().toISOString()
        },
        connections: {
          active: 1,
          healthy: true
        }
      });
    });

    // Xero integration endpoints
    this.app.get('/mcp/xero/balance-sheet', async (req, res) => {
      try {
        const data = await this.getXeroBalanceSheet();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/mcp/xero/cash-flow', async (req, res) => {
      try {
        const data = await this.getXeroCashFlow();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/mcp/xero/profit-loss', async (req, res) => {
      try {
        const data = await this.getXeroProfitLoss();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // MCP Protocol endpoints
    this.app.post('/mcp/initialize', (req, res) => {
      res.json({
        jsonrpc: '2.0',
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'Sentia MCP Server',
            version: '1.0.0',
            capabilities: ['xero-integration', 'financial-data', 'real-time-sync', 'ai-analysis']
          }
        },
        id: req.body.id
      });
    });

    this.app.post('/mcp/resources/list', (req, res) => {
      const resources = [
        {
          uri: 'xero://balance-sheet',
          name: 'Xero Balance Sheet',
          description: 'Current balance sheet data from Xero',
          mimeType: 'application/json'
        },
        {
          uri: 'xero://cash-flow',
          name: 'Xero Cash Flow',
          description: 'Cash flow statement from Xero',
          mimeType: 'application/json'
        },
        {
          uri: 'xero://profit-loss',
          name: 'Xero Profit & Loss',
          description: 'Profit and loss statement from Xero',
          mimeType: 'application/json'
        }
      ];

      res.json({
        jsonrpc: '2.0',
        result: { resources },
        id: req.body.id
      });
    });

    this.app.post('/mcp/resources/read', async (req, res) => {
      try {
        const { uri } = req.body.params;
        let contents;

        switch (uri) {
          case 'xero://balance-sheet':
            contents = await this.getXeroBalanceSheet();
            break;
          case 'xero://cash-flow':
            contents = await this.getXeroCashFlow();
            break;
          case 'xero://profit-loss':
            contents = await this.getXeroProfitLoss();
            break;
          default:
            throw new Error(`Unknown resource URI: ${uri}`);
        }

        res.json({
          jsonrpc: '2.0',
          result: { contents },
          id: req.body.id
        });
      } catch (error) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { message: error.message },
          id: req.body.id
        });
      }
    });

    this.app.post('/mcp/tools/call', async (req, res) => {
      try {
        const { name: toolName, arguments: args } = req.body.params;
        let result;

        switch (toolName) {
          case 'query_manufacturing_data':
            result = await this.proxyToMainServer('/api/analytics/kpis', args);
            break;
          case 'optimize_inventory':
            result = await this.proxyToMainServer('/api/optimization/inventory', args, 'POST');
            break;
          case 'generate_forecast':
            result = await this.proxyToMainServer('/api/forecasting/demand', args);
            break;
          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }

        res.json({
          jsonrpc: '2.0',
          result,
          id: req.body.id
        });
      } catch (error) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { message: error.message },
          id: req.body.id
        });
      }
    });

    // Data synchronization endpoints
    this.app.post('/mcp/sync', async (req, res) => {
      try {
        const result = await this.syncXeroData();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // API integration endpoints - Connect to main server APIs
    this.app.get('/mcp/api/optimization/:endpoint', async (req, res) => {
      try {
        const { endpoint } = req.params;
        const data = await this.proxyToMainServer(`/api/optimization/${endpoint}`, req.query);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/mcp/api/optimization/:endpoint', async (req, res) => {
      try {
        const { endpoint } = req.params;
        const data = await this.proxyToMainServer(`/api/optimization/${endpoint}`, req.body, 'POST');
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/mcp/api/forecasting/:endpoint', async (req, res) => {
      try {
        const { endpoint } = req.params;
        const data = await this.proxyToMainServer(`/api/forecasting/${endpoint}`, req.query);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/mcp/api/forecasting/:endpoint', async (req, res) => {
      try {
        const { endpoint } = req.params;
        const data = await this.proxyToMainServer(`/api/forecasting/${endpoint}`, req.body, 'POST');
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/mcp/api/analytics/:endpoint', async (req, res) => {
      try {
        const { endpoint } = req.params;
        const data = await this.proxyToMainServer(`/api/analytics/${endpoint}`, req.query);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // LLM Integration endpoints
    this.app.post('/mcp/llm/analyze', async (req, res) => {
      try {
        const { data, prompt, model } = req.body;
        const analysis = await this.queryLLM(data, prompt, model);
        res.json(analysis);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/mcp/llm/optimize', async (req, res) => {
      try {
        const { scenario, constraints, model } = req.body;
        const optimization = await this.optimizeWithLLM(scenario, constraints, model);
        res.json(optimization);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/mcp/llm/forecast', async (req, res) => {
      try {
        const { historicalData, parameters, model } = req.body;
        const forecast = await this.forecastWithLLM(historicalData, parameters, model);
        res.json(forecast);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  isXeroConfigured() {
    return !!(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET);
  }

  async getXeroBalanceSheet() {
    if (!this.isXeroConfigured()) {
      throw new Error('Xero API credentials not configured. Real financial data required - no mock data available. Please configure XERO_CLIENT_ID and XERO_CLIENT_SECRET environment variables.');
    }
    
    // Real Xero API integration required
    throw new Error('Xero Balance Sheet API integration not yet implemented. Real data connection required - mock data has been eliminated per enterprise requirements.');
  }

  async getXeroCashFlow() {
    if (!this.isXeroConfigured()) {
      throw new Error('Xero API credentials not configured. Real financial data required - no mock data available. Please configure XERO_CLIENT_ID and XERO_CLIENT_SECRET environment variables.');
    }
    
    // Real Xero API integration required
    throw new Error('Xero Cash Flow API integration not yet implemented. Real data connection required - mock data has been eliminated per enterprise requirements.');
  }

  async getXeroProfitLoss() {
    if (!this.isXeroConfigured()) {
      throw new Error('Xero API credentials not configured. Real financial data required - no mock data available. Please configure XERO_CLIENT_ID and XERO_CLIENT_SECRET environment variables.');
    }
    
    // Real Xero API integration required
    throw new Error('Xero Profit & Loss API integration not yet implemented. Real data connection required - mock data has been eliminated per enterprise requirements.');
  }

  async syncXeroData() {
    if (!this.isXeroConfigured()) {
      throw new Error('Xero API credentials not configured. Real data synchronization required - no mock data available. Please configure XERO_CLIENT_ID and XERO_CLIENT_SECRET environment variables.');
    }
    
    // Real Xero API synchronization required
    throw new Error('Xero data synchronization not yet implemented. Real API integration required - mock data has been eliminated per enterprise requirements.');
  }

  // API Proxy Methods - Connect MCP to main server APIs
  async proxyToMainServer(endpoint, data, method = 'GET') {
    try {
      const url = `${this.mainServerUrl}${endpoint}`;
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MCP-Server/1.0.0'
        }
      };

      if (method === 'POST' || method === 'PUT') {
        config.body = JSON.stringify(data);
      } else if (method === 'GET' && data) {
        const params = new URLSearchParams(data);
        url += `?${params}`;
      }

      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`Main server API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`MCP Proxy Error for ${endpoint}:`, error.message);
      throw error;
    }
  }

  // LLM Integration Methods - Connect to OpenAI/Claude APIs
  async queryLLM(data, prompt, model = 'gpt-4') {
    if (!this.llmApiKey) {
      throw new Error('LLM API key not configured');
    }

    try {
      const messages = [
        {
          role: 'system',
          content: 'You are an expert manufacturing and financial analyst. Analyze the provided data and respond with structured insights in JSON format.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nData to analyze:\n${JSON.stringify(data, null, 2)}`
        }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.llmApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      return {
        analysis: result.choices[0].message.content,
        model: model,
        timestamp: new Date().toISOString(),
        usage: result.usage
      };
    } catch (error) {
      console.error('LLM Query Error:', error.message);
      throw error;
    }
  }

  async optimizeWithLLM(scenario, constraints, model = 'gpt-4') {
    const prompt = `Analyze the following manufacturing scenario and provide optimization recommendations:
    
    Scenario: ${JSON.stringify(scenario)}
    Constraints: ${JSON.stringify(constraints)}
    
    Please provide:
    1. Key optimization opportunities
    2. Recommended actions with priority levels
    3. Expected impact on KPIs
    4. Implementation timeline
    
    Respond in structured JSON format.`;

    return await this.queryLLM({ scenario, constraints }, prompt, model);
  }

  async forecastWithLLM(historicalData, parameters, model = 'gpt-4') {
    const prompt = `Based on the historical manufacturing data provided, generate demand forecasts:
    
    Parameters: ${JSON.stringify(parameters)}
    
    Please provide:
    1. 30-day demand forecast with confidence intervals
    2. Key trends identified in the data
    3. Risk factors and assumptions
    4. Recommended inventory levels
    
    Respond in structured JSON format with numerical forecasts.`;

    return await this.queryLLM(historicalData, prompt, model);
  }

  start() {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`[MCP-SERVER] Running on port ${this.port}`);
      console.log(`[MCP-SERVER] Health check: http://localhost:${this.port}/health`);
      console.log(`[MCP-SERVER] Xero configured: ${this.isXeroConfigured()}`);
    });
  }
}

const server = new MCPServer();
server.start();

export default MCPServer;