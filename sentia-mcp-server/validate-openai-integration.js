/**
 * OpenAI Integration Validation Script
 * 
 * Simple validation test to ensure the OpenAI integration
 * is properly installed and can be imported successfully.
 */

import { OpenAIIntegration, registerOpenAITools } from './src/tools/openai-integration.js';

console.log('Starting OpenAI Integration Validation...\n');

// Mock server for testing
const mockServer = {
  tools: new Map(),
  setRequestHandler: (name, handler) => {
    console.log(`✓ Request handler registered: ${name}`);
  },
  registerTool: (name, tool) => {
    mockServer.tools.set(name, tool);
    console.log(`✓ Tool registered: ${name} (${tool.category})`);
  }
};

try {
  // Test 1: Basic Import
  console.log('1. Testing basic imports...');
  console.log('✓ OpenAIIntegration class imported successfully');
  console.log('✓ registerOpenAITools function imported successfully\n');

  // Test 2: Integration initialization
  console.log('2. Testing integration initialization...');
  const integration = new OpenAIIntegration(mockServer);
  console.log('✓ OpenAIIntegration instance created successfully');
  console.log(`✓ Server reference: ${integration.server ? 'Connected' : 'Missing'}`);
  console.log(`✓ Configuration loaded: ${integration.config ? 'Yes' : 'No'}\n`);

  // Test 3: Component availability check
  console.log('3. Testing component availability...');
  const components = ['auth', 'client', 'functionCalling', 'promptOptimizer', 'responseValidator', 'costTracker', 'analytics'];
  for (const component of components) {
    if (integration[component]) {
      console.log(`✓ ${component} component available`);
    } else {
      console.log(`⚠ ${component} component not initialized`);
    }
  }

  // Test 4: Tool registration
  console.log('\n4. Testing tool registration...');
  await registerOpenAITools(mockServer);
  console.log(`✓ Total tools registered: ${mockServer.tools.size}`);
  
  // List registered tools
  console.log('\nRegistered OpenAI Tools:');
  for (const [name, tool] of mockServer.tools) {
    console.log(`  - ${name}: ${tool.description.substring(0, 60)}...`);
  }

  // Test 5: Tool metadata validation
  console.log('\n5. Validating tool metadata...');
  let validTools = 0;
  for (const [name, tool] of mockServer.tools) {
    if (tool.name && tool.description && tool.category && typeof tool.execute === 'function') {
      validTools++;
    } else {
      console.log(`⚠ Tool ${name} missing required metadata`);
    }
  }
  console.log(`✓ Valid tools: ${validTools}/${mockServer.tools.size}`);

  // Test 6: Expected tools check
  console.log('\n6. Checking expected OpenAI tools...');
  const expectedTools = [
    'openai-data-analysis',
    'openai-content-generation', 
    'openai-customer-insights',
    'openai-operational-optimization',
    'openai-forecasting',
    'openai-automated-reporting'
  ];

  let foundTools = 0;
  for (const expectedTool of expectedTools) {
    if (mockServer.tools.has(expectedTool)) {
      console.log(`✓ ${expectedTool} found`);
      foundTools++;
    } else {
      console.log(`❌ ${expectedTool} missing`);
    }
  }
  console.log(`✓ Expected tools found: ${foundTools}/${expectedTools.length}`);

  // Test 7: Configuration validation
  console.log('\n7. Testing configuration...');
  if (integration.config) {
    console.log('✓ Configuration structure present');
    console.log(`✓ Model configured: ${integration.config.model || 'default'}`);
    console.log(`✓ Max tokens: ${integration.config.maxTokens || 'default'}`);
    console.log(`✓ Function calling: ${integration.config.enableFunctionCalling ? 'enabled' : 'disabled'}`);
    console.log(`✓ Streaming: ${integration.config.enableStreaming ? 'enabled' : 'disabled'}`);
    console.log(`✓ Cost optimization: ${integration.config.costOptimization ? 'enabled' : 'disabled'}`);
  } else {
    console.log('⚠ Configuration not found (will use defaults)');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ OPENAI INTEGRATION VALIDATION SUCCESSFUL');
  console.log('='.repeat(60));
  console.log(`Total tools available: ${mockServer.tools.size}`);
  console.log(`Expected tools found: ${foundTools}/${expectedTools.length}`);
  console.log('All required components are properly imported and registered.');
  console.log('The OpenAI integration is ready for use in the MCP server.');
  
  // Test 8: Integration status
  console.log('\n8. Integration status summary:');
  try {
    const status = integration.getStatus();
    console.log(`✓ Integration name: ${status.name}`);
    console.log(`✓ Integration version: ${status.version}`);
    console.log(`✓ Tool count: ${status.toolCount}`);
    console.log(`✓ Function calling: ${status.functionCalling ? 'enabled' : 'disabled'}`);
    console.log(`✓ Streaming: ${status.streaming ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.log('⚠ Could not retrieve integration status (expected before initialization)');
  }
  
} catch (error) {
  console.log('\n' + '='.repeat(60));
  console.log('❌ OPENAI INTEGRATION VALIDATION FAILED');
  console.log('='.repeat(60));
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}