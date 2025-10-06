/**
 * Unit Tests for Shopify Orders Tool
 * Comprehensive testing of Shopify order management functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Shopify API before importing the module
vi.mock('../../../../src/tools/shopify/auth/shopify-auth.js', () => ({
  getShopifyClient: vi.fn().mockResolvedValue({
    rest: {
      Order: {
        all: vi.fn(),
        find: vi.fn(),
        save: vi.fn(),
        cancel: vi.fn(),
        transactions: vi.fn()
      },
      Product: {
        find: vi.fn()
      },
      Customer: {
        find: vi.fn()
      }
    }
  })
}));

describe('Shopify Orders Tool', () => {
  let ordersTool;
  let mockShopifyClient;
  let consoleRestore;

  beforeEach(async () => {
    consoleRestore = global.testUtils.mockConsole();
    
    const { orders } = await import('../../../../src/tools/shopify/tools/orders.js');
    ordersTool = orders;
    
    const { getShopifyClient } = await import('../../../../src/tools/shopify/auth/shopify-auth.js');
    mockShopifyClient = await getShopifyClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (consoleRestore) consoleRestore();
  });

  describe('Get Orders', () => {
    it('should retrieve orders with default parameters', async () => {
      const mockOrdersData = [
        {
          id: 12345,
          order_number: '1001',
          name: '#1001',
          email: 'customer@example.com',
          created_at: '2024-10-20T10:00:00Z',
          updated_at: '2024-10-20T10:00:00Z',
          total_price: '299.00',
          subtotal_price: '299.00',
          total_tax: '0.00',
          currency: 'USD',
          financial_status: 'paid',
          fulfillment_status: 'fulfilled',
          customer: {
            id: 67890,
            email: 'customer@example.com',
            first_name: 'John',
            last_name: 'Doe'
          },
          shipping_address: {
            first_name: 'John',
            last_name: 'Doe',
            address1: '123 Main St',
            city: 'New York',
            country: 'United States',
            zip: '10001'
          },
          line_items: [
            {
              id: 11111,
              product_id: 22222,
              variant_id: 33333,
              title: 'Manufacturing Tool Set',
              quantity: 1,
              price: '299.00',
              sku: 'MFG-TOOL-001',
              fulfillable_quantity: 0,
              fulfillment_status: 'fulfilled'
            }
          ]
        }
      ];

      mockShopifyClient.rest.Order.all.mockResolvedValue({ data: mockOrdersData });

      const result = await ordersTool.handler({
        operation: 'get',
        shopDomain: 'test-shop.myshopify.com'
      });

      expect(result.success).toBe(true);
      expect(result.data.orders).toHaveLength(1);
      expect(result.data.orders[0].order_number).toBe('1001');
      expect(result.data.orders[0].total_price).toBe('299.00');
      expect(mockShopifyClient.rest.Order.all).toHaveBeenCalledWith({
        session: expect.objectContaining({
          shop: 'test-shop.myshopify.com'
        })
      });
    });

    it('should filter orders by status', async () => {
      const mockOrdersData = [
        {
          id: 12345,
          order_number: '1001',
          financial_status: 'pending',
          fulfillment_status: 'unfulfilled',
          total_price: '299.00'
        }
      ];

      mockShopifyClient.rest.Order.all.mockResolvedValue({ data: mockOrdersData });

      const result = await ordersTool.handler({
        operation: 'get',
        shopDomain: 'test-shop.myshopify.com',
        status: 'pending'
      });

      expect(result.success).toBe(true);
      expect(result.data.orders[0].financial_status).toBe('pending');
      expect(mockShopifyClient.rest.Order.all).toHaveBeenCalledWith({
        session: expect.objectContaining({
          shop: 'test-shop.myshopify.com'
        }),
        status: 'pending'
      });
    });

    it('should filter orders by date range', async () => {
      const mockOrdersData = [
        {
          id: 12345,
          order_number: '1001',
          created_at: '2024-10-15T10:00:00Z',
          total_price: '299.00'
        }
      ];

      mockShopifyClient.rest.Order.all.mockResolvedValue({ data: mockOrdersData });

      const result = await ordersTool.handler({
        operation: 'get',
        shopDomain: 'test-shop.myshopify.com',
        createdAtMin: '2024-10-01T00:00:00Z',
        createdAtMax: '2024-10-31T23:59:59Z'
      });

      expect(result.success).toBe(true);
      expect(mockShopifyClient.rest.Order.all).toHaveBeenCalledWith({
        session: expect.objectContaining({
          shop: 'test-shop.myshopify.com'
        }),
        created_at_min: '2024-10-01T00:00:00Z',
        created_at_max: '2024-10-31T23:59:59Z'
      });
    });

    it('should filter orders by fulfillment status', async () => {
      const mockOrdersData = [
        {
          id: 12345,
          order_number: '1001',
          fulfillment_status: 'unfulfilled',
          total_price: '299.00'
        }
      ];

      mockShopifyClient.rest.Order.all.mockResolvedValue({ data: mockOrdersData });

      const result = await ordersTool.handler({
        operation: 'get',
        shopDomain: 'test-shop.myshopify.com',
        fulfillmentStatus: 'unfulfilled'
      });

      expect(result.success).toBe(true);
      expect(result.data.orders[0].fulfillment_status).toBe('unfulfilled');
      expect(mockShopifyClient.rest.Order.all).toHaveBeenCalledWith({
        session: expect.objectContaining({
          shop: 'test-shop.myshopify.com'
        }),
        fulfillment_status: 'unfulfilled'
      });
    });
  });

  describe('Get Single Order', () => {
    it('should retrieve a specific order by ID', async () => {
      const mockOrderData = {
        id: 12345,
        order_number: '1001',
        name: '#1001',
        total_price: '299.00',
        line_items: [
          {
            id: 11111,
            title: 'Manufacturing Tool Set',
            quantity: 1,
            price: '299.00'
          }
        ],
        transactions: [
          {
            id: 55555,
            kind: 'sale',
            status: 'success',
            amount: '299.00'
          }
        ]
      };

      mockShopifyClient.rest.Order.find.mockResolvedValue({ data: mockOrderData });

      const result = await ordersTool.handler({
        operation: 'getById',
        shopDomain: 'test-shop.myshopify.com',
        orderId: '12345'
      });

      expect(result.success).toBe(true);
      expect(result.data.order.id).toBe(12345);
      expect(result.data.order.order_number).toBe('1001');
      expect(mockShopifyClient.rest.Order.find).toHaveBeenCalledWith({
        session: expect.objectContaining({
          shop: 'test-shop.myshopify.com'
        }),
        id: '12345'
      });
    });

    it('should handle order not found error', async () => {
      const notFoundError = new Error('Order not found');
      notFoundError.response = { status: 404 };

      mockShopifyClient.rest.Order.find.mockRejectedValue(notFoundError);

      const result = await ordersTool.handler({
        operation: 'getById',
        shopDomain: 'test-shop.myshopify.com',
        orderId: '99999'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Order not found');
    });
  });

  describe('Order Analytics', () => {
    it('should calculate order analytics and metrics', async () => {
      const mockOrdersData = [
        {
          id: 1,
          total_price: '100.00',
          financial_status: 'paid',
          fulfillment_status: 'fulfilled',
          created_at: '2024-10-01T10:00:00Z',
          line_items: [{ quantity: 2, price: '50.00' }]
        },
        {
          id: 2,
          total_price: '200.00',
          financial_status: 'paid',
          fulfillment_status: 'unfulfilled',
          created_at: '2024-10-15T14:00:00Z',
          line_items: [{ quantity: 1, price: '200.00' }]
        },
        {
          id: 3,
          total_price: '150.00',
          financial_status: 'pending',
          fulfillment_status: 'unfulfilled',
          created_at: '2024-10-20T16:00:00Z',
          line_items: [{ quantity: 3, price: '50.00' }]
        }
      ];

      mockShopifyClient.rest.Order.all.mockResolvedValue({ data: mockOrdersData });

      const result = await ordersTool.handler({
        operation: 'analytics',
        shopDomain: 'test-shop.myshopify.com'
      });

      expect(result.success).toBe(true);
      expect(result.data.analytics).toBeDefined();
      expect(result.data.analytics.totalOrders).toBe(3);
      expect(result.data.analytics.totalRevenue).toBe(450.00);
      expect(result.data.analytics.averageOrderValue).toBe(150.00);
      expect(result.data.analytics.paidOrders).toBe(2);
      expect(result.data.analytics.fulfilledOrders).toBe(1);
      expect(result.data.analytics.pendingOrders).toBe(1);
    });

    it('should generate manufacturing-specific order insights', async () => {
      const mockOrdersData = [
        {
          id: 1,
          line_items: [
            {
              title: 'Industrial Machinery Part A',
              quantity: 5,
              price: '100.00',
              sku: 'IMP-A-001',
              vendor: 'Manufacturing Co'
            },
            {
              title: 'Raw Material - Steel',
              quantity: 10,
              price: '50.00',
              sku: 'RAW-STEEL-001',
              vendor: 'Steel Supplier'
            }
          ],
          created_at: '2024-10-20T10:00:00Z',
          total_price: '1000.00'
        }
      ];

      mockShopifyClient.rest.Order.all.mockResolvedValue({ data: mockOrdersData });

      const result = await ordersTool.handler({
        operation: 'manufacturingInsights',
        shopDomain: 'test-shop.myshopify.com'
      });

      expect(result.success).toBe(true);
      expect(result.data.manufacturingInsights).toBeDefined();
      expect(result.data.manufacturingInsights.topProducts).toBeDefined();
      expect(result.data.manufacturingInsights.topVendors).toBeDefined();
      expect(result.data.manufacturingInsights.materialCategories).toBeDefined();
      expect(result.data.manufacturingInsights.totalQuantitySold).toBe(15);
    });
  });

  describe('Order Processing', () => {
    it('should update order status successfully', async () => {
      const mockUpdatedOrder = {
        id: 12345,
        order_number: '1001',
        financial_status: 'paid',
        note: 'Payment processed successfully'
      };

      mockShopifyClient.rest.Order.save.mockResolvedValue({ data: mockUpdatedOrder });

      const result = await ordersTool.handler({
        operation: 'updateStatus',
        shopDomain: 'test-shop.myshopify.com',
        orderId: '12345',
        status: 'paid',
        note: 'Payment processed successfully'
      });

      expect(result.success).toBe(true);
      expect(result.data.order.financial_status).toBe('paid');
      expect(mockShopifyClient.rest.Order.save).toHaveBeenCalled();
    });

    it('should cancel an order successfully', async () => {
      const mockCancelledOrder = {
        id: 12345,
        order_number: '1001',
        cancelled_at: '2024-10-20T15:00:00Z',
        cancel_reason: 'customer'
      };

      mockShopifyClient.rest.Order.cancel.mockResolvedValue({ data: mockCancelledOrder });

      const result = await ordersTool.handler({
        operation: 'cancel',
        shopDomain: 'test-shop.myshopify.com',
        orderId: '12345',
        reason: 'customer'
      });

      expect(result.success).toBe(true);
      expect(result.data.order.cancelled_at).toBeDefined();
      expect(result.data.order.cancel_reason).toBe('customer');
      expect(mockShopifyClient.rest.Order.cancel).toHaveBeenCalledWith({
        session: expect.objectContaining({
          shop: 'test-shop.myshopify.com'
        }),
        id: '12345',
        reason: 'customer'
      });
    });

    it('should handle order cancellation errors', async () => {
      const cancellationError = new Error('Cannot cancel paid order');
      cancellationError.response = { status: 422 };

      mockShopifyClient.rest.Order.cancel.mockRejectedValue(cancellationError);

      const result = await ordersTool.handler({
        operation: 'cancel',
        shopDomain: 'test-shop.myshopify.com',
        orderId: '12345',
        reason: 'inventory'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot cancel paid order');
    });
  });

  describe('Manufacturing Integration', () => {
    it('should generate production schedule from orders', async () => {
      const mockOrdersData = [
        {
          id: 1,
          line_items: [
            {
              title: 'Custom Manufacturing Part',
              quantity: 10,
              sku: 'CUSTOM-001',
              vendor: 'Internal Production',
              fulfillable_quantity: 10,
              properties: [
                { name: 'Production Time', value: '5 days' },
                { name: 'Material', value: 'Aluminum' }
              ]
            }
          ],
          created_at: '2024-10-20T10:00:00Z',
          fulfillment_status: 'unfulfilled'
        },
        {
          id: 2,
          line_items: [
            {
              title: 'Standard Manufacturing Component',
              quantity: 5,
              sku: 'STD-002',
              vendor: 'Internal Production',
              fulfillable_quantity: 5,
              properties: [
                { name: 'Production Time', value: '2 days' },
                { name: 'Material', value: 'Steel' }
              ]
            }
          ],
          created_at: '2024-10-21T14:00:00Z',
          fulfillment_status: 'unfulfilled'
        }
      ];

      mockShopifyClient.rest.Order.all.mockResolvedValue({ data: mockOrdersData });

      const result = await ordersTool.handler({
        operation: 'productionSchedule',
        shopDomain: 'test-shop.myshopify.com'
      });

      expect(result.success).toBe(true);
      expect(result.data.productionSchedule).toBeDefined();
      expect(result.data.productionSchedule.totalUnits).toBe(15);
      expect(result.data.productionSchedule.materialRequirements).toBeDefined();
      expect(result.data.productionSchedule.materialRequirements.Aluminum).toBe(10);
      expect(result.data.productionSchedule.materialRequirements.Steel).toBe(5);
      expect(result.data.productionSchedule.estimatedCompletionDates).toBeDefined();
    });

    it('should identify orders requiring custom manufacturing', async () => {
      const mockOrdersData = [
        {
          id: 1,
          line_items: [
            {
              title: 'Standard Product',
              quantity: 2,
              sku: 'STD-001',
              vendor: 'Standard Supplier'
            }
          ]
        },
        {
          id: 2,
          line_items: [
            {
              title: 'Custom Manufacturing Part',
              quantity: 1,
              sku: 'CUSTOM-001',
              vendor: 'Internal Production',
              properties: [
                { name: 'Custom Specifications', value: 'Special alloy required' },
                { name: 'Production Notes', value: 'Requires quality inspection' }
              ]
            }
          ]
        }
      ];

      mockShopifyClient.rest.Order.all.mockResolvedValue({ data: mockOrdersData });

      const result = await ordersTool.handler({
        operation: 'customManufacturing',
        shopDomain: 'test-shop.myshopify.com'
      });

      expect(result.success).toBe(true);
      expect(result.data.customManufacturingOrders).toBeDefined();
      expect(result.data.customManufacturingOrders).toHaveLength(1);
      expect(result.data.customManufacturingOrders[0].id).toBe(2);
      expect(result.data.customManufacturingOrders[0].customSpecifications).toBeDefined();
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle pagination for large order sets', async () => {
      const mockOrdersPage1 = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        order_number: `100${i + 1}`,
        total_price: '100.00'
      }));

      const mockOrdersPage2 = Array.from({ length: 25 }, (_, i) => ({
        id: i + 51,
        order_number: `105${i + 1}`,
        total_price: '100.00'
      }));

      mockShopifyClient.rest.Order.all
        .mockResolvedValueOnce({ data: mockOrdersPage1, pageInfo: { hasNextPage: true } })
        .mockResolvedValueOnce({ data: mockOrdersPage2, pageInfo: { hasNextPage: false } });

      const result = await ordersTool.handler({
        operation: 'get',
        shopDomain: 'test-shop.myshopify.com',
        limit: 50,
        getAllPages: true
      });

      expect(result.success).toBe(true);
      expect(result.data.orders).toHaveLength(75);
      expect(result.data.pagination.totalPages).toBe(2);
      expect(mockShopifyClient.rest.Order.all).toHaveBeenCalledTimes(2);
    });

    it('should cache frequently accessed order data', async () => {
      const mockOrdersData = [
        { id: 1, order_number: '1001', total_price: '100.00' }
      ];

      mockShopifyClient.rest.Order.all.mockResolvedValue({ data: mockOrdersData });

      // First call
      const result1 = await ordersTool.handler({
        operation: 'get',
        shopDomain: 'test-shop.myshopify.com',
        useCache: true
      });

      // Second call should use cache
      const result2 = await ordersTool.handler({
        operation: 'get',
        shopDomain: 'test-shop.myshopify.com',
        useCache: true
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result2.fromCache).toBe(true);
      expect(mockShopifyClient.rest.Order.all).toHaveBeenCalledTimes(1);
    });
  });

  describe('Input Validation', () => {
    it('should validate shop domain format', async () => {
      const result = await ordersTool.handler({
        operation: 'get',
        shopDomain: 'invalid-domain'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid shop domain format');
    });

    it('should validate order ID format', async () => {
      const result = await ordersTool.handler({
        operation: 'getById',
        shopDomain: 'test-shop.myshopify.com',
        orderId: 'invalid-id'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid order ID format');
    });

    it('should validate date range parameters', async () => {
      const result = await ordersTool.handler({
        operation: 'get',
        shopDomain: 'test-shop.myshopify.com',
        createdAtMin: '2024-12-31T23:59:59Z',
        createdAtMax: '2024-01-01T00:00:00Z'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('createdAtMin cannot be after createdAtMax');
    });

    it('should validate required parameters for operations', async () => {
      const result = await ordersTool.handler({
        operation: 'updateStatus'
        // Missing shopDomain, orderId, status
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameters');
    });
  });

  describe('Error Handling', () => {
    it('should handle API rate limiting gracefully', async () => {
      const rateLimitError = new Error('API rate limit exceeded');
      rateLimitError.response = { 
        status: 429,
        headers: { 'retry-after': '60' }
      };

      mockShopifyClient.rest.Order.all.mockRejectedValue(rateLimitError);

      const result = await ordersTool.handler({
        operation: 'get',
        shopDomain: 'test-shop.myshopify.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit exceeded');
      expect(result.retryable).toBe(true);
      expect(result.retryAfter).toBe(60);
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Unauthorized access');
      authError.response = { status: 401 };

      mockShopifyClient.rest.Order.all.mockRejectedValue(authError);

      const result = await ordersTool.handler({
        operation: 'get',
        shopDomain: 'test-shop.myshopify.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
      expect(result.requiresReauth).toBe(true);
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ETIMEDOUT';

      mockShopifyClient.rest.Order.all.mockRejectedValue(timeoutError);

      const result = await ordersTool.handler({
        operation: 'get',
        shopDomain: 'test-shop.myshopify.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      expect(result.retryable).toBe(true);
    });
  });
});