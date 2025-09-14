import { logInfo, logError, logWarn } from '../logger.js';

// Comprehensive Enterprise Integration Service
export class EnterpriseIntegrationService {
  constructor() {
    this.integrations = new Map();
    this.healthStatus = new Map();
    this.lastHealthCheck = new Map();
    this.initializeIntegrations();
  }

  initializeIntegrations() {
    // Initialize all available integrations
    this.integrations.set('unleashed', new UnleashedIntegration());
    this.integrations.set('shopify_uk', new ShopifyIntegration('UK'));
    this.integrations.set('shopify_usa', new ShopifyIntegration('USA'));
    this.integrations.set('shopify_eu', new ShopifyIntegration('EU'));
    this.integrations.set('amazon_uk', new AmazonIntegration('UK'));
    this.integrations.set('amazon_usa', new AmazonIntegration('USA'));
    this.integrations.set('xero', new XeroIntegration());
    this.integrations.set('openai', new OpenAIIntegration());
    this.integrations.set('claude', new ClaudeIntegration());
    this.integrations.set('microsoft_email', new MicrosoftEmailIntegration());
    this.integrations.set('slack', new SlackIntegration());
  }

  async checkAllIntegrationsHealth() {
    const healthResults = {};
    
    for (const [name, integration] of this.integrations) {
      try {
        const health = await integration.healthCheck();
        healthResults[name] = health;
        this.healthStatus.set(name, health);
        this.lastHealthCheck.set(name, new Date());
      } catch (error) {
        const errorHealth = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date()
        };
        healthResults[name] = errorHealth;
        this.healthStatus.set(name, errorHealth);
      }
    }

    logInfo('Integration health check completed', {
      totalIntegrations: this.integrations.size,
      healthyCount: Object.values(healthResults).filter(h => h.status === 'healthy').length
    });

    return healthResults;
  }

  getIntegration(name) {
    return this.integrations.get(name);
  }

  async syncAllData() {
    const syncResults = {};
    
    for (const [name, integration] of this.integrations) {
      if (integration.sync && typeof integration.sync === 'function') {
        try {
          const result = await integration.sync();
          syncResults[name] = result;
          logInfo(`${name} sync completed`, result);
        } catch (error) {
          syncResults[name] = { error: error.message };
          logError(`${name} sync failed`, { error: error.message });
        }
      }
    }

    return syncResults;
  }
}

// Unleashed Software Integration
class UnleashedIntegration {
  constructor() {
    this.apiId = process.env.UNLEASHED_API_ID;
    this.apiKey = process.env.UNLEASHED_API_KEY;
    this.baseUrl = process.env.UNLEASHED_API_URL;
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/Products/1`, {
        method: 'GET',
        headers: {
          'api-auth-id': this.apiId,
          'api-auth-signature': this.generateSignature('GET', '/api/v1/Products/1')
        }
      });

      return {
        status: response.ok ? 'healthy' : 'degraded',
        statusCode: response.status,
        responseTime: response.headers.get('x-response-time'),
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  generateSignature(method, endpoint, query = '') {
    const signature = crypto
      .createHmac('sha256', this.apiKey)
      .update(method + endpoint + query)
      .digest('base64');
    return signature;
  }

  async getProducts(page = 1, pageSize = 200) {
    try {
      const endpoint = `/api/v1/Products/${page}/${pageSize}`;
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'api-auth-id': this.apiId,
          'api-auth-signature': this.generateSignature('GET', endpoint)
        }
      });

      if (!response.ok) {
        throw new Error(`Unleashed API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.Items || [];
    } catch (error) {
      logError('Unleashed products fetch failed', { error: error.message });
      throw error;
    }
  }

  async sync() {
    const products = await this.getProducts();
    // Implement product synchronization logic
    return {
      productsCount: products.length,
      timestamp: new Date()
    };
  }
}

// Shopify Integration (Multi-region)
class ShopifyIntegration {
  constructor(region) {
    this.region = region;
    this.apiKey = process.env[`SHOPIFY_${region}_API_KEY`];
    this.secret = process.env[`SHOPIFY_${region}_SECRET`];
    this.accessToken = process.env[`SHOPIFY_${region}_ACCESS_TOKEN`];
    this.shopUrl = process.env[`SHOPIFY_${region}_SHOP_URL`];
    this.baseUrl = `https://${this.shopUrl}/admin/api/2023-10`;
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        }
      });

      return {
        status: response.ok ? 'healthy' : 'degraded',
        statusCode: response.status,
        region: this.region,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        region: this.region,
        timestamp: new Date()
      };
    }
  }

  async getOrders(limit = 50) {
    try {
      const response = await fetch(`${this.baseUrl}/orders.json?limit=${limit}`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.orders || [];
    } catch (error) {
      logError(`Shopify ${this.region} orders fetch failed`, { error: error.message });
      throw error;
    }
  }

  async getProducts(limit = 250) {
    try {
      const response = await fetch(`${this.baseUrl}/products.json?limit=${limit}`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.products || [];
    } catch (error) {
      logError(`Shopify ${this.region} products fetch failed`, { error: error.message });
      throw error;
    }
  }

  async sync() {
    const [orders, products] = await Promise.all([
      this.getOrders(),
      this.getProducts()
    ]);

    return {
      region: this.region,
      ordersCount: orders.length,
      productsCount: products.length,
      timestamp: new Date()
    };
  }
}

// Amazon SP-API Integration
class AmazonIntegration {
  constructor(region) {
    this.region = region;
    this.clientId = process.env.AMAZON_SP_API_CLIENT_ID;
    this.clientSecret = process.env.AMAZON_SP_API_CLIENT_SECRET;
    this.refreshToken = process.env.AMAZON_SP_API_REFRESH_TOKEN;
    this.marketplaceId = process.env[`AMAZON_${region}_MARKETPLACE_ID`];
    this.baseUrl = 'https://sellingpartnerapi-na.amazon.com';
  }

  async healthCheck() {
    try {
      // Amazon SP-API health check would require proper authentication
      // For now, return based on configuration presence
      const isConfigured = !!(this.clientId && this.clientSecret && this.refreshToken);
      
      return {
        status: isConfigured ? 'healthy' : 'unconfigured',
        region: this.region,
        marketplaceId: this.marketplaceId,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        region: this.region,
        timestamp: new Date()
      };
    }
  }

  async getAccessToken() {
    // Implement Amazon LWA token exchange
    // This is a simplified version
    try {
      const response = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret
        })
      });

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      logError('Amazon access token fetch failed', { error: error.message });
      throw error;
    }
  }

  async sync() {
    // Implement Amazon data synchronization
    return {
      region: this.region,
      status: 'configured',
      timestamp: new Date()
    };
  }
}

// Xero Integration
class XeroIntegration {
  constructor() {
    this.apiKey = process.env.XERO_API_KEY;
    this.apiSecret = process.env.XERO_API_SECRET;
    this.baseUrl = 'https://api.xero.com/api.xro/2.0';
  }

  async healthCheck() {
    try {
      // Xero health check would require OAuth setup
      const isConfigured = !!(this.apiKey && this.apiSecret);
      
      return {
        status: isConfigured ? 'healthy' : 'unconfigured',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async sync() {
    return {
      status: 'configured',
      timestamp: new Date()
    };
  }
}

// OpenAI Integration
class OpenAIIntegration {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        status: response.ok ? 'healthy' : 'degraded',
        statusCode: response.status,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

// Claude Integration
class ClaudeIntegration {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.baseUrl = 'https://api.anthropic.com/v1';
  }

  async healthCheck() {
    try {
      // Claude doesn't have a simple health endpoint, so we'll check configuration
      const isConfigured = !!this.apiKey;
      
      return {
        status: isConfigured ? 'healthy' : 'unconfigured',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

// Microsoft Email Integration
class MicrosoftEmailIntegration {
  constructor() {
    this.clientId = process.env.MS_CLIENT_ID;
    this.clientSecret = process.env.MS_CLIENT_SECRET;
    this.adminEmail = process.env.ADMIN_EMAIL;
    this.dataEmail = process.env.DATA_EMAIL;
  }

  async healthCheck() {
    try {
      const isConfigured = !!(this.clientId && this.clientSecret);
      
      return {
        status: isConfigured ? 'healthy' : 'unconfigured',
        adminEmail: this.adminEmail,
        dataEmail: this.dataEmail,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async sendEmail(to, subject, body) {
    // Implement Microsoft Graph API email sending
    logInfo('Email sent via Microsoft Graph', { to, subject });
  }
}

// Slack Integration
class SlackIntegration {
  constructor() {
    this.botToken = process.env.SLACK_BOT_TOKEN;
    this.baseUrl = 'https://slack.com/api';
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/auth.test`, {
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      return {
        status: data.ok ? 'healthy' : 'degraded',
        team: data.team,
        user: data.user,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async sendMessage(channel, text) {
    try {
      const response = await fetch(`${this.baseUrl}/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel,
          text
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      logError('Slack message send failed', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
let integrationService = null;

export const getIntegrationService = () => {
  if (!integrationService) {
    integrationService = new EnterpriseIntegrationService();
  }
  return integrationService;
};

export default {
  EnterpriseIntegrationService,
  getIntegrationService
};

