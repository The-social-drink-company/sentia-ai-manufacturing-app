# MCP Server Testing Guide

## Comprehensive Testing Infrastructure for Sentia MCP Server

This document provides a complete guide to the testing infrastructure implemented for the Sentia Manufacturing MCP Server, including quality gates, coverage reporting, and performance benchmarking.

## 🧪 Testing Overview

The MCP server includes a comprehensive testing suite covering:

- **Unit Tests**: Individual component testing
- **Integration Tests**: Database and external service integration
- **End-to-End Tests**: Complete workflow testing
- **Security Tests**: Authentication, authorization, and vulnerability detection
- **Performance Tests**: Memory leak detection, stress testing, and benchmarking
- **Quality Gates**: Automated quality assurance and coverage thresholds

## 📊 Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── tools/              # API tool tests (Xero, Shopify, Amazon, etc.)
│   ├── utils/              # Utility function tests
│   └── middleware/         # Middleware tests
├── integration/            # Integration tests
│   ├── database/           # Database integration tests
│   └── external-services/  # External API integration tests
├── e2e/                    # End-to-end workflow tests
│   ├── manufacturing-workflows.test.js
│   └── api-integrations.test.js
├── security/               # Security testing
│   ├── authentication.test.js
│   ├── authorization.test.js
│   └── vulnerability-detection.test.js
├── performance/            # Performance testing
│   ├── memory-leak-detection.test.js
│   ├── stress-testing.test.js
│   ├── benchmark.test.js
│   └── load-test.js
├── fixtures/               # Test data and mocks
│   ├── manufacturing-data.js
│   └── api-responses.js
├── utils/                  # Test utilities
│   ├── custom-matchers.js
│   └── test-data-generators.js
└── setup/                  # Test setup and configuration
    ├── coverage-setup.js
    └── global-coverage-setup.js
```

## 🚀 Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:security
npm run test:performance

# Run all test suites
npm run test:all

# Watch mode for development
npm run test:watch
```

### Coverage Commands

```bash
# Run comprehensive coverage analysis
npm run coverage

# Run coverage for specific test suites
npm run coverage:unit
npm run coverage:integration
npm run coverage:e2e
npm run coverage:security
npm run coverage:performance

# Generate coverage report with dashboard
npm run coverage:report

# Run quality gates validation
npm run quality-gates
```

## 📈 Coverage & Quality Gates

### Coverage Thresholds

The testing infrastructure enforces strict coverage thresholds:

#### Global Thresholds
- **Lines**: 90%
- **Functions**: 85%
- **Branches**: 80%
- **Statements**: 90%

#### Critical File Thresholds
- **Server Core** (`src/server.js`): 95% lines, 90% functions
- **API Tools** (`src/tools/`): 88% lines, 85% functions
- **Utilities** (`src/utils/`): 92% lines, 88% functions
- **Middleware** (`src/middleware/`): 90% lines, 85% functions

### Quality Gates

Quality gates automatically validate:

1. **Coverage Metrics**: All thresholds must be met
2. **Test Success Rate**: 100% test suite success required
3. **Performance Benchmarks**: Response time and memory usage limits
4. **Security Standards**: No security test failures allowed
5. **Code Quality**: Complexity and duplication limits

## 🔍 Test Categories

### 1. Unit Tests

Test individual components in isolation:

```bash
# Run specific unit test categories
npm run test:unit -- tests/unit/tools/xero
npm run test:unit -- tests/unit/utils
npm run test:unit -- tests/unit/middleware
```

**Coverage**: Tests for 60+ MCP tools across 6 major integrations:
- Xero Financial API (15+ tools)
- Shopify E-commerce API (12+ tools)
- Amazon SP-API (10+ tools)
- Anthropic AI API (8+ tools)
- OpenAI API (8+ tools)
- Unleashed ERP API (10+ tools)

### 2. Integration Tests

Test component interactions and external dependencies:

```bash
npm run test:integration
```

**Includes**:
- Database operations and transactions
- External API integrations
- Cache and session management
- Error handling and recovery

### 3. End-to-End Tests

Test complete business workflows:

```bash
npm run test:e2e
```

**Workflows Tested**:
- Order fulfillment (Shopify → Inventory → Fulfillment)
- Financial reporting (Xero → Analysis → Reports)
- Manufacturing planning (Demand → Production → Quality)
- Supply chain optimization (Inventory → Procurement → Delivery)

### 4. Security Tests

Comprehensive security validation:

```bash
npm run test:security
```

**Security Areas**:
- **Authentication**: JWT tokens, API keys, session management
- **Authorization**: RBAC, ABAC, resource-level permissions
- **Vulnerability Detection**: XSS, SQL injection, CSRF, path traversal
- **Input Validation**: Data sanitization and security headers

### 5. Performance Tests

Performance and reliability validation:

```bash
npm run test:performance
```

**Performance Areas**:
- **Memory Leak Detection**: Tool execution, database connections, HTTP requests
- **Stress Testing**: High concurrency, resource exhaustion, error recovery
- **Benchmarking**: API response times, throughput, resource usage
- **Load Testing**: Sustained load, burst patterns, scalability

## 🛠️ Test Utilities

### Custom Matchers

The testing infrastructure includes manufacturing-specific matchers:

```javascript
// Manufacturing data validation
expect(order).toBeValidManufacturingOrder();
expect(product).toBeValidProductSpecification();
expect(qualityRecord).toBeValidQualityRecord();

// API response validation
expect(response).toBeValidMcpToolResponse();
expect(xeroData).toBeValidXeroResponse();
expect(shopifyData).toBeValidShopifyResponse();

// Performance validation
expect(responseTime).toRespondWithin(1000);
expect(memoryUsage).toUseMemoryWithin(100 * 1024 * 1024);

// Security validation
expect(token).toBeSecureToken();
expect(input).toBeSanitizedInput();
```

### Test Data Generators

Realistic test data generation:

```javascript
import { 
  generateManufacturingCompany,
  generateProduct,
  generateOrder,
  generateQualityRecord 
} from './tests/utils/test-data-generators.js';

// Generate realistic manufacturing test data
const company = generateManufacturingCompany();
const product = generateProduct({ category: 'electronics' });
const order = generateOrder({ productCount: 5 });
```

### Mock Data & Fixtures

Comprehensive mock data for external APIs:

- **Manufacturing Data**: Companies, products, orders, inventory
- **API Responses**: Complete mock responses for all external services
- **Error Scenarios**: Various error conditions and edge cases

## 📊 Coverage Reports

### Generated Reports

The coverage system generates multiple report formats:

1. **HTML Dashboard**: Interactive coverage dashboard (`coverage/reports/dashboard.html`)
2. **JSON Report**: Detailed coverage data (`coverage/coverage.json`)
3. **LCOV Report**: Standard LCOV format (`coverage/lcov.info`)
4. **Cobertura XML**: CI/CD compatible format (`coverage/cobertura.xml`)
5. **Quality Gates Report**: Detailed quality assessment (`coverage/quality-gates-report.json`)

### Coverage Dashboard Features

The HTML dashboard includes:
- Overall coverage metrics with visual indicators
- File-level coverage details with progress bars
- Test suite performance charts
- Coverage trends over time
- Quality gate status and violations
- Interactive charts and metrics

## 🎯 Quality Assurance

### Automated Quality Checks

Every test run validates:

1. **Code Coverage**: Meets all threshold requirements
2. **Test Success**: All tests must pass
3. **Performance**: Response times within limits
4. **Security**: No security vulnerabilities
5. **Memory Usage**: No memory leaks detected
6. **API Integration**: All external services working

### Quality Gate Violations

If quality gates fail, the system provides:
- Detailed violation reports
- Specific remediation recommendations
- Performance impact analysis
- Security risk assessment

## 🚨 CI/CD Integration

### GitHub Actions Integration

The testing infrastructure integrates with CI/CD pipelines:

```yaml
- name: Run Comprehensive Tests
  run: npm run test:all

- name: Generate Coverage Report
  run: npm run coverage

- name: Validate Quality Gates
  run: npm run quality-gates

- name: Upload Coverage Reports
  uses: actions/upload-artifact@v3
  with:
    name: coverage-reports
    path: coverage/
```

### Build Pipeline Integration

- **Pull Request Checks**: Run full test suite on PRs
- **Coverage Reporting**: Upload coverage to external services
- **Quality Gates**: Fail builds that don't meet quality standards
- **Performance Monitoring**: Track performance trends over time

## 🔧 Configuration

### Vitest Configuration

Multiple specialized configurations:

- `vitest.config.js`: Base configuration
- `vitest.unit.config.js`: Unit test configuration
- `vitest.integration.config.js`: Integration test configuration
- `vitest.security.config.js`: Security test configuration
- `vitest.coverage.config.js`: Coverage collection configuration

### Environment Variables

Test-specific environment variables:

```bash
NODE_ENV=test
COVERAGE_MODE=true
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_SECURITY_TESTING=true
```

## 📚 Best Practices

### Writing Tests

1. **Isolation**: Each test should be independent
2. **Realistic Data**: Use test data generators for realistic scenarios
3. **Error Handling**: Test both success and failure cases
4. **Performance**: Include performance assertions where relevant
5. **Security**: Validate security aspects in all tests

### Maintaining Tests

1. **Regular Updates**: Keep tests updated with code changes
2. **Coverage Monitoring**: Monitor coverage trends over time
3. **Performance Baseline**: Establish and maintain performance baselines
4. **Security Updates**: Update security tests with new threats

### Debugging Tests

1. **Verbose Mode**: Use `--verbose` flag for detailed output
2. **Test Isolation**: Run individual tests to isolate issues
3. **Coverage Reports**: Use coverage reports to identify gaps
4. **Performance Profiling**: Use performance tests to identify bottlenecks

## 📖 Advanced Features

### Memory Leak Detection

Automated detection of:
- Tool execution memory leaks
- Database connection leaks
- HTTP request memory accumulation
- Event listener cleanup issues

### Security Testing

Comprehensive security validation:
- Authentication bypass attempts
- Authorization escalation testing
- Input validation and sanitization
- Vulnerability scanning and reporting

### Performance Benchmarking

Systematic performance measurement:
- API response time benchmarking
- Database query performance
- Memory usage optimization
- Concurrent operation handling

## 🎉 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Basic Tests**:
   ```bash
   npm test
   ```

3. **Generate Coverage Report**:
   ```bash
   npm run coverage:report
   ```

4. **Open Coverage Dashboard**:
   ```bash
   # Dashboard available at: coverage/reports/dashboard.html
   ```

5. **Validate Quality Gates**:
   ```bash
   npm run quality-gates
   ```

## 🔗 Related Documentation

- [MCP Server Setup Guide](./MCP_SERVER_SETUP.md)
- [API Documentation](./docs/api/)
- [Security Guidelines](./docs/security/)
- [Performance Optimization](./docs/performance/)

---

This comprehensive testing infrastructure ensures the Sentia MCP Server maintains high quality, security, and performance standards throughout development and deployment.