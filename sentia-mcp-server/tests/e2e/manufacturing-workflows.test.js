/**
 * End-to-End Manufacturing Workflow Tests
 * Tests complete business processes from start to finish
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { McpServer } from '../../src/server.js';
import { generateManufacturingCompany, generateProduct, generateOrder } from '../utils/test-data-generators.js';
import '../utils/custom-matchers.js';

describe('Manufacturing Workflow E2E Tests', () => {
  let server;
  let testContext;

  beforeAll(async () => {
    // Initialize MCP server for E2E testing
    server = new McpServer({
      environment: 'test',
      enableRealApis: false, // Use mocks for E2E
      enableDatabase: true
    });
    
    await server.initialize();
    
    // Set up test context with realistic manufacturing data
    testContext = {
      company: generateManufacturingCompany(),
      products: Array.from({ length: 5 }, () => generateProduct()),
      orders: [],
      qualityRecords: [],
      inventoryLevels: []
    };
  });

  afterAll(async () => {
    if (server) {
      await server.shutdown();
    }
  });

  beforeEach(async () => {
    // Reset test state before each test
    await server.resetTestState();
  });

  describe('Complete Order Fulfillment Workflow', () => {
    it('should handle complete order-to-delivery workflow', async () => {
      // Step 1: Customer places order via Shopify
      const orderData = generateOrder({
        customer_id: testContext.company.id,
        line_items: testContext.products.slice(0, 3).map(product => ({
          product_id: product.id,
          quantity: 10,
          unit_price: product.price
        }))
      });

      const orderResponse = await server.callTool('shopify_create_order', {
        order: orderData
      });

      expect(orderResponse).toBeValidMcpToolResponse();
      expect(orderResponse.data).toBeValidManufacturingOrder();

      const createdOrder = orderResponse.data;
      testContext.orders.push(createdOrder);

      // Step 2: Check inventory levels via Amazon
      const inventoryResponse = await server.callTool('amazon_get_inventory_summary', {
        marketplace_id: 'ATVPDKIKX0DER'
      });

      expect(inventoryResponse).toBeValidMcpToolResponse();
      expect(inventoryResponse.data.inventorySummaries).toBeInstanceOf(Array);

      // Step 3: Create production work order if stock is low
      const lowStockItems = inventoryResponse.data.inventorySummaries.filter(
        item => item.totalQuantity < item.reorderPoint
      );

      if (lowStockItems.length > 0) {
        const workOrderResponse = await server.callTool('unleashed_create_work_order', {
          product_id: lowStockItems[0].productId,
          quantity: 100,
          priority: 'high'
        });

        expect(workOrderResponse).toBeValidMcpToolResponse();
        expect(workOrderResponse.data).toHaveProperty('work_order_number');
      }

      // Step 4: Quality control inspection
      const qualityData = {
        inspector: 'QC_Inspector_001',
        work_order: createdOrder.order_number,
        product_id: createdOrder.line_items[0].product_id,
        measurements: [
          {
            characteristic: 'Weight',
            values: [98.5, 99.2, 98.8, 99.0, 98.9],
            specification: '99.0 ± 1.0g',
            result: 'pass'
          },
          {
            characteristic: 'Dimensions',
            values: [10.02, 10.01, 9.99, 10.00, 10.03],
            specification: '10.0 ± 0.05mm',
            result: 'pass'
          }
        ],
        overall_result: 'pass'
      };

      expect(qualityData).toBeValidQualityRecord();

      // Step 5: Update financial records via Xero
      const invoiceResponse = await server.callTool('xero_create_invoice', {
        contact_id: createdOrder.customer_id,
        line_items: createdOrder.line_items.map(item => ({
          description: `Product ${item.product_id}`,
          quantity: item.quantity,
          unit_amount: item.unit_price
        })),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      expect(invoiceResponse).toBeValidMcpToolResponse();
      expect(invoiceResponse.data).toHaveProperty('invoice_id');

      // Step 6: Generate financial reports
      const reportsResponse = await server.callTool('xero_get_profit_loss', {
        from_date: '2024-01-01',
        to_date: '2024-12-31'
      });

      expect(reportsResponse).toBeValidMcpToolResponse();
      expect(reportsResponse.data).toBeValidXeroResponse();

      // Verify workflow completion
      expect(createdOrder.status).toBe('pending');
      expect(qualityData.overall_result).toBe('pass');
      expect(invoiceResponse.data.status).toBe('draft');
    }, 30000); // 30 second timeout for complex workflow

    it('should handle production planning workflow', async () => {
      // Step 1: Analyze demand forecasting data
      const demandResponse = await server.callTool('anthropic_analyze_demand', {
        historical_data: testContext.orders,
        forecast_period: 90
      });

      expect(demandResponse).toBeValidMcpToolResponse();
      expect(demandResponse.data).toHaveProperty('forecast');

      // Step 2: Optimize inventory based on demand
      const optimizationResponse = await server.callTool('openai_optimize_inventory', {
        current_levels: testContext.inventoryLevels,
        demand_forecast: demandResponse.data.forecast,
        constraints: {
          storage_capacity: 10000,
          budget_limit: 50000
        }
      });

      expect(optimizationResponse).toBeValidMcpToolResponse();
      expect(optimizationResponse.data).toHaveProperty('recommended_orders');

      // Step 3: Create purchase orders via Unleashed
      const recommendedOrders = optimizationResponse.data.recommended_orders;
      
      for (const recommendation of recommendedOrders.slice(0, 2)) {
        const purchaseOrderResponse = await server.callTool('unleashed_create_purchase_order', {
          supplier_id: recommendation.supplier_id,
          product_id: recommendation.product_id,
          quantity: recommendation.quantity,
          unit_cost: recommendation.unit_cost
        });

        expect(purchaseOrderResponse).toBeValidMcpToolResponse();
        expect(purchaseOrderResponse.data).toHaveProperty('purchase_order_number');
      }

      // Step 4: Update working capital analysis
      const workingCapitalResponse = await server.callTool('xero_analyze_working_capital', {
        include_forecasts: true,
        period_days: 90
      });

      expect(workingCapitalResponse).toBeValidMcpToolResponse();
      expect(workingCapitalResponse.data).toHaveProperty('current_ratio');
      expect(workingCapitalResponse.data).toHaveProperty('cash_conversion_cycle');

      // Verify production planning workflow
      expect(demandResponse.data.forecast).toBeInstanceOf(Array);
      expect(optimizationResponse.data.recommended_orders).toBeInstanceOf(Array);
      expect(workingCapitalResponse.data.current_ratio).toBeValidFinancialAmount();
    }, 25000);
  });

  describe('Quality Control Workflow', () => {
    it('should handle complete quality assurance process', async () => {
      // Step 1: Create quality control plan
      const qualityPlan = {
        product_id: testContext.products[0].id,
        inspection_points: [
          { stage: 'incoming', characteristics: ['weight', 'dimensions', 'visual'] },
          { stage: 'in_process', characteristics: ['temperature', 'pressure', 'timing'] },
          { stage: 'final', characteristics: ['functionality', 'durability', 'packaging'] }
        ],
        sampling_rate: 0.1, // 10% sampling
        acceptance_criteria: {
          defect_rate: 0.02, // 2% maximum defect rate
          cpk_minimum: 1.33
        }
      };

      // Step 2: Execute incoming inspection
      const incomingInspection = await server.callTool('qc_perform_inspection', {
        type: 'incoming',
        product_id: testContext.products[0].id,
        sample_size: 50,
        measurements: [
          { characteristic: 'weight', values: Array.from({ length: 50 }, () => 99 + Math.random() * 2) },
          { characteristic: 'dimensions', values: Array.from({ length: 50 }, () => 10 + Math.random() * 0.1) }
        ]
      });

      expect(incomingInspection).toBeValidMcpToolResponse();
      expect(incomingInspection.data).toBeValidQualityRecord();

      // Step 3: Statistical process control analysis
      const spcResponse = await server.callTool('qc_analyze_spc', {
        measurement_data: incomingInspection.data.measurements,
        control_limits: {
          upper: 100.5,
          lower: 97.5,
          target: 99.0
        }
      });

      expect(spcResponse).toBeValidMcpToolResponse();
      expect(spcResponse.data).toHaveProperty('control_status');
      expect(spcResponse.data).toHaveProperty('cpk_value');

      // Step 4: Non-conformance management
      if (spcResponse.data.control_status !== 'in_control') {
        const nonConformanceResponse = await server.callTool('qc_create_non_conformance', {
          product_id: testContext.products[0].id,
          issue_description: 'Process out of statistical control',
          severity: 'medium',
          corrective_actions: [
            'Recalibrate measuring equipment',
            'Review process parameters',
            'Increase sampling frequency'
          ]
        });

        expect(nonConformanceResponse).toBeValidMcpToolResponse();
        expect(nonConformanceResponse.data).toHaveProperty('nc_number');
      }

      // Step 5: Quality metrics reporting
      const metricsResponse = await server.callTool('qc_generate_metrics', {
        period: 'monthly',
        include_trends: true,
        product_ids: [testContext.products[0].id]
      });

      expect(metricsResponse).toBeValidMcpToolResponse();
      expect(metricsResponse.data).toHaveProperty('defect_rate');
      expect(metricsResponse.data).toHaveProperty('first_pass_yield');
      expect(metricsResponse.data.defect_rate).toBeLessThanOrEqual(qualityPlan.acceptance_criteria.defect_rate);
    }, 20000);
  });

  describe('Financial Integration Workflow', () => {
    it('should handle complete financial reporting cycle', async () => {
      // Step 1: Synchronize sales data from multiple sources
      const salesSyncTasks = [
        server.callTool('shopify_get_orders', { 
          status: 'fulfilled',
          created_at_min: '2024-01-01T00:00:00Z'
        }),
        server.callTool('amazon_get_orders', {
          created_after: '2024-01-01T00:00:00Z',
          order_statuses: ['Shipped', 'Delivered']
        })
      ];

      const [shopifyOrders, amazonOrders] = await Promise.all(salesSyncTasks);

      expect(shopifyOrders).toBeValidMcpToolResponse();
      expect(amazonOrders).toBeValidMcpToolResponse();
      expect(shopifyOrders.data).toBeValidShopifyResponse();
      expect(amazonOrders.data).toBeValidAmazonResponse();

      // Step 2: Calculate manufacturing costs
      const allOrders = [
        ...shopifyOrders.data.orders,
        ...amazonOrders.data.orders
      ];

      const costAnalysisResponse = await server.callTool('calculate_manufacturing_costs', {
        orders: allOrders,
        include_overhead: true,
        cost_method: 'activity_based'
      });

      expect(costAnalysisResponse).toBeValidMcpToolResponse();
      expect(costAnalysisResponse.data).toHaveProperty('total_costs');
      expect(costAnalysisResponse.data).toHaveProperty('cost_breakdown');

      // Step 3: Generate comprehensive financial reports
      const financialReports = await Promise.all([
        server.callTool('xero_get_profit_loss', {
          from_date: '2024-01-01',
          to_date: '2024-12-31'
        }),
        server.callTool('xero_get_balance_sheet', {
          date: '2024-12-31'
        }),
        server.callTool('xero_get_cash_flow', {
          from_date: '2024-01-01',
          to_date: '2024-12-31'
        })
      ]);

      financialReports.forEach(report => {
        expect(report).toBeValidMcpToolResponse();
        expect(report.data).toBeValidXeroResponse();
      });

      // Step 4: Working capital analysis
      const workingCapitalAnalysis = await server.callTool('analyze_working_capital', {
        financial_data: financialReports.map(r => r.data),
        manufacturing_costs: costAnalysisResponse.data,
        forecast_period: 90
      });

      expect(workingCapitalAnalysis).toBeValidMcpToolResponse();
      expect(workingCapitalAnalysis.data).toHaveProperty('current_ratio');
      expect(workingCapitalAnalysis.data).toHaveProperty('quick_ratio');
      expect(workingCapitalAnalysis.data).toHaveProperty('cash_conversion_cycle');

      // Step 5: Profitability analysis by product
      const profitabilityResponse = await server.callTool('analyze_product_profitability', {
        orders: allOrders,
        costs: costAnalysisResponse.data,
        allocation_method: 'activity_based'
      });

      expect(profitabilityResponse).toBeValidMcpToolResponse();
      expect(profitabilityResponse.data).toHaveProperty('products');
      
      profitabilityResponse.data.products.forEach(product => {
        expect(product).toHaveProfitMargin(product.expected_margin, 0.05);
      });

      // Verify financial workflow completion
      expect(allOrders.length).toBeGreaterThan(0);
      expect(costAnalysisResponse.data.total_costs).toBeValidFinancialAmount();
      expect(workingCapitalAnalysis.data.current_ratio).toBeGreaterThan(1);
    }, 35000);
  });

  describe('Supply Chain Optimization Workflow', () => {
    it('should optimize entire supply chain process', async () => {
      // Step 1: Analyze current inventory positions
      const inventoryAnalysis = await Promise.all([
        server.callTool('amazon_get_inventory_summary', {
          marketplace_id: 'ATVPDKIKX0DER'
        }),
        server.callTool('shopify_get_inventory_levels', {
          location_ids: ['primary_warehouse']
        }),
        server.callTool('unleashed_get_stock_on_hand', {
          warehouse_code: 'MAIN'
        })
      ]);

      inventoryAnalysis.forEach(analysis => {
        expect(analysis).toBeValidMcpToolResponse();
      });

      // Step 2: AI-powered demand forecasting
      const demandForecast = await server.callTool('anthropic_forecast_demand', {
        historical_sales: testContext.orders,
        external_factors: {
          seasonality: true,
          market_trends: true,
          economic_indicators: true
        },
        forecast_horizon: 180
      });

      expect(demandForecast).toBeValidMcpToolResponse();
      expect(demandForecast.data).toHaveProperty('forecast_periods');
      expect(demandForecast.data).toHaveProperty('confidence_intervals');

      // Step 3: Inventory optimization using OpenAI
      const inventoryOptimization = await server.callTool('openai_optimize_inventory', {
        current_inventory: inventoryAnalysis.map(a => a.data),
        demand_forecast: demandForecast.data,
        constraints: {
          storage_capacity: 50000,
          capital_budget: 200000,
          service_level: 0.95
        }
      });

      expect(inventoryOptimization).toBeValidMcpToolResponse();
      expect(inventoryOptimization.data).toHaveProperty('optimization_results');
      expect(inventoryOptimization.data).toHaveProperty('recommended_actions');

      // Step 4: Supplier performance analysis
      const supplierAnalysis = await server.callTool('analyze_supplier_performance', {
        suppliers: testContext.company.suppliers,
        metrics: ['delivery_time', 'quality_rating', 'cost_competitiveness'],
        period_days: 365
      });

      expect(supplierAnalysis).toBeValidMcpToolResponse();
      expect(supplierAnalysis.data).toHaveProperty('supplier_rankings');
      expect(supplierAnalysis.data).toHaveProperty('risk_assessment');

      // Step 5: Generate optimized procurement plan
      const procurementPlan = await server.callTool('generate_procurement_plan', {
        inventory_optimization: inventoryOptimization.data,
        supplier_analysis: supplierAnalysis.data,
        budget_constraints: {
          quarterly_budget: 150000,
          emergency_reserve: 25000
        }
      });

      expect(procurementPlan).toBeValidMcpToolResponse();
      expect(procurementPlan.data).toHaveProperty('procurement_schedule');
      expect(procurementPlan.data).toHaveProperty('cost_savings_potential');

      // Verify supply chain optimization workflow
      expect(demandForecast.data.forecast_periods).toBeInstanceOf(Array);
      expect(inventoryOptimization.data.recommended_actions).toBeInstanceOf(Array);
      expect(supplierAnalysis.data.supplier_rankings).toBeInstanceOf(Array);
      expect(procurementPlan.data.cost_savings_potential).toBeValidFinancialAmount();
    }, 30000);
  });

  describe('Error Handling and Recovery Workflows', () => {
    it('should handle API failures gracefully', async () => {
      // Simulate API failures and test recovery mechanisms
      await server.simulateApiFailure('xero', 'temporary');

      const resilientResponse = await server.callTool('xero_get_invoices', {
        status: 'paid'
      });

      // Should fall back to cache or alternative data source
      expect(resilientResponse).toBeValidMcpToolResponse();
      expect(resilientResponse.data).toHaveProperty('source', 'cache');

      // Test recovery after API comes back online
      await server.restoreApiService('xero');
      
      const recoveredResponse = await server.callTool('xero_get_invoices', {
        status: 'paid'
      });

      expect(recoveredResponse).toBeValidMcpToolResponse();
      expect(recoveredResponse.data).toHaveProperty('source', 'live');
    });

    it('should handle data inconsistencies across systems', async () => {
      // Create scenario with mismatched data between systems
      const inconsistencyResponse = await server.callTool('detect_data_inconsistencies', {
        systems: ['shopify', 'xero', 'amazon'],
        data_types: ['inventory', 'orders', 'customers']
      });

      expect(inconsistencyResponse).toBeValidMcpToolResponse();
      expect(inconsistencyResponse.data).toHaveProperty('inconsistencies');

      if (inconsistencyResponse.data.inconsistencies.length > 0) {
        const reconciliationResponse = await server.callTool('reconcile_data_inconsistencies', {
          inconsistencies: inconsistencyResponse.data.inconsistencies,
          resolution_strategy: 'most_recent_wins'
        });

        expect(reconciliationResponse).toBeValidMcpToolResponse();
        expect(reconciliationResponse.data).toHaveProperty('resolved_count');
      }
    });
  });
});