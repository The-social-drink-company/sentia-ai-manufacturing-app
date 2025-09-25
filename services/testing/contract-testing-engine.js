/**
 * Enterprise Contract Testing Engine - Consumer-Driven Contract Testing Framework
 * Implements Pact-based contract testing with automated schema validation,
 * API versioning compatibility, and consumer-provider interaction testing
 */

import fs from 'fs';
import path from 'path';
import { Pact } from '@pact-foundation/pact';
import { PactV3 } from '@pact-foundation/pact/v3';
import { MatchersV3 } from '@pact-foundation/pact/v3';
import EventEmitter from 'events';
import { execSync } from 'child_process';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


class ContractTestingEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Pact broker configuration
      pactBroker: {
        url: process.env.PACT_BROKER_URL || 'http://localhost:9292',
        username: process.env.PACT_BROKER_USERNAME,
        password: process.env.PACT_BROKER_PASSWORD,
        token: process.env.PACT_BROKER_TOKEN
      },
      
      // Contract testing configuration
      consumer: {
        name: 'sentia-dashboard-frontend',
        version: process.env.npm_package_version || '1.0.0'
      },
      
      providers: {
        'sentia-api-gateway': {
          port: 5000,
          host: 'localhost',
          version: '1.0.0'
        },
        'xero-api-service': {
          port: 5001,
          host: 'localhost',
          version: '1.0.0'
        },
        'shopify-integration': {
          port: 5002,
          host: 'localhost',
          version: '1.0.0'
        }
      },
      
      // Schema validation
      schemaValidation: {
        enabled: true,
        strictMode: true,
        allowAdditionalProperties: false
      },
      
      // API versioning
      versioning: {
        strategy: 'semantic', // semantic, date-based, or custom
        compatibilityMatrix: {
          major: 'breaking',
          minor: 'backward-compatible',
          patch: 'backward-compatible'
        }
      },
      
      // Test execution
      execution: {
        timeout: 30000,
        retries: 3,
        parallel: true,
        generateMocks: true
      },
      
      ...config
    };

    this.pactInstances = new Map();
    this.contractCache = new Map();
    this.testResults = new Map();
    this.schemaRegistry = new Map();
    
    this.initializeContractFramework();
  }

  async initializeContractFramework() {
    logDebug('🤝 INITIALIZING CONTRACT TESTING ENGINE');
    
    // Setup directories
    this.setupContractDirectories();
    
    // Initialize Pact instances for each provider
    await this.initializePactInstances();
    
    // Load existing contracts
    await this.loadExistingContracts();
    
    // Setup schema registry
    await this.initializeSchemaRegistry();
    
    logDebug('✅ Contract Testing Engine initialized successfully');
    this.emit('initialized');
  }

  setupContractDirectories() {
    const dirs = [
      'tests/contracts/pacts',
      'tests/contracts/schemas',
      'tests/contracts/mocks',
      'tests/contracts/reports',
      'logs/contract-testing'
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  async initializePactInstances() {
    for (const [providerName, providerConfig] of Object.entries(this.config.providers)) {
      const pact = new Pact({
        consumer: this.config.consumer.name,
        provider: providerName,
        port: providerConfig.port + 1000, // Mock server port
        log: path.join(process.cwd(), 'logs/contract-testing', `${providerName}-pact.log`),
        dir: path.join(process.cwd(), 'tests/contracts/pacts'),
        logLevel: 'INFO',
        spec: 2
      });

      this.pactInstances.set(providerName, pact);
    }
  }

  async loadExistingContracts() {
    const contractsDir = path.join(process.cwd(), 'tests/contracts/pacts');
    
    if (fs.existsSync(contractsDir)) {
      const contractFiles = fs.readdirSync(contractsDir)
        .filter(file => file.endsWith('.json'));

      for (const file of contractFiles) {
        try {
          const contractPath = path.join(contractsDir, file);
          const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
          this.contractCache.set(contract.provider.name, contract);
        } catch (error) {
          logWarn(`Failed to load contract ${file}: ${error.message}`);
        }
      }
    }

    logDebug(`📋 Loaded ${this.contractCache.size} existing contracts`);
  }

  async initializeSchemaRegistry() {
    // Initialize with common API schemas
    this.registerSchema('HealthCheckResponse', {
      type: 'object',
      required: ['status', 'timestamp'],
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy'] },
        timestamp: { type: 'string', format: 'date-time' },
        services: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              responseTime: { type: 'string' }
            }
          }
        }
      }
    });

    this.registerSchema('ApiErrorResponse', {
      type: 'object',
      required: ['error', 'code'],
      properties: {
        error: { type: 'string' },
        code: { type: 'string' },
        details: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    });

    this.registerSchema('PaginatedResponse', {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: { type: 'array' },
        meta: {
          type: 'object',
          required: ['total', 'page', 'limit'],
          properties: {
            total: { type: 'integer', minimum: 0 },
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1 },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' }
          }
        }
      }
    });

    logDebug('📚 Schema registry initialized with base schemas');
  }

  // Main contract testing methods
  async runConsumerTests(providerName, testSuites) {
    logDebug(`🧪 Running consumer contract tests for ${providerName}...`);
    
    const pact = this.pactInstances.get(providerName);
    if (!pact) {
      throw new Error(`No Pact instance found for provider: ${providerName}`);
    }

    const testResults = {
      provider: providerName,
      consumer: this.config.consumer.name,
      startTime: new Date().toISOString(),
      tests: [],
      summary: { passed: 0, failed: 0, skipped: 0 }
    };

    try {
      await pact.setup();

      for (const testSuite of testSuites) {
        const suiteResults = await this.executeConsumerTestSuite(pact, testSuite);
        testResults.tests.push(...suiteResults.tests);
        
        testResults.summary.passed += suiteResults.summary.passed;
        testResults.summary.failed += suiteResults.summary.failed;
        testResults.summary.skipped += suiteResults.summary.skipped;
      }

      await pact.finalize();
      
      testResults.endTime = new Date().toISOString();
      testResults.status = testResults.summary.failed > 0 ? 'failed' : 'passed';
      
      this.testResults.set(providerName, testResults);
      
      // Publish contracts to broker if all tests passed
      if (testResults.status === 'passed') {
        await this.publishContract(providerName);
      }

      logDebug(`✅ Consumer tests completed: ${testResults.summary.passed}/${testResults.tests.length} passed`);
      return testResults;

    } catch (error) {
      testResults.error = error.message;
      testResults.status = 'error';
      throw error;
    } finally {
      await pact.finalize();
    }
  }

  async executeConsumerTestSuite(pact, testSuite) {
    const results = {
      suite: testSuite.name,
      tests: [],
      summary: { passed: 0, failed: 0, skipped: 0 }
    };

    for (const test of testSuite.tests) {
      try {
        logDebug(`  🔬 ${test.description}`);
        
        // Setup interaction
        await pact.addInteraction({
          state: test.providerState || 'default state',
          uponReceiving: test.description,
          withRequest: {
            method: test.request.method,
            path: test.request.path,
            headers: test.request.headers || {},
            query: test.request.query || {},
            body: test.request.body
          },
          willRespondWith: {
            status: test.response.status,
            headers: test.response.headers || { 'Content-Type': 'application/json' },
            body: test.response.body
          }
        });

        // Execute test
        const testResult = await this.executeConsumerTest(test, pact.mockService.baseUrl);
        
        results.tests.push({
          ...test,
          result: testResult.passed ? 'passed' : 'failed',
          error: testResult.error,
          duration: testResult.duration,
          actualResponse: testResult.actualResponse
        });

        if (testResult.passed) {
          results.summary.passed++;
        } else {
          results.summary.failed++;
        }

      } catch (error) {
        results.tests.push({
          ...test,
          result: 'failed',
          error: error.message,
          duration: 0
        });
        results.summary.failed++;
      }
    }

    return results;
  }

  async executeConsumerTest(test, mockBaseUrl) {
    const startTime = Date.now();
    
    try {
      // Construct test URL
      const url = new URL(test.request.path, mockBaseUrl);
      if (test.request.query) {
        Object.entries(test.request.query).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
      }

      // Execute HTTP request
      const response = await fetch(url.toString(), {
        method: test.request.method,
        headers: test.request.headers || {},
        body: test.request.body ? JSON.stringify(test.request.body) : undefined,
        timeout: this.config.execution.timeout
      });

      const actualResponse = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.json().catch(() => null)
      };

      // Validate response
      const validationResult = await this.validateContractResponse(test, actualResponse);

      return {
        passed: validationResult.valid,
        error: validationResult.error,
        duration: Date.now() - startTime,
        actualResponse
      };

    } catch (error) {
      return {
        passed: false,
        error: error.message,
        duration: Date.now() - startTime,
        actualResponse: null
      };
    }
  }

  async validateContractResponse(test, actualResponse) {
    // Status code validation
    if (actualResponse.status !== test.response.status) {
      return {
        valid: false,
        error: `Status code mismatch: expected ${test.response.status}, got ${actualResponse.status}`
      };
    }

    // Schema validation if enabled
    if (this.config.schemaValidation.enabled && test.response.schema) {
      const schemaValidation = await this.validateResponseSchema(
        actualResponse.body,
        test.response.schema
      );
      
      if (!schemaValidation.valid) {
        return {
          valid: false,
          error: `Schema validation failed: ${schemaValidation.error}`
        };
      }
    }

    // Content validation
    if (test.response.body && actualResponse.body) {
      const contentValidation = this.validateResponseContent(
        actualResponse.body,
        test.response.body
      );
      
      if (!contentValidation.valid) {
        return {
          valid: false,
          error: `Content validation failed: ${contentValidation.error}`
        };
      }
    }

    return { valid: true };
  }

  async validateResponseSchema(data, schemaName) {
    const schema = this.schemaRegistry.get(schemaName);
    if (!schema) {
      return { valid: false, error: `Schema not found: ${schemaName}` };
    }

    // Use Ajv for JSON schema validation
    const Ajv = (await import('ajv')).default;
    const ajv = new Ajv({ strict: false });
    
    const validate = ajv.compile(schema);
    const valid = validate(data);

    return {
      valid,
      error: valid ? null : ajv.errorsText(validate.errors)
    };
  }

  validateResponseContent(actual, expected) {
    // Deep comparison with matcher support
    try {
      this.deepCompare(actual, expected);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  deepCompare(actual, expected, path = '') {
    if (typeof expected === 'object' && expected !== null) {
      // Handle Pact matchers
      if (expected.pact_matcher) {
        return this.validatePactMatcher(actual, expected, path);
      }

      if (Array.isArray(expected)) {
        if (!Array.isArray(actual)) {
          throw new Error(`${path}: Expected array, got ${typeof actual}`);
        }
        
        expected.forEach((expectedItem, index) => {
          if (actual[index] === undefined) {
            throw new Error(`${path}[${index}]: Missing array element`);
          }
          this.deepCompare(actual[index], expectedItem, `${path}[${index}]`);
        });
      } else {
        Object.entries(expected).forEach(([key, value]) => {
          if (actual[key] === undefined) {
            throw new Error(`${path}.${key}: Missing property`);
          }
          this.deepCompare(actual[key], value, `${path}.${key}`);
        });
      }
    } else if (actual !== expected) {
      throw new Error(`${path}: Expected ${expected}, got ${actual}`);
    }
  }

  validatePactMatcher(actual, matcher, path) {
    switch (matcher.pact_matcher) {
      case 'type':
        if (typeof actual !== matcher.type) {
          throw new Error(`${path}: Expected type ${matcher.type}, got ${typeof actual}`);
        }
        break;
        
      case 'regex':
        if (!new RegExp(matcher.regex).test(actual)) {
          throw new Error(`${path}: Value ${actual} does not match pattern ${matcher.regex}`);
        }
        break;
        
      case 'integer':
        if (!Number.isInteger(actual)) {
          throw new Error(`${path}: Expected integer, got ${actual}`);
        }
        break;
        
      default:
        logWarn(`Unknown Pact matcher: ${matcher.pact_matcher}`);
    }
  }

  // Provider testing
  async runProviderTests(providerName, options = {}) {
    logDebug(`🔍 Running provider contract tests for ${providerName}...`);
    
    const providerConfig = this.config.providers[providerName];
    if (!providerConfig) {
      throw new Error(`Provider configuration not found: ${providerName}`);
    }

    const opts = {
      provider: providerName,
      providerBaseUrl: `http://${providerConfig.host}:${providerConfig.port}`,
      pactUrls: [
        path.join(process.cwd(), 'tests/contracts/pacts', `${this.config.consumer.name}-${providerName}.json`)
      ],
      publishVerificationResult: true,
      providerVersion: providerConfig.version,
      ...options
    };

    try {
      const { verifyPacts } = await import('@pact-foundation/pact');
      const result = await verifyPacts(opts);
      
      logDebug(`✅ Provider verification completed for ${providerName}`);
      return result;
      
    } catch (error) {
      logError(`❌ Provider verification failed for ${providerName}: ${error.message}`);
      throw error;
    }
  }

  // Contract publishing
  async publishContract(providerName) {
    if (!this.config.pactBroker.url) {
      logWarn('Pact Broker URL not configured, skipping contract publishing');
      return;
    }

    logDebug(`📤 Publishing contract for ${providerName}...`);
    
    const contractFile = path.join(
      process.cwd(), 
      'tests/contracts/pacts',
      `${this.config.consumer.name}-${providerName}.json`
    );

    if (!fs.existsSync(contractFile)) {
      logWarn(`Contract file not found: ${contractFile}`);
      return;
    }

    try {
      const { Publisher } = await import('@pact-foundation/pact-node');
      
      const publisher = new Publisher({
        pactFilesOrDirs: [contractFile],
        pactBroker: this.config.pactBroker.url,
        pactBrokerUsername: this.config.pactBroker.username,
        pactBrokerPassword: this.config.pactBroker.password,
        pactBrokerToken: this.config.pactBroker.token,
        consumerVersion: this.config.consumer.version
      });

      await publisher.publishPacts();
      logDebug(`✅ Contract published successfully for ${providerName}`);
      
    } catch (error) {
      logError(`Failed to publish contract: ${error.message}`);
      throw error;
    }
  }

  // API Versioning and Compatibility
  async checkApiCompatibility(providerName, newVersion, oldVersion) {
    logDebug(`🔄 Checking API compatibility: ${oldVersion} → ${newVersion}`);
    
    const compatibility = await this.analyzeVersionCompatibility(newVersion, oldVersion);
    
    const result = {
      provider: providerName,
      oldVersion,
      newVersion,
      compatibility: compatibility.level,
      breakingChanges: compatibility.breakingChanges,
      deprecations: compatibility.deprecations,
      additions: compatibility.additions,
      timestamp: new Date().toISOString()
    };

    // Save compatibility report
    const reportPath = path.join(
      process.cwd(),
      'tests/contracts/reports',
      `compatibility-${providerName}-${newVersion}.json`
    );
    
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    
    logDebug(`📊 Compatibility analysis: ${compatibility.level}`);
    return result;
  }

  analyzeVersionCompatibility(newVersion, oldVersion) {
    // Implement semantic versioning compatibility logic
    const newParts = newVersion.split('.').map(Number);
    const oldParts = oldVersion.split('.').map(Number);
    
    let level = 'patch';
    const breakingChanges = [];
    const deprecations = [];
    const additions = [];

    if (newParts[0] > oldParts[0]) {
      level = 'major';
      breakingChanges.push('Major version increment indicates breaking changes');
    } else if (newParts[1] > oldParts[1]) {
      level = 'minor';
      additions.push('Minor version increment indicates new features');
    }

    return {
      level,
      breakingChanges,
      deprecations,
      additions,
      compatible: level !== 'major'
    };
  }

  // Schema management
  registerSchema(name, schema) {
    this.schemaRegistry.set(name, schema);
    logDebug(`📋 Registered schema: ${name}`);
  }

  getSchema(name) {
    return this.schemaRegistry.get(name);
  }

  // Mock service generation
  async generateMockServices() {
    logDebug('🎭 Generating mock services from contracts...');
    
    const mockServices = new Map();
    
    for (const [providerName, contract] of this.contractCache) {
      const mockService = await this.createMockService(providerName, contract);
      mockServices.set(providerName, mockService);
    }

    // Save mock configurations
    const mockConfig = Object.fromEntries(mockServices);
    fs.writeFileSync(
      path.join(process.cwd(), 'tests/contracts/mocks/mock-services.json'),
      JSON.stringify(mockConfig, null, 2)
    );

    logDebug(`🎭 Generated ${mockServices.size} mock services`);
    return mockServices;
  }

  async createMockService(providerName, contract) {
    const mockEndpoints = contract.interactions.map(interaction => ({
      method: interaction.request.method,
      path: interaction.request.path,
      response: {
        status: interaction.response.status,
        headers: interaction.response.headers,
        body: interaction.response.body
      },
      providerState: interaction.providerState
    }));

    return {
      provider: providerName,
      consumer: contract.consumer.name,
      endpoints: mockEndpoints,
      baseUrl: `http://localhost:${this.config.providers[providerName].port + 1000}`
    };
  }

  // Reporting and analytics
  generateContractReport() {
    const report = {
      timestamp: new Date().toISOString(),
      consumer: this.config.consumer,
      providers: Object.keys(this.config.providers),
      contracts: this.contractCache.size,
      schemas: this.schemaRegistry.size,
      testResults: Object.fromEntries(this.testResults),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        coverage: 0
      }
    };

    // Calculate summary statistics
    for (const [, results] of this.testResults) {
      report.summary.totalTests += results.tests.length;
      report.summary.passedTests += results.summary.passed;
      report.summary.failedTests += results.summary.failed;
    }

    if (report.summary.totalTests > 0) {
      report.summary.coverage = (report.summary.passedTests / report.summary.totalTests) * 100;
    }

    // Save report
    const reportPath = path.join(
      process.cwd(),
      'tests/contracts/reports',
      `contract-report-${Date.now()}.json`
    );
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  // Integration with autonomous testing system
  async integrateWithAutonomousSystem() {
    logDebug('🔗 Integrating contract testing with autonomous system...');
    
    // Register contract test scenarios with the autonomous test suite
    const contractScenarios = await this.generateAutonomousTestScenarios();
    
    // Save scenarios for autonomous system integration
    fs.writeFileSync(
      path.join(process.cwd(), 'tests/autonomous/contract-test-scenarios.json'),
      JSON.stringify(contractScenarios, null, 2)
    );

    logDebug(`📋 Generated ${contractScenarios.length} autonomous contract test scenarios`);
    return contractScenarios;
  }

  async generateAutonomousTestScenarios() {
    const scenarios = [];
    
    for (const [providerName] of this.config.providers) {
      scenarios.push({
        name: `CONTRACT_TESTING_${providerName.toUpperCase()}`,
        type: 'contract',
        provider: providerName,
        priority: 'high',
        timeout: 30000,
        retries: 2,
        execution: async () => {
          return await this.runConsumerTests(providerName, this.getDefaultTestSuites(providerName));
        }
      });
    }

    return scenarios;
  }

  getDefaultTestSuites(providerName) {
    // Generate default test suites based on provider configuration
    return [
      {
        name: `${providerName}_health_check`,
        tests: [{
          description: 'Health check endpoint returns healthy status',
          providerState: 'service is healthy',
          request: {
            method: 'GET',
            path: '/api/health',
            headers: { 'Accept': 'application/json' }
          },
          response: {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
              status: { pact_matcher: 'type', type: 'string' },
              timestamp: { pact_matcher: 'regex', regex: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}' }
            },
            schema: 'HealthCheckResponse'
          }
        }]
      }
    ];
  }

  // Public API methods
  getContractStatus() {
    return {
      initialized: this.pactInstances.size > 0,
      providers: Object.keys(this.config.providers),
      contracts: this.contractCache.size,
      schemas: this.schemaRegistry.size,
      testResults: this.testResults.size
    };
  }

  async runAllContractTests() {
    logDebug('🚀 Running all contract tests...');
    
    const results = new Map();
    
    for (const providerName of Object.keys(this.config.providers)) {
      try {
        const testSuites = this.getDefaultTestSuites(providerName);
        const result = await this.runConsumerTests(providerName, testSuites);
        results.set(providerName, result);
      } catch (error) {
        results.set(providerName, {
          provider: providerName,
          status: 'error',
          error: error.message
        });
      }
    }

    return results;
  }
}

export default ContractTestingEngine;
export { ContractTestingEngine };