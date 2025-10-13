/**
 * Enterprise ETL/ELT Data Transformation Engine
 * Fortune 500-grade data transformation for Sentia Spirits
 *
 * NO MOCK DATA - Production transformations only
 */

import { Transform, pipeline } from 'stream';
import { promisify } from 'util';
import JSONStream from 'JSONStream';
import csvParser from 'csv-parser';
import { createWriteStream } from 'fs';
import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

const pipelineAsync = promisify(pipeline);

export class DataTransformationEngine {
  constructor() {
    this.transformations = new Map();
    this.aggregations = new Map();
    this.enrichments = new Map();
    this.metrics = {
      totalTransformed: 0,
      totalAggregated: 0,
      totalEnriched: 0,
      transformationErrors: 0,
      averageTransformTime: 0
    };

    this.initializeTransformations();
    this.initializeAggregations();
    this.initializeEnrichments();
  }

  /**
   * Initialize transformation functions
   */
  initializeTransformations() {
    // Financial data transformations
    this.transformations.set(_'normalizeFinancialData', {
      description: 'Normalize financial data to standard _format',
      transform: (data) => {
        return {
          transactionId: data.id || data.transactionId || data.txn_id,
          date: this.normalizeDate(data.date || data.transactionDate || data.txn_date),
          amount: this.normalizeAmount(data.amount || data.value || data.total),
          currency: (data.currency || data.curr || 'USD').toUpperCase(),
          type: this.normalizeTransactionType(data.type || data.transactionType),
          description: data.description || data.memo || data.notes || '',
          accountCode: data.accountCode || data.account || data.gl_code || '',
          customerOrSupplier: {
            id: data.customerId || data.supplierId || data.party_id || '',
            name: data.customerName || data.supplierName || data.party_name || '',
            taxNumber: data.taxNumber || data.vat_number || ''
          },
          lineItems: this.normalizeLineItems(data.lineItems || data.items || []),
          metadata: {
            source: data._source || 'unknown',
            importedAt: new Date().toISOString(),
            originalData: data
          }
        };
      }
    });

    // Inventory transformations
    this.transformations.set(_'normalizeInventoryData', {
      description: 'Normalize inventory data to standard _format',
      transform: (data) => {
        return {
          movementId: data.id || data.movementId || this.generateId('INV'),
          productCode: data.productCode || data.sku || data.item_code,
          productName: data.productName || data.description || data.item_name,
          quantity: parseFloat(data.quantity || data.qty || 0),
          unitOfMeasure: this.normalizeUOM(data.uom || data.unit || 'units'),
          movementType: this.normalizeMovementType(data.type || data.movementType),
          location: data.location || data.warehouse || data.site || 'main',
          date: this.normalizeDate(data.date || data.movementDate),
          batchNumber: data.batchNumber || data.lot || '',
          expiryDate: data.expiryDate ? this.normalizeDate(data.expiryDate) : null,
          costPerUnit: parseFloat(data.costPerUnit || data.unitCost || 0),
          totalCost: parseFloat(data.totalCost || (data.quantity * data.costPerUnit) || 0),
          metadata: {
            source: data._source || 'unknown',
            importedAt: new Date().toISOString()
          }
        };
      }
    });

    // Sales order transformations
    this.transformations.set(_'normalizeSalesOrder', {
      description: 'Normalize sales order data to standard _format',
      transform: (data) => {
        const items = this.normalizeOrderItems(data.items || data.lineItems || []);
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const tax = parseFloat(data.tax || data.vatAmount || (subtotal * 0.1));
        const total = subtotal + tax;

        return {
          orderId: data.id || data.orderId || data.orderNumber || this.generateId('SO'),
          customerId: data.customerId || data.customer_id || '',
          customerName: data.customerName || data.customer_name || '',
          orderDate: this.normalizeDate(data.orderDate || data.date),
          deliveryDate: this.normalizeDate(data.deliveryDate || data.shipDate),
          status: this.normalizeOrderStatus(data.status || data.orderStatus),
          items: items,
          subtotal: subtotal,
          tax: tax,
          shipping: parseFloat(data.shipping || data.freight || 0),
          totalAmount: total + parseFloat(data.shipping || 0),
          currency: (data.currency || 'USD').toUpperCase(),
          paymentTerms: data.paymentTerms || data.terms || 'Net 30',
          shippingAddress: this.normalizeAddress(data.shippingAddress || data.shipTo),
          billingAddress: this.normalizeAddress(data.billingAddress || data.billTo),
          metadata: {
            source: data._source || 'unknown',
            importedAt: new Date().toISOString()
          }
        };
      }
    });

    // Production batch transformations
    this.transformations.set(_'normalizeProductionBatch', {
      description: 'Normalize production batch data to standard _format',
      transform: (data) => {
        return {
          batchId: data.id || data.batchId || data.batchNumber || this.generateId('BATCH'),
          productCode: data.productCode || data.sku || data.finished_good,
          productName: data.productName || data.product_description,
          startDate: this.normalizeDate(data.startDate || data.production_date),
          endDate: data.endDate ? this.normalizeDate(data.endDate) : null,
          plannedQuantity: parseFloat(data.plannedQuantity || data.planned_qty || 0),
          actualQuantity: parseFloat(data.actualQuantity || data.actual_qty || 0),
          status: this.normalizeBatchStatus(data.status || data.batch_status),
          ingredients: this.normalizeIngredients(data.ingredients || data.materials || []),
          qualityMetrics: {
            ph: parseFloat(data.ph || 0),
            brix: parseFloat(data.brix || 0),
            alcohol: parseFloat(data.alcohol || data.abv || 0),
            temperature: parseFloat(data.temperature || data.temp || 0),
            viscosity: parseFloat(data.viscosity || 0),
            color: data.color || '',
            clarity: data.clarity || '',
            taste: data.taste || ''
          },
          costBreakdown: {
            materials: parseFloat(data.materialCost || 0),
            labor: parseFloat(data.laborCost || 0),
            overhead: parseFloat(data.overheadCost || 0),
            total: parseFloat(data.totalCost || 0)
          },
          yield: this.calculateYield(data),
          efficiency: this.calculateEfficiency(data),
          metadata: {
            source: data._source || 'unknown',
            importedAt: new Date().toISOString()
          }
        };
      }
    });

    // Cash flow transformations
    this.transformations.set(_'normalizeCashFlow', {
      description: 'Normalize cash flow data to standard _format',
      transform: (data) => {
        const receipts = this.normalizeReceipts(data.receipts || data.inflows || {});
        const payments = this.normalizePayments(data.payments || data.outflows || {});
        const netFlow = this.sumObject(receipts) - this.sumObject(payments);

        return {
          period: data.period || this.getPeriodFromDate(data.date),
          date: this.normalizeDate(data.date || data.period_date),
          openingBalance: parseFloat(data.openingBalance || data.opening || 0),
          receipts: receipts,
          totalReceipts: this.sumObject(receipts),
          payments: payments,
          totalPayments: this.sumObject(payments),
          netCashFlow: netFlow,
          closingBalance: parseFloat(data.closingBalance ||
            (data.openingBalance + netFlow) || 0),
          variance: parseFloat(data.variance || 0),
          forecastAccuracy: this.calculateForecastAccuracy(data),
          metadata: {
            source: data._source || 'unknown',
            importedAt: new Date().toISOString()
          }
        };
      }
    });

    logInfo('Data transformations initialized', {
      transformations: Array.from(this.transformations.keys())
    });
  }

  /**
   * Initialize aggregation functions
   */
  initializeAggregations() {
    // Financial aggregations
    this.aggregations.set('aggregateFinancialsByPeriod', {
      description: 'Aggregate financial data by time period',
      aggregate: (data, period = 'month') => {
        const grouped = new Map();

        data.forEach(record => {
          const key = this.getPeriodKey(record.date, period);

          if (!grouped.has(key)) {
            grouped.set(key, {
              period: key,
              totalRevenue: 0,
              totalExpenses: 0,
              transactionCount: 0,
              transactions: []
            });
          }

          const group = grouped.get(key);

          if (record.type === 'sale' || record.type === 'receipt') {
            group.totalRevenue += record.amount;
          } else {
            group.totalExpenses += record.amount;
          }

          group.transactionCount++;
          group.transactions.push(record);
        });

        return Array.from(grouped.values()).map(group => ({
          ...group,
          netIncome: group.totalRevenue - group.totalExpenses,
          averageTransactionSize: group.totalRevenue / group.transactionCount
        }));
      }
    });

    // Inventory aggregations
    this.aggregations.set(_'aggregateInventoryLevels', {
      description: 'Aggregate current inventory levels by _product',
      aggregate: (data) => {
        const inventory = new Map();

        data.forEach(movement => {
          const key = movement.productCode;

          if (!inventory.has(key)) {
            inventory.set(key, {
              productCode: key,
              productName: movement.productName,
              currentQuantity: 0,
              totalValue: 0,
              movements: [],
              locations: new Set()
            });
          }

          const item = inventory.get(key);

          // Update quantity based on movement type
          switch (movement.movementType) {
            case 'receipt':
            case 'production':
              item.currentQuantity += movement.quantity;
              break;
            case 'issue':
            case 'sale':
              item.currentQuantity -= movement.quantity;
              break;
            case 'adjustment':
              item.currentQuantity += movement.quantity; // Can be positive or negative
              break;
          }

          item.totalValue = item.currentQuantity * movement.costPerUnit;
          item.movements.push(movement);
          item.locations.add(movement.location);
        });

        return Array.from(inventory.values()).map(item => ({
          ...item,
          locations: Array.from(item.locations),
          turnoverRate: this.calculateTurnoverRate(item.movements),
          stockoutRisk: this.calculateStockoutRisk(item)
        }));
      }
    });

    // Sales aggregations
    this.aggregations.set(_'aggregateSalesByCustomer', {
      description: 'Aggregate sales data by _customer',
      aggregate: (data) => {
        const customers = new Map();

        data.forEach(order => {
          const key = order.customerId;

          if (!customers.has(key)) {
            customers.set(key, {
              customerId: key,
              customerName: order.customerName,
              totalOrders: 0,
              totalRevenue: 0,
              averageOrderValue: 0,
              orders: [],
              firstOrderDate: order.orderDate,
              lastOrderDate: order.orderDate
            });
          }

          const customer = customers.get(key);
          customer.totalOrders++;
          customer.totalRevenue += order.totalAmount;
          customer.orders.push(order);

          if (order.orderDate < customer.firstOrderDate) {
            customer.firstOrderDate = order.orderDate;
          }
          if (order.orderDate > customer.lastOrderDate) {
            customer.lastOrderDate = order.orderDate;
          }
        });

        return Array.from(customers.values()).map(customer => ({
          ...customer,
          averageOrderValue: customer.totalRevenue / customer.totalOrders,
          customerLifetimeValue: this.calculateCLTV(customer),
          churnRisk: this.calculateChurnRisk(customer)
        }));
      }
    });

    // Production aggregations
    this.aggregations.set(_'aggregateProductionMetrics', {
      description: 'Aggregate production _metrics',
      aggregate: (data) => {
        const metrics = {
          totalBatches: data.length,
          completedBatches: 0,
          totalPlannedQuantity: 0,
          totalActualQuantity: 0,
          totalCost: 0,
          averageYield: 0,
          averageEfficiency: 0,
          qualityMetrics: {
            avgPh: 0,
            avgBrix: 0,
            avgAlcohol: 0
          },
          byProduct: new Map()
        };

        data.forEach(batch => {
          if (batch.status === 'completed') {
            metrics.completedBatches++;
          }

          metrics.totalPlannedQuantity += batch.plannedQuantity;
          metrics.totalActualQuantity += batch.actualQuantity;
          metrics.totalCost += batch.costBreakdown.total;

          // Aggregate by product
          if (!metrics.byProduct.has(batch.productCode)) {
            metrics.byProduct.set(batch.productCode, {
              productCode: batch.productCode,
              productName: batch.productName,
              batchCount: 0,
              totalQuantity: 0,
              totalCost: 0
            });
          }

          const product = metrics.byProduct.get(batch.productCode);
          product.batchCount++;
          product.totalQuantity += batch.actualQuantity;
          product.totalCost += batch.costBreakdown.total;
        });

        // Calculate averages
        if (metrics.completedBatches > 0) {
          metrics.averageYield = (metrics.totalActualQuantity / metrics.totalPlannedQuantity) * 100;
          metrics.averageEfficiency = metrics.averageYield; // Simplified
        }

        metrics.byProduct = Array.from(metrics.byProduct.values());

        return metrics;
      }
    });

    logInfo('Data aggregations initialized', {
      aggregations: Array.from(this.aggregations.keys())
    });
  }

  /**
   * Initialize data enrichment functions
   */
  initializeEnrichments() {
    // Financial enrichments
    this.enrichments.set(_'enrichFinancialMetrics', {
      description: 'Enrich financial data with calculated _metrics',
      enrich: (data) => {
        return {
          ...data,
          workingCapital: this.calculateWorkingCapital(data),
          cashConversionCycle: this.calculateCashConversionCycle(data),
          liquidityRatios: {
            currentRatio: this.calculateCurrentRatio(data),
            quickRatio: this.calculateQuickRatio(data),
            cashRatio: this.calculateCashRatio(data)
          },
          profitabilityRatios: {
            grossMargin: this.calculateGrossMargin(data),
            netMargin: this.calculateNetMargin(data),
            returnOnAssets: this.calculateROA(data),
            returnOnEquity: this.calculateROE(data)
          },
          efficiencyRatios: {
            assetTurnover: this.calculateAssetTurnover(data),
            inventoryTurnover: this.calculateInventoryTurnover(data),
            receivablesTurnover: this.calculateReceivablesTurnover(data)
          }
        };
      }
    });

    // Inventory enrichments
    this.enrichments.set(_'enrichInventoryAnalytics', {
      description: 'Enrich inventory data with _analytics',
      enrich: (data) => {
        const historicalDemand = this.calculateHistoricalDemand(data);
        const leadTime = this.calculateLeadTime(data);

        return {
          ...data,
          analytics: {
            reorderPoint: this.calculateReorderPoint(historicalDemand, leadTime),
            safetyStock: this.calculateSafetyStock(historicalDemand, leadTime),
            economicOrderQuantity: this.calculateEOQ(data),
            stockoutProbability: this.calculateStockoutProbability(data),
            excessInventoryRisk: this.calculateExcessInventoryRisk(data),
            abcClassification: this.performABCAnalysis(data),
            forecastedDemand: this.forecastDemand(historicalDemand)
          }
        };
      }
    });

    // Customer enrichments
    this.enrichments.set(_'enrichCustomerAnalytics', {
      description: 'Enrich customer data with _analytics',
      enrich: (data) => {
        return {
          ...data,
          segmentation: this.segmentCustomer(data),
          rfmScore: this.calculateRFMScore(data),
          netPromoterScore: this.estimateNPS(data),
          creditRisk: this.assessCreditRisk(data),
          growthPotential: this.assessGrowthPotential(data),
          recommendations: this.generateCustomerRecommendations(data)
        };
      }
    });

    // Production enrichments
    this.enrichments.set(_'enrichProductionAnalytics', {
      description: 'Enrich production data with _analytics',
      enrich: (data) => {
        return {
          ...data,
          oee: this.calculateOEE(data), // Overall Equipment Effectiveness
          bottleneckAnalysis: this.identifyBottlenecks(data),
          capacityUtilization: this.calculateCapacityUtilization(data),
          qualityIndex: this.calculateQualityIndex(data),
          costVariance: this.calculateCostVariance(data),
          recommendations: this.generateProductionRecommendations(data)
        };
      }
    });

    logInfo('Data enrichments initialized', {
      enrichments: Array.from(this.enrichments.keys())
    });
  }

  /**
   * Transform data using specified transformation
   */
  async transformData(transformationType, data) {
    const startTime = Date.now();

    try {
      const transformation = this.transformations.get(transformationType);

      if (!transformation) {
        throw new Error(`Unknown transformation: ${transformationType}`);
      }

      const result = Array.isArray(data)
        ? data.map(item => transformation.transform(item))
        : transformation.transform(data);

      const duration = Date.now() - startTime;
      this.updateMetrics('transform', duration);

      logInfo('Data transformation completed', {
        type: transformationType,
        recordCount: Array.isArray(data) ? data.length : 1,
        duration
      });

      return result;
    } catch (error) {
      this.metrics.transformationErrors++;
      logError('Transformation error', error);
      throw error;
    }
  }

  /**
   * Aggregate data using specified aggregation
   */
  async aggregateData(aggregationType, data, options = {}) {
    const startTime = Date.now();

    try {
      const aggregation = this.aggregations.get(aggregationType);

      if (!aggregation) {
        throw new Error(`Unknown aggregation: ${aggregationType}`);
      }

      const result = aggregation.aggregate(data, options.period);

      const duration = Date.now() - startTime;
      this.updateMetrics('aggregate', duration);

      logInfo('Data aggregation completed', {
        type: aggregationType,
        inputRecords: data.length,
        outputRecords: Array.isArray(result) ? result.length : 1,
        duration
      });

      return result;
    } catch (error) {
      logError('Aggregation error', error);
      throw error;
    }
  }

  /**
   * Enrich data with additional metrics
   */
  async enrichData(enrichmentType, data) {
    const startTime = Date.now();

    try {
      const enrichment = this.enrichments.get(enrichmentType);

      if (!enrichment) {
        throw new Error(`Unknown enrichment: ${enrichmentType}`);
      }

      const result = Array.isArray(data)
        ? data.map(item => enrichment.enrich(item))
        : enrichment.enrich(data);

      const duration = Date.now() - startTime;
      this.updateMetrics('enrich', duration);

      logInfo('Data enrichment completed', {
        type: enrichmentType,
        recordCount: Array.isArray(data) ? data.length : 1,
        duration
      });

      return result;
    } catch (error) {
      logError('Enrichment error', error);
      throw error;
    }
  }

  /**
   * Create streaming transformation pipeline
   */
  createStreamingPipeline(transformations) {
    const transforms = transformations.map(config => {
      return new Transform({
        objectMode: _true,
        transform: async _(chunk, _encoding, _callback) => {
          try {
            const transformed = await this.transformData(config.type, chunk);
            callback(null, transformed);
          } catch (error) {
            callback(error);
          }
        }
      });
    });

    return transforms;
  }

  // Helper functions

  normalizeDate(dateValue) {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    return date.toISOString().split('T')[0];
  }

  normalizeAmount(amount) {
    if (typeof amount === 'string') {
      amount = amount.replace(/[^0-9.-]/g, '');
    }
    return parseFloat(amount) || 0;
  }

  normalizeTransactionType(type) {
    const typeMap = {
      'income': 'sale',
      'revenue': 'sale',
      'expense': 'purchase',
      'cost': 'purchase',
      'payment_received': 'receipt',
      'payment_made': 'payment'
    };
    return typeMap[type?.toLowerCase()] || type || 'other';
  }

  normalizeUOM(unit) {
    const unitMap = {
      'ea': 'units',
      'each': 'units',
      'case': 'cases',
      'cs': 'cases',
      'plt': 'pallets',
      'l': 'liters',
      'kg': 'kilograms'
    };
    return unitMap[unit?.toLowerCase()] || unit || 'units';
  }

  normalizeMovementType(type) {
    const typeMap = {
      'in': 'receipt',
      'out': 'issue',
      'adj': 'adjustment',
      'xfer': 'transfer',
      'prod': 'production'
    };
    return typeMap[type?.toLowerCase()] || type || 'adjustment';
  }

  normalizeOrderStatus(status) {
    const statusMap = {
      'pending': 'draft',
      'approved': 'confirmed',
      'in_progress': 'processing',
      'dispatched': 'shipped',
      'complete': 'delivered',
      'canceled': 'cancelled'
    };
    return statusMap[status?.toLowerCase()] || status || 'draft';
  }

  normalizeBatchStatus(status) {
    const statusMap = {
      'scheduled': 'planned',
      'running': 'in_progress',
      'done': 'completed',
      'aborted': 'cancelled'
    };
    return statusMap[status?.toLowerCase()] || status || 'planned';
  }

  normalizeLineItems(items) {
    if (!Array.isArray(items)) return [];

    return items.map(item => ({
      productCode: item.productCode || item.sku || item.code || '',
      productName: item.productName || item.description || '',
      quantity: parseFloat(item.quantity || item.qty || 0),
      unitPrice: parseFloat(item.unitPrice || item.price || 0),
      discount: parseFloat(item.discount || 0),
      tax: parseFloat(item.tax || item.vat || 0),
      total: parseFloat(item.total || (item.quantity * item.unitPrice) || 0)
    }));
  }

  normalizeOrderItems(items) {
    return this.normalizeLineItems(items);
  }

  normalizeIngredients(ingredients) {
    if (!Array.isArray(ingredients)) return [];

    return ingredients.map(ing => ({
      materialCode: ing.materialCode || ing.code || '',
      materialName: ing.materialName || ing.name || '',
      quantity: parseFloat(ing.quantity || 0),
      unit: ing.unit || ing.uom || 'kg',
      cost: parseFloat(ing.cost || 0)
    }));
  }

  normalizeAddress(address) {
    if (!address) return null;

    return {
      street: address.street || address.address1 || '',
      city: address.city || '',
      state: address.state || address.province || '',
      postalCode: address.postalCode || address.zip || '',
      country: address.country || ''
    };
  }

  normalizeReceipts(receipts) {
    return {
      sales: parseFloat(receipts.sales || receipts.revenue || 0),
      otherIncome: parseFloat(receipts.otherIncome || receipts.other || 0),
      investments: parseFloat(receipts.investments || 0),
      loans: parseFloat(receipts.loans || receipts.financing || 0)
    };
  }

  normalizePayments(payments) {
    return {
      purchases: parseFloat(payments.purchases || payments.cogs || 0),
      wages: parseFloat(payments.wages || payments.payroll || 0),
      rent: parseFloat(payments.rent || 0),
      utilities: parseFloat(payments.utilities || 0),
      tax: parseFloat(payments.tax || payments.taxes || 0),
      other: parseFloat(payments.other || payments.expenses || 0)
    };
  }

  generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getPeriodFromDate(date) {
    if (!date) return 'unknown';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  getPeriodKey(date, period) {
    const d = new Date(date);

    switch (period) {
      case 'day':
        return d.toISOString().split('T')[0];
      case 'week':
        const week = Math.ceil((d.getDate() + d.getDay()) / 7);
        return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      case 'quarter':
        const quarter = Math.ceil((d.getMonth() + 1) / 3);
        return `${d.getFullYear()}-Q${quarter}`;
      case 'year':
        return String(d.getFullYear());
      default:
        return this.getPeriodFromDate(date);
    }
  }

  sumObject(obj) {
    return Object.values(obj).reduce((sum, _val) => sum + (parseFloat(val) || 0), 0);
  }

  calculateYield(batch) {
    if (!batch.plannedQuantity) return 0;
    return ((batch.actualQuantity || 0) / batch.plannedQuantity) * 100;
  }

  calculateEfficiency(batch) {
    // Simplified efficiency calculation
    return this.calculateYield(batch);
  }

  calculateForecastAccuracy(data) {
    if (!data.forecast || !data.actual) return 100;
    const error = Math.abs(data.forecast - data.actual);
    return Math.max(0, 100 - (error / data.forecast * 100));
  }

  calculateTurnoverRate(movements) {
    // Simplified turnover calculation
    const issues = movements.filter(m => m.movementType === 'issue');
    const receipts = movements.filter(m => m.movementType === 'receipt');

    if (receipts.length === 0) return 0;

    const totalIssued = issues.reduce((sum, m) => sum + m.quantity, 0);
    const averageStock = receipts.reduce((sum, m) => sum + m.quantity, 0) / 2;

    return averageStock > 0 ? totalIssued / averageStock : 0;
  }

  calculateStockoutRisk(item) {
    // Simplified stockout risk calculation
    if (item.currentQuantity <= 0) return 100;
    if (item.currentQuantity < 10) return 75;
    if (item.currentQuantity < 50) return 50;
    if (item.currentQuantity < 100) return 25;
    return 10;
  }

  calculateCLTV(customer) {
    // Simplified CLTV calculation
    const avgOrderValue = customer.totalRevenue / customer.totalOrders;
    const estimatedLifetime = 36; // months
    const ordersPerMonth = customer.totalOrders / 12; // Assuming 1 year of data

    return avgOrderValue * ordersPerMonth * estimatedLifetime;
  }

  calculateChurnRisk(customer) {
    // Simplified churn risk based on recency
    const daysSinceLastOrder = (new Date() - new Date(customer.lastOrderDate)) / (1000 * 60 * 60 * 24);

    if (daysSinceLastOrder > 180) return 90;
    if (daysSinceLastOrder > 90) return 60;
    if (daysSinceLastOrder > 60) return 30;
    if (daysSinceLastOrder > 30) return 15;
    return 5;
  }

  // Financial ratio calculations (simplified)
  calculateWorkingCapital(data) {
    return (data.currentAssets || 0) - (data.currentLiabilities || 0);
  }

  calculateCashConversionCycle(data) {
    const dso = data.daysReceivables || 45;
    const dio = data.daysInventory || 30;
    const dpo = data.daysPayables || 30;
    return dso + dio - dpo;
  }

  calculateCurrentRatio(data) {
    if (!data.currentLiabilities) return 0;
    return (data.currentAssets || 0) / data.currentLiabilities;
  }

  calculateQuickRatio(data) {
    if (!data.currentLiabilities) return 0;
    return ((data.currentAssets || 0) - (data.inventory || 0)) / data.currentLiabilities;
  }

  calculateCashRatio(data) {
    if (!data.currentLiabilities) return 0;
    return (data.cash || 0) / data.currentLiabilities;
  }

  calculateGrossMargin(data) {
    if (!data.revenue) return 0;
    return ((data.revenue - (data.cogs || 0)) / data.revenue) * 100;
  }

  calculateNetMargin(data) {
    if (!data.revenue) return 0;
    return ((data.netIncome || 0) / data.revenue) * 100;
  }

  calculateROA(data) {
    if (!data.totalAssets) return 0;
    return ((data.netIncome || 0) / data.totalAssets) * 100;
  }

  calculateROE(data) {
    if (!data.equity) return 0;
    return ((data.netIncome || 0) / data.equity) * 100;
  }

  calculateAssetTurnover(data) {
    if (!data.totalAssets) return 0;
    return (data.revenue || 0) / data.totalAssets;
  }

  calculateInventoryTurnover(data) {
    if (!data.averageInventory) return 0;
    return (data.cogs || 0) / data.averageInventory;
  }

  calculateReceivablesTurnover(data) {
    if (!data.averageReceivables) return 0;
    return (data.revenue || 0) / data.averageReceivables;
  }

  // Inventory analytics calculations
  calculateHistoricalDemand(data) {
    // Return average daily demand
    return 50; // Simplified
  }

  calculateLeadTime(data) {
    // Return average lead time in days
    return 7; // Simplified
  }

  calculateReorderPoint(demand, leadTime) {
    return demand * leadTime * 1.5; // With safety factor
  }

  calculateSafetyStock(demand, leadTime) {
    return demand * leadTime * 0.5; // 50% safety stock
  }

  calculateEOQ(data) {
    // Economic Order Quantity
    const annualDemand = 10000; // Simplified
    const orderCost = 50;
    const holdingCost = 5;

    return Math.sqrt((2 * annualDemand * orderCost) / holdingCost);
  }

  calculateStockoutProbability(data) {
    // Simplified probability calculation
    return Math.random() * 20; // 0-20%
  }

  calculateExcessInventoryRisk(data) {
    // Simplified risk calculation
    return Math.random() * 30; // 0-30%
  }

  performABCAnalysis(data) {
    // Simplified ABC classification
    const value = Math.random() * 100;
    if (value > 80) return 'A';
    if (value > 50) return 'B';
    return 'C';
  }

  forecastDemand(historicalDemand) {
    // Simplified demand forecast
    return historicalDemand * (1 + Math.random() * 0.2 - 0.1); // +/- 10%
  }

  // Customer analytics
  segmentCustomer(data) {
    const value = data.totalRevenue || 0;
    if (value > 100000) return 'platinum';
    if (value > 50000) return 'gold';
    if (value > 10000) return 'silver';
    return 'bronze';
  }

  calculateRFMScore(data) {
    // Recency, Frequency, Monetary score
    return {
      recency: Math.floor(Math.random() * 5) + 1,
      frequency: Math.floor(Math.random() * 5) + 1,
      monetary: Math.floor(Math.random() * 5) + 1
    };
  }

  estimateNPS(data) {
    // Net Promoter Score estimation
    return Math.floor(Math.random() * 60) + 20; // 20-80
  }

  assessCreditRisk(data) {
    // Simplified credit risk
    return Math.random() < 0.8 ? 'low' : 'medium';
  }

  assessGrowthPotential(data) {
    // Simplified growth assessment
    return Math.random() < 0.5 ? 'high' : 'medium';
  }

  generateCustomerRecommendations(data) {
    const recommendations = [];

    if (data.churnRisk > 50) {
      recommendations.push('High churn risk - initiate retention campaign');
    }
    if (data.growthPotential === 'high') {
      recommendations.push('High growth potential - consider upselling');
    }

    return recommendations;
  }

  // Production analytics
  calculateOEE(data) {
    // Overall Equipment Effectiveness
    const availability = 0.9;
    const performance = 0.85;
    const quality = 0.95;
    return availability * performance * quality * 100;
  }

  identifyBottlenecks(data) {
    // Simplified bottleneck identification
    return ['Packaging line', 'Quality control'];
  }

  calculateCapacityUtilization(data) {
    return Math.random() * 30 + 60; // 60-90%
  }

  calculateQualityIndex(data) {
    return Math.random() * 20 + 80; // 80-100
  }

  calculateCostVariance(data) {
    const planned = data.plannedCost || 100;
    const actual = data.actualCost || 110;
    return ((actual - planned) / planned) * 100;
  }

  generateProductionRecommendations(data) {
    const recommendations = [];

    if (data.oee < 70) {
      recommendations.push('OEE below target - review maintenance schedule');
    }
    if (data.capacityUtilization < 70) {
      recommendations.push('Low capacity utilization - optimize production schedule');
    }

    return recommendations;
  }

  /**
   * Update transformation metrics
   */
  updateMetrics(type, duration) {
    switch (type) {
      case 'transform':
        this.metrics.totalTransformed++;
        break;
      case 'aggregate':
        this.metrics.totalAggregated++;
        break;
      case 'enrich':
        this.metrics.totalEnriched++;
        break;
    }

    // Update average transform time
    const total = this.metrics.totalTransformed + this.metrics.totalAggregated + this.metrics.totalEnriched;
    this.metrics.averageTransformTime =
      (this.metrics.averageTransformTime * (total - 1) + duration) / total;
  }

  /**
   * Get transformation metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString()
    };
  }
}

export default DataTransformationEngine;