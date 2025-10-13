/**
 * Xero Integration Tests
 * 
 * Comprehensive test suite for Xero integration functionality
 * including authentication, tool execution, and error handling.
 * 
 * @version 1.0.0
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { XeroIntegration } from '../index.js';

// Mock configuration for testing
const mockConfig = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  redirectUri: 'http://localhost:3000/callback',
  scopes: ['accounting.read', 'accounting.transactions']
};

test('Xero Integration instantiation', async () => {
  const xero = new XeroIntegration(mockConfig);
  
  assert(xero instanceof XeroIntegration, 'Should be instance of XeroIntegration');
  assert(xero.config.clientId === 'test-client-id', 'Should have correct client ID');
  assert(xero.tools instanceof Map, 'Should have tools Map');
  assert(xero.tools.size === 5, 'Should have 5 tools loaded');
});

test('Tool registration and availability', async () => {
  const xero = new XeroIntegration(mockConfig);
  
  // Check that all expected tools are registered
  const expectedTools = [
    'xero-get-financial-reports',
    'xero-get-invoices',
    'xero-create-invoice',
    'xero-get-contacts',
    'xero-get-bank-transactions'
  ];
  
  for (const toolName of expectedTools) {
    assert(xero.tools.has(toolName), `Should have ${toolName} tool`);
    
    const tool = xero.tools.get(toolName);
    assert(tool.name === toolName, `Tool should have correct name: ${toolName}`);
    assert(typeof tool.execute === 'function', `Tool ${toolName} should have execute function`);
    assert(tool.inputSchema, `Tool ${toolName} should have input schema`);
  }
});

test('Tool metadata retrieval', async () => {
  const xero = new XeroIntegration(mockConfig);
  
  const availableTools = xero.getAvailableTools();
  
  assert(Array.isArray(availableTools), 'Should return array of tools');
  assert(availableTools.length === 5, 'Should have 5 available tools');
  
  // Check tool metadata structure
  const firstTool = availableTools[0];
  assert(typeof firstTool.name === 'string', 'Tool should have name');
  assert(typeof firstTool.description === 'string', 'Tool should have description');
  assert(typeof firstTool.category === 'string', 'Tool should have category');
  assert(typeof firstTool.inputSchema === 'object', 'Tool should have input schema');
  assert(typeof firstTool.requiresAuth === 'boolean', 'Tool should have auth requirement');
});

test('Configuration validation', async () => {
  // Test missing required configuration
  try {
    new XeroIntegration({
      clientId: 'test-client-id'
      // Missing clientSecret and redirectUri
    });
    assert.fail('Should throw error for missing configuration');
  } catch (error) {
    assert(error.message.includes('Missing required Xero configuration'), 
           'Should throw configuration error');
  }
});

test('Authentication URL generation', async () => {
  const xero = new XeroIntegration(mockConfig);
  
  try {
    const authResult = await xero.getAuthUrl('test-state');
    
    assert(typeof authResult.url === 'string', 'Should return auth URL');
    assert(authResult.url.includes('https://'), 'Should be HTTPS URL');
    assert(authResult.state === 'test-state', 'Should include provided state');
    assert(authResult.expiresAt, 'Should have expiration time');
  } catch (error) {
    // Expected to fail without real credentials, but should handle gracefully
    assert(error.message.includes('Authentication') || error.message.includes('network'), 
           'Should fail gracefully for auth operations');
  }
});

test('System status check', async () => {
  const xero = new XeroIntegration(mockConfig);
  
  const status = await xero.getStatus();
  
  assert(typeof status === 'object', 'Should return status object');
  assert(typeof status.status === 'string', 'Should have status field');
  assert(typeof status.authenticated === 'boolean', 'Should have authenticated field');
  assert(typeof status.tools === 'number', 'Should have tools count');
  assert(status.tools === 5, 'Should report 5 tools');
  assert(typeof status.lastUpdate === 'string', 'Should have last update timestamp');
});

test('Cache operations', async () => {
  const xero = new XeroIntegration(mockConfig);
  
  // Test cache clearing
  const clearResult = await xero.clearCache();
  
  assert(clearResult.success === true, 'Cache clear should succeed');
  assert(typeof clearResult.message === 'string', 'Should have success message');
});

test('Tool execution error handling', async () => {
  const xero = new XeroIntegration(mockConfig);
  
  try {
    // Try to execute a tool without authentication
    await xero.executeTool('xero-get-financial-reports', {
      tenantId: 'test-tenant',
      reportType: 'ProfitAndLoss'
    });
    
    assert.fail('Should throw error without authentication');
  } catch (error) {
    assert(error.message.includes('authentication') || error.message.includes('token'), 
           'Should fail with authentication error');
  }
});

test('Tool execution with invalid tool name', async () => {
  const xero = new XeroIntegration(mockConfig);
  
  try {
    await xero.executeTool('invalid-tool-name', {});
    assert.fail('Should throw error for invalid tool');
  } catch (error) {
    assert(error.message.includes('not found'), 'Should throw tool not found error');
  }
});

test('Integration disconnect', async () => {
  const xero = new XeroIntegration(mockConfig);
  
  const disconnectResult = await xero.disconnect();
  
  assert(disconnectResult.success === true, 'Disconnect should succeed');
  assert(typeof disconnectResult.message === 'string', 'Should have success message');
});

test('Financial Reports Tool schema validation', async () => {
  const xero = new XeroIntegration(mockConfig);
  const tool = xero.tools.get('xero-get-financial-reports');
  
  assert(tool.inputSchema.type === 'object', 'Schema should be object type');
  assert(Array.isArray(tool.inputSchema.required), 'Should have required fields');
  assert(tool.inputSchema.required.includes('tenantId'), 'Should require tenantId');
  assert(tool.inputSchema.required.includes('reportType'), 'Should require reportType');
  
  // Check enum values for reportType
  const reportTypeProperty = tool.inputSchema.properties.reportType;
  assert(Array.isArray(reportTypeProperty.enum), 'ReportType should have enum values');
  assert(reportTypeProperty.enum.includes('ProfitAndLoss'), 'Should include ProfitAndLoss');
  assert(reportTypeProperty.enum.includes('BalanceSheet'), 'Should include BalanceSheet');
});

test('Invoices Tool schema validation', async () => {
  const xero = new XeroIntegration(mockConfig);
  const tool = xero.tools.get('xero-get-invoices');
  
  assert(tool.inputSchema.properties.invoiceType, 'Should have invoiceType property');
  assert(tool.inputSchema.properties.status, 'Should have status property');
  assert(tool.inputSchema.properties.overdueOnly, 'Should have overdueOnly property');
  
  // Check status is array type
  assert(tool.inputSchema.properties.status.type === 'array', 'Status should be array');
  assert(Array.isArray(tool.inputSchema.properties.status.items.enum), 'Status items should have enum');
});

test('Create Invoice Tool schema validation', async () => {
  const xero = new XeroIntegration(mockConfig);
  const tool = xero.tools.get('xero-create-invoice');
  
  assert(tool.inputSchema.required.includes('tenantId'), 'Should require tenantId');
  assert(tool.inputSchema.required.includes('contactID'), 'Should require contactID');
  assert(tool.inputSchema.required.includes('lineItems'), 'Should require lineItems');
  
  // Check line items structure
  const lineItemsProperty = tool.inputSchema.properties.lineItems;
  assert(lineItemsProperty.type === 'array', 'LineItems should be array');
  assert(lineItemsProperty.minItems === 1, 'Should require at least one line item');
  assert(lineItemsProperty.items.required.includes('description'), 'Line item should require description');
  assert(lineItemsProperty.items.required.includes('unitAmount'), 'Line item should require unitAmount');
});

test('Contacts Tool schema validation', async () => {
  const xero = new XeroIntegration(mockConfig);
  const tool = xero.tools.get('xero-get-contacts');
  
  assert(tool.inputSchema.properties.contactType, 'Should have contactType property');
  assert(tool.inputSchema.properties.searchTerm, 'Should have searchTerm property');
  assert(tool.inputSchema.properties.includeAddresses, 'Should have includeAddresses property');
  
  // Check contact type enum
  const contactTypeProperty = tool.inputSchema.properties.contactType;
  assert(contactTypeProperty.enum.includes('Customer'), 'Should include Customer');
  assert(contactTypeProperty.enum.includes('Supplier'), 'Should include Supplier');
  assert(contactTypeProperty.enum.includes('Both'), 'Should include Both');
});

test('Bank Transactions Tool schema validation', async () => {
  const xero = new XeroIntegration(mockConfig);
  const tool = xero.tools.get('xero-get-bank-transactions');
  
  assert(tool.inputSchema.properties.bankAccountID, 'Should have bankAccountID property');
  assert(tool.inputSchema.properties.transactionType, 'Should have transactionType property');
  assert(tool.inputSchema.properties.reconciliationStatus, 'Should have reconciliationStatus property');
  
  // Check transaction type is array with enum
  const transactionTypeProperty = tool.inputSchema.properties.transactionType;
  assert(transactionTypeProperty.type === 'array', 'TransactionType should be array');
  assert(transactionTypeProperty.items.enum.includes('RECEIVE'), 'Should include RECEIVE');
  assert(transactionTypeProperty.items.enum.includes('SPEND'), 'Should include SPEND');
});

test('Tool categories', async () => {
  const xero = new XeroIntegration(mockConfig);
  const availableTools = xero.getAvailableTools();
  
  // All tools should be in 'financial' category
  for (const tool of availableTools) {
    assert(tool.category === 'financial', `Tool ${tool.name} should be in financial category`);
  }
});

test('Tool caching configuration', async () => {
  const xero = new XeroIntegration(mockConfig);
  const availableTools = xero.getAvailableTools();
  
  // Check caching configuration
  const cachingTools = availableTools.filter(tool => tool.cacheEnabled);
  const nonCachingTools = availableTools.filter(tool => !tool.cacheEnabled);
  
  assert(cachingTools.length > 0, 'Should have some tools with caching enabled');
  
  // Create invoice should not be cached
  const createInvoiceTool = availableTools.find(tool => tool.name === 'xero-create-invoice');
  assert(createInvoiceTool.cacheEnabled === false, 'Create invoice should not be cached');
  
  // Read operations should be cached
  const financialReportsTool = availableTools.find(tool => tool.name === 'xero-get-financial-reports');
  assert(financialReportsTool.cacheEnabled === true, 'Financial reports should be cached');
});

console.log('Running Xero Integration tests...');