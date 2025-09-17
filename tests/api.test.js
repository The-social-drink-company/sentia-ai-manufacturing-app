import { test, expect } from '@playwright/test';

test.describe('API Health Checks', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  test('API health check should return 200', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/health`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('healthy');
  });

  test('Personnel API should return data', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/personnel`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty('success');
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('Financial dashboard API should return data', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/financial/dashboard`);

    // Should return either 200 with data or 401 if auth required
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('success');
    } else {
      expect(response.status()).toBe(401);
    }
  });

  test('Production metrics API should handle request', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/production/metrics`);

    // Should return either 200 with data or 401 if auth required
    expect([200, 401]).toContain(response.status());
  });

  test('Working capital API should return data or auth error', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/financial/working-capital`);

    // Should return either 200 with data or 401 if auth required
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('success');
      if (body.success) {
        expect(body).toHaveProperty('summary');
      }
    } else {
      expect(response.status()).toBe(401);
    }
  });
});

test.describe('API Performance', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  test('Health endpoint should respond within 1 second', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get(`${baseUrl}/api/health`);
    const endTime = Date.now();

    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(1000);
    expect(response.ok()).toBeTruthy();
  });

  test('Personnel API should respond within 5 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get(`${baseUrl}/api/personnel`);
    const endTime = Date.now();

    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(5000);
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('API Error Handling', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  test('Should handle invalid endpoints gracefully', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/invalid-endpoint`);
    expect(response.status()).toBe(404);
  });

  test('Should handle malformed requests', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/personnel?role=invalid%20%20%20`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    // Should still return valid structure even with bad input
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
  });
});