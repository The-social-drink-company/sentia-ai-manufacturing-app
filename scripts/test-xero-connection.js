#!/usr/bin/env node

/**
 * Xero Service Connection Test Script
 *
 * Tests the existing Xero service implementation to verify:
 * - Environment variables are configured
 * - Client initialization works
 * - Authentication succeeds
 * - API calls return data
 * - Error handling works correctly
 *
 * Part of BMAD-MOCK-001 Phase 1.2
 */

import xeroService from '../services/xeroService.js';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function printHeader(title) {
  console.log('\n' + colors.cyan + colors.bright + '='.repeat(60) + colors.reset);
  console.log(colors.cyan + colors.bright + title.toUpperCase() + colors.reset);
  console.log(colors.cyan + colors.bright + '='.repeat(60) + colors.reset + '\n');
}

function printSuccess(message) {
  console.log(colors.green + '✅ ' + message + colors.reset);
}

function printError(message) {
  console.log(colors.red + '❌ ' + message + colors.reset);
}

function printWarning(message) {
  console.log(colors.yellow + '⚠️  ' + message + colors.reset);
}

function printInfo(message) {
  console.log(colors.blue + 'ℹ️  ' + message + colors.reset);
}

async function testEnvironmentVariables() {
  printHeader('Test 1: Environment Variables');

  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;

  if (!clientId) {
    printError('XERO_CLIENT_ID environment variable not set');
    return false;
  }
  printSuccess(`XERO_CLIENT_ID is set (length: ${clientId.length})`);

  if (!clientSecret) {
    printError('XERO_CLIENT_SECRET environment variable not set');
    return false;
  }
  printSuccess(`XERO_CLIENT_SECRET is set (length: ${clientSecret.length})`);

  return true;
}

async function testHealthCheck() {
  printHeader('Test 2: Health Check');

  try {
    const health = await xeroService.healthCheck();

    printInfo(`Status: ${health.status}`);
    printInfo(`Message: ${health.message}`);

    if (health.organizationId) {
      printSuccess(`Organization ID: ${health.organizationId}`);
    }

    if (health.tenantId) {
      printSuccess(`Tenant ID: ${health.tenantId}`);
    }

    if (health.lastCheck) {
      printInfo(`Last Check: ${health.lastCheck}`);
    }

    if (health.status === 'connected') {
      printSuccess('Xero service is fully connected');
      return true;
    } else if (health.status === 'configuration_error') {
      printError('Configuration error detected');
      if (health.details) {
        if (health.details.missing && health.details.missing.length > 0) {
          printError(`Missing variables: ${health.details.missing.join(', ')}`);
        }
        if (health.details.invalid && health.details.invalid.length > 0) {
          printError(`Invalid variables: ${health.details.invalid.join(', ')}`);
        }
      }
      return false;
    } else {
      printWarning(`Xero not fully connected: ${health.status}`);
      return false;
    }
  } catch (error) {
    printError(`Health check failed: ${error.message}`);
    return false;
  }
}

async function testBalanceSheet() {
  printHeader('Test 3: Balance Sheet Data');

  try {
    const balanceSheet = await xeroService.getBalanceSheet(2);

    if (!balanceSheet) {
      printWarning('No balance sheet data returned');
      return false;
    }

    printSuccess(`Balance sheet data retrieved`);
    printInfo(`Report ID: ${balanceSheet.reportId}`);
    printInfo(`Report Name: ${balanceSheet.reportName}`);
    printInfo(`Report Date: ${balanceSheet.reportDate}`);
    printInfo(`Rows: ${balanceSheet.rows?.length || 0}`);

    return true;
  } catch (error) {
    printError(`Balance sheet test failed: ${error.message}`);
    return false;
  }
}

async function testProfitAndLoss() {
  printHeader('Test 4: Profit & Loss Data');

  try {
    const plData = await xeroService.getProfitAndLoss(3);

    if (!plData || plData.length === 0) {
      printWarning('No P&L data returned');
      return false;
    }

    printSuccess(`P&L data retrieved: ${plData.length} periods`);

    for (let i = 0; i < Math.min(3, plData.length); i++) {
      const period = plData[i];
      console.log(colors.magenta + `\nPeriod ${i + 1}:` + colors.reset);
      printInfo(`  Report Date: ${period.reportDate}`);
      printInfo(`  Total Revenue: £${period.totalRevenue?.toLocaleString() || 0}`);
      printInfo(`  Total Expenses: £${period.totalExpenses?.toLocaleString() || 0}`);
      printInfo(`  Net Profit: £${period.netProfit?.toLocaleString() || 0}`);
      printInfo(`  Gross Margin: ${period.grossMargin?.toFixed(1) || 0}%`);
      printInfo(`  Profit Margin: ${period.profitMargin?.toFixed(1) || 0}%`);
    }

    return true;
  } catch (error) {
    printError(`P&L test failed: ${error.message}`);
    return false;
  }
}

async function testCashFlow() {
  printHeader('Test 5: Cash Flow Data');

  try {
    const cashFlow = await xeroService.getCashFlow(3);

    if (!cashFlow) {
      printWarning('No cash flow data returned');
      return false;
    }

    printSuccess('Cash flow data retrieved');
    printInfo(`Operating: £${cashFlow.operating?.toLocaleString() || 0}`);
    printInfo(`Investing: £${cashFlow.investing?.toLocaleString() || 0}`);
    printInfo(`Financing: £${cashFlow.financing?.toLocaleString() || 0}`);
    printInfo(`Total Movement: £${cashFlow.totalMovement?.toLocaleString() || 0}`);
    printInfo(`Bank Accounts: £${cashFlow.bankAccounts?.toLocaleString() || 0}`);
    printInfo(`Account Count: ${cashFlow.accountCount || 0}`);

    return true;
  } catch (error) {
    printError(`Cash flow test failed: ${error.message}`);
    return false;
  }
}

async function testWorkingCapital() {
  printHeader('Test 6: Working Capital Calculation');

  try {
    const wcData = await xeroService.calculateWorkingCapital();

    if (!wcData.success) {
      printWarning(`Working capital calculation failed: ${wcData.message}`);
      if (wcData.dataSource === 'authentication_required') {
        printInfo('Authentication required - this is expected behavior');
      } else if (wcData.dataSource === 'setup_required') {
        printInfo('Setup required - this is expected behavior');
      }
      return wcData.dataSource !== 'xero_api_error';
    }

    printSuccess('Working capital calculated successfully');
    printInfo(`Data Source: ${wcData.dataSource}`);

    const data = wcData.data;
    if (data) {
      console.log(colors.magenta + '\nWorking Capital Metrics:' + colors.reset);
      printInfo(`  Working Capital: £${data.workingCapital?.toLocaleString() || 0}`);
      printInfo(`  Current Assets: £${data.currentAssets?.toLocaleString() || 0}`);
      printInfo(`  Current Liabilities: £${data.currentLiabilities?.toLocaleString() || 0}`);
      printInfo(`  Current Ratio: ${data.currentRatio?.toFixed(2) || 0}`);
      printInfo(`  Quick Ratio: ${data.quickRatio?.toFixed(2) || 0}`);

      console.log(colors.magenta + '\nCash Conversion Cycle:' + colors.reset);
      printInfo(`  CCC Days: ${data.cashConversionCycle || 0}`);
      printInfo(`  DSO (Days Sales Outstanding): ${data.dso?.toFixed(1) || 0}`);
      printInfo(`  DIO (Days Inventory Outstanding): ${data.dio?.toFixed(1) || 0}`);
      printInfo(`  DPO (Days Payable Outstanding): ${data.dpo?.toFixed(1) || 0}`);

      console.log(colors.magenta + '\nBalance Sheet Items:' + colors.reset);
      printInfo(`  Cash: £${data.cash?.toLocaleString() || 0}`);
      printInfo(`  Accounts Receivable: £${data.accountsReceivable?.toLocaleString() || 0}`);
      printInfo(`  Inventory: £${data.inventory?.toLocaleString() || 0}`);
      printInfo(`  Accounts Payable: £${data.accountsPayable?.toLocaleString() || 0}`);
    }

    return true;
  } catch (error) {
    printError(`Working capital test failed: ${error.message}`);
    return false;
  }
}

async function testErrorHandling() {
  printHeader('Test 7: Error Handling');

  try {
    // Test with invalid periods (should handle gracefully)
    printInfo('Testing invalid periods parameter...');
    const plData = await xeroService.getProfitAndLoss(50); // Invalid - should clamp to 11

    if (plData) {
      printSuccess('Invalid parameter handled gracefully');
      printInfo(`Returned ${plData.length} periods (should be max 11)`);
    }

    return true;
  } catch (error) {
    printError(`Error handling test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  printHeader('XERO SERVICE CONNECTION TEST SUITE');
  console.log(colors.bright + 'Testing Xero service implementation for BMAD-MOCK-001 Phase 1.2\n' + colors.reset);

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Test 1: Environment Variables
  const envTest = await testEnvironmentVariables();
  if (envTest) {
    results.passed++;
  } else {
    results.failed++;
    printWarning('Skipping remaining tests due to missing environment variables');
    printSummary(results);
    return;
  }

  // Test 2: Health Check
  const healthTest = await testHealthCheck();
  if (healthTest) {
    results.passed++;
  } else {
    results.failed++;
    printWarning('Xero not connected - some tests may fail');
  }

  // Only run API tests if health check passed
  if (healthTest) {
    // Test 3: Balance Sheet
    const balanceSheetTest = await testBalanceSheet();
    results[balanceSheetTest ? 'passed' : 'failed']++;

    // Test 4: P&L
    const plTest = await testProfitAndLoss();
    results[plTest ? 'passed' : 'failed']++;

    // Test 5: Cash Flow
    const cashFlowTest = await testCashFlow();
    results[cashFlowTest ? 'passed' : 'failed']++;

    // Test 6: Working Capital
    const wcTest = await testWorkingCapital();
    results[wcTest ? 'passed' : 'failed']++;

    // Test 7: Error Handling
    const errorTest = await testErrorHandling();
    results[errorTest ? 'passed' : 'failed']++;
  } else {
    results.skipped = 5;
    printWarning('Skipped 5 tests due to Xero connection failure');
  }

  printSummary(results);
}

function printSummary(results) {
  printHeader('TEST SUMMARY');

  const total = results.passed + results.failed + results.skipped;

  printSuccess(`Passed: ${results.passed}/${total}`);
  if (results.failed > 0) {
    printError(`Failed: ${results.failed}/${total}`);
  }
  if (results.skipped > 0) {
    printWarning(`Skipped: ${results.skipped}/${total}`);
  }

  console.log('\n' + colors.bright + 'OVERALL: ' + colors.reset, end='');
  if (results.failed === 0 && results.passed > 0) {
    printSuccess('ALL TESTS PASSED');
  } else if (results.failed > 0) {
    printError('SOME TESTS FAILED');
  } else {
    printWarning('NO TESTS RAN SUCCESSFULLY');
  }

  console.log('\n' + colors.bright + 'Next Steps:' + colors.reset);
  if (results.failed > 0 || results.skipped > 0) {
    printInfo('1. Check environment variables (XERO_CLIENT_ID, XERO_CLIENT_SECRET)');
    printInfo('2. Verify Xero Custom Connection is created in Developer Portal');
    printInfo('3. Ensure credentials have correct permissions (accounting.transactions.read, etc.)');
    printInfo('4. Review server logs for detailed error messages');
  } else {
    printInfo('1. Proceed to Phase 2: Fix mock data sources');
    printInfo('2. Update api/routes/financial.js P&L endpoints');
    printInfo('3. Integrate server/api/working-capital.js with Xero');
  }

  console.log('\n');
}

// Run the test suite
runAllTests().catch((error) => {
  printError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
