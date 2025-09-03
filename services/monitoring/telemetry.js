// OpenTelemetry Configuration for Node.js
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { logger } from '../logging/logger.js';

const serviceName = 'sentia-manufacturing-dashboard';
const environment = process.env.NODE_ENV || 'development';

// Create resource identifying the service
const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.VITE_APP_VERSION || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
    [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'sentia',
    [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: process.env.RAILWAY_REPLICA_ID || 'local',
  })
);

// Configure trace exporter
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
  headers: {
    'x-telemetry-key': process.env.TELEMETRY_KEY || ''
  }
});

// Configure metric exporter
const metricExporter = new OTLPMetricExporter({
  url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || 'http://localhost:4318/v1/metrics',
  headers: {
    'x-telemetry-key': process.env.TELEMETRY_KEY || ''
  }
});

// Create SDK configuration
const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60000, // Export every minute
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Disable file system instrumentation to reduce noise
      },
      '@opentelemetry/instrumentation-http': {
        requestHook: (span, request) => {
          // Add custom attributes to HTTP spans
          span.setAttribute('http.request.body.size', request.headers['content-length'] || 0);
          span.setAttribute('http.user_agent', request.headers['user-agent'] || 'unknown');
        },
        responseHook: (span, response) => {
          // Add response size
          span.setAttribute('http.response.body.size', response.headers['content-length'] || 0);
        },
        ignoreIncomingRequestHook: (request) => {
          // Ignore health checks and metrics endpoints
          const ignorePaths = ['/health', '/metrics', '/api/health', '/api/metrics'];
          return ignorePaths.includes(request.url);
        }
      },
      '@opentelemetry/instrumentation-express': {
        requestHook: (span, { req }) => {
          // Add user information if available
          if (req.user) {
            span.setAttribute('user.id', req.user.id);
            span.setAttribute('user.role', req.user.role);
          }
        }
      },
      '@opentelemetry/instrumentation-pg': {
        enhancedDatabaseReporting: true,
        responseHook: (span, { response }) => {
          // Add row count to query spans
          if (response?.rowCount !== undefined) {
            span.setAttribute('db.rows_affected', response.rowCount);
          }
        }
      },
      '@opentelemetry/instrumentation-redis': {
        responseHook: (span, { response }) => {
          // Add Redis response size
          if (response) {
            span.setAttribute('redis.response.size', JSON.stringify(response).length);
          }
        }
      }
    })
  ]
});

// Initialize telemetry
export const initTelemetry = async () => {
  try {
    if (environment === 'production' || environment === 'test') {
      await sdk.start();
      logger.info('OpenTelemetry initialized successfully', {
        service: serviceName,
        environment,
        endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
      });
    } else {
      logger.info('OpenTelemetry disabled in development mode');
    }
  } catch (error) {
    logger.error('Failed to initialize OpenTelemetry:', error);
    // Don't throw - allow app to continue without telemetry
  }
};

// Shutdown telemetry gracefully
export const shutdownTelemetry = async () => {
  try {
    await sdk.shutdown();
    logger.info('OpenTelemetry shut down successfully');
  } catch (error) {
    logger.error('Error shutting down OpenTelemetry:', error);
  }
};

// Custom span creation helper
export const createSpan = (tracer, name, attributes = {}) => {
  const span = tracer.startSpan(name);
  Object.entries(attributes).forEach(([key, value]) => {
    span.setAttribute(key, value);
  });
  return span;
};

// Trace async operations
export const traceAsync = async (tracer, name, fn, attributes = {}) => {
  const span = createSpan(tracer, name, attributes);
  
  try {
    const result = await fn(span);
    span.setStatus({ code: 1 }); // OK
    return result;
  } catch (error) {
    span.setStatus({ 
      code: 2, // ERROR
      message: error.message 
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
};

// Add custom metrics
export const recordCustomMetric = (meter, name, value, attributes = {}) => {
  const metric = meter.createUpDownCounter(name);
  metric.add(value, attributes);
};

// Add custom events to spans
export const addSpanEvent = (span, name, attributes = {}) => {
  span.addEvent(name, attributes, Date.now());
};

// Context propagation helper
export const extractContext = (headers) => {
  const { propagation, context } = require('@opentelemetry/api');
  return propagation.extract(context.active(), headers);
};

export const injectContext = (headers) => {
  const { propagation, context } = require('@opentelemetry/api');
  propagation.inject(context.active(), headers);
  return headers;
};

// Error reporting helper
export const reportError = (error, context = {}) => {
  const { trace } = require('@opentelemetry/api');
  const span = trace.getActiveSpan();
  
  if (span) {
    span.recordException(error);
    span.setStatus({ code: 2, message: error.message });
    
    // Add error context as span attributes
    Object.entries(context).forEach(([key, value]) => {
      span.setAttribute(`error.context.${key}`, value);
    });
  }
  
  logger.error('Error reported to telemetry', {
    error: error.message,
    stack: error.stack,
    context
  });
};

// Performance measurement helper
export const measurePerformance = async (name, fn, attributes = {}) => {
  const { trace, metrics } = require('@opentelemetry/api');
  const tracer = trace.getTracer(serviceName);
  const meter = metrics.getMeter(serviceName);
  
  const histogram = meter.createHistogram(`${name}.duration`, {
    description: `Duration of ${name} operation`,
    unit: 'ms'
  });
  
  const startTime = Date.now();
  
  return traceAsync(tracer, name, async (span) => {
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      histogram.record(duration, attributes);
      span.setAttribute('duration.ms', duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      histogram.record(duration, { ...attributes, status: 'error' });
      throw error;
    }
  }, attributes);
};

export default {
  initTelemetry,
  shutdownTelemetry,
  createSpan,
  traceAsync,
  recordCustomMetric,
  addSpanEvent,
  extractContext,
  injectContext,
  reportError,
  measurePerformance
};