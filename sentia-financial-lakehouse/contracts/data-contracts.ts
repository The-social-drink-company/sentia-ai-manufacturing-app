import { z } from 'zod';

// Core Financial Data Contracts
export const CashFlowRecordSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  source: z.enum(['xero', 'quickbooks', 'sap', 'oracle', 'manual']),
  amount: z.number(),
  currency: z.string().length(3),
  type: z.enum(['inflow', 'outflow']),
  category: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const LiquidityMetricSchema = z.object({
  timestamp: z.string().datetime(),
  cashOnHand: z.number(),
  availableCredit: z.number(),
  currentRatio: z.number(),
  quickRatio: z.number(),
  cashConversionCycle: z.number(),
  daysPayableOutstanding: z.number(),
  daysReceivableOutstanding: z.number(),
  daysInventoryOutstanding: z.number(),
});

export const ForecastScenarioSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  assumptions: z.object({
    growthRate: z.number(),
    seasonalityFactors: z.array(z.number()),
    paymentTerms: z.object({
      receivables: z.number(),
      payables: z.number(),
    }),
    inventoryTurnover: z.number(),
  }),
  projections: z.array(z.object({
    date: z.string().date(),
    revenue: z.number(),
    expenses: z.number(),
    cashBalance: z.number(),
    workingCapital: z.number(),
  })),
  confidence: z.number().min(0).max(1),
});

// Data Source Adapters Contract
export const DataSourceConfigSchema = z.object({
  type: z.enum(['xero', 'quickbooks', 'sap', 'oracle', 'csv', 'api']),
  credentials: z.object({
    apiKey: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    tenantId: z.string().optional(),
    endpoint: z.string().url().optional(),
  }),
  syncSchedule: z.string().default('0 */6 * * *'), // Every 6 hours
  dataRetention: z.number().default(90), // Days
  enabled: z.boolean().default(true),
});

// Compliance and Audit Contracts
export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  userId: z.string(),
  action: z.enum(['read', 'write', 'delete', 'export']),
  resource: z.string(),
  details: z.record(z.unknown()),
  compliance: z.object({
    gdpr: z.boolean(),
    sox: z.boolean(),
    pci: z.boolean(),
  }),
});

// AI Agent Contracts
export const AgentRequestSchema = z.object({
  query: z.string(),
  context: z.object({
    timeRange: z.object({
      start: z.string().date(),
      end: z.string().date(),
    }).optional(),
    metrics: z.array(z.string()).optional(),
    dataSources: z.array(z.string()).optional(),
  }),
  capabilities: z.array(z.enum([
    'forecast',
    'optimize',
    'analyze',
    'recommend',
    'alert',
  ])),
});

export const AgentResponseSchema = z.object({
  requestId: z.string().uuid(),
  timestamp: z.string().datetime(),
  response: z.string(),
  data: z.array(z.record(z.unknown())),
  visualizations: z.array(z.object({
    type: z.enum(['chart', 'table', 'metric', 'alert']),
    config: z.record(z.unknown()),
    data: z.unknown(),
  })),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string()),
  nextActions: z.array(z.string()).optional(),
});

// Export types
export type CashFlowRecord = z.infer<typeof CashFlowRecordSchema>;
export type LiquidityMetric = z.infer<typeof LiquidityMetricSchema>;
export type ForecastScenario = z.infer<typeof ForecastScenarioSchema>;
export type DataSourceConfig = z.infer<typeof DataSourceConfigSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type AgentRequest = z.infer<typeof AgentRequestSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;