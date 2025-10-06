/**
 * Unit Tests for Amazon Inventory Tool
 * Comprehensive testing of Amazon SP-API inventory management functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Amazon SP-API before importing the module
vi.mock('../../../../src/tools/amazon/auth/sp-api-auth.js', () => ({
  getAmazonClient: vi.fn().mockResolvedValue({
    fbaInventoryApi: {
      getInventorySummaries: vi.fn(),
      getInventoryDetails: vi.fn()
    },
    fbaInboundApi: {
      getShipments: vi.fn(),
      getShipmentItems: vi.fn()
    },
    catalogApi: {
      getCatalogItem: vi.fn(),
      searchCatalogItems: vi.fn()
    },
    reportsApi: {
      createReport: vi.fn(),
      getReport: vi.fn(),
      getReportDocument: vi.fn()
    }
  })
}));

describe('Amazon Inventory Tool', () => {
  let inventoryTool;
  let mockAmazonClient;
  let consoleRestore;

  beforeEach(async () => {
    consoleRestore = global.testUtils.mockConsole();
    
    const { inventory } = await import('../../../../src/tools/amazon/tools/inventory.js');
    inventoryTool = inventory;
    
    const { getAmazonClient } = await import('../../../../src/tools/amazon/auth/sp-api-auth.js');
    mockAmazonClient = await getAmazonClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (consoleRestore) consoleRestore();
  });

  describe('Get Inventory Summaries', () => {
    it('should retrieve inventory summaries successfully', async () => {
      const mockInventoryData = {
        inventorySummaries: [
          {
            asin: 'B01234567890',
            fnSku: 'SKU-FBA-001',
            sellerSku: 'SELLER-SKU-001',
            condition: 'NewItem',
            inventoryDetails: {
              fulfillableQuantity: 100,
              inboundWorkingQuantity: 50,
              inboundShippedQuantity: 25,
              inboundReceivingQuantity: 0,
              reservedQuantity: {
                totalReservedQuantity: 10,
                pendingCustomerOrderQuantity: 8,
                pendingTransshipmentQuantity: 2,
                fcProcessingQuantity: 0
              },
              unfulfillableQuantity: {
                totalUnfulfillableQuantity: 5,
                customerDamagedQuantity: 2,
                warehouseDamagedQuantity: 3,
                distributorDamagedQuantity: 0
              }
            },
            lastUpdatedTime: '2024-10-20T10:00:00Z'
          },
          {
            asin: 'B09876543210',
            fnSku: 'SKU-FBA-002',
            sellerSku: 'SELLER-SKU-002',
            condition: 'NewItem',
            inventoryDetails: {
              fulfillableQuantity: 50,
              inboundWorkingQuantity: 25,
              inboundShippedQuantity: 10,
              inboundReceivingQuantity: 5,
              reservedQuantity: {
                totalReservedQuantity: 15,
                pendingCustomerOrderQuantity: 12,
                pendingTransshipmentQuantity: 3
              },
              unfulfillableQuantity: {
                totalUnfulfillableQuantity: 2,
                customerDamagedQuantity: 1,
                warehouseDamagedQuantity: 1
              }
            },
            lastUpdatedTime: '2024-10-20T11:00:00Z'
          }
        ],
        pagination: {
          nextToken: 'next-page-token-123'
        }
      };

      mockAmazonClient.fbaInventoryApi.getInventorySummaries.mockResolvedValue({
        data: mockInventoryData
      });

      const result = await inventoryTool.handler({
        operation: 'getSummaries',
        marketplaceId: 'ATVPDKIKX0DER'
      });

      expect(result.success).toBe(true);
      expect(result.data.inventorySummaries).toHaveLength(2);
      expect(result.data.inventorySummaries[0].asin).toBe('B01234567890');
      expect(result.data.inventorySummaries[0].inventoryDetails.fulfillableQuantity).toBe(100);
      expect(result.data.pagination.nextToken).toBe('next-page-token-123');
      expect(mockAmazonClient.fbaInventoryApi.getInventorySummaries).toHaveBeenCalledWith({
        marketplaceIds: ['ATVPDKIKX0DER'],
        details: true,
        granularityType: 'Marketplace',
        granularityId: 'ATVPDKIKX0DER'
      });
    });

    it('should filter inventory by SKU', async () => {
      const mockInventoryData = {
        inventorySummaries: [
          {
            asin: 'B01234567890',
            fnSku: 'SKU-FBA-001',
            sellerSku: 'SELLER-SKU-001',
            inventoryDetails: {
              fulfillableQuantity: 100
            }
          }
        ]
      };

      mockAmazonClient.fbaInventoryApi.getInventorySummaries.mockResolvedValue({
        data: mockInventoryData
      });

      const result = await inventoryTool.handler({
        operation: 'getSummaries',
        marketplaceId: 'ATVPDKIKX0DER',
        sellerSkus: ['SELLER-SKU-001']
      });

      expect(result.success).toBe(true);
      expect(result.data.inventorySummaries[0].sellerSku).toBe('SELLER-SKU-001');
      expect(mockAmazonClient.fbaInventoryApi.getInventorySummaries).toHaveBeenCalledWith({
        marketplaceIds: ['ATVPDKIKX0DER'],
        details: true,
        granularityType: 'Marketplace',
        granularityId: 'ATVPDKIKX0DER',
        sellerSkus: ['SELLER-SKU-001']
      });
    });

    it('should handle pagination for large inventory sets', async () => {
      const mockPage1Data = {
        inventorySummaries: [
          { asin: 'B001', sellerSku: 'SKU-001', inventoryDetails: { fulfillableQuantity: 50 } }
        ],
        pagination: { nextToken: 'page2-token' }
      };

      const mockPage2Data = {
        inventorySummaries: [
          { asin: 'B002', sellerSku: 'SKU-002', inventoryDetails: { fulfillableQuantity: 75 } }
        ],
        pagination: {}
      };

      mockAmazonClient.fbaInventoryApi.getInventorySummaries
        .mockResolvedValueOnce({ data: mockPage1Data })
        .mockResolvedValueOnce({ data: mockPage2Data });

      const result = await inventoryTool.handler({
        operation: 'getSummaries',
        marketplaceId: 'ATVPDKIKX0DER',
        getAllPages: true
      });

      expect(result.success).toBe(true);
      expect(result.data.inventorySummaries).toHaveLength(2);
      expect(result.data.totalItems).toBe(2);
      expect(mockAmazonClient.fbaInventoryApi.getInventorySummaries).toHaveBeenCalledTimes(2);
    });
  });

  describe('Manufacturing Inventory Analytics', () => {
    it('should analyze manufacturing inventory levels and trends', async () => {
      const mockInventoryData = {
        inventorySummaries: [
          {
            asin: 'B01234567890',
            sellerSku: 'MFG-COMPONENT-001',
            inventoryDetails: {
              fulfillableQuantity: 25, // Low stock
              inboundWorkingQuantity: 100,
              reservedQuantity: { totalReservedQuantity: 15 }
            },
            lastUpdatedTime: '2024-10-20T10:00:00Z'
          },
          {
            asin: 'B09876543210',
            sellerSku: 'MFG-RAWMATERIAL-002',
            inventoryDetails: {
              fulfillableQuantity: 200, // Adequate stock
              inboundWorkingQuantity: 50,
              reservedQuantity: { totalReservedQuantity: 30 }
            },
            lastUpdatedTime: '2024-10-20T11:00:00Z'
          },
          {
            asin: 'B01122334455',
            sellerSku: 'MFG-FINISHED-003',
            inventoryDetails: {
              fulfillableQuantity: 500, // Overstock
              inboundWorkingQuantity: 0,
              reservedQuantity: { totalReservedQuantity: 5 }
            },
            lastUpdatedTime: '2024-10-20T12:00:00Z'
          }
        ]
      };

      mockAmazonClient.fbaInventoryApi.getInventorySummaries.mockResolvedValue({
        data: mockInventoryData
      });

      const result = await inventoryTool.handler({
        operation: 'manufacturingAnalytics',
        marketplaceId: 'ATVPDKIKX0DER',
        lowStockThreshold: 50,
        overstockThreshold: 400
      });

      expect(result.success).toBe(true);
      expect(result.data.manufacturingAnalytics).toBeDefined();
      expect(result.data.manufacturingAnalytics.lowStockItems).toHaveLength(1);
      expect(result.data.manufacturingAnalytics.lowStockItems[0].sellerSku).toBe('MFG-COMPONENT-001');
      expect(result.data.manufacturingAnalytics.overstockItems).toHaveLength(1);
      expect(result.data.manufacturingAnalytics.overstockItems[0].sellerSku).toBe('MFG-FINISHED-003');
      expect(result.data.manufacturingAnalytics.adequateStockItems).toHaveLength(1);
      expect(result.data.manufacturingAnalytics.totalInventoryValue).toBeDefined();
      expect(result.data.manufacturingAnalytics.turnoverRate).toBeDefined();
    });

    it('should calculate reorder recommendations for manufacturing', async () => {
      const mockInventoryData = {
        inventorySummaries: [
          {
            asin: 'B01234567890',
            sellerSku: 'MFG-CRITICAL-001',
            inventoryDetails: {
              fulfillableQuantity: 10, // Critical low
              inboundWorkingQuantity: 0,
              reservedQuantity: { totalReservedQuantity: 8 }
            }
          },
          {
            asin: 'B09876543210',
            sellerSku: 'MFG-STANDARD-002',
            inventoryDetails: {
              fulfillableQuantity: 45, // Near reorder point
              inboundWorkingQuantity: 20,
              reservedQuantity: { totalReservedQuantity: 15 }
            }
          }
        ]
      };

      mockAmazonClient.fbaInventoryApi.getInventorySummaries.mockResolvedValue({
        data: mockInventoryData
      });

      const result = await inventoryTool.handler({
        operation: 'reorderRecommendations',
        marketplaceId: 'ATVPDKIKX0DER',
        reorderPoint: 50,
        safetyStock: 20
      });

      expect(result.success).toBe(true);
      expect(result.data.reorderRecommendations).toBeDefined();
      expect(result.data.reorderRecommendations.criticalItems).toHaveLength(1);
      expect(result.data.reorderRecommendations.criticalItems[0].sellerSku).toBe('MFG-CRITICAL-001');
      expect(result.data.reorderRecommendations.reorderSoonItems).toHaveLength(1);
      expect(result.data.reorderRecommendations.reorderSoonItems[0].sellerSku).toBe('MFG-STANDARD-002');
      expect(result.data.reorderRecommendations.suggestedOrderQuantities).toBeDefined();
    });

    it('should analyze inventory aging and obsolescence', async () => {
      const mockInventoryData = {
        inventorySummaries: [
          {
            asin: 'B01234567890',
            sellerSku: 'MFG-OLD-001',
            inventoryDetails: {
              fulfillableQuantity: 100,
              unfulfillableQuantity: { totalUnfulfillableQuantity: 20 }
            },
            lastUpdatedTime: '2024-01-15T10:00:00Z' // Old inventory
          },
          {
            asin: 'B09876543210',
            sellerSku: 'MFG-RECENT-002',
            inventoryDetails: {
              fulfillableQuantity: 150,
              unfulfillableQuantity: { totalUnfulfillableQuantity: 2 }
            },
            lastUpdatedTime: '2024-10-15T10:00:00Z' // Recent inventory
          }
        ]
      };

      mockAmazonClient.fbaInventoryApi.getInventorySummaries.mockResolvedValue({
        data: mockInventoryData
      });

      const result = await inventoryTool.handler({
        operation: 'agingAnalysis',
        marketplaceId: 'ATVPDKIKX0DER',
        agingThresholdDays: 180
      });

      expect(result.success).toBe(true);
      expect(result.data.agingAnalysis).toBeDefined();
      expect(result.data.agingAnalysis.agedInventory).toHaveLength(1);
      expect(result.data.agingAnalysis.agedInventory[0].sellerSku).toBe('MFG-OLD-001');
      expect(result.data.agingAnalysis.agedInventory[0].ageDays).toBeGreaterThan(180);
      expect(result.data.agingAnalysis.totalAgedValue).toBeDefined();
      expect(result.data.agingAnalysis.obsolescenceRisk).toBeDefined();
    });
  });

  describe('Inbound Shipment Management', () => {
    it('should retrieve inbound shipments status', async () => {
      const mockShipmentsData = {
        shipmentData: [
          {
            shipmentId: 'FBA123456789',
            shipmentName: 'Manufacturing Components Batch 1',
            shipmentStatus: 'WORKING',
            destinationFulfillmentCenterId: 'ABC1',
            shipFromAddress: {
              name: 'Manufacturing Facility',
              addressLine1: '123 Factory St',
              city: 'Industrial City',
              countryCode: 'US'
            },
            labelPrepPreference: 'SELLER_LABEL',
            areCasesRequired: false,
            confirmedNeedByDate: '2024-11-01',
            estimatedBoxContentsFee: {
              totalUnits: 100,
              feePerUnit: { currencyCode: 'USD', value: 0.15 },
              totalFee: { currencyCode: 'USD', value: 15.00 }
            }
          }
        ]
      };

      mockAmazonClient.fbaInboundApi.getShipments.mockResolvedValue({
        data: mockShipmentsData
      });

      const result = await inventoryTool.handler({
        operation: 'getInboundShipments',
        marketplaceId: 'ATVPDKIKX0DER'
      });

      expect(result.success).toBe(true);
      expect(result.data.shipments).toHaveLength(1);
      expect(result.data.shipments[0].shipmentId).toBe('FBA123456789');
      expect(result.data.shipments[0].shipmentStatus).toBe('WORKING');
      expect(mockAmazonClient.fbaInboundApi.getShipments).toHaveBeenCalledWith({
        marketplaceId: 'ATVPDKIKX0DER'
      });
    });

    it('should track inbound shipment items for manufacturing planning', async () => {
      const mockShipmentItemsData = {
        itemData: [
          {
            sellerSku: 'MFG-COMPONENT-001',
            fulfillmentNetworkSku: 'FN-MFG-001',
            quantityShipped: 100,
            quantityReceived: 95,
            quantityInCase: 10,
            releaseDate: '2024-10-25',
            prepDetailsList: [
              {
                prepInstruction: 'Labeling',
                prepOwner: 'SELLER'
              }
            ]
          },
          {
            sellerSku: 'MFG-RAWMATERIAL-002',
            fulfillmentNetworkSku: 'FN-MFG-002',
            quantityShipped: 200,
            quantityReceived: 200,
            quantityInCase: 25,
            releaseDate: '2024-10-25'
          }
        ]
      };

      mockAmazonClient.fbaInboundApi.getShipmentItems.mockResolvedValue({
        data: mockShipmentItemsData
      });

      const result = await inventoryTool.handler({
        operation: 'getShipmentItems',
        shipmentId: 'FBA123456789'
      });

      expect(result.success).toBe(true);
      expect(result.data.shipmentItems).toHaveLength(2);
      expect(result.data.shipmentItems[0].sellerSku).toBe('MFG-COMPONENT-001');
      expect(result.data.shipmentItems[0].quantityReceived).toBe(95);
      expect(result.data.manufacturingImpact).toBeDefined();
      expect(result.data.manufacturingImpact.expectedAvailability).toBeDefined();
      expect(mockAmazonClient.fbaInboundApi.getShipmentItems).toHaveBeenCalledWith({
        shipmentId: 'FBA123456789'
      });
    });
  });

  describe('Inventory Reports and Analytics', () => {
    it('should generate comprehensive inventory report', async () => {
      const mockReportResponse = {
        reportId: 'INVENTORY_REPORT_123'
      };

      const mockReportDetails = {
        processingStatus: 'DONE',
        reportDocumentId: 'DOC_123'
      };

      const mockReportDocument = {
        reportDocumentId: 'DOC_123',
        url: 'https://amazon-reports.s3.amazonaws.com/report.csv',
        compressionAlgorithm: 'GZIP'
      };

      mockAmazonClient.reportsApi.createReport.mockResolvedValue({
        data: mockReportResponse
      });

      mockAmazonClient.reportsApi.getReport.mockResolvedValue({
        data: mockReportDetails
      });

      mockAmazonClient.reportsApi.getReportDocument.mockResolvedValue({
        data: mockReportDocument
      });

      const result = await inventoryTool.handler({
        operation: 'generateReport',
        marketplaceId: 'ATVPDKIKX0DER',
        reportType: 'GET_FBA_INVENTORY_AGED_REPORT'
      });

      expect(result.success).toBe(true);
      expect(result.data.reportId).toBe('INVENTORY_REPORT_123');
      expect(result.data.reportUrl).toBeDefined();
      expect(mockAmazonClient.reportsApi.createReport).toHaveBeenCalledWith({
        reportType: 'GET_FBA_INVENTORY_AGED_REPORT',
        marketplaceIds: ['ATVPDKIKX0DER']
      });
    });

    it('should calculate inventory turnover metrics', async () => {
      const mockInventoryData = {
        inventorySummaries: [
          {
            asin: 'B01234567890',
            sellerSku: 'MFG-FAST-001',
            inventoryDetails: {
              fulfillableQuantity: 50,
              reservedQuantity: { totalReservedQuantity: 25 }
            }
          },
          {
            asin: 'B09876543210',
            sellerSku: 'MFG-SLOW-002',
            inventoryDetails: {
              fulfillableQuantity: 200,
              reservedQuantity: { totalReservedQuantity: 5 }
            }
          }
        ]
      };

      mockAmazonClient.fbaInventoryApi.getInventorySummaries.mockResolvedValue({
        data: mockInventoryData
      });

      const result = await inventoryTool.handler({
        operation: 'turnoverAnalysis',
        marketplaceId: 'ATVPDKIKX0DER',
        analysisperiod: 90 // days
      });

      expect(result.success).toBe(true);
      expect(result.data.turnoverAnalysis).toBeDefined();
      expect(result.data.turnoverAnalysis.averageTurnoverRate).toBeDefined();
      expect(result.data.turnoverAnalysis.fastMovingItems).toBeDefined();
      expect(result.data.turnoverAnalysis.slowMovingItems).toBeDefined();
      expect(result.data.turnoverAnalysis.inventoryVelocity).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should validate marketplace ID format', async () => {
      const result = await inventoryTool.handler({
        operation: 'getSummaries',
        marketplaceId: 'INVALID_ID'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid marketplace ID format');
    });

    it('should validate SKU format', async () => {
      const result = await inventoryTool.handler({
        operation: 'getSummaries',
        marketplaceId: 'ATVPDKIKX0DER',
        sellerSkus: ['', null, 'VALID-SKU']
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid SKU format');
    });

    it('should validate shipment ID format', async () => {
      const result = await inventoryTool.handler({
        operation: 'getShipmentItems',
        shipmentId: 'invalid-format'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid shipment ID format');
    });

    it('should validate threshold values', async () => {
      const result = await inventoryTool.handler({
        operation: 'manufacturingAnalytics',
        marketplaceId: 'ATVPDKIKX0DER',
        lowStockThreshold: -10,
        overstockThreshold: 'invalid'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid threshold values');
    });
  });

  describe('Error Handling', () => {
    it('should handle API rate limiting errors', async () => {
      const rateLimitError = new Error('Request rate exceeded');
      rateLimitError.response = { 
        status: 429,
        headers: { 'x-amzn-rate-limit-limit': '1' }
      };

      mockAmazonClient.fbaInventoryApi.getInventorySummaries.mockRejectedValue(rateLimitError);

      const result = await inventoryTool.handler({
        operation: 'getSummaries',
        marketplaceId: 'ATVPDKIKX0DER'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit exceeded');
      expect(result.retryable).toBe(true);
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Access denied');
      authError.response = { status: 403 };

      mockAmazonClient.fbaInventoryApi.getInventorySummaries.mockRejectedValue(authError);

      const result = await inventoryTool.handler({
        operation: 'getSummaries',
        marketplaceId: 'ATVPDKIKX0DER'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied');
      expect(result.requiresReauth).toBe(true);
    });

    it('should handle marketplace not found errors', async () => {
      const notFoundError = new Error('Marketplace not found');
      notFoundError.response = { status: 404 };

      mockAmazonClient.fbaInventoryApi.getInventorySummaries.mockRejectedValue(notFoundError);

      const result = await inventoryTool.handler({
        operation: 'getSummaries',
        marketplaceId: 'INVALID_MARKETPLACE'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Marketplace not found');
    });

    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ETIMEDOUT';

      mockAmazonClient.fbaInventoryApi.getInventorySummaries.mockRejectedValue(timeoutError);

      const result = await inventoryTool.handler({
        operation: 'getSummaries',
        marketplaceId: 'ATVPDKIKX0DER'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      expect(result.retryable).toBe(true);
    });
  });

  describe('Performance and Caching', () => {
    it('should cache inventory data for performance', async () => {
      const mockInventoryData = {
        inventorySummaries: [
          { asin: 'B001', sellerSku: 'SKU-001', inventoryDetails: { fulfillableQuantity: 100 } }
        ]
      };

      mockAmazonClient.fbaInventoryApi.getInventorySummaries.mockResolvedValue({
        data: mockInventoryData
      });

      // First call
      const result1 = await inventoryTool.handler({
        operation: 'getSummaries',
        marketplaceId: 'ATVPDKIKX0DER',
        useCache: true
      });

      // Second call should use cache
      const result2 = await inventoryTool.handler({
        operation: 'getSummaries',
        marketplaceId: 'ATVPDKIKX0DER',
        useCache: true
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result2.fromCache).toBe(true);
      expect(mockAmazonClient.fbaInventoryApi.getInventorySummaries).toHaveBeenCalledTimes(1);
    });

    it('should track performance metrics for large inventory operations', async () => {
      const largeInventoryData = {
        inventorySummaries: Array.from({ length: 1000 }, (_, i) => ({
          asin: `B${String(i).padStart(10, '0')}`,
          sellerSku: `SKU-${i}`,
          inventoryDetails: { fulfillableQuantity: Math.floor(Math.random() * 500) }
        }))
      };

      mockAmazonClient.fbaInventoryApi.getInventorySummaries.mockResolvedValue({
        data: largeInventoryData
      });

      const result = await inventoryTool.handler({
        operation: 'getSummaries',
        marketplaceId: 'ATVPDKIKX0DER'
      });

      expect(result.success).toBe(true);
      expect(result.performance).toBeDefined();
      expect(result.performance.duration).toBeGreaterThan(0);
      expect(result.performance.itemsProcessed).toBe(1000);
      expect(result.performance.memoryUsage).toBeDefined();
    });
  });
});