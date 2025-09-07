// Application Performance Monitoring (APM) Service
import { performance } from './performance';

interface Transaction {
  id: string;
  name: string;
  type: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'success' | 'error';
  spans: Span[];
  metadata: Record<string, any>;
}

interface Span {
  id: string;
  name: string;
  type: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  parentId?: string;
  metadata: Record<string, any>;
}

interface APMConfig {
  serviceName: string;
  serverUrl: string;
  secretToken: string;
  environment: string;
  sampleRate: number;
  maxQueueSize: number;
  flushInterval: number;
}

class ApplicationPerformanceMonitoring {
  private config: APMConfig;
  private transactions: Map<string, Transaction> = new Map();
  private queue: any[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<APMConfig>) {
    this.config = {
      serviceName: config.serviceName || 'sentia-dashboard',
      serverUrl: config.serverUrl || '/api/apm',
      secretToken: config.secretToken || '',
      environment: config.environment || 'production',
      sampleRate: config.sampleRate || 0.1,
      maxQueueSize: config.maxQueueSize || 100,
      flushInterval: config.flushInterval || 30000
    };

    this.init();
  }

  private init() {
    // Monitor API calls
    this.instrumentFetch();
    this.instrumentXHR();

    // Monitor route changes
    this.instrumentRouter();

    // Monitor component rendering (React specific)
    this.instrumentReact();

    // Set up periodic flush
    this.startFlushTimer();

    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush());
  }

  // Transaction Management
  public startTransaction(name: string, type: string = 'request'): string {
    const id = this.generateId();
    const transaction: Transaction = {
      id,
      name,
      type,
      startTime: performance.now(),
      status: 'running',
      spans: [],
      metadata: {
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    };

    this.transactions.set(id, transaction);
    return id;
  }

  public endTransaction(id: string, status: 'success' | 'error' = 'success') {
    const transaction = this.transactions.get(id);
    if (!transaction) return;

    transaction.endTime = performance.now();
    transaction.duration = transaction.endTime - transaction.startTime;
    transaction.status = status;

    // Sample based on rate
    if (Math.random() <= this.config.sampleRate) {
      this.queue.push({
        type: 'transaction',
        data: transaction,
        timestamp: Date.now()
      });
    }

    this.transactions.delete(id);
    this.checkQueue();
  }

  // Span Management
  public startSpan(transactionId: string, name: string, type: string = 'custom'): string {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return '';

    const spanId = this.generateId();
    const span: Span = {
      id: spanId,
      name,
      type,
      startTime: performance.now(),
      metadata: {}
    };

    transaction.spans.push(span);
    return spanId;
  }

  public endSpan(transactionId: string, spanId: string) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;

    const span = transaction.spans.find(s => s.id === spanId);
    if (!span) return;

    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;
  }

  // Instrumentation
  private instrumentFetch() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const method = options?.method || 'GET';
      const transactionName = `${method} ${this.getUrlPath(url.toString())}`;
      
      const transactionId = this.startTransaction(transactionName, 'http');
      const transaction = this.transactions.get(transactionId);
      
      if (transaction) {
        transaction.metadata.httpMethod = method;
        transaction.metadata.httpUrl = url.toString();
      }

      try {
        const response = await originalFetch(...args);
        
        if (transaction) {
          transaction.metadata.httpStatusCode = response.status;
        }
        
        this.endTransaction(transactionId, response.ok ? 'success' : 'error');
        return response;
      } catch (error) {
        this.endTransaction(transactionId, 'error');
        throw error;
      }
    };
  }

  private instrumentXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string, ...args: any[]) {
      this._apmMethod = method;
      this._apmUrl = url;
      return originalOpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function(...args: any[]) {
      const transactionName = `${this._apmMethod} ${this._apmUrl}`;
      const transactionId = this.startTransaction(transactionName, 'xhr');

      this.addEventListener('loadend', () => {
        const status = this.status >= 200 && this.status < 400 ? 'success' : 'error';
        this.endTransaction(transactionId, status);
      });

      return originalSend.apply(this, args);
    };
  }

  private instrumentRouter() {
    // React Router instrumentation
    if (window.history) {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = (...args) => {
        const result = originalPushState.apply(history, args);
        this.trackNavigation('pushState', args[2] as string);
        return result;
      };

      history.replaceState = (...args) => {
        const result = originalReplaceState.apply(history, args);
        this.trackNavigation('replaceState', args[2] as string);
        return result;
      };

      window.addEventListener('popstate', () => {
        this.trackNavigation('popstate', window.location.pathname);
      });
    }
  }

  private instrumentReact() {
    // React component profiling
    if ((window as any).React && (window as any).React.Profiler) {
      const Profiler = (window as any).React.Profiler;
      const originalOnRender = Profiler.onRender;

      Profiler.onRender = (
        id: string,
        phase: string,
        actualDuration: number,
        baseDuration: number,
        startTime: number,
        commitTime: number
      ) => {
        this.trackComponentRender({
          componentId: id,
          phase,
          actualDuration,
          baseDuration,
          startTime,
          commitTime
        });

        if (originalOnRender) {
          originalOnRender(id, phase, actualDuration, baseDuration, startTime, commitTime);
        }
      };
    }
  }

  // Tracking Methods
  private trackNavigation(type: string, url: string) {
    const transactionId = this.startTransaction(`Navigation to ${url}`, 'navigation');
    const transaction = this.transactions.get(transactionId);
    
    if (transaction) {
      transaction.metadata.navigationType = type;
      transaction.metadata.targetUrl = url;
    }

    // Auto-end navigation transaction after a delay
    setTimeout(() => {
      this.endTransaction(transactionId);
    }, 100);
  }

  private trackComponentRender(data: any) {
    this.queue.push({
      type: 'component-render',
      data,
      timestamp: Date.now()
    });
    this.checkQueue();
  }

  // Custom Metrics
  public trackMetric(name: string, value: number, tags?: Record<string, string>) {
    this.queue.push({
      type: 'metric',
      data: {
        name,
        value,
        tags: tags || {},
        timestamp: Date.now()
      }
    });
    this.checkQueue();
  }

  public trackError(error: Error, context?: Record<string, any>) {
    this.queue.push({
      type: 'error',
      data: {
        message: error.message,
        stack: error.stack,
        context: context || {},
        timestamp: Date.now()
      }
    });
    this.checkQueue();
  }

  // Database Query Tracking
  public trackDatabaseQuery(query: string, duration: number, success: boolean) {
    this.queue.push({
      type: 'db-query',
      data: {
        query: this.sanitizeQuery(query),
        duration,
        success,
        timestamp: Date.now()
      }
    });
    this.checkQueue();
  }

  // Cache Performance
  public trackCacheOperation(operation: string, key: string, hit: boolean, duration: number) {
    this.queue.push({
      type: 'cache',
      data: {
        operation,
        key,
        hit,
        duration,
        timestamp: Date.now()
      }
    });
    this.checkQueue();
  }

  // Queue Management
  private checkQueue() {
    if (this.queue.length >= this.config.maxQueueSize) {
      this.flush();
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch(this.config.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.secretToken}`
        },
        body: JSON.stringify({
          service: this.config.serviceName,
          environment: this.config.environment,
          events
        })
      });
    } catch (error) {
      console.error('Failed to send APM data:', error);
      // Re-add events for retry
      this.queue.unshift(...events);
    }
  }

  // Utility Methods
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private getUrlPath(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  private sanitizeQuery(query: string): string {
    // Remove sensitive data from queries
    return query.replace(/\b\d{4,}\b/g, 'XXXX'); // Replace numbers with 4+ digits
  }

  // Public API
  public setUser(userId: string, metadata?: Record<string, any>) {
    this.queue.push({
      type: 'user',
      data: {
        userId,
        metadata: metadata || {},
        timestamp: Date.now()
      }
    });
  }

  public addContext(context: Record<string, any>) {
    this.queue.push({
      type: 'context',
      data: {
        context,
        timestamp: Date.now()
      }
    });
  }

  public destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Initialize APM
export const initAPM = (config?: Partial<APMConfig>) => {
  return new ApplicationPerformanceMonitoring(config || {});
};

// Export singleton instance
let apmInstance: ApplicationPerformanceMonitoring | null = null;

export const getAPM = () => {
  if (!apmInstance) {
    apmInstance = initAPM({
      serviceName: import.meta.env.VITE_APM_SERVICE_NAME || 'sentia-dashboard',
      serverUrl: import.meta.env.VITE_APM_SERVER_URL || '/api/apm',
      secretToken: import.meta.env.VITE_APM_SECRET_TOKEN || '',
      environment: import.meta.env.VITE_ENV || 'production',
      sampleRate: parseFloat(import.meta.env.VITE_APM_SAMPLE_RATE) || 0.1
    });
  }
  return apmInstance;
};