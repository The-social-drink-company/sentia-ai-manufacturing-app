import xeroService from '../../services/xeroService.js';
import aiAnalyticsService from '../../services/aiAnalyticsService.js';
import MCPOrchestrator from '../../services/mcp/mcpOrchestrator.js';
import { logInfo, logError } from '../../services/observability/structuredLogger.js';

// Initialize MCP Orchestrator for Anthropic Model Context Protocol
const mcpOrchestrator = new MCPOrchestrator();

export async function initializeServices() {
  logInfo('Initializing enterprise services');
  
  try {
    // Initialize MCP Server
    await initializeMCPServer();
    
    // Initialize Xero service
    const xeroHealth = await xeroService.healthCheck();
    logInfo('Xero Service initialized', { 
      status: xeroHealth.status, 
      message: xeroHealth.message || 'Ready' 
    });
    
    // Initialize AI Analytics service
    const aiHealth = await aiAnalyticsService.healthCheck();
    logInfo('AI Analytics initialized', { 
      status: aiHealth.status, 
      message: 'Vector database ready' 
    });
    
    logInfo('All enterprise services initialized successfully');
    
  } catch (error) {
    logError('Service initialization error', error);
    throw error;
  }
}

async function initializeMCPServer() {
  try {
    const mcpServerConfig = {
      id: 'sentia-mcp-server',
      name: 'Sentia MCP Server',
      type: 'manufacturing-finance',
      endpoint: 'http://localhost:6002',
      transport: 'http',
      capabilities: ['xero-integration', 'financial-data', 'real-time-sync', 'ai-analysis'],
      dataTypes: ['financial', 'manufacturing', 'forecasting', 'optimization'],
      updateInterval: 30000
    };
    
    const result = await mcpOrchestrator.registerMCPServer(mcpServerConfig);
    
    if (result.success) {
      logInfo('MCP Server registered successfully', { serverId: result.serverId });
    } else {
      logError('Failed to register MCP Server', { error: result.error });
    }
    
  } catch (error) {
    logError('MCP Server registration error', error);
  }
}

// Graceful shutdown of services
export async function shutdownServices() {
  logInfo('Shutting down enterprise services');
  
  try {
    // Add cleanup for any services that need it
    logInfo('Services shutdown complete');
  } catch (error) {
    logError('Error during service shutdown', error);
  }
}