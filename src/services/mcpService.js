/**
 * MCP Server Integration Service
 * Provides cross-branch access to Xero, OpenAI, and Anthropic services
 */

import { logError, logApiCall } from '../lib/logger.js';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://sentia-mcp-server.railway.app';
const MCP_HEALTH_URL = process.env.MCP_HEALTH_URL || 'https://sentia-mcp-server.railway.app/health';

class MCPService {
  constructor() {
    this.baseUrl = MCP_SERVER_URL;
    this.healthUrl = MCP_HEALTH_URL;
  }

  /**
   * Check MCP Server health status
   */
  async checkHealth() {
    try {
      const response = await fetch(this.healthUrl);
      return await response.json();
    } catch (error) {
      logError('MCP Server health check failed', error, { service: 'mcp', operation: 'health_check' });
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Get available providers status
   */
  async getProviders() {
    try {
      const response = await fetch(`${this.baseUrl}/api/providers`);
      return await response.json();
    } catch (error) {
      logError('Failed to fetch MCP providers', error, { service: 'mcp', operation: 'get_providers' });
      return { error: error.message };
    }
  }

  /**
   * Xero Integration Methods
   */
  async xeroGetContacts(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${this.baseUrl}/api/xero/contacts?${queryString}`);
      return await response.json();
    } catch (error) {
      logError('Failed to fetch Xero contacts via MCP', error, { service: 'mcp', provider: 'xero', operation: 'get_contacts' });
      return { error: error.message };
    }
  }

  async xeroGetInvoices(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${this.baseUrl}/api/xero/invoices?${queryString}`);
      return await response.json();
    } catch (error) {
      logError('Failed to fetch Xero invoices via MCP', error, { service: 'mcp', provider: 'xero', operation: 'get_invoices' });
      return { error: error.message };
    }
  }

  async xeroGetItems() {
    try {
      const response = await fetch(`${this.baseUrl}/api/xero/items`);
      return await response.json();
    } catch (error) {
      logError('Failed to fetch Xero items via MCP', error, { service: 'mcp', provider: 'xero', operation: 'get_items' });
      return { error: error.message };
    }
  }

  async xeroCreateInvoice(invoiceData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/xero/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      return await response.json();
    } catch (error) {
      logError('Failed to create Xero invoice via MCP', error, { service: 'mcp', provider: 'xero', operation: 'create_invoice' });
      return { error: error.message };
    }
  }

  /**
   * OpenAI Integration Methods
   */
  async openaiGenerateText(prompt, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/openai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, ...options }),
      });
      return await response.json();
    } catch (error) {
      logError('Failed to generate OpenAI text via MCP', error, { service: 'mcp', provider: 'openai', operation: 'generate_text' });
      return { error: error.message };
    }
  }

  async openaiAnalyzeData(data, analysisType) {
    try {
      const response = await fetch(`${this.baseUrl}/api/openai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, analysisType }),
      });
      return await response.json();
    } catch (error) {
      logError('Failed to analyze data with OpenAI via MCP', error, { service: 'mcp', provider: 'openai', operation: 'analyze_data' });
      return { error: error.message };
    }
  }

  async openaiCreateEmbedding(text) {
    try {
      const response = await fetch(`${this.baseUrl}/api/openai/embedding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      return await response.json();
    } catch (error) {
      logError('Failed to create OpenAI embedding via MCP', error, { service: 'mcp', provider: 'openai', operation: 'create_embedding' });
      return { error: error.message };
    }
  }

  /**
   * Anthropic Integration Methods
   */
  async anthropicAnalyzeManufacturing(data, analysisType) {
    try {
      const response = await fetch(`${this.baseUrl}/api/anthropic/manufacturing/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, analysisType }),
      });
      return await response.json();
    } catch (error) {
      logError('Failed to analyze manufacturing with Anthropic via MCP', error, { service: 'mcp', provider: 'anthropic', operation: 'analyze_manufacturing' });
      return { error: error.message };
    }
  }

  async anthropicOptimizeProcess(processData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/anthropic/process/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processData),
      });
      return await response.json();
    } catch (error) {
      logError('Failed to optimize process with Anthropic via MCP', error, { service: 'mcp', provider: 'anthropic', operation: 'optimize_process' });
      return { error: error.message };
    }
  }

  async anthropicGenerateInsights(context) {
    try {
      const response = await fetch(`${this.baseUrl}/api/anthropic/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context }),
      });
      return await response.json();
    } catch (error) {
      logError('Failed to generate insights with Anthropic via MCP', error, { service: 'mcp', provider: 'anthropic', operation: 'generate_insights' });
      return { error: error.message };
    }
  }
}

// Export singleton instance
export const mcpService = new MCPService();

// Export class for testing
export default MCPService;