#!/usr/bin/env node

/**
 * Phase 2 Implementation Verification Script
 * Verifies all 7 prompts from Phase 2 are completed
 */

import fetch from 'node-fetch';
import { io } from 'socket.io-client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RENDER_URL = 'https://sentia-manufacturing-development.onrender.com';
const LOCAL_URL = 'http://localhost:3000';
const API_URL = `${RENDER_URL}/api`;

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

async function checkPrompt1() {
  console.log(`\n${CYAN}PROMPT 1: Deploy Real Dashboard Components${RESET}`);
  console.log('=========================================');

  try {
    // Check if main.jsx imports App instead of TestApp
    const mainJsxPath = path.join(__dirname, '../src/main.jsx');
    const mainContent = fs.readFileSync(mainJsxPath, 'utf8');
    const importsApp = mainContent.includes("import App from './App.jsx'") &&
                      !mainContent.includes("import TestApp from './TestApp.jsx'");

    console.log(`  Main.jsx imports App.jsx: ${importsApp ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}`);

    // Check if App.jsx has routing
    const appJsxPath = path.join(__dirname, '../src/App.jsx');
    const appContent = fs.readFileSync(appJsxPath, 'utf8');
    const hasRouting = appContent.includes('BrowserRouter') || appContent.includes('Routes');

    console.log(`  App.jsx has routing: ${hasRouting ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}`);

    // Check production site
    const response = await fetch(RENDER_URL);
    const html = await response.text();
    const hasReactApp = html.includes('root') && !html.includes('Test Button');

    console.log(`  Production serves main app: ${hasReactApp ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}`);

    return importsApp && hasRouting && hasReactApp;
  } catch (error) {
    console.log(`  ${RED}Error: ${error.message}${RESET}`);
    return false;
  }
}

async function checkPrompt2() {
  console.log(`\n${CYAN}PROMPT 2: Activate Full Authentication Flow${RESET}`);
  console.log('=========================================');

  try {
    // Check if Clerk is configured
    const mainJsxPath = path.join(__dirname, '../src/main.jsx');
    const mainContent = fs.readFileSync(mainJsxPath, 'utf8');
    const hasClerkProvider = mainContent.includes('ClerkProvider');
    const bypassClerk = mainContent.includes('bypassClerk = true');

    console.log(`  ClerkProvider configured: ${hasClerkProvider ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}`);
    console.log(`  Clerk bypass mode: ${bypassClerk ? YELLOW + 'ENABLED' : GREEN + 'DISABLED'}${RESET}`);

    // Check for auth components
    const authDir = path.join(__dirname, '../src/components/auth');
    const hasAuthComponents = fs.existsSync(authDir);

    console.log(`  Auth components exist: ${hasAuthComponents ? GREEN + 'PASS' : YELLOW + 'WARN'}${RESET}`);

    return hasClerkProvider;
  } catch (error) {
    console.log(`  ${RED}Error: ${error.message}${RESET}`);
    return false;
  }
}

async function checkPrompt3() {
  console.log(`\n${CYAN}PROMPT 3: Connect Dashboard Widgets to Real APIs${RESET}`);
  console.log('=========================================');

  try {
    // Check if API services are configured
    const servicesDir = path.join(__dirname, '../src/services');
    const hasApiService = fs.existsSync(path.join(servicesDir, 'api.js'));

    console.log(`  API service exists: ${hasApiService ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}`);

    // Check if widgets use real data
    const widgetsDir = path.join(__dirname, '../src/components/widgets');
    const hasWidgets = fs.existsSync(widgetsDir);

    console.log(`  Dashboard widgets exist: ${hasWidgets ? GREEN + 'PASS' : YELLOW + 'WARN'}${RESET}`);

    // Test API endpoints
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    const apiHealthy = healthResponse.ok;

    console.log(`  API health check: ${apiHealthy ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}`);

    return hasApiService && apiHealthy;
  } catch (error) {
    console.log(`  ${RED}Error: ${error.message}${RESET}`);
    return false;
  }
}

async function checkPrompt4() {
  console.log(`\n${CYAN}PROMPT 4: Implement Dashboard Grid System${RESET}`);
  console.log('=========================================');

  try {
    // Check for grid layout components
    const layoutDir = path.join(__dirname, '../src/components/layout');
    const hasGridComponent = fs.existsSync(path.join(layoutDir, 'DashboardGrid.jsx'));

    console.log(`  DashboardGrid component: ${hasGridComponent ? GREEN + 'PASS' : YELLOW + 'WARN'}${RESET}`);

    // Check package.json for react-grid-layout
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    const hasGridLayout = packageJson.dependencies['react-grid-layout'] !== undefined;

    console.log(`  react-grid-layout installed: ${hasGridLayout ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}`);

    // Check for layout store
    const storesDir = path.join(__dirname, '../src/stores');
    const hasLayoutStore = fs.existsSync(path.join(storesDir, 'layoutStore.js'));

    console.log(`  Layout store exists: ${hasLayoutStore ? GREEN + 'PASS' : YELLOW + 'WARN'}${RESET}`);

    return hasGridLayout;
  } catch (error) {
    console.log(`  ${RED}Error: ${error.message}${RESET}`);
    return false;
  }
}

async function checkPrompt5() {
  console.log(`\n${CYAN}PROMPT 5: Complete All API Endpoints${RESET}`);
  console.log('=========================================');

  const endpoints = [
    '/health',
    '/personnel',
    '/production/lines',
    '/production/metrics',
    '/inventory/levels',
    '/inventory/movements',
    '/quality/inspections',
    '/quality/defects',
    '/financial/working-capital',
    '/financial/cash-flow'
  ];

  let allPassed = true;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`);
      const passed = response.ok;
      console.log(`  ${endpoint}: ${passed ? GREEN + 'PASS' : RED + 'FAIL'} (${response.status})${RESET}`);
      if (!passed) allPassed = false;
    } catch (error) {
      console.log(`  ${endpoint}: ${RED}ERROR${RESET}`);
      allPassed = false;
    }
  }

  return allPassed;
}

async function checkPrompt6() {
  console.log(`\n${CYAN}PROMPT 6: WebSocket Real-Time Implementation${RESET}`);
  console.log('=========================================');

  try {
    // Check if Socket.io is installed
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    const hasSocketIO = packageJson.dependencies['socket.io'] !== undefined;
    const hasSocketIOClient = packageJson.dependencies['socket.io-client'] !== undefined;

    console.log(`  socket.io installed: ${hasSocketIO ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}`);
    console.log(`  socket.io-client installed: ${hasSocketIOClient ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}`);

    // Check for WebSocket service
    const wsServicePath = path.join(__dirname, '../services/websocketService.js');
    const hasWsService = fs.existsSync(wsServicePath);

    console.log(`  WebSocket service exists: ${hasWsService ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}`);

    // Check for real-time hooks
    const hooksPath = path.join(__dirname, '../src/hooks/useRealTimeData.js');
    const hasRealTimeHooks = fs.existsSync(hooksPath);

    console.log(`  Real-time hooks exist: ${hasRealTimeHooks ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}`);

    // Check for real-time components
    const rtComponentsDir = path.join(__dirname, '../src/components/realtime');
    const hasRtComponents = fs.existsSync(rtComponentsDir);

    console.log(`  Real-time components exist: ${hasRtComponents ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}`);

    return hasSocketIO && hasSocketIOClient && hasWsService && hasRealTimeHooks && hasRtComponents;
  } catch (error) {
    console.log(`  ${RED}Error: ${error.message}${RESET}`);
    return false;
  }
}

async function checkPrompt7() {
  console.log(`\n${CYAN}PROMPT 7: Database Schema Completion${RESET}`);
  console.log('=========================================');

  try {
    // Check Prisma schema
    const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    const tables = [
      'ProductionLine',
      'ProductionMetrics',
      'ProductionSchedule',
      'BatchProduction',
      'QualityInspection',
      'QualityDefect',
      'QualityMetrics',
      'InventoryMovement',
      'StockTake',
      'MaintenanceSchedule',
      'PurchaseOrder',
      'CashFlow',
      'CashBalance'
    ];

    let allTablesExist = true;
    for (const table of tables) {
      const exists = schemaContent.includes(`model ${table}`);
      console.log(`  ${table}: ${exists ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}`);
      if (!exists) allTablesExist = false;
    }

    // Check for SQL migration file
    const migrationPath = path.join(__dirname, '../database/migrations/complete_schema.sql');
    const hasMigration = fs.existsSync(migrationPath);

    console.log(`\n  SQL migration file: ${hasMigration ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}`);

    // Check for pgvector extension in migration
    if (hasMigration) {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      const hasPgVector = migrationContent.includes('CREATE EXTENSION IF NOT EXISTS vector');
      console.log(`  pgvector extension: ${hasPgVector ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}`);
    }

    return allTablesExist && hasMigration;
  } catch (error) {
    console.log(`  ${RED}Error: ${error.message}${RESET}`);
    return false;
  }
}

async function main() {
  console.log('============================================================');
  console.log('PHASE 2 IMPLEMENTATION VERIFICATION');
  console.log('============================================================');
  console.log(`Target: ${RENDER_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);

  const results = {
    prompt1: await checkPrompt1(),
    prompt2: await checkPrompt2(),
    prompt3: await checkPrompt3(),
    prompt4: await checkPrompt4(),
    prompt5: await checkPrompt5(),
    prompt6: await checkPrompt6(),
    prompt7: await checkPrompt7()
  };

  console.log('\n============================================================');
  console.log('SUMMARY');
  console.log('============================================================');

  let passedCount = 0;
  const prompts = [
    'Deploy Real Dashboard Components',
    'Activate Full Authentication Flow',
    'Connect Dashboard Widgets to Real APIs',
    'Implement Dashboard Grid System',
    'Complete All API Endpoints',
    'WebSocket Real-Time Implementation',
    'Database Schema Completion'
  ];

  Object.entries(results).forEach(([key, passed], index) => {
    if (passed) passedCount++;
    console.log(`PROMPT ${index + 1}: ${prompts[index]}`);
    console.log(`  Status: ${passed ? GREEN + 'COMPLETED' : RED + 'INCOMPLETE'}${RESET}`);
  });

  console.log('\n============================================================');
  console.log(`Overall: ${passedCount}/7 prompts completed`);

  if (passedCount === 7) {
    console.log(`${GREEN}SUCCESS: All Phase 2 implementations are complete!${RESET}`);
  } else {
    console.log(`${YELLOW}IN PROGRESS: ${7 - passedCount} prompts remaining${RESET}`);
  }

  console.log('============================================================');

  // Save results
  const statusFile = path.join(__dirname, 'phase2-status.json');
  fs.writeFileSync(statusFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    completed: passedCount,
    total: 7,
    results,
    details: prompts.map((prompt, i) => ({
      prompt: `PROMPT ${i + 1}`,
      description: prompt,
      status: results[`prompt${i + 1}`] ? 'completed' : 'incomplete'
    }))
  }, null, 2));

  console.log(`\nStatus saved to: ${statusFile}`);
}

main().catch(console.error);