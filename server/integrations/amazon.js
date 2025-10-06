/**
 * Amazon SP-API Integration Service
 * Enterprise-grade marketplace data integration
 * Part of Phase 3.1: E-commerce Platform Integration
 */

import crypto from 'crypto';

class AmazonIntegration {
  constructor(config = {}) {
    this.regions = {
      uk: {
        marketplaceId: config.UK_MARKETPLACE_ID || process.env.AMAZON_UK_MARKETPLACE_ID || 'A1F83G8C2ARO7P',
        endpoint: 'https://sellingpartnerapi-eu.amazon.com',
        accessKeyId: config.UK_ACCESS_KEY_ID || process.env.AMAZON_UK_ACCESS_KEY_ID,
        secretAccessKey: config.UK_SECRET_ACCESS_KEY || process.env.AMAZON_UK_SECRET_ACCESS_KEY,
        roleArn: config.UK_ROLE_ARN || process.env.AMAZON_UK_ROLE_ARN,
        clientId: config.UK_CLIENT_ID || process.env.AMAZON_UK_CLIENT_ID,
        clientSecret: config.UK_CLIENT_SECRET || process.env.AMAZON_UK_CLIENT_SECRET,
        refreshToken: config.UK_REFRESH_TOKEN || process.env.AMAZON_UK_REFRESH_TOKEN,
        region: 'EU',
        currency: 'GBP',
        timezone: 'Europe/London'
      },
      usa: {
        marketplaceId: config.USA_MARKETPLACE_ID || process.env.AMAZON_USA_MARKETPLACE_ID || 'ATVPDKIKX0DER',
        endpoint: 'https://sellingpartnerapi-na.amazon.com',
        accessKeyId: config.USA_ACCESS_KEY_ID || process.env.AMAZON_USA_ACCESS_KEY_ID,
        secretAccessKey: config.USA_SECRET_ACCESS_KEY || process.env.AMAZON_USA_SECRET_ACCESS_KEY,
        roleArn: config.USA_ROLE_ARN || process.env.AMAZON_USA_ROLE_ARN,
        clientId: config.USA_CLIENT_ID || process.env.AMAZON_USA_CLIENT_ID,
        clientSecret: config.USA_CLIENT_SECRET || process.env.AMAZON_USA_CLIENT_SECRET,
        refreshToken: config.USA_REFRESH_TOKEN || process.env.AMAZON_USA_REFRESH_TOKEN,
        region: 'NA',
        currency: 'USD',
        timezone: 'America/New_York'
      }
    };

    this.apiVersion = 'v0';
    this.rateLimits = {
      uk: { remaining: 100, resetTime: Date.now() + 60000 },
      usa: { remaining: 100, resetTime: Date.now() + 60000 }
    };

    this.accessTokens = {
      uk: { token: null, expiresAt: 0 },
      usa: { token: null, expiresAt: 0 }
    };
  }

  /**
   * Generate AWS Signature v4 for SP-API requests
   */
  generateSignature(method, url, headers, payload, region) {
    const service = 'execute-api';
    const datetime = new Date().toISOString().replace(/[:/-]|\.\d{3}/g, '').replace(/-/g, '');
    const date = datetime.substr(0, 8);

    // Create canonical request
    const canonicalUri = new URL(url).pathname;
    const canonicalQueryString = new URL(url).searchParams.toString();
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map(key => `${key.toLowerCase()}:${headers[key]}`)
      .join('\n') + '\n';
    const signedHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase())
      .join(';');
    const payloadHash = crypto.createHash('sha256').update(payload || '').digest('hex');

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');

    // Create string to sign
    const credentialScope = `${date}/${region}/${service}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      datetime,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');

    // Calculate signature
    const kDate = crypto.createHmac('sha256', `AWS4${this.regions[region === 'eu-west-1' ? 'uk' : 'usa'].secretAccessKey}`).update(date).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    return {
      authorization: `AWS4-HMAC-SHA256 Credential=${this.regions[region === 'eu-west-1' ? 'uk' : 'usa'].accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      datetime
    };
  }

  /**
   * Get access token for SP-API requests
   */
  async getAccessToken(region) {
    const regionConfig = this.regions[region];
    const now = Date.now();

    // Return cached token if still valid
    if (this.accessTokens[region].token && now < this.accessTokens[region].expiresAt) {
      return this.accessTokens[region].token;
    }

    try {
      const response = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: regionConfig.refreshToken,
          client_id: regionConfig.clientId,
          client_secret: regionConfig.clientSecret
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the token
      this.accessTokens[region] = {
        token: data.access_token,
        expiresAt: now + (data.expires_in * 1000) - 60000 // Subtract 1 minute for safety
      };

      return data.access_token;
    } catch (error) {
      console.error(`Failed to get access token for ${region}:`, error);
      throw error;
    }
  }

  /**
   * Make authenticated request to Amazon SP-API
   */
  async makeRequest(region, endpoint, options = {}) {
    const regionConfig = this.regions[region];
    if (!regionConfig?.accessKeyId || !regionConfig?.secretAccessKey) {
      throw new Error(`Amazon ${region.toUpperCase()} credentials not configured`);
    }

    // Check rate limits
    if (this.rateLimits[region].remaining <= 0 && Date.now() < this.rateLimits[region].resetTime) {
      const waitTime = this.rateLimits[region].resetTime - Date.now();
      throw new Error(`Rate limit exceeded for ${region}. Wait ${waitTime}ms`);
    }

    try {
      const accessToken = await this.getAccessToken(region);
      const url = `${regionConfig.endpoint}${endpoint}`;
      const method = options.method || 'GET';
      const payload = options.body ? JSON.stringify(options.body) : '';

      const headers = {
        'x-amz-access-token': accessToken,
        'x-amz-date': new Date().toISOString().replace(/[:/-]|\.\d{3}/g, '').replace(/-/g, ''),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      };

      // Add AWS signature
      const awsRegion = region === 'uk' ? 'eu-west-1' : 'us-east-1';
      const signature = this.generateSignature(method, url, headers, payload, awsRegion);
      headers['Authorization'] = signature.authorization;
      headers['x-amz-date'] = signature.datetime;

      const response = await fetch(url, {
        method,
        headers,
        body: payload || undefined
      });

      // Update rate limits (simplified - real implementation would parse actual limits)
      this.rateLimits[region].remaining--;
      if (this.rateLimits[region].remaining <= 0) {
        this.rateLimits[region].resetTime = Date.now() + 60000; // Reset in 1 minute
      }

      if (!response.ok) {
        throw new Error(`Amazon SP-API error (${response.status}): ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Amazon SP-API request failed for ${region}:`, error);
      throw error;
    }
  }

  /**
   * Get orders from both marketplaces
   */
  async getOrders(options = {}) {
    const {
      createdAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdBefore = new Date().toISOString(),
      orderStatuses = ['Pending', 'Unshipped', 'PartiallyShipped', 'Shipped'],
      maxResultsPerPage = 50
    } = options;

    const params = new URLSearchParams({
      CreatedAfter: createdAfter,
      CreatedBefore: createdBefore,
      OrderStatuses: orderStatuses.join(','),
      MaxResultsPerPage: Math.min(maxResultsPerPage, 100).toString()
    });

    try {
      const [ukOrders, usaOrders] = await Promise.allSettled([
        this.makeRequest('uk', `/orders/v0/orders?MarketplaceIds=${this.regions.uk.marketplaceId}&${params}`),
        this.makeRequest('usa', `/orders/v0/orders?MarketplaceIds=${this.regions.usa.marketplaceId}&${params}`)
      ]);

      const result = {
        uk: {
          success: ukOrders.status === 'fulfilled',
          orders: ukOrders.status === 'fulfilled' ? ukOrders.value.payload?.Orders || [] : [],
          error: ukOrders.status === 'rejected' ? ukOrders.reason.message : null
        },
        usa: {
          success: usaOrders.status === 'fulfilled',
          orders: usaOrders.status === 'fulfilled' ? usaOrders.value.payload?.Orders || [] : [],
          error: usaOrders.status === 'rejected' ? usaOrders.reason.message : null
        }
      };

      // Combine and enrich orders
      const allOrders = [
        ...result.uk.orders.map(order => ({ ...order, region: 'UK', currency: 'GBP' })),
        ...result.usa.orders.map(order => ({ ...order, region: 'USA', currency: 'USD' }))
      ];

      return {
        success: true,
        totalOrders: allOrders.length,
        orders: allOrders,
        breakdown: {
          uk: { count: result.uk.orders.length, error: result.uk.error },
          usa: { count: result.usa.orders.length, error: result.usa.error }
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        orders: [],
        breakdown: { uk: { count: 0 }, usa: { count: 0 } }
      };
    }
  }

  /**
   * Get catalog items (products) from both marketplaces
   */
  async getCatalogItems(options = {}) {
    const {
      keywords,
      marketplaceIds,
      includedData = ['identifiers', 'attributes', 'relationships', 'salesRanks'],
      pageSize = 20
    } = options;

    const params = new URLSearchParams({
      pageSize: Math.min(pageSize, 50).toString(),
      includedData: includedData.join(','),
      ...(keywords && { keywords }),
      ...(marketplaceIds && { marketplaceIds: marketplaceIds.join(',') })
    });

    try {
      const [ukCatalog, usaCatalog] = await Promise.allSettled([
        this.makeRequest('uk', `/catalog/2022-04-01/items?${params}&marketplaceIds=${this.regions.uk.marketplaceId}`),
        this.makeRequest('usa', `/catalog/2022-04-01/items?${params}&marketplaceIds=${this.regions.usa.marketplaceId}`)
      ]);

      const result = {
        uk: {
          success: ukCatalog.status === 'fulfilled',
          items: ukCatalog.status === 'fulfilled' ? ukCatalog.value.items || [] : [],
          error: ukCatalog.status === 'rejected' ? ukCatalog.reason.message : null
        },
        usa: {
          success: usaCatalog.status === 'fulfilled',
          items: usaCatalog.status === 'fulfilled' ? usaCatalog.value.items || [] : [],
          error: usaCatalog.status === 'rejected' ? usaCatalog.reason.message : null
        }
      };

      const allItems = [
        ...result.uk.items.map(item => ({ ...item, region: 'UK' })),
        ...result.usa.items.map(item => ({ ...item, region: 'USA' }))
      ];

      return {
        success: true,
        totalItems: allItems.length,
        items: allItems,
        breakdown: {
          uk: { count: result.uk.items.length, error: result.uk.error },
          usa: { count: result.usa.items.length, error: result.usa.error }
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        items: [],
        breakdown: { uk: { count: 0 }, usa: { count: 0 } }
      };
    }
  }

  /**
   * Get inventory summary from both marketplaces
   */
  async getInventorySummary(options = {}) {
    const {
      granularityType = 'Marketplace',
      granularityId,
      marketplaceIds,
      skus
    } = options;

    const params = new URLSearchParams({
      granularityType,
      ...(granularityId && { granularityId }),
      ...(marketplaceIds && { marketplaceIds: marketplaceIds.join(',') }),
      ...(skus && { skus: skus.join(',') })
    });

    try {
      const [ukInventory, usaInventory] = await Promise.allSettled([
        this.makeRequest('uk', `/fba/inventory/v1/summaries?${params}&marketplaceIds=${this.regions.uk.marketplaceId}`),
        this.makeRequest('usa', `/fba/inventory/v1/summaries?${params}&marketplaceIds=${this.regions.usa.marketplaceId}`)
      ]);

      const result = {
        uk: {
          success: ukInventory.status === 'fulfilled',
          summaries: ukInventory.status === 'fulfilled' ? ukInventory.value.payload?.inventorySummaries || [] : [],
          error: ukInventory.status === 'rejected' ? ukInventory.reason.message : null
        },
        usa: {
          success: usaInventory.status === 'fulfilled',
          summaries: usaInventory.status === 'fulfilled' ? usaInventory.value.payload?.inventorySummaries || [] : [],
          error: usaInventory.status === 'rejected' ? usaInventory.reason.message : null
        }
      };

      const allSummaries = [
        ...result.uk.summaries.map(summary => ({ ...summary, region: 'UK' })),
        ...result.usa.summaries.map(summary => ({ ...summary, region: 'USA' }))
      ];

      return {
        success: true,
        totalSummaries: allSummaries.length,
        inventorySummaries: allSummaries,
        breakdown: {
          uk: { count: result.uk.summaries.length, error: result.uk.error },
          usa: { count: result.usa.summaries.length, error: result.usa.error }
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        inventorySummaries: [],
        breakdown: { uk: { count: 0 }, usa: { count: 0 } }
      };
    }
  }

  /**
   * Get financial data from both marketplaces
   */
  async getFinancialData(options = {}) {
    const {
      dataStartTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dataEndTime = new Date().toISOString(),
      maxResultsPerPage = 100
    } = options;

    const params = new URLSearchParams({
      DataStartTime: dataStartTime,
      DataEndTime: dataEndTime,
      MaxResultsPerPage: Math.min(maxResultsPerPage, 100).toString()
    });

    try {
      const [ukFinancials, usaFinancials] = await Promise.allSettled([
        this.makeRequest('uk', `/finances/v0/financialEventGroups?${params}`),
        this.makeRequest('usa', `/finances/v0/financialEventGroups?${params}`)
      ]);

      const result = {
        uk: {
          success: ukFinancials.status === 'fulfilled',
          events: ukFinancials.status === 'fulfilled' ? ukFinancials.value.payload?.FinancialEventGroupList || [] : [],
          error: ukFinancials.status === 'rejected' ? ukFinancials.reason.message : null
        },
        usa: {
          success: usaFinancials.status === 'fulfilled',
          events: usaFinancials.status === 'fulfilled' ? usaFinancials.value.payload?.FinancialEventGroupList || [] : [],
          error: usaFinancials.status === 'rejected' ? usaFinancials.reason.message : null
        }
      };

      const allEvents = [
        ...result.uk.events.map(event => ({ ...event, region: 'UK' })),
        ...result.usa.events.map(event => ({ ...event, region: 'USA' }))
      ];

      return {
        success: true,
        totalEvents: allEvents.length,
        financialEvents: allEvents,
        breakdown: {
          uk: { count: result.uk.events.length, error: result.uk.error },
          usa: { count: result.usa.events.length, error: result.usa.error }
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        financialEvents: [],
        breakdown: { uk: { count: 0 }, usa: { count: 0 } }
      };
    }
  }

  /**
   * Get connection status for both marketplaces
   */
  async getConnectionStatus() {
    const status = {
      uk: { connected: false, error: null, lastCheck: new Date().toISOString() },
      usa: { connected: false, error: null, lastCheck: new Date().toISOString() }
    };

    // Test UK connection
    try {
      await this.getAccessToken('uk');
      status.uk.connected = true;
    } catch (error) {
      status.uk.error = error.message;
    }

    // Test USA connection
    try {
      await this.getAccessToken('usa');
      status.usa.connected = true;
    } catch (error) {
      status.usa.error = error.message;
    }

    return {
      overall: status.uk.connected || status.usa.connected,
      marketplaces: status,
      rateLimits: this.rateLimits
    };
  }

  /**
   * Generate mock data for development/testing
   */
  generateMockData() {
    return {
      orders: [
        {
          AmazonOrderId: 'AMZ-UK-001',
          PurchaseDate: new Date().toISOString(),
          OrderStatus: 'Shipped',
          OrderTotal: { CurrencyCode: 'GBP', Amount: '45.99' },
          NumberOfItemsShipped: 1,
          NumberOfItemsUnshipped: 0,
          MarketplaceId: this.regions.uk.marketplaceId,
          region: 'UK'
        },
        {
          AmazonOrderId: 'AMZ-USA-001',
          PurchaseDate: new Date(Date.now() - 86400000).toISOString(),
          OrderStatus: 'Pending',
          OrderTotal: { CurrencyCode: 'USD', Amount: '67.50' },
          NumberOfItemsShipped: 0,
          NumberOfItemsUnshipped: 2,
          MarketplaceId: this.regions.usa.marketplaceId,
          region: 'USA'
        }
      ],
      inventory: [
        {
          sellerSku: 'WIDGET-A-001',
          fnSku: 'X001234567',
          asin: 'B08EXAMPLE',
          totalQuantity: 150,
          inStockQuantity: 120,
          region: 'UK'
        },
        {
          sellerSku: 'WIDGET-B-001',
          fnSku: 'X001234568',
          asin: 'B08EXAMPL2',
          totalQuantity: 89,
          inStockQuantity: 67,
          region: 'USA'
        }
      ],
      analytics: {
        uk: { totalRevenue: 15750, totalOrders: 89, averageOrderValue: 176.97 },
        usa: { totalRevenue: 22100, totalOrders: 134, averageOrderValue: 164.93 },
        combined: { totalRevenue: 37850, totalOrders: 223, averageOrderValue: 169.73 }
      }
    };
  }
}

export default AmazonIntegration;