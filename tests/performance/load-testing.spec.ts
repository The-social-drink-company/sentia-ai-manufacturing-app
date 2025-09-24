// Load Testing and Performance Benchmarks
import { test, expect } from '@playwright/test';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface LoadTestConfig {
  duration: number; // in seconds
  concurrentUsers: number;
  rampUpTime: number;
  endpoints: string[];
}

test.describe('Load Testing & Performance Benchmarks', () => {
  
  test.describe('API Load Testing', () => {
    const loadTestConfigs: { [key: string]: LoadTestConfig } = {
      light: { duration: 60, concurrentUsers: 10, rampUpTime: 10, endpoints: ['/api/dashboard', '/api/health'] },
      moderate: { duration: 300, concurrentUsers: 50, rampUpTime: 30, endpoints: ['/api/working-capital', '/api/reports'] },
      heavy: { duration: 600, concurrentUsers: 100, rampUpTime: 60, endpoints: ['/api/dashboard', '/api/working-capital', '/api/reports', '/api/analytics'] }
    };

    Object.entries(loadTestConfigs).forEach(([scenario, config]) => {
      test(`API load test - ${scenario} scenario`, async ({ page, request }) => {
        const metrics: PerformanceMetrics[] = [];
        const errors: string[] = [];
        
        console.log(`Starting ${scenario} load test with ${config.concurrentUsers} users for ${config.duration}s`);
        
        // Authenticate first
        await page.goto('/login');
        await page.fill('[data-testid="email"]', 'loadtest@example.com');
        await page.fill('[data-testid="password"]', 'LoadTest123!');
        await page.click('[data-testid="submit"]');
        
        const authToken = await page.evaluate(() => localStorage.getItem('auth_token'));
        
        const startTime = Date.now();
        const endTime = startTime + (config.duration * 1000);
        
        // Create concurrent user sessions
        const userPromises: Promise<void>[] = [];
        
        for (let userId = 0; userId < config.concurrentUsers; userId++) {
          const userPromise = simulateUser(userId, config, authToken, request, metrics, errors, endTime);
          userPromises.push(userPromise);
          
          // Ramp up gradually
          if (userId < config.concurrentUsers - 1) {
            await new Promise(resolve => setTimeout(resolve, (config.rampUpTime * 1000) / config.concurrentUsers));
          }
        }
        
        // Wait for all users to complete
        await Promise.allSettled(userPromises);
        
        // Analyze results
        const totalRequests = metrics.length;
        const successfulRequests = metrics.filter(m => m.errorRate === 0).length;
        const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
        const maxResponseTime = Math.max(...metrics.map(m => m.responseTime));
        const minResponseTime = Math.min(...metrics.map(m => m.responseTime));
        const errorRate = (errors.length / totalRequests) * 100;
        const throughput = totalRequests / config.duration;
        
        // Performance assertions
        expect(avgResponseTime).toBeLessThan(2000); // Average response time under 2s
        expect(maxResponseTime).toBeLessThan(5000); // Max response time under 5s
        expect(errorRate).toBeLessThan(5); // Error rate under 5%
        expect(throughput).toBeGreaterThan(1); // At least 1 request per second
        
        console.log(`Load Test Results - ${scenario}:`);
        console.log(`Total Requests: ${totalRequests}`);
        console.log(`Successful Requests: ${successfulRequests}`);
        console.log(`Error Rate: ${errorRate.toFixed(2)}%`);
        console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
        console.log(`Min/Max Response Time: ${minResponseTime}ms / ${maxResponseTime}ms`);
        console.log(`Throughput: ${throughput.toFixed(2)} requests/second`);
        console.log(`Errors: ${errors.length}`);
        
        if (errors.length > 0) {
          console.log('First 10 errors:', errors.slice(0, 10));
        }
      });
    });

    async function simulateUser(
      userId: number,
      config: LoadTestConfig,
      authToken: string,
      request: any,
      metrics: PerformanceMetrics[],
      errors: string[],
      endTime: number
    ): Promise<void> {
      const userStartTime = Date.now();
      
      while (Date.now() < endTime) {
        // Select random endpoint
        const endpoint = config.endpoints[Math.floor(Math.random() * config.endpoints.length)];
        
        try {
          const requestStart = performance.now();
          
          const response = await request.get(endpoint, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'User-Agent': `LoadTest-User-${userId}`
            },
            timeout: 10000
          });
          
          const requestEnd = performance.now();
          const responseTime = requestEnd - requestStart;
          
          metrics.push({
            responseTime,
            throughput: 1,
            errorRate: response.ok() ? 0 : 1,
            cpuUsage: 0, // Would be measured server-side
            memoryUsage: 0 // Would be measured server-side
          });
          
          if (!response.ok()) {
            errors.push(`User ${userId}: ${endpoint} returned ${response.status()}`);
          }
          
        } catch (error) {
          errors.push(`User ${userId}: ${endpoint} error - ${error.message}`);
          metrics.push({
            responseTime: 10000, // Timeout value
            throughput: 0,
            errorRate: 1,
            cpuUsage: 0,
            memoryUsage: 0
          });
        }
        
        // Random think time between requests (500ms to 3000ms)
        const thinkTime = 500 + Math.random() * 2500;
        await new Promise(resolve => setTimeout(resolve, thinkTime));
      }
    }
  });

  test.describe('Frontend Performance Benchmarks', () => {
    test('dashboard load performance', async ({ page }) => {
      // Clear cache for accurate measurement
      await page.context().clearCookies();
      await page.goto('about:blank');
      
      const startTime = performance.now();
      
      // Navigate to dashboard
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      const endTime = performance.now();
      const totalLoadTime = endTime - startTime;
      
      // Measure specific metrics
      const metrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        return {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          largestContentfulPaint: 0, // Would need web-vitals library
          cumulativeLayoutShift: 0, // Would need web-vitals library
          timeToInteractive: nav.loadEventEnd - nav.fetchStart,
          totalBytes: 0 // Would calculate from resource timings
        };
      });
      
      // Performance assertions
      expect(totalLoadTime).toBeLessThan(3000); // Total load under 3s
      expect(metrics.domContentLoaded).toBeLessThan(1500); // DOM ready under 1.5s
      expect(metrics.firstContentfulPaint).toBeLessThan(1000); // FCP under 1s
      expect(metrics.timeToInteractive).toBeLessThan(2500); // TTI under 2.5s
      
      console.log('Dashboard Performance Metrics:');
      console.log(`Total Load Time: ${totalLoadTime.toFixed(2)}ms`);
      console.log(`DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
      console.log(`First Paint: ${metrics.firstPaint.toFixed(2)}ms`);
      console.log(`First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`);
      console.log(`Time to Interactive: ${metrics.timeToInteractive.toFixed(2)}ms`);
      
      // Test widget loading performance
      const widgetMetrics = await measureWidgetPerformance(page);
      
      // Widget performance assertions
      expect(widgetMetrics.averageLoadTime).toBeLessThan(800); // Average widget load under 800ms
      expect(widgetMetrics.maxLoadTime).toBeLessThan(1500); // Max widget load under 1.5s
      
      console.log('Widget Performance:');
      console.log(`Average Widget Load: ${widgetMetrics.averageLoadTime.toFixed(2)}ms`);
      console.log(`Max Widget Load: ${widgetMetrics.maxLoadTime.toFixed(2)}ms`);
    });

    test('working capital page performance', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'perf@example.com');
      await page.fill('[data-testid="password"]', 'password123');
      await page.click('[data-testid="submit"]');
      
      const startTime = performance.now();
      await page.click('[data-testid="nav-working-capital"]');
      
      // Wait for all data to load
      await page.waitForSelector('[data-testid="current-ratio"]');
      await page.waitForSelector('[data-testid="working-capital-amount"]');
      await page.waitForSelector('[data-testid="cash-flow-chart"]');
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      expect(loadTime).toBeLessThan(2000); // Working capital page loads under 2s
      
      // Test chart rendering performance
      const chartMetrics = await measureChartPerformance(page);
      expect(chartMetrics.renderTime).toBeLessThan(500); // Chart renders under 500ms
      
      console.log(`Working Capital Page Load: ${loadTime.toFixed(2)}ms`);
      console.log(`Chart Render Time: ${chartMetrics.renderTime.toFixed(2)}ms`);
    });

    test('reports generation performance', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'perf@example.com');
      await page.fill('[data-testid="password"]', 'password123');
      await page.click('[data-testid="submit"]');
      
      await page.goto('/reports');
      
      // Test P&L report generation
      const reportStartTime = performance.now();
      
      await page.click('[data-testid="create-report"]');
      await page.selectOption('[data-testid="report-type"]', 'profit-loss');
      await page.selectOption('[data-testid="report-period"]', 'monthly');
      await page.click('[data-testid="generate-report"]');
      
      // Wait for report to generate
      await page.waitForSelector('[data-testid="report-generated"]');
      
      const reportEndTime = performance.now();
      const reportGenerationTime = reportEndTime - reportStartTime;
      
      expect(reportGenerationTime).toBeLessThan(5000); // Report generates under 5s
      
      // Test export performance
      const exportStartTime = performance.now();
      await page.click('[data-testid="export-pdf"]');
      await page.waitForSelector('[data-testid="export-complete"]');
      const exportTime = performance.now() - exportStartTime;
      
      expect(exportTime).toBeLessThan(3000); // Export completes under 3s
      
      console.log(`Report Generation: ${reportGenerationTime.toFixed(2)}ms`);
      console.log(`Export Time: ${exportTime.toFixed(2)}ms`);
    });

    async function measureWidgetPerformance(page: any) {
      const widgets = await page.locator('[data-testid^="widget-"]').all();
      const loadTimes: number[] = [];
      
      for (const widget of widgets) {
        const startTime = performance.now();
        await widget.waitFor({ state: 'visible' });
        const endTime = performance.now();
        loadTimes.push(endTime - startTime);
      }
      
      return {
        averageLoadTime: loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length,
        maxLoadTime: Math.max(...loadTimes),
        minLoadTime: Math.min(...loadTimes),
        totalWidgets: loadTimes.length
      };
    }

    async function measureChartPerformance(page: any) {
      const startTime = performance.now();
      
      // Wait for chart to be fully rendered
      await page.waitForFunction(() => {
        const charts = document.querySelectorAll('[data-testid*="chart"]');
        return Array.from(charts).every(chart => 
          chart.querySelector('svg') && chart.querySelector('svg').children.length > 0
        );
      });
      
      const endTime = performance.now();
      
      return {
        renderTime: endTime - startTime
      };
    }
  });

  test.describe('Database Performance', () => {
    test('query performance benchmarks', async ({ request }) => {
      const authResponse = await request.post('/api/auth/login', {
        data: {
          email: 'admin@example.com',
          password: 'admin123'
        }
      });
      
      const { token } = await authResponse.json();
      
      // Test dashboard query performance
      const dashboardQueryStart = performance.now();
      const dashboardResponse = await request.get('/api/dashboard/data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dashboardQueryTime = performance.now() - dashboardQueryStart;
      
      expect(dashboardResponse.ok()).toBeTruthy();
      expect(dashboardQueryTime).toBeLessThan(500); // Dashboard query under 500ms
      
      // Test working capital query performance
      const wcQueryStart = performance.now();
      const wcResponse = await request.get('/api/working-capital/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const wcQueryTime = performance.now() - wcQueryStart;
      
      expect(wcResponse.ok()).toBeTruthy();
      expect(wcQueryTime).toBeLessThan(300); // Working capital query under 300ms
      
      // Test complex analytics query performance
      const analyticsQueryStart = performance.now();
      const analyticsResponse = await request.get('/api/analytics/customer-profitability?period=12m', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const analyticsQueryTime = performance.now() - analyticsQueryStart;
      
      expect(analyticsResponse.ok()).toBeTruthy();
      expect(analyticsQueryTime).toBeLessThan(2000); // Complex analytics under 2s
      
      console.log('Database Query Performance:');
      console.log(`Dashboard Query: ${dashboardQueryTime.toFixed(2)}ms`);
      console.log(`Working Capital Query: ${wcQueryTime.toFixed(2)}ms`);
      console.log(`Analytics Query: ${analyticsQueryTime.toFixed(2)}ms`);
      
      // Test bulk operations
      const bulkOperationStart = performance.now();
      const bulkResponse = await request.post('/api/bulk/orders', {
        headers: { 'Authorization': `Bearer ${token}` },
        data: {
          orders: Array.from({ length: 100 }, (_, i) => ({
            customerName: `Customer ${i}`,
            amount: Math.random() * 1000,
            items: [{ name: 'Product A', quantity: 1, price: 100 }]
          }))
        }
      });
      const bulkOperationTime = performance.now() - bulkOperationStart;
      
      expect(bulkResponse.ok()).toBeTruthy();
      expect(bulkOperationTime).toBeLessThan(3000); // Bulk operation under 3s
      
      console.log(`Bulk Operation (100 orders): ${bulkOperationTime.toFixed(2)}ms`);
    });
  });

  test.describe('Memory Usage and Resource Monitoring', () => {
    test('memory usage during heavy operations', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'perf@example.com');
      await page.fill('[data-testid="password"]', 'password123');
      await page.click('[data-testid="submit"]');
      
      // Measure initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });
      
      if (!initialMemory) {
        console.log('Memory measurement not available in this browser');
        return;
      }
      
      console.log('Initial Memory Usage:', initialMemory);
      
      // Perform memory-intensive operations
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Load multiple reports
      for (let i = 0; i < 5; i++) {
        await page.goto('/reports');
        await page.click('[data-testid="create-report"]');
        await page.selectOption('[data-testid="report-type"]', 'profit-loss');
        await page.click('[data-testid="generate-report"]');
        await page.waitForSelector('[data-testid="report-generated"]');
      }
      
      // Measure memory after operations
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });
      
      console.log('Final Memory Usage:', finalMemory);
      
      if (finalMemory && initialMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
        
        console.log(`Memory Increase: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(2)}%)`);
        
        // Memory usage should not increase by more than 100%
        expect(memoryIncreasePercent).toBeLessThan(100);
        
        // Force garbage collection and check for memory leaks
        await page.evaluate(() => {
          if (window.gc) {
            window.gc();
          }
        });
        
        const postGCMemory = await page.evaluate(() => {
          return (performance as any).memory ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize
          } : null;
        });
        
        if (postGCMemory) {
          console.log('Post-GC Memory Usage:', postGCMemory);
          
          // After GC, memory should not be significantly higher than initial
          const postGCIncrease = postGCMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
          const postGCIncreasePercent = (postGCIncrease / initialMemory.usedJSHeapSize) * 100;
          
          expect(postGCIncreasePercent).toBeLessThan(50); // No major memory leaks
        }
      }
    });

    test('network resource usage', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Monitor network resources
      const resourceTimings = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        
        const summary = {
          totalResources: resources.length,
          totalSize: 0,
          totalDuration: 0,
          resourceTypes: {} as { [key: string]: number },
          largestResources: [] as { name: string; size: number; duration: number }[]
        };
        
        resources.forEach(resource => {
          // Estimate size from transfer size or encoded body size
          const size = resource.transferSize || resource.encodedBodySize || 0;
          summary.totalSize += size;
          summary.totalDuration += resource.duration;
          
          // Categorize resource type
          const extension = resource.name.split('.').pop()?.toLowerCase() || 'other';
          summary.resourceTypes[extension] = (summary.resourceTypes[extension] || 0) + 1;
          
          if (size > 50000) { // Resources larger than 50KB
            summary.largestResources.push({
              name: resource.name,
              size,
              duration: resource.duration
            });
          }
        });
        
        summary.largestResources.sort((a, b) => b.size - a.size);
        
        return summary;
      });
      
      console.log('Network Resource Summary:');
      console.log(`Total Resources: ${resourceTimings.totalResources}`);
      console.log(`Total Size: ${(resourceTimings.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Average Load Time: ${(resourceTimings.totalDuration / resourceTimings.totalResources).toFixed(2)}ms`);
      console.log('Resource Types:', resourceTimings.resourceTypes);
      
      if (resourceTimings.largestResources.length > 0) {
        console.log('Largest Resources:');
        resourceTimings.largestResources.slice(0, 5).forEach(resource => {
          console.log(`  ${resource.name}: ${(resource.size / 1024).toFixed(2)} KB`);
        });
      }
      
      // Performance assertions
      expect(resourceTimings.totalSize).toBeLessThan(5 * 1024 * 1024); // Total size under 5MB
      expect(resourceTimings.totalResources).toBeLessThan(100); // Less than 100 resources
      expect(resourceTimings.totalDuration / resourceTimings.totalResources).toBeLessThan(200); // Avg load time under 200ms
    });
  });

  test.describe('Stress Testing', () => {
    test('concurrent user simulation', async ({ browser }) => {
      const contexts = [];
      const pages = [];
      const errors = [];
      const performances = [];
      
      console.log('Starting concurrent user stress test...');
      
      try {
        // Create 20 concurrent user sessions
        for (let i = 0; i < 20; i++) {
          const context = await browser.newContext({
            userAgent: `StressTest-User-${i}`
          });
          const page = await context.newPage();
          
          contexts.push(context);
          pages.push(page);
        }
        
        // Simulate concurrent user activities
        const userActivities = pages.map(async (page, index) => {
          try {
            const startTime = performance.now();
            
            // Login
            await page.goto('/login');
            await page.fill('[data-testid="email"]', `stressuser${index}@example.com`);
            await page.fill('[data-testid="password"]', 'StressTest123!');
            await page.click('[data-testid="submit"]');
            
            // Navigate through the application
            await page.goto('/dashboard');
            await page.waitForLoadState('networkidle');
            
            await page.goto('/working-capital');
            await page.waitForLoadState('networkidle');
            
            await page.goto('/reports');
            await page.waitForLoadState('networkidle');
            
            // Create a report
            await page.click('[data-testid="create-report"]');
            await page.selectOption('[data-testid="report-type"]', 'profit-loss');
            await page.click('[data-testid="generate-report"]');
            await page.waitForSelector('[data-testid="report-generated"]', { timeout: 10000 });
            
            const endTime = performance.now();
            performances.push({
              userId: index,
              totalTime: endTime - startTime,
              success: true
            });
            
          } catch (error) {
            errors.push({
              userId: index,
              error: error.message
            });
            
            performances.push({
              userId: index,
              totalTime: 0,
              success: false
            });
          }
        });
        
        // Wait for all users to complete
        await Promise.allSettled(userActivities);
        
        // Analyze results
        const successfulUsers = performances.filter(p => p.success).length;
        const averageTime = performances
          .filter(p => p.success)
          .reduce((sum, p) => sum + p.totalTime, 0) / successfulUsers;
        
        const errorRate = (errors.length / pages.length) * 100;
        
        console.log('Stress Test Results:');
        console.log(`Successful Users: ${successfulUsers}/${pages.length}`);
        console.log(`Error Rate: ${errorRate.toFixed(2)}%`);
        console.log(`Average Completion Time: ${averageTime.toFixed(2)}ms`);
        console.log(`Errors: ${errors.length}`);
        
        if (errors.length > 0) {
          console.log('Error Details:', errors.slice(0, 5));
        }
        
        // Stress test assertions
        expect(errorRate).toBeLessThan(10); // Error rate under 10% during stress
        expect(successfulUsers).toBeGreaterThan(15); // At least 75% success rate
        expect(averageTime).toBeLessThan(15000); // Complete user journey under 15s
        
      } finally {
        // Cleanup
        for (const context of contexts) {
          await context.close();
        }
      }
    });
  });
});