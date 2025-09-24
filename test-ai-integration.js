#!/usr/bin/env node

/**
 * AI INTEGRATION TEST SCRIPT
 * Tests the complete AI Central Nervous System integration with sample data
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const PRODUCTION_URL = 'https://sentia-manufacturing-dashboard-production.up.railway.app';

// Sample manufacturing data for testing
const sampleData = {
  // AI Manufacturing Request Test
  aiManufacturingRequest: {
    query: "Analyze current inventory levels and suggest optimization strategies for our top 10 SKUs",
    type: "inventory-optimization",
    llmProvider: "claude",
    capabilities: ["manufacturing-intelligence", "reasoning", "analysis"]
  },

  // Inventory Optimization Test
  inventoryOptimization: {
    sku: "SENTIA-WIDGET-001",
    timeHorizon: 90,
    optimizationGoal: "balanced"
  },

  // Demand Forecasting Test
  demandForecast: {
    sku: "SENTIA-COMPONENT-X",
    timeHorizon: 30,
    seasonalFactors: true
  },

  // Production Planning Test
  productionPlanning: {
    targetDate: "2025-10-15",
    capacity: 1000,
    priority: "high"
  },

  // Quality Control Test
  qualityControl: {
    batchId: "BATCH-2025-001",
    testResults: {
      defectRate: 0.02,
      testsPassed: 98,
      totalTests: 100
    }
  },

  // Working Capital Analysis Test
  workingCapitalAnalysis: {
    period: "Q4-2025",
    includeForecasting: true
  },

  // Unified API Call Test
  unifiedApiCall: {
    serviceId: "xero-accounting",
    endpoint: "/contacts",
    method: "GET"
  }
};

async function testMCPServer() {
  console.log('🧪 Starting AI Integration Test Suite...\n');
  
  try {
    // Test 1: Health Check
    console.log('1. 🏥 Testing Health Endpoint...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      console.log('   ✅ Health Check:', healthResponse.data);
    } catch (error) {
      console.log('   ❌ Local server not available, testing production...');
      try {
        const prodHealthResponse = await axios.get(`${PRODUCTION_URL}/api/health`, { timeout: 10000 });
        console.log('   ✅ Production Health:', prodHealthResponse.data);
      } catch (prodError) {
        console.log('   ❌ Production health check failed:', prodError.message);
      }
    }

    // Test 2: MCP Tools List
    console.log('\n2. 🔧 Testing MCP Tools List...');
    const mcpRequest = {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    };

    try {
      const toolsResponse = await axios.post(`${BASE_URL}/mcp`, mcpRequest, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      console.log('   ✅ Available Tools:', toolsResponse.data.result?.tools?.length || 0);
      
      if (toolsResponse.data.result?.tools) {
        toolsResponse.data.result.tools.forEach(tool => {
          console.log(`      - ${tool.name}: ${tool.description}`);
        });
      }
    } catch (error) {
      console.log('   ❌ Tools list failed:', error.message);
    }

    // Test 3: AI Manufacturing Request
    console.log('\n3. 🤖 Testing AI Manufacturing Request...');
    const aiRequest = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'ai_manufacturing_request',
        arguments: sampleData.aiManufacturingRequest
      },
      id: 2
    };

    try {
      const aiResponse = await axios.post(`${BASE_URL}/mcp`, aiRequest, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      console.log('   ✅ AI Manufacturing Request Result:');
      console.log('      Query:', sampleData.aiManufacturingRequest.query);
      console.log('      Success:', aiResponse.data.result?.success);
      console.log('      AI Provider:', aiResponse.data.result?.aiProvider);
      console.log('      Confidence:', aiResponse.data.result?.confidence);
      console.log('      Response Time:', aiResponse.data.result?.responseTime + 'ms');
    } catch (error) {
      console.log('   ❌ AI request failed:', error.message);
    }

    // Test 4: AI System Status
    console.log('\n4. 📊 Testing AI System Status...');
    const statusRequest = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'ai_system_status',
        arguments: { includeMetrics: true }
      },
      id: 3
    };

    try {
      const statusResponse = await axios.post(`${BASE_URL}/mcp`, statusRequest, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      const status = statusResponse.data.result?.aiCentralNervousSystem;
      if (status) {
        console.log('   ✅ AI System Status:');
        console.log('      Status:', status.status);
        console.log('      LLM Providers:', Object.keys(status.llmProviders || {}).length);
        console.log('      API Integrations:', Object.keys(status.apiIntegrations || {}).length);
        console.log('      Vector Categories:', status.vectorDatabase?.categories?.length || 0);
        console.log('      Active Connections:', status.metrics?.activeConnections || 0);
        console.log('      Total Requests:', status.metrics?.requests || 0);
        console.log('      Success Rate:', status.metrics?.responses ? 
          ((status.metrics.responses / status.metrics.requests) * 100).toFixed(1) + '%' : 'N/A');
      }
    } catch (error) {
      console.log('   ❌ System status failed:', error.message);
    }

    // Test 5: Inventory Optimization
    console.log('\n5. 📦 Testing Inventory Optimization...');
    const inventoryRequest = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'inventory_optimize',
        arguments: sampleData.inventoryOptimization
      },
      id: 4
    };

    try {
      const inventoryResponse = await axios.post(`${BASE_URL}/mcp`, inventoryRequest, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
      
      const result = inventoryResponse.data.result;
      if (result) {
        console.log('   ✅ Inventory Optimization Result:');
        console.log('      SKU:', result.sku);
        console.log('      Current Stock:', result.currentStock);
        console.log('      Recommended Order:', result.recommendedOrderQuantity);
        console.log('      Reorder Point:', result.reorderPoint);
        console.log('      Safety Stock:', result.safetyStock);
        console.log('      Cost Savings:', '$' + (result.potentialSavings || 0).toLocaleString());
      }
    } catch (error) {
      console.log('   ❌ Inventory optimization failed:', error.message);
    }

    // Test 6: API System Status
    console.log('\n6. 🔌 Testing API System Status...');
    const apiStatusRequest = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'get_api_system_status',
        arguments: { includeMetrics: true }
      },
      id: 5
    };

    try {
      const apiStatusResponse = await axios.post(`${BASE_URL}/mcp`, apiStatusRequest, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      const apiStatus = apiStatusResponse.data.result?.unifiedAPIInterface;
      if (apiStatus) {
        console.log('   ✅ API System Status:');
        console.log('      Status:', apiStatus.unifiedInterface?.status);
        console.log('      Total Services:', apiStatus.unifiedInterface?.totalServices);
        console.log('      Connected Services:', apiStatus.unifiedInterface?.connectedServices);
        console.log('      Healthy Services:', apiStatus.unifiedInterface?.healthyServices);
        console.log('      Total API Requests:', apiStatus.apiMetrics?.totalRequests || 0);
        console.log('      Success Rate:', apiStatus.apiMetrics?.totalRequests ? 
          ((apiStatus.apiMetrics.successfulRequests / apiStatus.apiMetrics.totalRequests) * 100).toFixed(1) + '%' : 'N/A');
        
        if (apiStatus.services) {
          console.log('      Services:');
          apiStatus.services.forEach(service => {
            console.log(`        - ${service.name}: ${service.status} (${service.capabilities.join(', ')})`);
          });
        }
      }
    } catch (error) {
      console.log('   ❌ API system status failed:', error.message);
    }

    console.log('\n🎉 AI Integration Test Suite Complete!');
    console.log('\n📊 SAMPLE DATA USED:');
    console.log('=====================================');
    console.log(JSON.stringify(sampleData, null, 2));

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Export sample data for reference
export { sampleData };

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMCPServer();
}

export default testMCPServer;