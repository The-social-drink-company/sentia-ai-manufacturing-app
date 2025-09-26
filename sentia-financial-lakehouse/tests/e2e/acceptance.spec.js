import { test, expect } from '@playwright/test';
import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';
const LAKEHOUSE_URL = process.env.LAKEHOUSE_URL || 'http://localhost:8100';
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:8102';
const ADAPTERS_URL = process.env.ADAPTERS_URL || 'http://localhost:8103';

test.describe('Financial Intelligence Platform - Acceptance Tests', () => {
  
  test.beforeAll(async () => {
    // Setup: Register mock adapter
    await axios.post(`${ADAPTERS_URL}/register`, {
      type: 'mock',
      enabled: true,
      credentials: {},
    });
    
    // Sync initial data
    await axios.post(`${ADAPTERS_URL}/sync/mock`, {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    
    // Wait for data ingestion
    await new Promise(resolve => setTimeout(resolve, 2000));
  });
  
  test('Scenario 1: End-to-end liquidity question', async ({ page }) => {
    // Navigate to AI chat
    await page.goto(`${BASE_URL}/chat`);
    
    // Ask a liquidity question
    const questionInput = page.locator('input[placeholder*="Ask about liquidity"]');
    await questionInput.fill('What is our current liquidity position and how has it changed over the last 30 days?');
    
    // Enable analysis capability
    await page.locator('label:has-text("Analyze")').click();
    
    // Submit question
    await page.locator('button:has-text("Send")').click();
    
    // Wait for AI response
    await page.waitForSelector('.bg-gray-100', { timeout: 30000 });
    
    // Verify response contains analysis
    const response = await page.locator('.bg-gray-100').first();
    await expect(response).toContainText('Analysis');
    await expect(response).toContainText('liquidity');
    
    // Verify data is included
    const dataToggle = page.locator('summary:has-text("View data")');
    await expect(dataToggle).toBeVisible();
    
    // Expand data view
    await dataToggle.click();
    const dataView = page.locator('pre');
    await expect(dataView).toBeVisible();
  });
  
  test('Scenario 2: Forecast scenario run', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat`);
    
    // Ask for forecast
    const questionInput = page.locator('input[placeholder*="Ask about liquidity"]');
    await questionInput.fill('Create a 90-day cash flow forecast with optimistic and pessimistic scenarios');
    
    // Enable forecast capability
    await page.locator('label:has-text("Forecast")').click();
    
    // Submit
    await page.locator('button:has-text("Send")').click();
    
    // Wait for forecast response
    await page.waitForSelector('h4:has-text("Forecast")', { timeout: 30000 });
    
    // Verify scenarios are present
    const forecastSection = page.locator('div:has(h4:has-text("Forecast"))');
    await expect(forecastSection).toContainText('Base case');
    await expect(forecastSection).toContainText('Optimistic');
    await expect(forecastSection).toContainText('Pessimistic');
    await expect(forecastSection).toContainText('Confidence');
  });
  
  test('Scenario 3: Benchmark report export', async () => {
    // Query lakehouse for analytics data
    const analyticsResponse = await axios.get(`${LAKEHOUSE_URL}/analytics/working-capital`, {
      params: {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      },
    });
    
    expect(analyticsResponse.status).toBe(200);
    expect(analyticsResponse.data.data).toBeDefined();
    expect(Array.isArray(analyticsResponse.data.data)).toBe(true);
    
    // Export to Parquet
    const exportResponse = await axios.post(`${LAKEHOUSE_URL}/export/parquet`, {
      table: 'analytics.liquidity_metrics',
    });
    
    expect(exportResponse.status).toBe(200);
    expect(exportResponse.data.success).toBe(true);
    expect(exportResponse.data.exportPath).toContain('.parquet');
  });
  
  test('Scenario 4: Working capital optimization recommendations', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat`);
    
    // Ask for recommendations
    const questionInput = page.locator('input[placeholder*="Ask about liquidity"]');
    await questionInput.fill('How can we optimize our working capital to improve cash flow?');
    
    // Enable all capabilities
    await page.locator('label:has-text("Analyze")').click();
    await page.locator('label:has-text("Forecast")').click();
    await page.locator('label:has-text("Recommend")').click();
    
    // Submit
    await page.locator('button:has-text("Send")').click();
    
    // Wait for comprehensive response
    await page.waitForSelector('h4:has-text("Recommendations")', { timeout: 30000 });
    
    // Verify all sections are present
    await expect(page.locator('h4:has-text("Analysis")')).toBeVisible();
    await expect(page.locator('h4:has-text("Forecast")')).toBeVisible();
    await expect(page.locator('h4:has-text("Recommendations")')).toBeVisible();
    
    // Verify recommendations include specific strategies
    const recommendationsSection = page.locator('div:has(h4:has-text("Recommendations"))');
    await expect(recommendationsSection).toContainText('Working capital optimization');
    await expect(recommendationsSection).toContainText('Cash flow improvement');
    await expect(recommendationsSection).toContainText('Implementation roadmap');
  });
  
  test('Scenario 5: Real-time data sync and alerts', async () => {
    // Trigger data sync
    const syncResponse = await axios.post(`${ADAPTERS_URL}/sync/mock`, {
      startDate: '2024-11-01',
      endDate: '2024-11-30',
    });
    
    expect(syncResponse.status).toBe(200);
    expect(syncResponse.data.jobId).toBeDefined();
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check metrics for alerts
    const metricsResponse = await axios.get(`${METRICS_URL}/query/alertsTriggered`);
    
    // Trigger an alert condition
    await axios.post(`${METRICS_URL}/alert`, {
      severity: 'warning',
      type: 'liquidity',
      message: 'Cash ratio below threshold',
      data: {
        currentRatio: 0.8,
        threshold: 1.0,
      },
    });
    
    // Verify alert was recorded
    const alertsResponse = await axios.get(`${METRICS_URL}/query/alertsTriggered`);
    expect(alertsResponse.data.data.length).toBeGreaterThan(0);
  });
  
  test('Scenario 6: Multi-source data aggregation', async () => {
    // Register multiple adapters (simulate)
    const adapters = ['xero', 'quickbooks'];
    
    for (const adapter of adapters) {
      // Check if adapter is available
      const healthResponse = await axios.get(`${ADAPTERS_URL}/health`);
      
      if (healthResponse.data.featureFlags[`${adapter}Integration`]) {
        // Would register real adapter here
        console.log(`${adapter} integration available`);
      }
    }
    
    // Query aggregated data
    const queryResponse = await axios.post(`${LAKEHOUSE_URL}/query`, {
      sql: `
        SELECT 
          source,
          COUNT(*) as record_count,
          SUM(amount) as total_amount
        FROM raw.cash_flows
        GROUP BY source
      `,
    });
    
    expect(queryResponse.status).toBe(200);
    expect(queryResponse.data.success).toBe(true);
    expect(queryResponse.data.data).toBeDefined();
  });
});

test.describe('Performance Benchmarks', () => {
  
  test('Lakehouse query performance', async () => {
    const startTime = Date.now();
    
    await axios.post(`${LAKEHOUSE_URL}/query`, {
      sql: `
        SELECT 
          DATE_TRUNC('month', timestamp) as month,
          SUM(amount) as total
        FROM raw.cash_flows
        GROUP BY DATE_TRUNC('month', timestamp)
        ORDER BY month
      `,
    });
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
  });
  
  test('AI agent response time', async () => {
    const startTime = Date.now();
    
    await axios.post(`${ORCHESTRATOR_URL}/query`, {
      query: 'What is the current cash position?',
      capabilities: ['analyze'],
    });
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });
  
  test('Data ingestion throughput', async () => {
    const records = [];
    for (let i = 0; i < 1000; i++) {
      records.push({
        id: `perf-test-${i}`,
        timestamp: new Date().toISOString(),
        amount: Math.random() * 10000,
        type: 'inflow',
        category: 'test',
        source: 'performance-test',
        currency: 'USD',
      });
    }
    
    const startTime = Date.now();
    
    await axios.post(`${LAKEHOUSE_URL}/ingest/cash_flows`, {
      data: records,
      schema: 'raw',
    });
    
    const duration = Date.now() - startTime;
    const throughput = (1000 / duration) * 1000; // Records per second
    
    expect(throughput).toBeGreaterThan(100); // Should handle >100 records/second
  });
});