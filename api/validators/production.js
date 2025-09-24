import { z } from 'zod';

// Production metrics validation schemas
const productionMetricsSchema = {
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    lineId: z.string().optional(),
    productId: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0)
  }),

  create: z.object({
    lineId: z.string().min(1),
    productId: z.string().min(1),
    unitsProduced: z.number().min(0),
    targetUnits: z.number().min(0),
    efficiency: z.number().min(0).max(100),
    quality: z.number().min(0).max(100),
    oee: z.number().min(0).max(100),
    downtime: z.number().min(0),
    cycleTime: z.number().min(0),
    timestamp: z.string().datetime().optional()
  }),

  update: z.object({
    unitsProduced: z.number().min(0).optional(),
    targetUnits: z.number().min(0).optional(),
    efficiency: z.number().min(0).max(100).optional(),
    quality: z.number().min(0).max(100).optional(),
    oee: z.number().min(0).max(100).optional(),
    downtime: z.number().min(0).optional(),
    cycleTime: z.number().min(0).optional()
  })
};

// Production schedule validation schemas
const productionScheduleSchema = {
  query: z.object({
    date: z.string().datetime().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    lineId: z.string().optional(),
    status: z.enum(['scheduled', 'in-progress', 'completed', 'delayed']).optional()
  }),

  create: z.object({
    lineId: z.string().min(1),
    productId: z.string().min(1),
    quantity: z.number().min(1),
    scheduledDate: z.string().datetime(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    status: z.enum(['scheduled', 'in-progress', 'completed', 'delayed']).default('scheduled')
  }),

  update: z.object({
    quantity: z.number().min(1).optional(),
    scheduledDate: z.string().datetime().optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    status: z.enum(['scheduled', 'in-progress', 'completed', 'delayed']).optional()
  })
};

// Production line validation schemas
const productionLineSchema = {
  create: z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(1).max(20),
    type: z.enum(['assembly', 'packaging', 'processing', 'quality']),
    capacity: z.number().min(1),
    status: z.enum(['active', 'maintenance', 'inactive']).default('active'),
    description: z.string().max(500).optional()
  }),

  update: z.object({
    name: z.string().min(1).max(100).optional(),
    type: z.enum(['assembly', 'packaging', 'processing', 'quality']).optional(),
    capacity: z.number().min(1).optional(),
    status: z.enum(['active', 'maintenance', 'inactive']).optional(),
    description: z.string().max(500).optional()
  })
};

// Batch production validation
const batchProductionSchema = {
  create: z.object({
    batchNumber: z.string().min(1).max(50),
    productId: z.string().min(1),
    lineId: z.string().min(1),
    quantity: z.number().min(1),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional(),
    status: z.enum(['pending', 'in-progress', 'completed', 'rejected']).default('pending'),
    qualityCheckPassed: z.boolean().default(false)
  })
};

export {
  productionMetricsSchema,
  productionScheduleSchema,
  productionLineSchema,
  batchProductionSchema
};