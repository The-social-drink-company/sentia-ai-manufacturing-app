/**
 * Tool Input/Output Schemas
 *
 * Comprehensive JSON schemas for validating tool parameters and responses
 * across all manufacturing, financial, and integration tools.
 */

/**
 * Common schema components for reuse
 */
const COMMON_SCHEMAS = {
  correlationId: {
    type: 'string',
    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    description: 'UUID v4 correlation ID for request tracking',
  },

  timestamp: {
    type: 'string',
    format: 'date-time',
    description: 'ISO 8601 timestamp',
  },

  dateRange: {
    type: 'object',
    properties: {
      startDate: { type: 'string', format: 'date' },
      endDate: { type: 'string', format: 'date' },
    },
    required: ['startDate', 'endDate'],
  },

  pagination: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 1000, default: 50 },
      offset: { type: 'integer', minimum: 0 },
    },
  },

  currency: {
    type: 'object',
    properties: {
      amount: { type: 'number', minimum: 0 },
      currency: { type: 'string', pattern: '^[A-Z]{3}$', default: 'USD' },
    },
    required: ['amount'],
  },

  standardResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: { type: 'object' },
      error: { type: 'string' },
      correlationId: { $ref: '#/definitions/correlationId' },
      timestamp: { $ref: '#/definitions/timestamp' },
      executionTime: { type: 'number', minimum: 0 },
    },
    required: ['success', 'correlationId', 'timestamp'],
  },
}

/**
 * System tool schemas
 */
export const SYSTEM_TOOL_SCHEMAS = {
  'system-status': {
    input: {
      type: 'object',
      properties: {
        includeMetrics: { type: 'boolean', default: true },
        includeConnections: { type: 'boolean', default: true },
        includeDatabase: { type: 'boolean', default: true },
        detailed: { type: 'boolean', default: false },
      },
      additionalProperties: false,
    },
    output: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
        uptime: { type: 'number', minimum: 0 },
        version: { type: 'string' },
        environment: { type: 'string' },
        server: {
          type: 'object',
          properties: {
            memory: { type: 'object' },
            cpu: { type: 'object' },
            connections: { type: 'number' },
          },
        },
        database: {
          type: 'object',
          properties: {
            connected: { type: 'boolean' },
            latency: { type: 'number' },
            poolSize: { type: 'number' },
          },
        },
      },
      required: ['status', 'uptime', 'version'],
    },
  },

  'list-tools': {
    input: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['system', 'manufacturing', 'financial', 'database', 'integration', 'ai'],
        },
        includeSchemas: { type: 'boolean', default: false },
      },
      additionalProperties: false,
    },
    output: {
      type: 'object',
      properties: {
        tools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              version: { type: 'string' },
              hasSchema: { type: 'boolean' },
            },
          },
        },
        categories: { type: 'array', items: { type: 'string' } },
        totalCount: { type: 'integer', minimum: 0 },
      },
      required: ['tools', 'totalCount'],
    },
  },

  'database-query': {
    input: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          minLength: 1,
          maxLength: 10000,
          pattern: '^\\s*(SELECT|WITH|EXPLAIN)\\s+',
          description: 'Read-only SQL query',
        },
        params: {
          type: 'array',
          items: { type: ['string', 'number', 'boolean', 'null'] },
          maxItems: 50,
        },
        timeout: { type: 'integer', minimum: 1000, maximum: 30000, default: 30000 },
      },
      required: ['query'],
      additionalProperties: false,
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        rows: { type: 'array' },
        rowCount: { type: 'integer', minimum: 0 },
        executionTime: { type: 'number', minimum: 0 },
        fields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
            },
          },
        },
      },
      required: ['success', 'rows', 'rowCount'],
    },
  },
}

/**
 * Manufacturing tool schemas
 */
export const MANUFACTURING_TOOL_SCHEMAS = {
  'inventory-optimization': {
    input: {
      type: 'object',
      properties: {
        currentLevels: {
          type: 'object',
          patternProperties: {
            '^[A-Z0-9-]+$': { type: 'number', minimum: 0 },
          },
          minProperties: 1,
        },
        demandForecast: {
          type: 'object',
          patternProperties: {
            '^[A-Z0-9-]+$': { type: 'number', minimum: 0 },
          },
        },
        constraints: {
          type: 'object',
          properties: {
            maxInventoryValue: { type: 'number', minimum: 0 },
            minServiceLevel: { type: 'number', minimum: 0, maximum: 1 },
            leadTime: { type: 'integer', minimum: 1 },
            safetyStockDays: { type: 'integer', minimum: 0 },
          },
        },
        optimizationGoal: {
          type: 'string',
          enum: ['minimize_cost', 'maximize_service_level', 'balanced'],
          default: 'balanced',
        },
      },
      required: ['currentLevels'],
      additionalProperties: false,
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sku: { type: 'string' },
              current: { type: 'number' },
              optimal: { type: 'number' },
              adjustment: { type: 'number' },
              savings: { type: 'number' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            },
          },
        },
        totalSavings: { type: 'number' },
        implementationPlan: { type: 'array' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: ['success', 'recommendations'],
    },
  },

  'demand-forecast': {
    input: {
      type: 'object',
      properties: {
        productId: { type: 'string', minLength: 1 },
        historicalData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date' },
              demand: { type: 'number', minimum: 0 },
              price: { type: 'number', minimum: 0 },
              promotions: { type: 'boolean' },
            },
            required: ['date', 'demand'],
          },
          minItems: 30, // At least 30 data points
        },
        horizon: { type: 'integer', minimum: 1, maximum: 365, default: 30 },
        method: {
          type: 'string',
          enum: ['arima', 'lstm', 'prophet', 'ensemble'],
          default: 'ensemble',
        },
        seasonality: {
          type: 'object',
          properties: {
            weekly: { type: 'boolean', default: true },
            monthly: { type: 'boolean', default: true },
            yearly: { type: 'boolean', default: true },
          },
        },
      },
      required: ['productId', 'historicalData'],
      additionalProperties: false,
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        productId: { type: 'string' },
        forecast: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date' },
              value: { type: 'number', minimum: 0 },
              lower: { type: 'number', minimum: 0 },
              upper: { type: 'number', minimum: 0 },
            },
          },
        },
        accuracy: { type: 'number', minimum: 0, maximum: 1 },
        method: { type: 'string' },
        horizon: { type: 'integer' },
      },
      required: ['success', 'productId', 'forecast'],
    },
  },

  'quality-prediction': {
    input: {
      type: 'object',
      properties: {
        productionData: {
          type: 'object',
          properties: {
            temperature: { type: 'number' },
            pressure: { type: 'number' },
            humidity: { type: 'number' },
            speed: { type: 'number', minimum: 0 },
            vibration: { type: 'number', minimum: 0 },
            operatorId: { type: 'string' },
            materialBatch: { type: 'string' },
            equipmentId: { type: 'string' },
          },
          required: ['temperature', 'pressure'],
        },
        threshold: { type: 'number', minimum: 0, maximum: 1, default: 0.95 },
        includeRecommendations: { type: 'boolean', default: true },
      },
      required: ['productionData'],
      additionalProperties: false,
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        predictions: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 1 },
            passRate: { type: 'boolean' },
            riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            factors: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array' },
          },
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: ['success', 'predictions'],
    },
  },
}

/**
 * Financial tool schemas
 */
export const FINANCIAL_TOOL_SCHEMAS = {
  'working-capital-optimization': {
    input: {
      type: 'object',
      properties: {
        currentMetrics: {
          type: 'object',
          properties: {
            dso: { type: 'number', minimum: 0 },
            dpo: { type: 'number', minimum: 0 },
            dio: { type: 'number', minimum: 0 },
            dailyRevenue: { type: 'number', minimum: 0 },
            dailyCOGS: { type: 'number', minimum: 0 },
            dailyInventoryCost: { type: 'number', minimum: 0 },
          },
          required: ['dso', 'dpo', 'dio'],
        },
        targetCCC: { type: 'number', minimum: 0, default: 60 },
        constraints: {
          type: 'object',
          properties: {
            minDSO: { type: 'number', minimum: 0 },
            maxDPO: { type: 'number', minimum: 0 },
            minDIO: { type: 'number', minimum: 0 },
            industryBenchmarks: { type: 'object' },
          },
        },
        optimizationPriority: {
          type: 'string',
          enum: ['cash_flow', 'working_capital', 'balanced'],
          default: 'balanced',
        },
      },
      required: ['currentMetrics'],
      additionalProperties: false,
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        optimization: {
          type: 'object',
          properties: {
            dso: { type: 'number' },
            dpo: { type: 'number' },
            dio: { type: 'number' },
          },
        },
        actionPlan: { type: 'object' },
        totalImpact: { type: 'number' },
        newCCC: { type: 'number' },
        implementationTimeline: { type: 'array' },
      },
      required: ['success', 'optimization'],
    },
  },

  'cash-runway-analysis': {
    input: {
      type: 'object',
      properties: {
        cashBalance: { type: 'number', minimum: 0 },
        burnRate: { type: 'number', minimum: 0 },
        revenue: { type: 'number', minimum: 0 },
        scenarios: {
          type: 'array',
          items: { type: 'string', enum: ['base', 'optimistic', 'pessimistic', 'stress_test'] },
          default: ['base', 'optimistic', 'pessimistic'],
        },
        growthAssumptions: {
          type: 'object',
          properties: {
            revenueGrowthRate: { type: 'number' },
            burnRateIncrease: { type: 'number' },
            seasonalityFactor: { type: 'number' },
          },
        },
      },
      required: ['cashBalance', 'burnRate', 'revenue'],
      additionalProperties: false,
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        analyses: {
          type: 'object',
          patternProperties: {
            '^(base|optimistic|pessimistic|stress_test)$': {
              type: 'object',
              properties: {
                runway: { type: 'number' },
                monthlyBurn: { type: 'number' },
                monthlyRevenue: { type: 'number' },
                netBurn: { type: 'number' },
                breakEvenMonth: { type: 'number' },
                recommendations: { type: 'array' },
              },
            },
          },
        },
        criticalMonth: { type: 'number' },
        fundingNeeded: { type: 'number' },
        optimizationPotential: { type: 'object' },
      },
      required: ['success', 'analyses'],
    },
  },
}

/**
 * Integration tool schemas
 */
export const INTEGRATION_TOOL_SCHEMAS = {
  'unified-api-call': {
    input: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          enum: ['xero', 'shopify', 'amazon', 'unleashed'],
        },
        endpoint: { type: 'string', minLength: 1 },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          default: 'GET',
        },
        data: { type: 'object' },
        headers: { type: 'object' },
        timeout: { type: 'integer', minimum: 1000, maximum: 60000, default: 30000 },
      },
      required: ['service', 'endpoint'],
      additionalProperties: false,
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        status: { type: 'integer' },
        data: {},
        service: { type: 'string' },
        endpoint: { type: 'string' },
        responseTime: { type: 'number' },
      },
      required: ['success', 'status', 'service', 'endpoint'],
    },
  },

  'anomaly-detection': {
    input: {
      type: 'object',
      properties: {
        metrics: {
          type: 'object',
          patternProperties: {
            '^[a-zA-Z][a-zA-Z0-9_]*$': {
              type: 'array',
              items: { type: 'number' },
              minItems: 10,
            },
          },
        },
        threshold: { type: 'number', minimum: 1, maximum: 5, default: 2.5 },
        lookback: { type: 'integer', minimum: 10, maximum: 1000, default: 30 },
        method: {
          type: 'string',
          enum: ['zscore', 'isolation_forest', 'statistical'],
          default: 'zscore',
        },
      },
      required: ['metrics'],
      additionalProperties: false,
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        anomalies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              value: { type: 'number' },
              expected: { type: 'number' },
              deviation: { type: 'number' },
              severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
              timestamp: { type: 'string', format: 'date-time' },
              recommendation: { type: 'string' },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            critical: { type: 'integer' },
            high: { type: 'integer' },
            medium: { type: 'integer' },
            low: { type: 'integer' },
          },
        },
      },
      required: ['success', 'anomalies', 'summary'],
    },
  },
}

/**
 * All tool schemas registry
 */
export const TOOL_SCHEMAS = {
  ...SYSTEM_TOOL_SCHEMAS,
  ...MANUFACTURING_TOOL_SCHEMAS,
  ...FINANCIAL_TOOL_SCHEMAS,
  ...INTEGRATION_TOOL_SCHEMAS,
}

/**
 * Get schema for a specific tool
 */
export function getToolSchema(toolName, schemaType = 'input') {
  const schema = TOOL_SCHEMAS[toolName]
  if (!schema) {
    throw new Error(`Schema not found for tool: ${toolName}`)
  }

  if (schemaType === 'input') {
    return schema.input || {}
  } else if (schemaType === 'output') {
    return schema.output || {}
  } else {
    throw new Error(`Invalid schema type: ${schemaType}`)
  }
}

/**
 * Validate tool parameters against schema
 */
export function validateToolParameters(toolName, parameters) {
  const schema = getToolSchema(toolName, 'input')

  // Basic validation - in production, use a proper JSON schema validator like Ajv
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in parameters)) {
        throw new Error(`Missing required parameter: ${field}`)
      }
    }
  }

  // Type validation
  if (schema.properties) {
    for (const [field, fieldSchema] of Object.entries(schema.properties)) {
      if (field in parameters) {
        validateFieldType(field, parameters[field], fieldSchema)
      }
    }
  }

  return true
}

/**
 * Validate individual field type
 */
function validateFieldType(fieldName, value, schema) {
  const { type, minimum, maximum, minLength, maxLength, enum: enumValues } = schema

  if (type === 'string' && typeof value !== 'string') {
    throw new Error(`Parameter ${fieldName} must be a string`)
  }

  if (type === 'number' && typeof value !== 'number') {
    throw new Error(`Parameter ${fieldName} must be a number`)
  }

  if (type === 'integer' && !Number.isInteger(value)) {
    throw new Error(`Parameter ${fieldName} must be an integer`)
  }

  if (type === 'boolean' && typeof value !== 'boolean') {
    throw new Error(`Parameter ${fieldName} must be a boolean`)
  }

  if (type === 'array' && !Array.isArray(value)) {
    throw new Error(`Parameter ${fieldName} must be an array`)
  }

  if (type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
    throw new Error(`Parameter ${fieldName} must be an object`)
  }

  // Range validation
  if (typeof value === 'number') {
    if (minimum !== undefined && value < minimum) {
      throw new Error(`Parameter ${fieldName} must be at least ${minimum}`)
    }
    if (maximum !== undefined && value > maximum) {
      throw new Error(`Parameter ${fieldName} must be at most ${maximum}`)
    }
  }

  // String length validation
  if (typeof value === 'string') {
    if (minLength !== undefined && value.length < minLength) {
      throw new Error(`Parameter ${fieldName} must be at least ${minLength} characters`)
    }
    if (maxLength !== undefined && value.length > maxLength) {
      throw new Error(`Parameter ${fieldName} must be at most ${maxLength} characters`)
    }
  }

  // Enum validation
  if (enumValues && !enumValues.includes(value)) {
    throw new Error(`Parameter ${fieldName} must be one of: ${enumValues.join(', ')}`)
  }
}

/**
 * Get all available tool categories
 */
export function getToolCategories() {
  const categories = new Set()

  for (const [toolName, schema] of Object.entries(TOOL_SCHEMAS)) {
    // Extract category from tool name or use 'general' as default
    const parts = toolName.split('-')
    if (parts.length > 1) {
      categories.add(parts[0])
    } else {
      categories.add('general')
    }
  }

  return Array.from(categories).sort()
}

export default TOOL_SCHEMAS
