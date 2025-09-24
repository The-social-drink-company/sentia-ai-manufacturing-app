import { z } from 'zod';

// Inventory level validation schemas
const inventoryLevelSchema = {
  query: z.object({
    sku: z.string().optional(),
    location: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(['in-stock', 'low-stock', 'out-of-stock', 'overstock']).optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0)
  }),

  create: z.object({
    sku: z.string().min(1).max(50),
    name: z.string().min(1).max(200),
    description: z.string().max(500).optional(),
    category: z.string().min(1).max(100),
    location: z.string().min(1).max(100),
    quantity: z.number().min(0),
    unit: z.string().min(1).max(20),
    reorderPoint: z.number().min(0),
    reorderQuantity: z.number().min(0),
    unitCost: z.number().min(0),
    supplier: z.string().optional()
  }),

  update: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(500).optional(),
    category: z.string().min(1).max(100).optional(),
    location: z.string().min(1).max(100).optional(),
    quantity: z.number().min(0).optional(),
    reorderPoint: z.number().min(0).optional(),
    reorderQuantity: z.number().min(0).optional(),
    unitCost: z.number().min(0).optional(),
    supplier: z.string().optional()
  }),

  adjust: z.object({
    quantity: z.number(),
    type: z.enum(['addition', 'subtraction', 'adjustment', 'count']),
    reason: z.string().min(1).max(200),
    reference: z.string().optional()
  })
};

// Inventory optimization validation
const inventoryOptimizationSchema = {
  eoq: z.object({
    sku: z.string().min(1),
    demandRate: z.number().min(0),
    orderCost: z.number().min(0),
    holdingCost: z.number().min(0),
    leadTime: z.number().min(0).optional(),
    serviceLevel: z.number().min(0).max(1).default(0.95)
  }),

  reorder: z.object({
    skus: z.array(z.string().min(1)).min(1).max(50)
  })
};

// Inventory movement validation
const inventoryMovementSchema = {
  create: z.object({
    sku: z.string().min(1),
    fromLocation: z.string().min(1),
    toLocation: z.string().min(1),
    quantity: z.number().min(1),
    type: z.enum(['transfer', 'receipt', 'shipment', 'adjustment']),
    reason: z.string().min(1).max(200),
    reference: z.string().optional(),
    scheduledDate: z.string().datetime().optional()
  }),

  query: z.object({
    sku: z.string().optional(),
    location: z.string().optional(),
    type: z.enum(['transfer', 'receipt', 'shipment', 'adjustment']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0)
  })
};

// Stock take validation
const stockTakeSchema = {
  create: z.object({
    location: z.string().min(1),
    items: z.array(z.object({
      sku: z.string().min(1),
      countedQuantity: z.number().min(0),
      systemQuantity: z.number().min(0),
      variance: z.number()
    })).min(1),
    notes: z.string().max(500).optional()
  })
};

export {
  inventoryLevelSchema,
  inventoryOptimizationSchema,
  inventoryMovementSchema,
  stockTakeSchema
};