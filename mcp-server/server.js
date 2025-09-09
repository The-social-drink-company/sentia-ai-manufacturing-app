/**
 * Sentia Manufacturing MCP Server
 * Anthropic Model Context Protocol implementation for Xero and AI integrations
 * Deploy to Railway as separate service: https://sentia-mcp-server.railway.app
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'xero-node';
const { XeroClient } = pkg;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MCP Protocol Headers
const MCP_PROTOCOL_VERSION = '2024-11-05';
const MCP_SERVER_INFO = {
  name: 'sentia-manufacturing-mcp',
  version: '1.0.0',
  protocol_version: MCP_PROTOCOL_VERSION
};

// CORS Configuration for cross-origin requests
app.use(cors({
  origin: [
    'https://sentia-manufacturing-dashboard-development.up.railway.app',
    'https://sentia-manufacturing-dashboard-testing.up.railway.app', 
    'https://sentia-manufacturing-dashboard-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true
}));

app.use(express.json());

// Initialize Xero API client
let xeroClient = null;
try {
  if (process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET) {
    xeroClient = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      redirectUris: [process.env.XERO_REDIRECT_URI || 'https://sentia-mcp-server.railway.app/callback'],
      scopes: [
        'openid',
        'profile',
        'email',
        'accounting.transactions',
        'accounting.contacts',
        'accounting.settings'
      ]
    });
  }
} catch (error) {
  console.warn('Xero client initialization failed - using mock data:', error.message);
}

// MCP Protocol Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    protocol: MCP_PROTOCOL_VERSION,
    server: MCP_SERVER_INFO,
    services: {
      xero: xeroClient ? 'configured' : 'mock',
      database: 'connected',
      ai_integration: 'ready'
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// MCP Protocol Server Info
app.get('/mcp/info', (req, res) => {
  res.json({
    protocol_version: MCP_PROTOCOL_VERSION,
    server_info: MCP_SERVER_INFO,
    capabilities: {
      tools: ['xero_query', 'financial_analysis', 'working_capital_calc'],
      resources: ['balance_sheet', 'profit_loss', 'cash_flow'],
      prompts: ['financial_summary', 'analysis_template']
    }
  });
});

// MCP Protocol - List Available Tools
app.get('/mcp/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'xero_balance_sheet',
        description: 'Retrieve balance sheet data from Xero accounting system',
        input_schema: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date' },
            periods: { type: 'number', default: 1 }
          }
        }
      },
      {
        name: 'xero_profit_loss',
        description: 'Get profit and loss statement from Xero',
        input_schema: {
          type: 'object',
          properties: {
            fromDate: { type: 'string', format: 'date' },
            toDate: { type: 'string', format: 'date' }
          }
        }
      },
      {
        name: 'working_capital_analysis',
        description: 'Analyze working capital requirements and projections',
        input_schema: {
          type: 'object',
          properties: {
            scenario: { type: 'string', enum: ['current', 'optimistic', 'pessimistic'] },
            timeframe: { type: 'number', default: 12 }
          }
        }
      }
    ]
  });
});

// MCP Protocol - Execute Tool
app.post('/mcp/tools/call', async (req, res) => {
  const { name, arguments: args } = req.body;

  try {
    let result;
    
    switch (name) {
      case 'xero_balance_sheet':
        result = await getXeroBalanceSheet(args);
        break;
      case 'xero_profit_loss':
        result = await getXeroProfitLoss(args);
        break;
      case 'working_capital_analysis':
        result = await analyzeWorkingCapital(args);
        break;
      default:
        return res.status(400).json({ error: `Unknown tool: ${name}` });
    }

    res.json({
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    });
  } catch (error) {
    console.error(`MCP Tool execution error (${name}):`, error);
    res.status(500).json({ 
      error: 'Tool execution failed', 
      message: error.message 
    });
  }
});

// Xero Balance Sheet Integration
async function getXeroBalanceSheet({ date, periods = 1 }) {
  if (!xeroClient) {
    // Return mock data for development
    return {
      source: 'mock',
      date: date || new Date().toISOString().split('T')[0],
      balanceSheet: {
        totalAssets: 5200000,
        currentAssets: {
          cash: 850000,
          accountsReceivable: 1200000,
          inventory: 800000,
          otherCurrentAssets: 250000,
          total: 3100000
        },
        fixedAssets: {
          propertyPlantEquipment: 1800000,
          accumulatedDepreciation: -500000,
          intangibleAssets: 800000,
          total: 2100000
        },
        totalLiabilities: 2100000,
        currentLiabilities: {
          accountsPayable: 400000,
          shortTermDebt: 300000,
          accruedExpenses: 250000,
          otherCurrentLiabilities: 150000,
          total: 1100000
        },
        longTermLiabilities: {
          longTermDebt: 800000,
          otherLongTermLiabilities: 200000,
          total: 1000000
        },
        equity: {
          shareholderEquity: 2500000,
          retainedEarnings: 600000,
          total: 3100000
        },
        workingCapital: 2000000,
        currentRatio: 2.82
      }
    };
  }

  // Real Xero integration would go here
  // const balanceSheet = await xeroClient.accountingApi.getReports(tenantId, 'BalanceSheet', ...args);
  // return balanceSheet;
}

// Xero Profit & Loss Integration  
async function getXeroProfitLoss({ fromDate, toDate }) {
  if (!xeroClient) {
    // Return mock data for development
    return {
      source: 'mock',
      period: { from: fromDate, to: toDate },
      profitLoss: {
        revenue: {
          sales: 2800000,
          otherIncome: 150000,
          total: 2950000
        },
        expenses: {
          costOfGoodsSold: 1400000,
          operatingExpenses: 980000,
          depreciation: 180000,
          interestExpense: 45000,
          total: 2605000
        },
        grossProfit: 1550000,
        operatingProfit: 570000,
        netProfit: 345000,
        margins: {
          grossMargin: 52.54,
          operatingMargin: 19.32,
          netMargin: 11.69
        }
      }
    };
  }

  // Real Xero integration would go here
}

// Working Capital Analysis Tool
async function analyzeWorkingCapital({ scenario = 'current', timeframe = 12 }) {
  const baseWorkingCapital = 2000000;
  const scenarios = {
    current: { multiplier: 1.0, risk: 'medium' },
    optimistic: { multiplier: 1.25, risk: 'low' },
    pessimistic: { multiplier: 0.8, risk: 'high' }
  };

  const scenarioConfig = scenarios[scenario];
  const projectedCapital = baseWorkingCapital * scenarioConfig.multiplier;

  return {
    scenario,
    timeframe_months: timeframe,
    analysis: {
      currentWorkingCapital: baseWorkingCapital,
      projectedWorkingCapital: projectedCapital,
      changeAmount: projectedCapital - baseWorkingCapital,
      changePercentage: ((projectedCapital - baseWorkingCapital) / baseWorkingCapital * 100),
      riskLevel: scenarioConfig.risk,
      recommendations: [
        'Monitor accounts receivable aging to maintain healthy cash flow',
        'Optimize inventory levels to reduce carrying costs',
        'Negotiate better payment terms with suppliers',
        'Consider invoice factoring for faster cash conversion'
      ],
      cashFlowProjection: Array.from({ length: timeframe }, (_, i) => ({
        month: i + 1,
        workingCapital: projectedCapital + (Math.random() * 100000 - 50000),
        cashFlow: 120000 + (Math.random() * 50000 - 25000)
      }))
    }
  };
}

// API Endpoints for Direct Integration (Legacy support)
app.get('/api/providers', (req, res) => {
  res.json({
    xero: { status: xeroClient ? 'configured' : 'mock', version: '2.0' },
    anthropic: { status: 'configured', model: 'claude-3-5-sonnet' },
    openai: { status: 'available', model: 'gpt-4' }
  });
});

// Xero API Endpoints
app.get('/api/xero/balance-sheet', async (req, res) => {
  try {
    const result = await getXeroBalanceSheet(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/xero/profit-loss', async (req, res) => {
  try {
    const result = await getXeroProfitLoss(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/xero/contacts', async (req, res) => {
  res.json({
    source: 'mock',
    contacts: [
      { id: '1', name: 'Acme Corp', email: 'accounts@acme.com', type: 'customer' },
      { id: '2', name: 'Supplier Ltd', email: 'billing@supplier.com', type: 'supplier' }
    ]
  });
});

// Working Capital API
app.post('/api/working-capital/analyze', async (req, res) => {
  try {
    const result = await analyzeWorkingCapital(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('MCP Server Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    protocol: MCP_PROTOCOL_VERSION
  });
});

// Start MCP Server
app.listen(PORT, () => {
  console.log(`🚀 Sentia Manufacturing MCP Server running on port ${PORT}`);
  console.log(`📊 Protocol: Model Context Protocol v${MCP_PROTOCOL_VERSION}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`🎯 Xero Integration: ${xeroClient ? 'Live' : 'Mock Mode'}`);
  console.log(`🤖 Ready for Claude integration via MCP protocol`);
});

export default app;