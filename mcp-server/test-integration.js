/**
 * MCP Server Integration Test
 * Test all API endpoints and providers
 */

import fetch from 'node-fetch';

const TEST_ENVIRONMENTS = {
  local: 'http://localhost:3000',
  development: 'https://dev-sentia-mcp-server.railway.app',
  test: 'https://test-sentia-mcp-server.railway.app',
  production: 'https://sentia-mcp-server.railway.app'
};

// Get environment from command line argument
const environment = process.argv[2] || 'local';
const BASE_URL = TEST_ENVIRONMENTS[environment];

if (!BASE_URL) {
  console.error(`Invalid environment: ${environment}`);
  console.log('Available environments:', Object.keys(TEST_ENVIRONMENTS).join(', '));
  process.exit(1);
}

console.log(`Testing MCP Server at: ${BASE_URL}`);
console.log('=====================================\n');

const tests = {
  // Health check
  async testHealth() {
    console.log('Testing: Health Check');
    try {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();
      
      if (response.ok && data.status === 'healthy') {
        console.log('✓ Health check passed');
        console.log(`  Environment: ${data.environment}`);
        console.log(`  Version: ${data.version}`);
        return true;
      } else {
        console.log('✗ Health check failed');
        console.log(`  Status: ${data.status}`);
        return false;
      }
    } catch (error) {
      console.log('✗ Health check error:', error.message);
      return false;
    }
  },

  // Provider status
  async testProviders() {
    console.log('\nTesting: Provider Status');
    try {
      const response = await fetch(`${BASE_URL}/api/providers`);
      const data = await response.json();
      
      if (response.ok && data.providers) {
        console.log('✓ Provider endpoint accessible');
        data.providers.forEach(provider => {
          const status = provider.status === 'connected' ? '✓' : '✗';
          console.log(`  ${status} ${provider.name}: ${provider.status}`);
        });
        return true;
      } else {
        console.log('✗ Provider endpoint failed');
        return false;
      }
    } catch (error) {
      console.log('✗ Provider endpoint error:', error.message);
      return false;
    }
  },

  // Xero contacts (GET)
  async testXeroContacts() {
    console.log('\nTesting: Xero Contacts (GET)');
    try {
      const response = await fetch(`${BASE_URL}/api/xero/contacts?page=1&pageSize=5`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✓ Xero contacts endpoint accessible');
        console.log(`  Total contacts: ${data.total || 0}`);
        return true;
      } else {
        console.log('✗ Xero contacts failed');
        console.log(`  Error: ${data.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.log('✗ Xero contacts error:', error.message);
      return false;
    }
  },

  // OpenAI text generation (POST)
  async testOpenAI() {
    console.log('\nTesting: OpenAI Text Generation');
    try {
      const response = await fetch(`${BASE_URL}/api/openai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Say "Hello, MCP Server test successful!" in exactly 5 words.',
          temperature: 0.7,
          max_tokens: 20
        })
      });
      const data = await response.json();
      
      if (response.ok && data.text) {
        console.log('✓ OpenAI generation successful');
        console.log(`  Response: ${data.text.substring(0, 50)}...`);
        return true;
      } else {
        console.log('✗ OpenAI generation failed');
        console.log(`  Error: ${data.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.log('✗ OpenAI generation error:', error.message);
      return false;
    }
  },

  // Anthropic insights (POST)
  async testAnthropic() {
    console.log('\nTesting: Anthropic Insights');
    try {
      const response = await fetch(`${BASE_URL}/api/anthropic/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            type: 'manufacturing',
            data: {
              production_rate: 100,
              defect_rate: 0.02,
              efficiency: 0.85
            }
          }
        })
      });
      const data = await response.json();
      
      if (response.ok && data.insights) {
        console.log('✓ Anthropic insights successful');
        console.log(`  Insights generated: ${data.insights.length || 0}`);
        return true;
      } else {
        console.log('✗ Anthropic insights failed');
        console.log(`  Error: ${data.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.log('✗ Anthropic insights error:', error.message);
      return false;
    }
  }
};

// Run all tests
async function runTests() {
  console.log('Starting MCP Server Integration Tests');
  console.log('=====================================\n');
  
  const results = [];
  
  for (const [name, test] of Object.entries(tests)) {
    const passed = await test();
    results.push({ name, passed });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between tests
  }
  
  // Summary
  console.log('\n=====================================');
  console.log('Test Summary');
  console.log('=====================================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${result.name}`);
  });
  
  console.log(`\nTotal: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n✓ All tests passed successfully!');
    process.exit(0);
  } else {
    console.log(`\n✗ ${total - passed} test(s) failed`);
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

// Run tests
runTests();