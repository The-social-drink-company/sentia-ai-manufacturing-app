/**
 * End-to-End API Integration Tests
 * Tests real API interactions with external services
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { McpServer } from '../../src/server.js';
import '../utils/custom-matchers.js';

describe('API Integrations E2E Tests', () => {
  let server;
  let testConfig;

  beforeAll(async () => {
    // Initialize MCP server with real API connections for E2E testing
    server = new McpServer({
      environment: 'test',
      enableRealApis: true, // Enable real API calls for true E2E testing
      enableDatabase: true,
      rateLimiting: {
        enabled: true,
        requests: 100,
        window: 60000 // 1 minute
      }
    });
    
    await server.initialize();
    
    testConfig = {
      timeout: 15000, // 15 second timeout for real API calls
      retries: 2, // Retry failed API calls
      delay: 1000 // Delay between API calls to respect rate limits
    };
  });

  afterAll(async () => {
    if (server) {
      await server.shutdown();
    }
  });

  beforeEach(async () => {
    // Add delay between tests to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, testConfig.delay));
  });

  describe('Xero Financial API Integration', () => {
    it('should connect to Xero and retrieve financial data', async () => {
      // Test connection and authentication
      const connectionTest = await server.callTool('xero_test_connection', {});
      expect(connectionTest).toBeValidMcpToolResponse();
      expect(connectionTest.data).toHaveProperty('connected', true);

      // Retrieve profit and loss report
      const profitLossResponse = await server.callTool('xero_get_profit_loss', {
        from_date: '2024-01-01',
        to_date: '2024-03-31'
      });

      expect(profitLossResponse).toBeValidMcpToolResponse();
      expect(profitLossResponse.data).toBeValidXeroResponse();
      
      // Verify response time is acceptable
      expect(profitLossResponse.metadata?.responseTime).toRespondWithin(5000);

      // Test balance sheet retrieval
      const balanceSheetResponse = await server.callTool('xero_get_balance_sheet', {
        date: '2024-03-31'
      });

      expect(balanceSheetResponse).toBeValidMcpToolResponse();
      expect(balanceSheetResponse.data).toBeValidXeroResponse();

      // Test invoice creation
      const invoiceResponse = await server.callTool('xero_create_invoice', {
        contact_id: 'test-contact-001',
        line_items: [
          {
            description: 'E2E Test Product',
            quantity: 1,
            unit_amount: 100.00
          }
        ],
        due_date: '2024-04-30'
      });

      expect(invoiceResponse).toBeValidMcpToolResponse();
      expect(invoiceResponse.data).toHaveProperty('invoice_id');
      expect(invoiceResponse.data.status).toMatch(/draft|submitted|authorised/);
    }, testConfig.timeout);

    it('should handle Xero rate limiting gracefully', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array.from({ length: 10 }, () =>
        server.callTool('xero_get_contacts', { limit: 10 })
      );

      const responses = await Promise.allSettled(requests);
      
      // Some requests should succeed, others might be rate limited
      const successfulResponses = responses.filter(r => r.status === 'fulfilled');
      const rateLimitedResponses = responses.filter(r => 
        r.status === 'rejected' && 
        r.reason?.message?.includes('rate limit')
      );

      expect(successfulResponses.length).toBeGreaterThan(0);
      
      // If rate limited, verify proper error handling
      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].reason).toBeValidErrorResponse();
      }
    }, testConfig.timeout * 2);
  });

  describe('Shopify E-commerce API Integration', () => {
    it('should connect to Shopify and manage orders', async () => {
      // Test Shopify connection
      const connectionTest = await server.callTool('shopify_test_connection', {});
      expect(connectionTest).toBeValidMcpToolResponse();
      expect(connectionTest.data).toHaveProperty('connected', true);

      // Retrieve recent orders
      const ordersResponse = await server.callTool('shopify_get_orders', {
        status: 'any',
        limit: 50,
        created_at_min: '2024-01-01T00:00:00Z'
      });

      expect(ordersResponse).toBeValidMcpToolResponse();
      expect(ordersResponse.data).toBeValidShopifyResponse();
      expect(ordersResponse.data.orders).toBeInstanceOf(Array);

      // Test order analytics
      if (ordersResponse.data.orders.length > 0) {
        const analyticsResponse = await server.callTool('shopify_analyze_orders', {
          orders: ordersResponse.data.orders.slice(0, 10),
          metrics: ['revenue', 'average_order_value', 'conversion_rate']
        });

        expect(analyticsResponse).toBeValidMcpToolResponse();
        expect(analyticsResponse.data).toHaveProperty('total_revenue');
        expect(analyticsResponse.data.total_revenue).toBeValidFinancialAmount();
      }

      // Test inventory levels
      const inventoryResponse = await server.callTool('shopify_get_inventory_levels', {
        location_ids: ['primary']
      });

      expect(inventoryResponse).toBeValidMcpToolResponse();
      expect(inventoryResponse.data).toBeValidShopifyResponse();
    }, testConfig.timeout);

    it('should handle Shopify webhook processing', async () => {
      // Simulate webhook payload processing
      const webhookPayload = {
        id: 'test-order-webhook-001',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_price: '150.00',
        currency: 'USD',
        financial_status: 'paid',
        fulfillment_status: 'unfulfilled',
        line_items: [
          {
            id: 'line-item-001',
            product_id: 'product-001',
            quantity: 2,
            price: '75.00'
          }
        ]
      };

      const webhookResponse = await server.callTool('shopify_process_webhook', {
        event: 'orders/create',
        payload: webhookPayload
      });

      expect(webhookResponse).toBeValidMcpToolResponse();
      expect(webhookResponse.data).toHaveProperty('processed', true);
      expect(webhookResponse.data).toHaveProperty('order_id');
    }, testConfig.timeout);
  });

  describe('Amazon SP-API Integration', () => {
    it('should connect to Amazon and retrieve seller data', async () => {
      // Test Amazon SP-API connection
      const connectionTest = await server.callTool('amazon_test_connection', {});
      expect(connectionTest).toBeValidMcpToolResponse();
      expect(connectionTest.data).toHaveProperty('connected', true);

      // Get inventory summary
      const inventoryResponse = await server.callTool('amazon_get_inventory_summary', {
        marketplace_id: 'ATVPDKIKX0DER', // US marketplace
        granularity: 'Marketplace'
      });

      expect(inventoryResponse).toBeValidMcpToolResponse();
      expect(inventoryResponse.data).toBeValidAmazonResponse();
      expect(inventoryResponse.data.inventorySummaries).toBeInstanceOf(Array);

      // Test order retrieval
      const ordersResponse = await server.callTool('amazon_get_orders', {
        marketplace_ids: ['ATVPDKIKX0DER'],
        created_after: '2024-01-01T00:00:00Z',
        order_statuses: ['Unshipped', 'PartiallyShipped', 'Shipped']
      });

      expect(ordersResponse).toBeValidMcpToolResponse();
      expect(ordersResponse.data).toBeValidAmazonResponse();

      // Test FBA inventory analysis
      const fbaAnalysisResponse = await server.callTool('amazon_analyze_fba_inventory', {
        marketplace_id: 'ATVPDKIKX0DER',
        include_recommendations: true
      });

      expect(fbaAnalysisResponse).toBeValidMcpToolResponse();
      expect(fbaAnalysisResponse.data).toHaveProperty('inventory_analysis');
      expect(fbaAnalysisResponse.data).toHaveProperty('recommendations');
    }, testConfig.timeout * 2); // Amazon API can be slower

    it('should handle Amazon API throttling', async () => {
      // Test Amazon's request throttling by making multiple requests
      const startTime = Date.now();
      
      const requests = Array.from({ length: 5 }, (_, i) =>
        server.callTool('amazon_get_marketplace_participations', {})
          .then(response => ({ index: i, response, timestamp: Date.now() }))
          .catch(error => ({ index: i, error, timestamp: Date.now() }))
      );

      const results = await Promise.all(requests);
      const endTime = Date.now();

      // Verify requests were properly throttled
      const totalTime = endTime - startTime;
      expect(totalTime).toBeGreaterThan(2000); // Should take at least 2 seconds due to throttling

      // Verify successful responses follow Amazon's format
      const successfulResults = results.filter(r => r.response && !r.error);
      successfulResults.forEach(result => {
        expect(result.response).toBeValidMcpToolResponse();
      });
    }, testConfig.timeout * 3);
  });

  describe('AI Service Integration (Anthropic & OpenAI)', () => {
    it('should integrate with Anthropic for manufacturing analysis', async () => {
      // Test Anthropic connection
      const connectionTest = await server.callTool('anthropic_test_connection', {});
      expect(connectionTest).toBeValidMcpToolResponse();
      expect(connectionTest.data).toHaveProperty('connected', true);

      // Test demand forecasting analysis
      const demandAnalysis = await server.callTool('anthropic_analyze_demand', {
        historical_data: [
          { date: '2024-01-01', quantity: 100, revenue: 10000 },
          { date: '2024-02-01', quantity: 120, revenue: 12000 },
          { date: '2024-03-01', quantity: 110, revenue: 11000 }
        ],
        external_factors: {
          seasonality: true,
          market_trends: ['growing_demand', 'supply_chain_stability']
        }
      });

      expect(demandAnalysis).toBeValidMcpToolResponse();
      expect(demandAnalysis.data).toHaveProperty('forecast');
      expect(demandAnalysis.data).toHaveProperty('confidence_level');
      expect(demandAnalysis.data.confidence_level).toBeGreaterThan(0);
      expect(demandAnalysis.data.confidence_level).toBeLessThanOrEqual(1);

      // Test manufacturing process optimization
      const processOptimization = await server.callTool('anthropic_optimize_process', {
        process_data: {
          cycle_time: 45, // minutes
          setup_time: 30, // minutes
          efficiency: 0.85,
          defect_rate: 0.03
        },
        constraints: {
          max_cycle_time: 60,
          min_efficiency: 0.80,
          max_defect_rate: 0.05
        }
      });

      expect(processOptimization).toBeValidMcpToolResponse();
      expect(processOptimization.data).toHaveProperty('recommendations');
      expect(processOptimization.data.recommendations).toBeInstanceOf(Array);
    }, testConfig.timeout);

    it('should integrate with OpenAI for inventory optimization', async () => {
      // Test OpenAI connection
      const connectionTest = await server.callTool('openai_test_connection', {});
      expect(connectionTest).toBeValidMcpToolResponse();
      expect(connectionTest.data).toHaveProperty('connected', true);

      // Test inventory optimization
      const inventoryOptimization = await server.callTool('openai_optimize_inventory', {
        current_inventory: [
          { sku: 'PROD-001', quantity: 150, reorder_point: 50, cost: 25.00 },
          { sku: 'PROD-002', quantity: 75, reorder_point: 100, cost: 45.00 },
          { sku: 'PROD-003', quantity: 200, reorder_point: 80, cost: 15.00 }
        ],
        demand_forecast: [
          { sku: 'PROD-001', predicted_demand: 200, period: '30_days' },
          { sku: 'PROD-002', predicted_demand: 150, period: '30_days' },
          { sku: 'PROD-003', predicted_demand: 250, period: '30_days' }
        ],
        constraints: {
          budget: 50000,
          storage_capacity: 10000
        }
      });

      expect(inventoryOptimization).toBeValidMcpToolResponse();
      expect(inventoryOptimization.data).toHaveProperty('optimization_results');
      expect(inventoryOptimization.data).toHaveProperty('cost_analysis');
      expect(inventoryOptimization.data.cost_analysis.total_cost).toBeValidFinancialAmount();

      // Test quality prediction analysis
      const qualityPrediction = await server.callTool('openai_predict_quality', {
        process_parameters: {
          temperature: 180, // Celsius
          pressure: 2.5, // bar
          humidity: 45, // percentage
          material_grade: 'A',
          operator_experience: 5 // years
        },
        historical_quality_data: [
          { parameters: { temperature: 175, pressure: 2.3, humidity: 50 }, defect_rate: 0.02 },
          { parameters: { temperature: 185, pressure: 2.7, humidity: 40 }, defect_rate: 0.04 },
          { parameters: { temperature: 180, pressure: 2.5, humidity: 45 }, defect_rate: 0.01 }
        ]
      });

      expect(qualityPrediction).toBeValidMcpToolResponse();
      expect(qualityPrediction.data).toHaveProperty('predicted_defect_rate');
      expect(qualityPrediction.data.predicted_defect_rate).toBeGreaterThanOrEqual(0);
      expect(qualityPrediction.data.predicted_defect_rate).toBeLessThanOrEqual(1);
    }, testConfig.timeout);
  });

  describe('Unleashed ERP Integration', () => {
    it('should connect to Unleashed and manage inventory', async () => {
      // Test Unleashed connection
      const connectionTest = await server.callTool('unleashed_test_connection', {});
      expect(connectionTest).toBeValidMcpToolResponse();
      expect(connectionTest.data).toHaveProperty('connected', true);

      // Get stock on hand
      const stockResponse = await server.callTool('unleashed_get_stock_on_hand', {
        warehouse_code: 'MAIN',
        include_obsolete: false
      });

      expect(stockResponse).toBeValidMcpToolResponse();
      expect(stockResponse.data).toHaveProperty('stock_items');
      expect(stockResponse.data.stock_items).toBeInstanceOf(Array);

      // Test purchase order creation
      const purchaseOrderResponse = await server.callTool('unleashed_create_purchase_order', {
        supplier_id: 'SUPP-001',
        warehouse_id: 'MAIN',
        order_lines: [
          {
            product_code: 'RAW-MAT-001',
            order_quantity: 100,
            unit_cost: 12.50
          }
        ],
        required_date: '2024-05-01'
      });

      expect(purchaseOrderResponse).toBeValidMcpToolResponse();
      expect(purchaseOrderResponse.data).toHaveProperty('purchase_order_number');
      expect(purchaseOrderResponse.data).toHaveProperty('status');

      // Test work order management
      const workOrderResponse = await server.callTool('unleashed_create_work_order', {
        product_id: 'PROD-ASSEMBLY-001',
        quantity: 50,
        required_date: '2024-04-15',
        priority: 'normal'
      });

      expect(workOrderResponse).toBeValidMcpToolResponse();
      expect(workOrderResponse.data).toHaveProperty('work_order_number');
    }, testConfig.timeout);

    it('should handle Unleashed data synchronization', async () => {
      // Test data sync between Unleashed and other systems
      const syncResponse = await server.callTool('unleashed_sync_data', {
        sync_types: ['products', 'customers', 'suppliers'],
        target_systems: ['xero', 'shopify'],
        conflict_resolution: 'most_recent_wins'
      });

      expect(syncResponse).toBeValidMcpToolResponse();
      expect(syncResponse.data).toHaveProperty('sync_results');
      expect(syncResponse.data).toHaveProperty('conflicts_resolved');
      
      // Verify sync statistics
      expect(syncResponse.data.sync_results).toHaveProperty('products_synced');
      expect(syncResponse.data.sync_results).toHaveProperty('customers_synced');
      expect(syncResponse.data.sync_results).toHaveProperty('suppliers_synced');
    }, testConfig.timeout * 2);
  });

  describe('Cross-System Data Consistency', () => {
    it('should maintain data consistency across all integrated systems', async () => {
      // Create a test product in multiple systems and verify consistency
      const testProduct = {
        sku: `TEST-E2E-${Date.now()}`,
        name: 'E2E Test Product',
        description: 'Product created for E2E testing',
        price: 99.99,
        cost: 45.00,
        category: 'Testing'
      };

      // Create product in Shopify
      const shopifyProductResponse = await server.callTool('shopify_create_product', {
        product: testProduct
      });

      expect(shopifyProductResponse).toBeValidMcpToolResponse();
      const shopifyProductId = shopifyProductResponse.data.id;

      // Sync product to Unleashed
      const unleashedSyncResponse = await server.callTool('unleashed_sync_product', {
        shopify_product_id: shopifyProductId,
        product_data: testProduct
      });

      expect(unleashedSyncResponse).toBeValidMcpToolResponse();

      // Verify product exists in both systems with consistent data
      const shopifyProductCheck = await server.callTool('shopify_get_product', {
        product_id: shopifyProductId
      });

      const unleashedProductCheck = await server.callTool('unleashed_get_product', {
        product_code: testProduct.sku
      });

      expect(shopifyProductCheck).toBeValidMcpToolResponse();
      expect(unleashedProductCheck).toBeValidMcpToolResponse();

      // Verify data consistency
      expect(shopifyProductCheck.data.sku).toBe(unleashedProductCheck.data.product_code);
      expect(shopifyProductCheck.data.title).toBe(unleashedProductCheck.data.product_description);

      // Clean up test product
      await server.callTool('shopify_delete_product', { product_id: shopifyProductId });
      await server.callTool('unleashed_archive_product', { product_code: testProduct.sku });
    }, testConfig.timeout * 3);

    it('should handle real-time data synchronization events', async () => {
      // Test real-time sync when inventory changes
      const inventoryChangeEvent = {
        system: 'shopify',
        event_type: 'inventory_level_update',
        data: {
          inventory_item_id: 'test-inventory-001',
          location_id: 'primary',
          available: 150,
          previous_available: 200
        },
        timestamp: new Date().toISOString()
      };

      const syncEventResponse = await server.callTool('process_sync_event', {
        event: inventoryChangeEvent,
        target_systems: ['unleashed', 'amazon']
      });

      expect(syncEventResponse).toBeValidMcpToolResponse();
      expect(syncEventResponse.data).toHaveProperty('sync_status');
      expect(syncEventResponse.data).toHaveProperty('systems_updated');
      expect(syncEventResponse.data.systems_updated).toBeInstanceOf(Array);
    }, testConfig.timeout);
  });

  describe('Performance and Reliability Testing', () => {
    it('should handle concurrent API requests efficiently', async () => {
      // Test concurrent requests across different APIs
      const startTime = Date.now();
      
      const concurrentRequests = [
        server.callTool('xero_get_contacts', { limit: 10 }),
        server.callTool('shopify_get_products', { limit: 10 }),
        server.callTool('amazon_get_marketplace_participations', {}),
        server.callTool('unleashed_get_products', { page_size: 10 }),
        server.callTool('anthropic_test_connection', {})
      ];

      const results = await Promise.allSettled(concurrentRequests);
      const endTime = Date.now();

      // Verify all requests completed
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      expect(successfulResults.length).toBeGreaterThanOrEqual(3); // At least 3 should succeed

      // Verify reasonable response time for concurrent requests
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(30000); // Should complete within 30 seconds

      // Verify each successful response
      successfulResults.forEach(result => {
        expect(result.value).toBeValidMcpToolResponse();
      });
    }, testConfig.timeout * 4);

    it('should recover gracefully from temporary API failures', async () => {
      // Test resilience to temporary network issues
      const resilientCall = async (maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const response = await server.callTool('xero_get_organisation', {});
            if (response.success) {
              return { success: true, data: response.data, attempts: attempt };
            }
          } catch (error) {
            if (attempt === maxRetries) {
              return { success: false, error: error.message, attempts: attempt };
            }
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
          }
        }
      };

      const resilientResult = await resilientCall();
      
      // Should either succeed or fail gracefully with proper error handling
      expect(resilientResult).toHaveProperty('attempts');
      expect(resilientResult.attempts).toBeGreaterThanOrEqual(1);
      expect(resilientResult.attempts).toBeLessThanOrEqual(3);
      
      if (resilientResult.success) {
        expect(resilientResult.data).toBeDefined();
      } else {
        expect(resilientResult.error).toBeDefined();
        expect(typeof resilientResult.error).toBe('string');
      }
    }, testConfig.timeout * 2);
  });
});