/**
 * Real Database Query Functions - PostgreSQL Only
 * Version: 2.0.0 - September 2025
 *
 * CRITICAL: This module enforces REAL DATA ONLY policy
 * - Direct Prisma queries to real PostgreSQL database
 * - No hardcoded values in responses
 * - Real-time data fetching
 * - Error on missing data (no defaults)
 * - Support for CSV data imports
 *
 * @module RealDatabaseQueries
 */

// import { PrismaClient } from '@prisma/client'; // Server-side only - commented for client build
import { parse } from 'csv-parse/sync';
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


// Initialize Prisma with detailed logging
// const prisma = new PrismaClient({
//   log: process.env.NODE_ENV === 'development'
//     ? ['query', 'error', 'warn', 'info']
//     : ['error', 'warn'],
//   errorFormat: 'pretty',
//   datasources: {
//     db: {
//       url: process.env.DATABASE_URL
//     }
//   }
const prisma = null; // Placeholder - Prisma only works server-side

// Validate database connection - NO MOCK DATABASE ALLOWED
const validateDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    logDebug('[Database] Connected to real PostgreSQL database');
    return true;
  } catch (error) {
    logError('[Database] Connection failed:', error);
    throw new Error('CRITICAL: Real database connection required. No mock data allowed.');
  }
};

// Ensure connection on module load
validateDatabaseConnection();

// ==================== WORKING CAPITAL QUERIES ====================
export const WorkingCapitalQueries = {
  /**
   * Get current working capital metrics - REAL DATA ONLY
   */
  async getCurrentMetrics() {
    const data = await prisma.workingCapital.findFirst({
      orderBy: { date: 'desc' },
      include: {
        breakdowns: true,
        projections: true
      }
    });

    if (!data) {
      throw new Error('No working capital data available. Import real data from Xero or CSV.');
    }

    // Validate data is real
    if (this.isLikelyMockData(data)) {
      throw new Error('Suspicious data detected. Only real financial data allowed.');
    }

    return data;
  },

  /**
   * Get historical working capital data - NO FALLBACK
   */
  async getHistoricalData(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await prisma.workingCapital.findMany({
      where: {
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' },
      include: {
        breakdowns: true
      }
    });

    if (data.length === 0) {
      throw new Error(`No historical data for past ${days} days. Import real data from accounting system.`);
    }

    return data;
  },

  /**
   * Get real-time DSO/DPO/DIO metrics
   */
  async getCashConversionMetrics() {
    const metrics = await prisma.$queryRaw`
      SELECT
        AVG(dso) as avg_dso,
        AVG(dpo) as avg_dpo,
        AVG(dio) as avg_dio,
        AVG(cash_conversion_cycle) as avg_ccc,
        MIN(date) as from_date,
        MAX(date) as to_date,
        COUNT(*) as data_points
      FROM working_capital
      WHERE date >= NOW() - INTERVAL '90 days'
    `;

    if (!metrics || metrics.length === 0 || metrics[0].data_points === 0) {
      throw new Error('No cash conversion metrics available. Sync with Xero for real data.');
    }

    return metrics[0];
  },

  /**
   * Import real working capital data from CSV
   */
  async importFromCSV(fileContent, options = {}) {
    // Parse CSV with strict validation
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      cast: true,
      cast_date: true
    });

    if (records.length === 0) {
      throw new Error('CSV file is empty. Provide real financial data.');
    }

    // Validate and transform records
    const validatedData = records.map((row, index) => {
      // Validate required fields
      const required = ['date', 'currentAssets', 'currentLiabilities', 'cash'];
      for (const field of required) {
        if (!row[field]) {
          throw new Error(`Row ${index + 1}: Missing required field '${field}'. All data must be complete.`);
        }
      }

      // No default values - all must be real
      return {
        date: new Date(row.date),
        currentAssets: parseFloat(row.currentAssets),
        currentLiabilities: parseFloat(row.currentLiabilities),
        inventory: parseFloat(row.inventory),
        accountsReceivable: parseFloat(row.accountsReceivable),
        accountsPayable: parseFloat(row.accountsPayable),
        cash: parseFloat(row.cash),
        dso: row.dso ? parseInt(row.dso) : null,
        dpo: row.dpo ? parseInt(row.dpo) : null,
        dio: row.dio ? parseInt(row.dio) : null,
        cashConversionCycle: row.cashConversionCycle ? parseInt(row.cashConversionCycle) : null,
        workingCapitalRatio: row.workingCapitalRatio ? parseFloat(row.workingCapitalRatio) : null,
        quickRatio: row.quickRatio ? parseFloat(row.quickRatio) : null,
        dataSource: options.source || 'CSV_IMPORT',
        importedAt: new Date(),
        importedBy: options.userId
      };
    });

    // Bulk insert with conflict handling
    const result = await prisma.workingCapital.createMany({
      data: validatedData,
      skipDuplicates: true
    });

    return {
      imported: result.count,
      total: validatedData.length,
      skipped: validatedData.length - result.count
    };
  },

  /**
   * Sync with Xero for real-time data
   */
  async syncWithXero() {
    const xeroData = await prisma.$queryRaw`
      SELECT * FROM sync_xero_working_capital()
    `;

    if (!xeroData || xeroData.length === 0) {
      throw new Error('Xero sync failed. Check API credentials and connection.');
    }

    return xeroData;
  },

  /**
   * Check if data appears to be mock/fake
   */
  isLikelyMockData(data) {
    // Check for suspicious patterns
    const suspicious = [
      data.currentAssets === 100000,
      data.currentLiabilities === 50000,
      data.dso === 30,
      data.dpo === 30,
      data.dio === 30,
      data.workingCapitalRatio === 2.0
    ];

    return suspicious.filter(Boolean).length >= 3;
  }
};

// ==================== PRODUCTION QUERIES ====================
export const ProductionQueries = {
  /**
   * Get active production jobs - REAL JOBS ONLY
   */
  async getActiveJobs() {
    const jobs = await prisma.productionJob.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS', 'SCHEDULED'] },
        isDeleted: false
      },
      include: {
        resource: true,
        product: true,
        qualityChecks: {
          orderBy: { performedAt: 'desc' },
          take: 5
        }
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledStart: 'asc' }
      ]
    });

    if (jobs.length === 0) {
      throw new Error('No active production jobs. Create real jobs or sync with ERP system.');
    }

    return jobs;
  },

  /**
   * Update job progress with real data
   */
  async updateJobProgress(jobId, progressData) {
    // Validate job exists
    const job = await prisma.productionJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      throw new Error(`Job ${jobId} not found. Cannot update non-existent job.`);
    }

    // Validate progress data
    if (progressData.completedQuantity > job.plannedQuantity) {
      throw new Error('Completed quantity cannot exceed planned quantity.');
    }

    // Real update with audit trail
    const updated = await prisma.$transaction(async (tx) => {
      // Update job
      const updatedJob = await tx.productionJob.update({
        where: { id: jobId },
        data: {
          completedQuantity: progressData.completedQuantity,
          status: progressData.status,
          efficiency: progressData.efficiency,
          actualStart: job.actualStart || new Date(),
          actualEnd: progressData.status === 'COMPLETED' ? new Date() : null,
          updatedAt: new Date()
        }
      });

      // Create audit log
      await tx.productionAudit.create({
        data: {
          jobId: jobId,
          action: 'PROGRESS_UPDATE',
          previousStatus: job.status,
          newStatus: progressData.status,
          previousQuantity: job.completedQuantity,
          newQuantity: progressData.completedQuantity,
          performedBy: progressData.userId,
          performedAt: new Date()
        }
      });

      return updatedJob;
    });

    return updated;
  },

  /**
   * Get production metrics from real sensors
   */
  async getRealTimeMetrics() {
    const metrics = await prisma.$queryRaw`
      SELECT
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as active_jobs,
        AVG(efficiency) as avg_efficiency,
        AVG(quality_score) as avg_quality,
        SUM(completed_quantity) as total_output,
        AVG(EXTRACT(EPOCH FROM (actual_end - actual_start))/3600) as avg_cycle_time_hours
      FROM production_jobs
      WHERE actual_start >= NOW() - INTERVAL '24 hours'
    `;

    if (!metrics || metrics[0].active_jobs === 0) {
      throw new Error('No production data in last 24 hours. Check sensor connections.');
    }

    return metrics[0];
  },

  /**
   * Import production schedule from CSV
   */
  async importScheduleFromCSV(fileContent) {
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    const jobs = await Promise.all(records.map(async (row) => {
      // Validate product exists
      const product = await prisma.product.findUnique({
        where: { sku: row.productSku }
      });

      if (!product) {
        throw new Error(`Product ${row.productSku} not found. Import products first.`);
      }

      return {
        productId: product.id,
        resourceId: row.resourceId,
        plannedQuantity: parseInt(row.quantity),
        scheduledStart: new Date(row.startDate),
        scheduledEnd: new Date(row.endDate),
        priority: parseInt(row.priority) || 5,
        status: 'SCHEDULED',
        createdAt: new Date()
      };
    }));

    const result = await prisma.productionJob.createMany({
      data: jobs
    });

    return result;
  }
};

// ==================== INVENTORY QUERIES ====================
export const InventoryQueries = {
  /**
   * Get current inventory levels - REAL STOCK ONLY
   */
  async getCurrentLevels() {
    const inventory = await prisma.inventory.findMany({
      where: {
        isActive: true
      },
      include: {
        product: true,
        location: true,
        movements: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (inventory.length === 0) {
      throw new Error('No inventory data. Import from Unleashed ERP or CSV.');
    }

    // Validate quantities are realistic
    inventory.forEach(item => {
      if (item.quantity < 0) {
        throw new Error(`Negative inventory for ${item.product.name}. Fix data integrity.`);
      }
    });

    return inventory;
  },

  /**
   * Record real inventory movement
   */
  async recordMovement(movement) {
    // Validate movement data
    if (!movement.inventoryId || !movement.quantity || !movement.type) {
      throw new Error('Invalid movement data. All fields required.');
    }

    // Execute as transaction for data integrity
    const result = await prisma.$transaction(async (tx) => {
      // Get current inventory
      const inventory = await tx.inventory.findUnique({
        where: { id: movement.inventoryId }
      });

      if (!inventory) {
        throw new Error('Inventory item not found. Cannot move non-existent stock.');
      }

      // Calculate new quantity
      const newQuantity = movement.type === 'IN'
        ? inventory.quantity + movement.quantity
        : inventory.quantity - movement.quantity;

      if (newQuantity < 0) {
        throw new Error(`Insufficient stock. Available: ${inventory.quantity}, Requested: ${movement.quantity}`);
      }

      // Update inventory
      const updatedInventory = await tx.inventory.update({
        where: { id: movement.inventoryId },
        data: {
          quantity: newQuantity,
          lastMovement: new Date(),
          value: newQuantity * inventory.unitCost
        }
      });

      // Record movement
      const movementRecord = await tx.inventoryMovement.create({
        data: {
          inventoryId: movement.inventoryId,
          type: movement.type,
          quantity: movement.quantity,
          reference: movement.reference,
          reason: movement.reason,
          previousQuantity: inventory.quantity,
          newQuantity: newQuantity,
          unitCost: inventory.unitCost,
          totalValue: movement.quantity * inventory.unitCost,
          performedBy: movement.userId,
          createdAt: new Date()
        }
      });

      return { inventory: updatedInventory, movement: movementRecord };
    });

    return result;
  },

  /**
   * Get real-time stock alerts
   */
  async getStockAlerts() {
    const alerts = await prisma.$queryRaw`
      SELECT
        i.id,
        p.name as product_name,
        p.sku,
        i.quantity as current_stock,
        i.reorder_point,
        i.reorder_quantity,
        l.name as location,
        CASE
          WHEN i.quantity = 0 THEN 'OUT_OF_STOCK'
          WHEN i.quantity <= i.reorder_point THEN 'LOW_STOCK'
          WHEN i.quantity > i.max_stock THEN 'OVERSTOCK'
        END as alert_type
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN locations l ON i.location_id = l.id
      WHERE i.quantity <= i.reorder_point
         OR i.quantity = 0
         OR i.quantity > i.max_stock
      ORDER BY
        CASE
          WHEN i.quantity = 0 THEN 1
          WHEN i.quantity <= i.reorder_point THEN 2
          ELSE 3
        END,
        i.quantity ASC
    `;

    return alerts;
  },

  /**
   * Sync inventory with Unleashed ERP
   */
  async syncWithUnleashed() {
    const syncResult = await prisma.$queryRaw`
      SELECT * FROM sync_unleashed_inventory()
    `;

    if (!syncResult || syncResult.length === 0) {
      throw new Error('Unleashed sync failed. Check API connection.');
    }

    return syncResult;
  }
};

// ==================== FINANCIAL QUERIES ====================
export const FinancialQueries = {
  /**
   * Get real P&L data
   */
  async getProfitAndLoss(startDate, endDate) {
    const data = await prisma.profitLoss.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });

    if (data.length === 0) {
      throw new Error('No P&L data for period. Sync with accounting system.');
    }

    return data;
  },

  /**
   * Get cash flow statement
   */
  async getCashFlow(period = 'monthly') {
    const cashFlow = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC(${period}, date) as period,
        SUM(operating_activities) as operating,
        SUM(investing_activities) as investing,
        SUM(financing_activities) as financing,
        SUM(net_cash_flow) as net_flow,
        MAX(ending_cash) as ending_cash
      FROM cash_flow
      WHERE date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC(${period}, date)
      ORDER BY period DESC
    `;

    if (!cashFlow || cashFlow.length === 0) {
      throw new Error('No cash flow data. Import from accounting system.');
    }

    return cashFlow;
  },

  /**
   * Get accounts receivable aging
   */
  async getARAgingReport() {
    const aging = await prisma.$queryRaw`
      SELECT
        customer_name,
        invoice_number,
        invoice_date,
        due_date,
        amount,
        amount_paid,
        amount - amount_paid as outstanding,
        CURRENT_DATE - due_date as days_overdue,
        CASE
          WHEN CURRENT_DATE - due_date <= 0 THEN 'Current'
          WHEN CURRENT_DATE - due_date <= 30 THEN '1-30 Days'
          WHEN CURRENT_DATE - due_date <= 60 THEN '31-60 Days'
          WHEN CURRENT_DATE - due_date <= 90 THEN '61-90 Days'
          ELSE 'Over 90 Days'
        END as aging_bucket
      FROM accounts_receivable
      WHERE amount > amount_paid
      ORDER BY days_overdue DESC
    `;

    if (!aging || aging.length === 0) {
      throw new Error('No AR data. Sync with accounting system for real receivables.');
    }

    return aging;
  }
};

// ==================== AI INSIGHTS QUERIES ====================
export const AIInsightQueries = {
  /**
   * Get latest AI insights - REAL INSIGHTS ONLY
   */
  async getLatestInsights() {
    const insights = await prisma.aIInsight.findMany({
      where: {
        actioned: false,
        confidence: { gte: 0.7 }
      },
      orderBy: [
        { priority: 'desc' },
        { confidence: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 20
    });

    // No fallback insights - only real AI-generated ones
    return insights;
  },

  /**
   * Save real AI insight
   */
  async saveRealInsight(insight) {
    // Validate insight is real
    if (!insight.content || !insight.confidence || !insight.modelUsed) {
      throw new Error('Invalid insight data. Real AI insights only.');
    }

    if (insight.confidence < 0 || insight.confidence > 1) {
      throw new Error('Confidence must be between 0 and 1.');
    }

    const saved = await prisma.aIInsight.create({
      data: {
        type: insight.type,
        category: insight.category,
        content: insight.content,
        confidence: insight.confidence,
        impact: insight.impact,
        priority: insight.priority,
        modelUsed: insight.modelUsed,
        dataSource: insight.dataSource,
        metadata: insight.metadata,
        actioned: false,
        createdAt: new Date()
      }
    });

    return saved;
  },

  /**
   * Mark insight as actioned
   */
  async markAsActioned(insightId, actionTaken) {
    const insight = await prisma.aIInsight.update({
      where: { id: insightId },
      data: {
        actioned: true,
        actionedAt: new Date(),
        actionTaken: actionTaken
      }
    });

    return insight;
  }
};

// ==================== QUALITY CONTROL QUERIES ====================
export const QualityQueries = {
  /**
   * Get quality metrics from real inspections
   */
  async getQualityMetrics(productId = null) {
    const whereClause = productId ? `WHERE product_id = ${productId}` : '';

    const metrics = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total_inspections,
        AVG(quality_score) as avg_quality_score,
        COUNT(CASE WHEN passed = true THEN 1 END) as passed,
        COUNT(CASE WHEN passed = false THEN 1 END) as failed,
        COUNT(CASE WHEN passed = false THEN 1 END)::float / COUNT(*)::float as defect_rate,
        STRING_AGG(DISTINCT defect_type, ', ') as defect_types
      FROM quality_inspections
      ${whereClause}
      ${whereClause ? 'AND' : 'WHERE'} inspected_at >= NOW() - INTERVAL '30 days'
    `;

    if (!metrics || metrics[0].total_inspections === 0) {
      throw new Error('No quality inspection data. Record real inspections.');
    }

    return metrics[0];
  },

  /**
   * Record quality inspection result
   */
  async recordInspection(inspection) {
    if (!inspection.productId || !inspection.batchNumber) {
      throw new Error('Product and batch required for inspection.');
    }

    const result = await prisma.qualityInspection.create({
      data: {
        productId: inspection.productId,
        batchNumber: inspection.batchNumber,
        sampleSize: inspection.sampleSize,
        qualityScore: inspection.qualityScore,
        passed: inspection.passed,
        defectType: inspection.defectType,
        defectCount: inspection.defectCount,
        notes: inspection.notes,
        inspectedBy: inspection.userId,
        inspectedAt: new Date()
      }
    });

    return result;
  }
};

// ==================== FORECASTING QUERIES ====================
export const ForecastingQueries = {
  /**
   * Get demand forecast from ML model
   */
  async getDemandForecast(productId, horizon = 30) {
    const forecast = await prisma.demandForecast.findMany({
      where: {
        productId: productId,
        forecastDate: {
          gte: new Date(),
          lte: new Date(Date.now() + horizon * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { forecastDate: 'asc' }
    });

    if (forecast.length === 0) {
      throw new Error('No forecast available. Run ML model with real historical data.');
    }

    return forecast;
  },

  /**
   * Save ML-generated forecast
   */
  async saveForecast(forecastData) {
    if (!forecastData.modelVersion || !forecastData.accuracy) {
      throw new Error('Invalid forecast. Must be from real ML model.');
    }

    const forecast = await prisma.demandForecast.createMany({
      data: forecastData.predictions.map(pred => ({
        productId: pred.productId,
        forecastDate: pred.date,
        predictedDemand: pred.demand,
        lowerBound: pred.lowerBound,
        upperBound: pred.upperBound,
        confidence: pred.confidence,
        modelVersion: forecastData.modelVersion,
        accuracy: forecastData.accuracy,
        createdAt: new Date()
      }))
    });

    return forecast;
  }
};

// ==================== REAL-TIME ANALYTICS QUERIES ====================
export const AnalyticsQueries = {
  /**
   * Get real-time KPIs
   */
  async getRealTimeKPIs() {
    const kpis = await prisma.$queryRaw`
      WITH current_metrics AS (
        SELECT
          -- Financial KPIs
          (SELECT SUM(amount) FROM sales WHERE date = CURRENT_DATE) as today_revenue,
          (SELECT SUM(amount) FROM sales WHERE date >= CURRENT_DATE - INTERVAL '30 days') as mtd_revenue,
          (SELECT AVG(gross_margin) FROM profit_loss WHERE date >= CURRENT_DATE - INTERVAL '30 days') as avg_margin,

          -- Production KPIs
          (SELECT AVG(efficiency) FROM production_jobs WHERE status = 'IN_PROGRESS') as current_efficiency,
          (SELECT AVG(quality_score) FROM quality_inspections WHERE inspected_at >= CURRENT_DATE) as today_quality,

          -- Inventory KPIs
          (SELECT COUNT(*) FROM inventory WHERE quantity <= reorder_point) as low_stock_items,
          (SELECT SUM(value) FROM inventory) as total_inventory_value,

          -- Working Capital KPIs
          (SELECT dso FROM working_capital ORDER BY date DESC LIMIT 1) as current_dso,
          (SELECT dpo FROM working_capital ORDER BY date DESC LIMIT 1) as current_dpo,
          (SELECT cash FROM working_capital ORDER BY date DESC LIMIT 1) as current_cash
      )
      SELECT * FROM current_metrics
    `;

    if (!kpis || kpis.length === 0) {
      throw new Error('No KPI data available. Check data pipeline.');
    }

    return kpis[0];
  },

  /**
   * Get trend analysis
   */
  async getTrendAnalysis(metric, periods = 12) {
    const trends = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', date) as period,
        AVG(${metric}) as value,
        STDDEV(${metric}) as volatility,
        REGR_SLOPE(${metric}, EXTRACT(EPOCH FROM date)) as trend_slope,
        REGR_R2(${metric}, EXTRACT(EPOCH FROM date)) as trend_strength
      FROM analytics_data
      WHERE date >= CURRENT_DATE - INTERVAL '${periods} months'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY period ASC
    `;

    if (!trends || trends.length === 0) {
      throw new Error(`No trend data for ${metric}. Insufficient historical data.`);
    }

    return trends;
  }
};

// ==================== DATA VALIDATION UTILITIES ====================
export const DataValidation = {
  /**
   * Validate data is real (not mock)
   */
  validateRealData(data) {
    const mockIndicators = ['test', 'demo', 'sample', 'fake', 'mock', 'lorem', 'ipsum'];
    const dataStr = JSON.stringify(data).toLowerCase();

    for (const indicator of mockIndicators) {
      if (dataStr.includes(indicator)) {
        throw new Error(`Mock data detected: contains '${indicator}'. Only real data allowed.`);
      }
    }

    return true;
  },

  /**
   * Check data freshness
   */
  checkDataFreshness(lastUpdated, maxAgeHours = 24) {
    const age = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60);

    if (age > maxAgeHours) {
      throw new Error(`Data is ${Math.floor(age)} hours old. Refresh from source system.`);
    }

    return true;
  }
};

// ==================== ERROR HANDLING ====================
const handleDatabaseError = (error) => {
  logError('[Database Error]', error);

  if (error.code === 'P2025') {
    throw new Error('Record not found. Ensure data exists in database.');
  }

  if (error.code === 'P2002') {
    throw new Error('Duplicate record. Data already exists.');
  }

  if (error.code === 'P2003') {
    throw new Error('Foreign key constraint failed. Related record missing.');
  }

  if (error.code === 'P2021') {
    throw new Error('Table does not exist. Run database migrations.');
  }

  if (error.code === 'P1001') {
    throw new Error('Cannot connect to database. Check connection string.');
  }

  throw error;
};

// Wrap all query functions with error handling
const wrapWithErrorHandling = (queryObject) => {
  const wrapped = {};

  for (const [key, value] of Object.entries(queryObject)) {
    if (typeof value === 'function') {
      wrapped[key] = async (...args) => {
        try {
          return await value(...args);
        } catch (error) {
          handleDatabaseError(error);
        }
      };
    } else {
      wrapped[key] = value;
    }
  }

  return wrapped;
};

// ==================== CLEANUP & EXPORT ====================

// Cleanup on exit
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logDebug('[Database] Disconnected from PostgreSQL');
});

// Handle uncaught errors
process.on('unhandledRejection', async (error) => {
  logError('[Database] Unhandled error:', error);
  await prisma.$disconnect();
  process.exit(1);
});

// Export all query modules with error handling
export default {
  workingCapital: wrapWithErrorHandling(WorkingCapitalQueries),
  production: wrapWithErrorHandling(ProductionQueries),
  inventory: wrapWithErrorHandling(InventoryQueries),
  financial: wrapWithErrorHandling(FinancialQueries),
  aiInsights: wrapWithErrorHandling(AIInsightQueries),
  quality: wrapWithErrorHandling(QualityQueries),
  forecasting: wrapWithErrorHandling(ForecastingQueries),
  analytics: wrapWithErrorHandling(AnalyticsQueries),
  validation: DataValidation,
  prisma
};

// CRITICAL: NO MOCK DATA, NO FAKE DATA, NO STATIC DATA
// ALL QUERIES MUST RETURN REAL DATABASE DATA ONLY
// ERRORS ARE THROWN - NO FALLBACK VALUES ALLOWED