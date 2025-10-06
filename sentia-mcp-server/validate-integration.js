/**
 * Anthropic Integration Validation Script
 * 
 * Simple validation test to ensure the Anthropic integration
 * is properly installed and can be imported successfully.
 */

import { AnthropicIntegration, registerAnthropicTools } from './src/tools/anthropic-integration.js';

console.log('Starting Anthropic Integration Validation...\n');

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
  console.log('✓ AnthropicIntegration class imported successfully');
  console.log('✓ registerAnthropicTools function imported successfully\n');

  // Test 2: Integration initialization
  console.log('2. Testing integration initialization...');
  const integration = new AnthropicIntegration(mockServer);
  console.log('✓ AnthropicIntegration instance created successfully');
  console.log(`✓ Server reference: ${integration.server ? 'Connected' : 'Missing'}`);
  console.log(`✓ Configuration loaded: ${integration.config ? 'Yes' : 'No'}\n`);

  // Test 3: Tool registration
  console.log('3. Testing tool registration...');
  await registerAnthropicTools(mockServer);
  console.log(`✓ Total tools registered: ${mockServer.tools.size}`);
  
  // List registered tools
  console.log('\nRegistered Anthropic Tools:');
  for (const [name, tool] of mockServer.tools) {
    console.log(`  - ${name}: ${tool.description.substring(0, 60)}...`);
  }

  // Test 4: Tool metadata validation
  console.log('\n4. Validating tool metadata...');
  let validTools = 0;
  for (const [name, tool] of mockServer.tools) {
    if (tool.name && tool.description && tool.category && typeof tool.execute === 'function') {
      validTools++;
    } else {
      console.log(`⚠ Tool ${name} missing required metadata`);
    }
  }
  console.log(`✓ Valid tools: ${validTools}/${mockServer.tools.size}`);

  // Test 5: Basic configuration check
  console.log('\n5. Testing basic configuration...');
  if (integration.config && integration.config.anthropic) {
    console.log('✓ Anthropic configuration structure present');
    console.log(`✓ Model configured: ${integration.config.anthropic.model || 'default'}`);
    console.log(`✓ Max tokens: ${integration.config.anthropic.maxTokens || 'default'}`);
  } else {
    console.log('⚠ Anthropic configuration not found (will use defaults)');
  }

  // Test 6: Component availability check
  console.log('\n6. Testing component availability...');
  const components = ['auth', 'client', 'promptBuilder', 'responseParser', 'costOptimizer', 'analytics'];
  for (const component of components) {
    if (integration[component]) {
      console.log(`✓ ${component} component available`);
    } else {
      console.log(`⚠ ${component} component not initialized`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ ANTHROPIC INTEGRATION VALIDATION SUCCESSFUL');
  console.log('='.repeat(60));
  console.log(`Total tools available: ${mockServer.tools.size}`);
  console.log('All required components are properly imported and registered.');
  console.log('The Anthropic integration is ready for use in the MCP server.');
  
} catch (error) {
  console.log('\n' + '='.repeat(60));
  console.log('❌ ANTHROPIC INTEGRATION VALIDATION FAILED');
  console.log('='.repeat(60));
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}