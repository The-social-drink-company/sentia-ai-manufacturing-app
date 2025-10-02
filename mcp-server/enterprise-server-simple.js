#!/usr/bin/env node

import express from 'express';
import { randomUUID } from 'crypto';
import { setTimeout as wait } from 'timers/promises';
import { WebSocketServer } from 'ws';
import { config } from 'dotenv';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pg from 'pg';
import cors from 'cors';
// Simple console-based logging for MCP server
const logDebug = (...args) => console.log('[DEBUG]', new Date().toISOString(), ...args);
const logInfo = (...args) => console.info('[INFO]', new Date().toISOString(), ...args);
const logWarn = (...args) => console.warn('[WARN]', new Date().toISOString(), ...args);
const logError = (...args) => console.error('[ERROR]', new Date().toISOString(), ...args);


config();

const {
  PORT = 10000,
  MCP_SERVER_PORT = process.env.PORT || 10000,
  MCP_HTTP_PORT = process.env.PORT || 10000,
  MCP_API_KEY,
  MCP_VECTOR_TABLE = 'Embeddings',
  MCP_VECTOR_DIM = '1536',
  DATABASE_URL,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  GOOGLE_AI_API_KEY,
  CORS_ORIGINS = 'https://sentia-manufacturing-dashboard-621h.onrender.com,https://sentia-manufacturing-dashboard-test.onrender.com,https://sentia-manufacturing-dashboard-production.onrender.com'
} = process.env;

const VECTOR_DIM = Number(MCP_VECTOR_DIM) || 1536;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 750;
const HEARTBEAT_INTERVAL_MS = 30_000;
const HEALTH_CHECK_INTERVAL_MS = 30_000;
const MAX_BUFFERED_BYTES = 5 * 1024 * 1024; // 5 MB

const app = express();
const allowedOrigins = CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : undefined, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const pool = DATABASE_URL
  ? new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    })
  : null;

const providers = {
  claude: ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null,
  gpt4: OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null,
  gemini: GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(GOOGLE_AI_API_KEY) : null
};

const metrics = {
  startedAt: Date.now(),
  activeConnections: 0,
  totalRequests: 0,
  completedRequests: 0,
  failedRequests: 0,
  averageLatencyMs: 0,
  providerCalls: {
    claude: 0,
    gpt4: 0,
    gemini: 0
  }
};

const connections = new Map();
const subscriptions = new Map();

function getValue(row, key) {
  if (!row || typeof row !== 'object') return undefined;
  if (key in row) return row[key];
  const lower = key.toLowerCase();
  if (lower in row) return row[lower];
  const snake = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  if (snake in row) return row[snake];
  return undefined;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function checkDatabaseConnection() {
  if (!pool) return { status: 'unconfigured' };
  try {
    await pool.query('SELECT 1');
    return { status: 'healthy' };
  } catch (error) {
    logError('[MCP] Database health check failed', error);
    return { status: 'degraded', error: error.message };
  }
}

function checkProviderStatus() {
  return Object.entries(providers).reduce((acc, [key, client]) => {
    acc[key] = client ? 'ready' : 'unconfigured';
    return acc;
  }, {});
}

app.get('/health', async (_req, res) => {
  const database = await checkDatabaseConnection();
  res.json({
    status: 'healthy',
    server: 'sentia-enterprise-mcp-server',
    version: '2.0.0-enterprise-simple',
    protocol: '2024-11-05',
    uptime: process.uptime(),
    connections: wss.clients.size,
    features: {
      manufacturing: true,
      multiProvider: true,
      aiIntegration: true,
      realTime: true,
      enterprise: true
    },
    providers: checkProviderStatus(),
    database,
    metrics: {
      activeConnections: metrics.activeConnections,
      totalRequests: metrics.totalRequests,
      completedRequests: metrics.completedRequests,
      failedRequests: metrics.failedRequests,
      averageLatencyMs: metrics.averageLatencyMs,
      providerCalls: metrics.providerCalls
    },
    timestamp: new Date().toISOString()
  });
});

// Alternative health check endpoint for Render compatibility
app.get('/healthz', async (_req, res) => {
  const database = await checkDatabaseConnection();
  const isHealthy = database.status === 'healthy';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    database: database.status,
    timestamp: new Date().toISOString()
  });
});

const httpServer = app.listen(Number(PORT), () => {
  logDebug(`Sentia MCP server listening on port ${PORT}`);
});

async function runHealthCheck() {
  const database = await checkDatabaseConnection();
  const providersStatus = checkProviderStatus();
  const status = database.status === 'healthy' && Object.values(providersStatus).every(value => value === 'ready' || value === 'unconfigured')
    ? 'healthy'
    : 'degraded';
  return { status, database, providers: providersStatus };
}

setInterval(() => {
  runHealthCheck().catch(error => {
    logError('[MCP] Error running scheduled health check', error);
  });
}, HEALTH_CHECK_INTERVAL_MS);

async function fetchContextSnippets(limit = 5) {
  if (!pool) return [];
  try {
    const result = await pool.query(
      'SELECT id, title, content, confidence FROM "AIInsight" ORDER BY "createdAt" DESC LIMIT $1',
      [limit]
    );
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      excerpt: row.content?.slice(0, 400) ?? '',
      confidence: row.confidence
    }));
  } catch (error) {
    logError('[MCP] Failed to fetch AI context', error);
    return [];
  }
}

function buildManufacturingPrompt(prompt, snippets) {
  const contextBlock = snippets.length
    ? snippets
        .map((snippet, index) => `Context #${index + 1} (${snippet.confidence ?? 'n/a'} confidence): ${snippet.title}\n${snippet.excerpt}`)
        .join('\n\n')
    : 'No relevant context retrieved.';

  return `You are Sentia Manufacturing Intelligence, an enterprise AI orchestrator for industrial operations.\n\nOperational Context:\n${contextBlock}\n\nRequest:\n${prompt}\n\nRespond with actionable manufacturing insights, including risks, KPIs, and next steps.`;
}

async function invokeClaude(prompt) {
  if (!providers.claude) throw new Error('Anthropic provider not configured');
  metrics.providerCalls.claude += 1;
  const response = await providers.claude.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 1024,
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }]
  });
  return response.content?.map(part => part.text).join('\n').trim();
}

async function invokeGPT4(prompt) {
  if (!providers.gpt4) throw new Error('OpenAI provider not configured');
  metrics.providerCalls.gpt4 += 1;
  const response = await providers.gpt4.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    temperature: 0.2,
    messages: [
      { role: 'system', content: 'You are a manufacturing analytics assistant for Sentia.' },
      { role: 'user', content: prompt }
    ]
  });
  return response.choices?.[0]?.message?.content?.trim();
}

async function invokeGemini(prompt) {
  if (!providers.gemini) throw new Error('Google Gemini provider not configured');
  metrics.providerCalls.gemini += 1;
  const model = providers.gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const response = await model.generateContent(prompt);
  return response.response?.text?.() ?? null;
}

async function orchestrateLLM(provider, prompt, metadata = {}) {
  const snippets = await fetchContextSnippets(metadata.contextLimit ?? 5);
  const finalPrompt = buildManufacturingPrompt(prompt, snippets);

  switch (provider) {
    case 'claude':
      return {
        provider,
        content: await invokeClaude(finalPrompt),
        metadata: { snippets, promptTokens: finalPrompt.length, requestMetadata: metadata }
      };
    case 'gpt4':
      return {
        provider,
        content: await invokeGPT4(finalPrompt),
        metadata: { snippets, promptTokens: finalPrompt.length, requestMetadata: metadata }
      };
    case 'gemini':
      return {
        provider,
        content: await invokeGemini(finalPrompt),
        metadata: { snippets, promptTokens: finalPrompt.length, requestMetadata: metadata }
      };
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function storeEmbedding({ id = randomUUID(), content = '', metadata = {}, embedding }) {
  if (!pool || !Array.isArray(embedding) || embedding.length !== VECTOR_DIM) return null;
  try {
    await pool.query(
      `INSERT INTO "${MCP_VECTOR_TABLE}" (id, content, metadata, embedding, "createdAt")
       VALUES ($1, $2, $3::jsonb, $4::vector, NOW())
       ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata, embedding = EXCLUDED.embedding, "updatedAt" = NOW()`,
      [id, content, JSON.stringify(metadata ?? {}), embedding]
    );
    return id;
  } catch (error) {
    logError('[MCP] Failed to store embedding', error);
    return null;
  }
}

async function semanticSearch(vector, limit = 5) {
  if (!pool || !Array.isArray(vector) || vector.length !== VECTOR_DIM) return [];
  try {
    const { rows } = await pool.query(
      `SELECT id, content, metadata, 1 - (embedding <=> $1::vector) AS score
       FROM "${MCP_VECTOR_TABLE}"
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [vector, limit]
    );
    return rows.map(row => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      similarity: Number(row.score)
    }));
  } catch (error) {
    logError('[MCP] Semantic search failed', error);
    return [];
  }
}

async function fetchInventorySnapshot(limit = 50) {
  if (!pool) return [];
  try {
    const { rows } = await pool.query(
      'SELECT "sku", "name", "quantity", "reorderPoint", "reorderQuantity", "unitCost", "totalValue", "updatedAt" FROM "Inventory" ORDER BY "updatedAt" DESC NULLS LAST LIMIT $1',
      [limit]
    );
    return rows;
  } catch (error) {
    logError('[MCP] Failed to fetch inventory snapshot', error);
    return [];
  }
}

function computeInventoryInsights(rows) {
  if (!rows.length) {
    return {
      metrics: { totalSkus: 0, totalQuantity: 0, totalValue: 0, averageUnitCost: 0 },
      lowStock: [],
      sampleSize: 0
    };
  }

  const aggregates = rows.reduce((acc, item) => {
    const quantity = toNumber(getValue(item, 'quantity'));
    const unitCost = toNumber(getValue(item, 'unitCost'));
    const totalValue = toNumber(getValue(item, 'totalValue'), quantity * unitCost);
    const reorderPoint = toNumber(getValue(item, 'reorderPoint'));
    const reorderQuantity = toNumber(getValue(item, 'reorderQuantity'));

    acc.totalSkus += 1;
    acc.totalQuantity += quantity;
    acc.totalValue += totalValue;
    acc.totalUnitCost += unitCost;

    if (quantity <= reorderPoint) {
      acc.lowStock.push({
        sku: getValue(item, 'sku'),
        name: getValue(item, 'name'),
        quantity,
        reorderPoint,
        reorderQuantity
      });
    }

    return acc;
  }, {
    totalSkus: 0,
    totalQuantity: 0,
    totalValue: 0,
    totalUnitCost: 0,
    lowStock: []
  });

  const averageUnitCost = aggregates.totalSkus ? aggregates.totalUnitCost / aggregates.totalSkus : 0;

  return {
    metrics: {
      totalSkus: aggregates.totalSkus,
      totalQuantity: aggregates.totalQuantity,
      totalValue: Number(aggregates.totalValue.toFixed(2)),
      averageUnitCost: Number(averageUnitCost.toFixed(2))
    },
    lowStock: aggregates.lowStock.slice(0, 15),
    sampleSize: rows.length
  };
}

async function fetchAnalyticsSeries(metric, dimension = null, window = 30) {
  if (!pool) return [];
  try {
    const params = dimension ? [metric, dimension, window] : [metric, window];
    const where = dimension ? 'WHERE metric = $1 AND (dimension = $2 OR $2 IS NULL)' : 'WHERE metric = $1';
    const limitParam = dimension ? '$3' : '$2';
    const sql = `SELECT "date", "value", "forecast", "actual" FROM "Analytics" ${where} ORDER BY "date" DESC LIMIT ${limitParam}`;
    const { rows } = await pool.query(sql, params);
    return rows.map(row => ({
      date: row.date,
      value: toNumber(row.value),
      actual: row.actual !== null ? toNumber(row.actual) : null,
      forecast: row.forecast !== null ? toNumber(row.forecast) : null
    })).reverse();
  } catch (error) {
    logError('[MCP] Failed to fetch analytics series', error);
    return [];
  }
}

function calculateForecast(series, horizon = 4) {
  if (!series.length) return { horizon, projected: [], average: 0, trend: 0, lastValue: 0 };

  const values = series.map(point => point.actual ?? point.value ?? 0);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  let avgDelta = 0;
  if (values.length > 1) {
    const deltas = [];
    for (let index = 1; index < values.length; index += 1) {
      deltas.push(values[index] - values[index - 1]);
    }
    avgDelta = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  }

  const lastValue = values[values.length - 1];
  const projected = [];
  let running = lastValue;
  for (let index = 1; index <= horizon; index += 1) {
    running += avgDelta;
    projected.push(Number(running.toFixed(2)));
  }

  return {
    horizon,
    projected,
    average: Number(average.toFixed(2)),
    trend: Number(avgDelta.toFixed(2)),
    lastValue
  };
}

async function fetchRecentProduction(limit = 50) {
  if (!pool) return [];
  try {
    const { rows } = await pool.query(
      'SELECT "jobNumber", "productName", "qualityScore", "defectRate", "efficiency", "status", "priority", "completionDate" FROM "Production" ORDER BY "updatedAt" DESC NULLS LAST LIMIT $1',
      [limit]
    );
    return rows;
  } catch (error) {
    logError('[MCP] Failed to fetch production records', error);
    return [];
  }
}

function assessQualityRisk(rows) {
  if (!rows.length) {
    return {
      summary: {
        averageQualityScore: null,
        averageDefectRate: null,
        highRiskJobs: []
      }
    };
  }

  const aggregates = rows.reduce((acc, job) => {
    const qualityScore = toNumber(getValue(job, 'qualityScore'), 0);
    const defectRate = toNumber(getValue(job, 'defectRate'), 0);
    acc.totalQuality += qualityScore;
    acc.totalDefects += defectRate;
    acc.count += 1;
    if ((qualityScore && qualityScore < 0.85) || (defectRate && defectRate > 0.05)) {
      acc.highRisk.push({
        jobNumber: getValue(job, 'jobNumber'),
        productName: getValue(job, 'productName'),
        qualityScore,
        defectRate,
        status: getValue(job, 'status'),
        priority: getValue(job, 'priority')
      });
    }
    return acc;
  }, { totalQuality: 0, totalDefects: 0, count: 0, highRisk: [] });

  const averageQualityScore = aggregates.count ? aggregates.totalQuality / aggregates.count : null;
  const averageDefectRate = aggregates.count ? aggregates.totalDefects / aggregates.count : null;

  return {
    summary: {
      averageQualityScore: averageQualityScore !== null ? Number(averageQualityScore.toFixed(3)) : null,
      averageDefectRate: averageDefectRate !== null ? Number(averageDefectRate.toFixed(3)) : null,
      highRiskJobs: aggregates.highRisk.slice(0, 10)
    }
  };
}

async function fetchWorkingCapital(limit = 90) {
  if (!pool) return [];
  try {
    const { rows } = await pool.query(
      'SELECT "date", "currentAssets", "currentLiabilities", "cashConversionCycle", "workingCapitalRatio", "quickRatio", "dso", "dpo", "dio" FROM "WorkingCapital" ORDER BY "date" DESC LIMIT $1',
      [limit]
    );
    return rows.reverse();
  } catch (error) {
    logError('[MCP] Failed to fetch working capital data', error);
    return [];
  }
}

async function fetchCashRunway(limit = 24) {
  if (!pool) return [];
  try {
    const { rows } = await pool.query(
      'SELECT "date", "cashBalance", "monthlyBurnRate", "monthlyRevenue", "netBurnRate", "runwayMonths", "coverageDay30", "coverageDay60", "coverageDay90", "coverageDay120", "coverageDay180" FROM "CashRunway" ORDER BY "date" DESC LIMIT $1',
      [limit]
    );
    return rows.reverse();
  } catch (error) {
    logError('[MCP] Failed to fetch cash runway data', error);
    return [];
  }
}

async function storeMcpRequest({ tool, request, response, status, error, startedAt, provider }) {
  if (!pool) return;
  try {
    const processingTime = startedAt ? Date.now() - startedAt : null;
    await pool.query(
      'INSERT INTO "MCPRequest" (id, tool, request, response, status, "processingTime", error, provider, "createdAt") VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8, NOW())',
      [
        randomUUID(),
        tool,
        JSON.stringify(request ?? {}),
        JSON.stringify(response ?? {}),
        status,
        processingTime,
        error ?? null,
        provider ?? null
      ]
    );
  } catch (dbError) {
    logError('[MCP] Failed to persist MCP request log', dbError);
  }
}

async function handleInventoryOptimization(params = {}, provider = 'claude') {
  const { limit = 100 } = params;
  const snapshot = await fetchInventorySnapshot(limit);
  const insights = computeInventoryInsights(snapshot);

  if (!snapshot.length) {
    return {
      snapshot: insights,
      recommendation: 'Inventory data unavailable. Ingest recent inventory records to enable optimization.',
      provider: null
    };
  }

  const prompt = `Inventory optimization analysis request. Current metrics: ${JSON.stringify(insights.metrics)}. Low stock SKUs (up to 10): ${JSON.stringify(insights.lowStock)}. Provide replenishment priorities, safety stock adjustments, supplier or production considerations, and expected working capital impact.`;
  const aiResult = await orchestrateLLM(provider, prompt, { tool: 'inventory-optimization', contextLimit: 3 });

  return {
    snapshot: insights,
    recommendation: aiResult.content ?? 'No AI recommendation available.',
    provider: aiResult.provider,
    metadata: aiResult.metadata
  };
}

async function handleDemandForecast(params = {}, provider = 'claude') {
  const { metric = 'demand', dimension = null, horizon = 6 } = params;
  const series = await fetchAnalyticsSeries(metric, dimension, Math.max(horizon * 3, 12));
  const forecast = calculateForecast(series, horizon);

  if (!series.length) {
    return {
      series,
      forecast,
      recommendation: 'Demand history unavailable. Provide time series data to enable forecasts.',
      provider: null
    };
  }

  const prompt = `Demand forecasting request. Historical series (latest 12 points): ${JSON.stringify(series.slice(-12))}. Forecast for next ${horizon} periods: ${JSON.stringify(forecast.projected)}. Provide demand planning recommendations, risk indicators, scenario sensitivities, and supply chain adjustments.`;
  const aiResult = await orchestrateLLM(provider, prompt, { tool: 'demand-forecast', metric, dimension, contextLimit: 4 });

  return {
    series,
    forecast,
    recommendation: aiResult.content ?? 'No AI narrative available.',
    provider: aiResult.provider,
    metadata: aiResult.metadata
  };
}

async function handleQualityPrediction(params = {}, provider = 'claude') {
  const { limit = 100 } = params;
  const records = await fetchRecentProduction(limit);
  const assessment = assessQualityRisk(records);

  if (!records.length) {
    return {
      assessment,
      recommendation: 'Production quality history unavailable. Feed recent job data to enable risk predictions.',
      provider: null
    };
  }

  const prompt = `Quality risk assessment request. Average quality score: ${assessment.summary.averageQualityScore}. Average defect rate: ${assessment.summary.averageDefectRate}. High risk jobs: ${JSON.stringify(assessment.summary.highRiskJobs)}. Provide likely root causes, preventive maintenance recommendations, inspection focus areas, and monitoring KPIs.`;
  const aiResult = await orchestrateLLM(provider, prompt, { tool: 'quality-prediction', contextLimit: 3 });

  return {
    assessment,
    recommendation: aiResult.content ?? 'No AI advisory available.',
    provider: aiResult.provider,
    metadata: aiResult.metadata
  };
}

async function handleMaintenanceScheduling(params = {}, provider = 'claude') {
  const { limit = 50 } = params;
  const production = await fetchRecentProduction(limit);
  const risk = assessQualityRisk(production);

  const prompt = `Predictive maintenance scheduling request. High risk jobs: ${JSON.stringify(risk.summary.highRiskJobs)}. Provide maintenance schedule recommendations, resource requirements, spare parts priority, and risk mitigation steps.`;
  const aiResult = await orchestrateLLM(provider, prompt, { tool: 'maintenance-scheduling', contextLimit: 3 });

  return {
    risk,
    schedule: aiResult.content ?? 'No maintenance schedule generated.',
    provider: aiResult.provider,
    metadata: aiResult.metadata
  };
}

async function handleWorkingCapitalOptimization(params = {}, provider = 'claude') {
  const { horizon = 12 } = params;
  const history = await fetchWorkingCapital(horizon);

  if (!history.length) {
    return {
      history,
      recommendation: 'Working capital history unavailable. Populate working capital metrics to enable optimization.',
      provider: null
    };
  }

  const latest = history[history.length - 1];
  const prompt = `Working capital optimization request. Recent metrics: ${JSON.stringify(latest)}. History (last ${history.length} periods): ${JSON.stringify(history.slice(-12))}. Provide DSO/DPO/DIO adjustments, cash conversion cycle recommendations, policy changes, and forecasted outcomes.`;
  const aiResult = await orchestrateLLM(provider, prompt, { tool: 'working-capital-optimization', contextLimit: 4 });

  return {
    history,
    recommendation: aiResult.content ?? 'No optimization guidance available.',
    provider: aiResult.provider,
    metadata: aiResult.metadata
  };
}

async function handleCashRunwayAnalysis(params = {}, provider = 'claude') {
  const { scenarios = [] } = params;
  const history = await fetchCashRunway();

  if (!history.length) {
    return {
      history,
      recommendation: 'Cash runway history unavailable. Provide cash flow data to enable analysis.',
      provider: null
    };
  }

  const latest = history[history.length - 1];
  const scenarioSummary = scenarios.length ? JSON.stringify(scenarios) : 'No custom scenarios provided.';
  const prompt = `Cash runway analysis request. Latest metrics: ${JSON.stringify(latest)}. History points: ${history.length}. Scenarios: ${scenarioSummary}. Provide liquidity risks, levers to extend runway, funding options, and monitoring KPIs.`;
  const aiResult = await orchestrateLLM(provider, prompt, { tool: 'cash-runway-analysis', contextLimit: 4 });

  return {
    history,
    scenarios,
    recommendation: aiResult.content ?? 'No runway analysis available.',
    provider: aiResult.provider,
    metadata: aiResult.metadata
  };
}

async function handleAnomalyDetection(params = {}, provider = 'claude') {
  const { metric = 'production_quality', dimension = null, window = 30, threshold = 3 } = params;
  const series = await fetchAnalyticsSeries(metric, dimension, window);

  if (!series.length) {
    return {
      anomalies: [],
      series,
      recommendation: 'No analytics data available for anomaly detection.',
      provider: null
    };
  }

  const values = series.map(point => point.actual ?? point.value ?? 0);
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const anomalies = series
    .map((point, index) => {
      const deviation = stdDev ? Math.abs(values[index] - avg) / stdDev : 0;
      return deviation >= threshold ? { ...point, deviation: Number(deviation.toFixed(2)) } : null;
    })
    .filter(Boolean);

  const prompt = `Operational anomaly detection request. Metric ${metric} with dimension ${dimension ?? 'n/a'}. Average ${avg.toFixed(2)}, std deviation ${stdDev.toFixed(2)}. Anomalies: ${JSON.stringify(anomalies)}. Provide root cause hypotheses, impact analysis, and corrective actions.`;
  const aiResult = await orchestrateLLM(provider, prompt, { tool: 'anomaly-detection', contextLimit: 4 });

  return {
    series,
    anomalies,
    statistics: { average: Number(avg.toFixed(2)), stdDev: Number(stdDev.toFixed(2)) },
    recommendation: aiResult.content ?? 'No anomaly narrative available.',
    provider: aiResult.provider,
    metadata: aiResult.metadata
  };
}

async function performUnifiedApiCall(params = {}) {
  const { target = 'xero', action = 'status', payload = {} } = params;
  return {
    target,
    action,
    payload,
    status: 'stubbed',
    message: 'Unified API bridge is stubbed in this environment. Configure provider credentials for live calls.'
  };
}

async function fetchSystemStatus() {
  return {
    timestamp: new Date().toISOString(),
    metrics,
    providers: checkProviderStatus(),
    database: await checkDatabaseConnection()
  };
}

const toolExecutors = {
  'ai-manufacturing-request': async (params = {}, provider = 'claude') => {
    const { prompt, contextLimit = 5 } = params;
    if (!prompt) {
      throw new Error('Prompt is required for ai-manufacturing-request');
    }
    return orchestrateLLM(provider, prompt, { tool: 'ai-manufacturing-request', contextLimit });
  },
  'system-status': async () => fetchSystemStatus(),
  'unified-api-call': async (params = {}) => performUnifiedApiCall(params),
  'inventory-optimization': async (params = {}, provider = 'claude') => handleInventoryOptimization(params, provider),
  'demand-forecast': async (params = {}, provider = 'claude') => handleDemandForecast(params, provider),
  'quality-prediction': async (params = {}, provider = 'claude') => handleQualityPrediction(params, provider),
  'maintenance-scheduling': async (params = {}, provider = 'claude') => handleMaintenanceScheduling(params, provider),
  'working-capital-optimization': async (params = {}, provider = 'claude') => handleWorkingCapitalOptimization(params, provider),
  'cash-runway-analysis': async (params = {}, provider = 'claude') => handleCashRunwayAnalysis(params, provider),
  'anomaly-detection': async (params = {}, provider = 'claude') => handleAnomalyDetection(params, provider)
};

async function handleToolRequest(tool, params = {}, provider = 'claude') {
  if (!tool || !(tool in toolExecutors)) {
    throw new Error(`Unsupported tool: ${tool}`);
  }

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const startedAt = Date.now();
      const result = await toolExecutors[tool](params, provider);
      await storeMcpRequest({ tool, request: params, response: result, status: 'success', provider, startedAt });
      const latency = Date.now() - startedAt;
      metrics.completedRequests += 1;
      const { completedRequests } = metrics;
      metrics.averageLatencyMs = completedRequests === 0
        ? latency
        : ((metrics.averageLatencyMs * (completedRequests - 1)) + latency) / completedRequests;
      return result;
    } catch (error) {
      lastError = error;
      logError(`[MCP] Tool execution failed (attempt ${attempt}/${MAX_RETRIES})`, error);
      if (attempt < MAX_RETRIES) {
        await wait(RETRY_DELAY_MS * attempt);
      }
    }
  }

  await storeMcpRequest({ tool, request: params, response: null, status: 'error', error: lastError?.message, provider });
  throw lastError ?? new Error('Tool execution failed');
}

function safeSend(socket, payload) {
  if (socket.readyState !== socket.OPEN) return;
  const message = JSON.stringify(payload);
  if (socket.bufferedAmount > MAX_BUFFERED_BYTES) {
    logWarn('[MCP] Socket backpressure detected, dropping message');
    return;
  }
  socket.send(message);
}

function broadcast(payload, predicate = () => true) {
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN && predicate(client)) {
      safeSend(client, payload);
    }
  });
}

function subscribe(client, topics = []) {
  const clientTopics = new Set(topics);
  subscriptions.set(client, clientTopics);
}

function getSubscriptionPredicate(topics = []) {
  if (!topics.length) return () => true;
  return (client) => {
    const clientTopics = subscriptions.get(client);
    if (!clientTopics || !clientTopics.size) return false;
    return topics.some(topic => clientTopics.has(topic));
  };
}

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (socket, req) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const token = url.searchParams.get('token');
  if (MCP_API_KEY && token !== MCP_API_KEY) {
    safeSend(socket, { type: 'error', error: 'Unauthorized' });
    socket.close(4401, 'Unauthorized');
    return;
  }

  socket.isAlive = true;
  socket.on('pong', () => {
    socket.isAlive = true;
  });

  metrics.activeConnections += 1;
  connections.set(socket, { connectedAt: Date.now(), metadata: {} });

  safeSend(socket, {
    type: 'welcome',
    version: '2025.09.0',
    protocol: 'model-context-protocol',
    tools: Object.keys(toolExecutors)
  });

  socket.on('message', async (raw) => {
    socket.isAlive = true;
    metrics.totalRequests += 1;

    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch (error) {
      metrics.failedRequests += 1;
      safeSend(socket, { type: 'error', error: 'Invalid JSON payload' });
      return;
    }

    const { id = randomUUID(), tool, params = {}, provider = 'claude', subscribe: topicList } = message;

    if (topicList) {
      subscribe(socket, Array.isArray(topicList) ? topicList : [topicList]);
    }

    try {
      const startedAt = Date.now();
      const result = await handleToolRequest(tool, params, provider);
      safeSend(socket, { id, type: 'toolResult', tool, result });
      const latency = Date.now() - startedAt;
      broadcast(
        { type: 'telemetry', tool, latency, timestamp: new Date().toISOString() },
        getSubscriptionPredicate(['telemetry'])
      );
    } catch (error) {
      metrics.failedRequests += 1;
      const errorMessage = error?.message ?? 'Tool execution failed';
      safeSend(socket, { id, type: 'toolError', tool, error: errorMessage });
    }
  });

  socket.on('close', () => {
    metrics.activeConnections = Math.max(metrics.activeConnections - 1, 0);
    connections.delete(socket);
    subscriptions.delete(socket);
  });

  socket.on('error', (error) => {
    logError('[MCP] WebSocket error', error);
  });
});

const heartbeatInterval = setInterval(() => {
  wss.clients.forEach(socket => {
    if (socket.isAlive === false) {
      socket.terminate();
      return;
    }
    socket.isAlive = false;
    socket.ping();
  });
}, HEARTBEAT_INTERVAL_MS);

logDebug(`Sentia MCP WebSocket server attached to HTTP server on port ${PORT}`);

async function shutdown() {
  logDebug('Shutting down Sentia MCP server...');
  clearInterval(heartbeatInterval);
  wss.clients.forEach(client => client.terminate());
  wss.close();
  await new Promise(resolve => httpServer.close(resolve));
  if (pool) {
    try {
      await pool.end();
      logDebug('Database pool closed');
    } catch (error) {
      logError('[MCP] Failed to close database pool', error);
    }
  }
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);