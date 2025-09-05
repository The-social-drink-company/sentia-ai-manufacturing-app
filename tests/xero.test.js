/**
 * Xero Integration Tests
 * Tests for Xero service functionality
 */

const XeroService = require('../services/xeroService');

describe('Xero Service', () => {
  let xeroService;

  beforeEach(() => {
    // Mock environment variables
    process.env.XERO_CLIENT_ID = '9C0CAB921C134476A249E48BBECB8C4B';
    process.env.XERO_CLIENT_SECRET = 'f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5';
    process.env.XERO_REDIRECT_URI = 'http://localhost:5000/api/xero/callback';
    process.env.XERO_SCOPE = 'accounting.transactions,accounting.contacts,accounting.settings';
    
    xeroService = new XeroService();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.XERO_CLIENT_ID;
    delete process.env.XERO_CLIENT_SECRET;
    delete process.env.XERO_REDIRECT_URI;
    delete process.env.XERO_SCOPE;
  });

  test('should initialize with correct configuration', () => {
    expect(xeroService.clientId).toBe('9C0CAB921C134476A249E48BBECB8C4B');
    expect(xeroService.clientSecret).toBe('f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5');
    expect(xeroService.redirectUri).toBe('http://localhost:5000/api/xero/callback');
    expect(xeroService.scope).toBe('accounting.transactions,accounting.contacts,accounting.settings');
  });

  test('should generate auth URL', () => {
    const authUrl = xeroService.getAuthUrl();
    expect(authUrl).toBeDefined();
    expect(typeof authUrl).toBe('string');
    expect(authUrl).toContain('login.xero.com');
  });

  test('should handle missing environment variables', () => {
    delete process.env.XERO_CLIENT_ID;
    delete process.env.XERO_CLIENT_SECRET;
    
    expect(() => new XeroService()).toThrow();
  });

  test('should have all required methods', () => {
    expect(typeof xeroService.getAuthUrl).toBe('function');
    expect(typeof xeroService.exchangeCodeForToken).toBe('function');
    expect(typeof xeroService.refreshToken).toBe('function');
    expect(typeof xeroService.getOrganizations).toBe('function');
    expect(typeof xeroService.getContacts).toBe('function');
    expect(typeof xeroService.createOrUpdateContact).toBe('function');
    expect(typeof xeroService.getInvoices).toBe('function');
    expect(typeof xeroService.createInvoice).toBe('function');
    expect(typeof xeroService.getItems).toBe('function');
    expect(typeof xeroService.createOrUpdateItem).toBe('function');
    expect(typeof xeroService.getFinancialReports).toBe('function');
    expect(typeof xeroService.testConnection).toBe('function');
  });
});

describe('Xero API Routes', () => {
  test('should have auth endpoint', () => {
    // This would require setting up Express app for testing
    // For now, just verify the route file exists and is valid
    const fs = require('fs');
    const path = require('path');
    const routeFile = path.join(__dirname, '../api/xero.js');
    expect(fs.existsSync(routeFile)).toBe(true);
  });
});
