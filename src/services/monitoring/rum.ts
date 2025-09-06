// Real User Monitoring (RUM) Implementation
import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';

interface PerformanceMetrics {
  cls: number | null;
  fcp: number | null;
  fid: number | null;
  lcp: number | null;
  ttfb: number | null;
  [key: string]: any;
}

interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  pageViews: number;
  interactions: number;
  errors: number;
  device: DeviceInfo;
  location?: LocationInfo;
}

interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  screenResolution: string;
  viewport: string;
  connection?: string;
}

interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
}

class RealUserMonitoring {
  private metrics: PerformanceMetrics = {
    cls: null,
    fcp: null,
    fid: null,
    lcp: null,
    ttfb: null
  };

  private session: UserSession;
  private buffer: any[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private endpoint: string;
  private apiKey: string;

  constructor(config: { endpoint: string; apiKey: string }) {
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
    this.session = this.initSession();
    this.init();
  }

  private init() {
    // Collect Core Web Vitals
    this.collectWebVitals();

    // Monitor page navigation
    this.monitorNavigation();

    // Monitor user interactions
    this.monitorInteractions();

    // Monitor errors
    this.monitorErrors();

    // Monitor resource timing
    this.monitorResources();

    // Set up periodic flush
    setInterval(() => this.flush(), this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush());
  }

  private initSession(): UserSession {
    const sessionId = this.getSessionId();
    const device = this.getDeviceInfo();

    return {
      sessionId,
      userId: this.getUserId(),
      startTime: Date.now(),
      pageViews: 0,
      interactions: 0,
      errors: 0,
      device,
      location: this.getLocationInfo()
    };
  }

  private collectWebVitals() {
    getCLS((metric) => {
      this.metrics.cls = metric.value;
      this.track('web-vital', {
        name: 'CLS',
        value: metric.value,
        rating: metric.rating
      });
    });

    getFCP((metric) => {
      this.metrics.fcp = metric.value;
      this.track('web-vital', {
        name: 'FCP',
        value: metric.value,
        rating: metric.rating
      });
    });

    getFID((metric) => {
      this.metrics.fid = metric.value;
      this.track('web-vital', {
        name: 'FID',
        value: metric.value,
        rating: metric.rating
      });
    });

    getLCP((metric) => {
      this.metrics.lcp = metric.value;
      this.track('web-vital', {
        name: 'LCP',
        value: metric.value,
        rating: metric.rating
      });
    });

    getTTFB((metric) => {
      this.metrics.ttfb = metric.value;
      this.track('web-vital', {
        name: 'TTFB',
        value: metric.value,
        rating: metric.rating
      });
    });
  }

  private monitorNavigation() {
    // Track page views
    const trackPageView = () => {
      this.session.pageViews++;
      this.track('page-view', {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        timestamp: Date.now()
      });
    };

    // Initial page view
    trackPageView();

    // Track SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      trackPageView();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      trackPageView();
    };

    window.addEventListener('popstate', trackPageView);
  }

  private monitorInteractions() {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        this.session.interactions++;
        this.track('interaction', {
          type: 'click',
          element: target.tagName,
          text: target.innerText?.substring(0, 50),
          className: target.className,
          id: target.id,
          timestamp: Date.now()
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.session.interactions++;
      this.track('interaction', {
        type: 'form-submit',
        formId: form.id,
        formName: form.name,
        timestamp: Date.now()
      });
    });

    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollDepth = Math.round(
        ((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100
      );
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        if (scrollDepth % 25 === 0) {
          this.track('scroll-depth', {
            depth: scrollDepth,
            timestamp: Date.now()
          });
        }
      }
    });
  }

  private monitorErrors() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.session.errors++;
      this.track('error', {
        type: 'javascript',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.session.errors++;
      this.track('error', {
        type: 'unhandled-promise',
        reason: event.reason,
        timestamp: Date.now()
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      const target = event.target as HTMLElement;
      if (target !== window) {
        this.track('error', {
          type: 'resource',
          tagName: target.tagName,
          source: (target as any).src || (target as any).href,
          timestamp: Date.now()
        });
      }
    }, true);
  }

  private monitorResources() {
    if (!window.PerformanceObserver) return;

    // Monitor resource timing
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          this.track('resource', {
            name: resource.name,
            type: this.getResourceType(resource.name),
            duration: resource.duration,
            size: resource.transferSize,
            cached: resource.transferSize === 0,
            timestamp: resource.startTime
          });
        }
      }
    });

    resourceObserver.observe({ entryTypes: ['resource'] });

    // Monitor long tasks
    if ('PerformanceLongTaskTiming' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.track('long-task', {
            duration: entry.duration,
            startTime: entry.startTime,
            timestamp: Date.now()
          });
        }
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
    }
  }

  private track(eventType: string, data: any) {
    const event = {
      type: eventType,
      sessionId: this.session.sessionId,
      userId: this.session.userId,
      data,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      }
    };

    this.buffer.push(event);

    // Flush if buffer is getting large
    if (this.buffer.length >= 50) {
      this.flush();
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          session: this.session,
          metrics: this.metrics,
          events
        })
      });
    } catch (error) {
      console.error('Failed to send RUM data:', error);
      // Re-add events to buffer for retry
      this.buffer.unshift(...events);
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('rum_session_id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('rum_session_id', sessionId);
    }
    return sessionId;
  }

  private getUserId(): string | undefined {
    return localStorage.getItem('user_id') || undefined;
  }

  private getDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);
    const tablet = /iPad|Android.*Tablet/i.test(ua);

    return {
      type: tablet ? 'tablet' : mobile ? 'mobile' : 'desktop',
      browser: this.getBrowser(),
      os: this.getOS(),
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      connection: (navigator as any).connection?.effectiveType
    };
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getLocationInfo(): LocationInfo | undefined {
    // This would typically be populated from IP geolocation
    return undefined;
  }

  private getResourceType(url: string): string {
    if (url.match(/\.(js|mjs)$/)) return 'script';
    if (url.match(/\.css$/)) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Public API
  public identify(userId: string, traits?: Record<string, any>) {
    this.session.userId = userId;
    if (traits) {
      this.track('identify', traits);
    }
  }

  public trackCustomEvent(name: string, properties?: Record<string, any>) {
    this.track('custom', {
      name,
      ...properties
    });
  }

  public setContext(context: Record<string, any>) {
    Object.assign(this.session, context);
  }
}

// Initialize RUM
export const initRUM = (config: { endpoint: string; apiKey: string }) => {
  return new RealUserMonitoring(config);
};

// Export singleton instance
let rumInstance: RealUserMonitoring | null = null;

export const getRUM = () => {
  if (!rumInstance) {
    rumInstance = initRUM({
      endpoint: import.meta.env.VITE_RUM_ENDPOINT || '/api/rum',
      apiKey: import.meta.env.VITE_RUM_API_KEY || ''
    });
  }
  return rumInstance;
};