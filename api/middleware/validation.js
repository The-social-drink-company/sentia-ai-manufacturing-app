import { z } from 'zod';

/**
 * Validation middleware factory using Zod
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {string} property - Property to validate ('body', 'query', 'params')
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req[property]);
      req[property] = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Common validation schemas
 */
export const schemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),

  // Date range
  dateRange: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    period: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional()
  }),

  // ID parameter
  idParam: z.object({
    id: z.string().uuid().or(z.coerce.number().positive())
  }),

  // Production schemas
  productionMetrics: z.object({
    lineId: z.string().optional(),
    shiftId: z.string().optional(),
    productId: z.string().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional()
  }),

  productionSchedule: z.object({
    lineId: z.string(),
    productId: z.string(),
    quantity: z.number().positive(),
    scheduledDate: z.coerce.date(),
    shiftId: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
  }),

  // Inventory schemas
  inventoryUpdate: z.object({
    sku: z.string().min(1),
    location: z.string().min(1),
    quantity: z.number(),
    type: z.enum(['adjustment', 'receipt', 'shipment', 'transfer']),
    reason: z.string().optional(),
    reference: z.string().optional()
  }),

  inventoryOptimization: z.object({
    sku: z.string().min(1),
    demandRate: z.number().positive(),
    orderCost: z.number().positive(),
    holdingCost: z.number().positive(),
    leadTime: z.number().positive().optional(),
    serviceLevel: z.number().min(0).max(1).default(0.95)
  }),

  // Financial schemas
  workingCapitalQuery: z.object({
    date: z.coerce.date().optional(),
    includeProjections: z.coerce.boolean().default(false)
  }),

  cashflowQuery: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    groupBy: z.enum(['day', 'week', 'month']).default('month'),
    includeForecasts: z.coerce.boolean().default(false)
  }),

  // Quality schemas
  qualityMetrics: z.object({
    productId: z.string().optional(),
    lineId: z.string().optional(),
    batchNumber: z.string().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    metricType: z.enum(['defects', 'passRate', 'rework', 'scrap']).optional()
  }),

  qualityInspection: z.object({
    batchNumber: z.string().min(1),
    productId: z.string().min(1),
    inspectorId: z.string().min(1),
    passed: z.boolean(),
    defects: z.array(z.object({
      type: z.string(),
      severity: z.enum(['minor', 'major', 'critical']),
      quantity: z.number().positive()
    })).optional(),
    notes: z.string().optional()
  }),

  // Maintenance schemas
  maintenanceSchedule: z.object({
    equipmentId: z.string().optional(),
    status: z.enum(['scheduled', 'in-progress', 'completed', 'overdue']).optional(),
    type: z.enum(['preventive', 'corrective', 'predictive']).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional()
  }),

  maintenanceRequest: z.object({
    equipmentId: z.string().min(1),
    type: z.enum(['preventive', 'corrective', 'emergency']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string().min(1),
    requestedBy: z.string().min(1),
    scheduledDate: z.coerce.date().optional()
  }),

  // Supply chain schemas
  supplierPerformance: z.object({
    supplierId: z.string().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    metrics: z.array(z.enum(['delivery', 'quality', 'cost', 'responsiveness'])).optional()
  }),

  purchaseOrder: z.object({
    supplierId: z.string().min(1),
    items: z.array(z.object({
      sku: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      requestedDate: z.coerce.date()
    })).min(1),
    terms: z.string().optional(),
    notes: z.string().optional()
  }),

  // Forecasting schemas
  demandForecast: z.object({
    sku: z.string().min(1),
    horizon: z.number().min(1).max(365).default(30),
    method: z.enum(['movingAverage', 'exponentialSmoothing', 'arima', 'ml']).default('exponentialSmoothing'),
    seasonality: z.boolean().default(true),
    confidence: z.number().min(0).max(1).default(0.95)
  }),

  // What-if analysis schemas
  whatIfScenario: z.object({
    name: z.string().min(1),
    type: z.enum(['production', 'inventory', 'financial', 'demand']),
    parameters: z.record(z.number()),
    constraints: z.record(z.object({
      min: z.number().optional(),
      max: z.number().optional()
    })).optional()
  })
};

/**
 * Combine multiple schemas
 */
export const combineSchemas = (...schemas) => {
  return schemas.reduce((acc, schema) => acc.merge(schema), z.object({}));
};

/**
 * Common query validators
 */
export const validatePagination = validate(schemas.pagination, 'query');
export const validateDateRange = validate(schemas.dateRange, 'query');
export const validateIdParam = validate(schemas.idParam, 'params');

/**
 * Production validators
 */
export const validateProductionMetrics = validate(schemas.productionMetrics, 'query');
export const validateProductionSchedule = validate(schemas.productionSchedule, 'body');

/**
 * Inventory validators
 */
export const validateInventoryUpdate = validate(schemas.inventoryUpdate, 'body');
export const validateInventoryOptimization = validate(schemas.inventoryOptimization, 'body');

/**
 * Financial validators
 */
export const validateWorkingCapitalQuery = validate(schemas.workingCapitalQuery, 'query');
export const validateCashflowQuery = validate(schemas.cashflowQuery, 'query');

/**
 * Quality validators
 */
export const validateQualityMetrics = validate(schemas.qualityMetrics, 'query');
export const validateQualityInspection = validate(schemas.qualityInspection, 'body');

/**
 * Maintenance validators
 */
export const validateMaintenanceSchedule = validate(schemas.maintenanceSchedule, 'query');
export const validateMaintenanceRequest = validate(schemas.maintenanceRequest, 'body');

/**
 * Supply chain validators
 */
export const validateSupplierPerformance = validate(schemas.supplierPerformance, 'query');
export const validatePurchaseOrder = validate(schemas.purchaseOrder, 'body');

/**
 * Forecasting validators
 */
export const validateDemandForecast = validate(schemas.demandForecast, 'body');

/**
 * What-if validators
 */
export const validateWhatIfScenario = validate(schemas.whatIfScenario, 'body');

export default validate;