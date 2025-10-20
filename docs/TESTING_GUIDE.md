# CapLiquify Manufacturing Platform - Testing Guide

## Overview

This document provides comprehensive guidance on testing the CapLiquify Manufacturing Platform. It covers testing strategies, procedures, tools, and best practices used to ensure the system meets all functional and non-functional requirements.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Pyramid Structure](#test-pyramid-structure)
3. [Testing Types](#testing-types)
4. [Running Tests](#running-tests)
5. [Test Environment Setup](#test-environment-setup)
6. [Writing Tests](#writing-tests)
7. [Continuous Integration](#continuous-integration)
8. [Performance Testing](#performance-testing)
9. [Security Testing](#security-testing)
10. [User Acceptance Testing](#user-acceptance-testing)
11. [Quality Metrics](#quality-metrics)
12. [Troubleshooting](#troubleshooting)

## Testing Philosophy

Our testing approach follows these core principles:

- **Quality First**: Every feature must have corresponding tests before being merged
- **Shift Left**: Testing is integrated early in the development process
- **Risk-Based**: Testing effort is prioritized based on business risk and impact
- **Automated by Default**: All tests should be automated unless specifically requiring human judgment
- **Continuous Feedback**: Tests provide immediate feedback to developers and stakeholders

## Test Pyramid Structure

```
    /\
   /  \     E2E Tests (Few)
  /    \    - User acceptance scenarios
 /      \   - End-to-end workflows
/________\  - Browser automation

/\      /\  Integration Tests (Some)
  \    /    - API integration tests
   \  /     - Database integration tests
    \/      - External service integration

/________\  Unit Tests (Many)
          - Business logic tests
          - Model tests  
          - Service tests
          - Utility function tests
```

## Testing Types

### 1. Unit Tests

**Purpose**: Test individual components in isolation
**Location**: `tests/unit/`
**Framework**: pytest
**Coverage Target**: >90%

#### Key Test Categories:
- **Authentication System** (`test_auth_system.py`)
  - User registration/login
  - Password management
  - Session handling
  - Security controls

- **Business Logic** (`test_business_logic.py`)
  - Forecasting algorithms
  - Stock optimization
  - Constraint solving
  - Financial calculations

- **Data Validation** (`test_data_validation.py`)
  - Input validation
  - Data integrity checks
  - Business rule enforcement

- **Models** (`test_models.py`)
  - Database model functionality
  - Relationships and constraints
  - Model methods and properties

- **Services** (`test_services.py`)
  - Service layer logic
  - External API clients
  - Data processing services

- **API Routes** (`test_api_routes.py`)
  - HTTP endpoint testing
  - Request/response validation
  - Error handling

### 2. Integration Tests

**Purpose**: Test component interactions
**Location**: `tests/integration/`
**Framework**: pytest with database fixtures

#### Key Test Categories:
- **Database Integration** (`test_database_integration.py`)
  - Database operations
  - Transaction handling
  - Migration testing

- **API Integration** (`test_api_integrations.py`)
  - Amazon SP-API integration
  - Shopify API integration
  - Xero API integration
  - Webhook processing

- **End-to-End Workflows** (`test_end_to_end_workflows.py`)
  - Complete business processes
  - Multi-user scenarios
  - Error recovery workflows

### 3. Performance Tests

**Purpose**: Verify system performance under load
**Location**: `tests/performance/`
**Framework**: pytest-benchmark, locust

#### Test Categories:
- **Benchmark Tests** (`test_performance_benchmarks.py`)
  - Database performance
  - Service performance
  - API response times
  - Memory usage
  - Scalability tests

### 4. End-to-End (E2E) Tests

**Purpose**: Test complete user workflows
**Location**: `tests/e2e/`
**Framework**: Selenium WebDriver, Playwright

#### Test Categories:
- **User Acceptance** (`test_user_acceptance.py`)
  - User registration/login workflows
  - Dashboard navigation
  - Feature functionality
  - Responsive design
  - Accessibility compliance

### 5. Business Scenario Tests

**Purpose**: Validate business requirements
**Location**: `tests/uat/`
**Framework**: pytest with business scenario fixtures

#### Test Categories:
- **Production Planning Scenarios**
- **Inventory Management Scenarios** 
- **Demand Forecasting Scenarios**
- **Customer Satisfaction Scenarios**

## Running Tests

### Prerequisites

1. **Python Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Database Setup**:
   ```bash
   python -m flask db upgrade
   ```

3. **Environment Variables**:
   ```bash
   export FLASK_ENV=testing
   export DATABASE_URL=sqlite:///:memory:
   export SECRET_KEY=test-secret-key
   ```

### Running All Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/ --cov-report=html

# Run specific test categories
pytest tests/unit/           # Unit tests only
pytest tests/integration/    # Integration tests only  
pytest tests/performance/    # Performance tests only
pytest tests/e2e/           # E2E tests only
```

### Running Specific Tests

```bash
# Run specific test file
pytest tests/unit/test_auth_system.py

# Run specific test class
pytest tests/unit/test_auth_system.py::TestUserAuthentication

# Run specific test method
pytest tests/unit/test_auth_system.py::TestUserAuthentication::test_user_registration_valid_data

# Run tests matching pattern
pytest -k "test_auth"
```

### Test Options

```bash
# Verbose output
pytest -v

# Stop on first failure
pytest -x

# Run tests in parallel
pytest -n auto

# Generate JUnit XML report
pytest --junitxml=test-results.xml

# Run with specific markers
pytest -m "slow"      # Run slow tests
pytest -m "not slow"  # Skip slow tests
```

## Test Environment Setup

### Local Development

1. **Database**: SQLite in-memory for fast testing
2. **External APIs**: Mocked using unittest.mock
3. **File Storage**: Temporary directories
4. **Configuration**: TestConfig class

### CI/CD Environment

1. **Database**: PostgreSQL test instance
2. **Redis**: Redis test instance  
3. **Browser**: Headless Chrome for E2E tests
4. **Environment**: GitHub Actions runners

### Test Data Management

```python
# Fixtures for test data
@pytest.fixture
def sample_user():
    """Create sample user for testing."""
    user = User(email='test@example.com', first_name='Test', last_name='User')
    user.set_password('testpass')
    return user

@pytest.fixture
def sample_product():
    """Create sample product for testing."""
    return Product(
        name='Test Product',
        sku='TEST-001',
        cost=Decimal('10.00'),
        price=Decimal('20.00'),
        lead_time_days=7
    )
```

## Writing Tests

### Unit Test Example

```python
def test_user_registration_valid_data(self, db_session):
    """Test user registration with valid data - TC-AUTH-001."""
    user_data = {
        'email': 'newuser@example.com',
        'first_name': 'New',
        'last_name': 'User',
        'password': 'SecurePass123!'
    }
    
    user = User(
        email=user_data['email'],
        first_name=user_data['first_name'],
        last_name=user_data['last_name']
    )
    user.set_password(user_data['password'])
    
    db_session.add(user)
    db_session.commit()
    
    assert user.id is not None
    assert user.email == user_data['email']
    assert user.check_password(user_data['password']) is True
```

### Integration Test Example

```python
def test_complete_order_fulfillment_workflow(self, client, db_session):
    """Test complete workflow from order creation to delivery."""
    # Setup test data
    user = User(email='workflow@example.com', first_name='Test', last_name='User')
    user.set_password('password123')
    
    product = Product(name='Workflow Product', sku='WF-001', cost=Decimal('10.00'), price=Decimal('20.00'))
    
    db_session.add_all([user, product])
    db_session.commit()
    
    # Execute workflow steps
    with client.session_transaction() as sess:
        sess['_user_id'] = str(user.id)
    
    # Create job
    job_data = {'product_id': str(product.id), 'quantity': 50, 'priority': 1}
    response = client.post('/api/jobs', data=json.dumps(job_data), content_type='application/json')
    
    assert response.status_code in [200, 201]
```

### Test Best Practices

1. **Test Naming**: Use descriptive names that explain what is being tested
2. **AAA Pattern**: Arrange, Act, Assert
3. **Single Responsibility**: Each test should verify one specific behavior
4. **Independent Tests**: Tests should not depend on each other
5. **Test Data**: Use fixtures and factories for test data creation
6. **Mocking**: Mock external dependencies to isolate units under test

## Continuous Integration

### GitHub Actions Workflow

Our CI/CD pipeline runs comprehensive tests on every push and pull request:

```yaml
# .github/workflows/ci-cd-testing.yml
name: CI/CD Testing Pipeline

on:
  push:
    branches: [ development, test, production ]
  pull_request:
    branches: [ development, test, production ]

jobs:
  lint-and-format:
    # Code quality checks
    
  unit-tests:
    # Unit test execution
    
  integration-tests:
    # Integration test execution
    
  performance-tests:
    # Performance benchmarking
    
  security-tests:
    # Security vulnerability scanning
    
  browser-tests:
    # End-to-end browser testing
```

### Quality Gates

Before code can be merged:
- All tests must pass
- Code coverage must be >80%
- Security scans must pass
- Performance benchmarks must meet SLA
- Code review approval required

## Performance Testing

### Benchmark Testing

```python
def test_forecasting_performance(self, benchmark):
    """Test forecasting service performance."""
    forecasting_service = ForecastingService()
    
    def generate_forecast():
        return forecasting_service.generate_simple_forecast('product-id', 'market-id', days=365)
    
    result = benchmark(generate_forecast)
    assert len(result['predicted_quantities']) == 365
```

### Load Testing

```python
# Using Locust for load testing
class WebsiteUser(HttpUser):
    wait_time = between(1, 5)
    
    def on_start(self):
        self.login()
    
    def login(self):
        response = self.client.post("/auth/login", {
            "email": "test@example.com",
            "password": "password123"
        })
    
    @task
    def view_dashboard(self):
        self.client.get("/")
    
    @task
    def view_products(self):
        self.client.get("/api/products")
```

### Performance Targets

- **API Response Time**: <2 seconds (95th percentile)
- **Database Queries**: <1 second average
- **Page Load Time**: <3 seconds
- **Concurrent Users**: 100+ without performance degradation

## Security Testing

### Automated Security Scans

1. **Bandit**: Static security analysis
2. **Safety**: Dependency vulnerability scanning
3. **Semgrep**: SAST (Static Application Security Testing)

### Manual Security Testing

1. **Authentication Testing**
   - Password strength validation
   - Session management
   - Access control verification

2. **Input Validation Testing**
   - SQL injection prevention
   - XSS prevention
   - CSRF protection

3. **API Security Testing**
   - Authorization checks
   - Rate limiting
   - Input sanitization

## User Acceptance Testing

### UAT Process

1. **Test Planning**
   - Business scenarios identification
   - Acceptance criteria definition
   - Test environment preparation

2. **Test Execution**
   - Manual testing by business users
   - Automated E2E test execution
   - Bug reporting and tracking

3. **Sign-off**
   - Business requirement validation
   - Performance acceptance
   - Production readiness confirmation

### UAT Test Categories

- **Functional Testing**: Core business functionality
- **Usability Testing**: User experience validation
- **Integration Testing**: External system integration
- **Performance Testing**: Production load simulation

## Quality Metrics

### Test Metrics

- **Test Coverage**: >90% for unit tests, >70% overall
- **Test Pass Rate**: >95% for all test categories
- **Test Execution Time**: <30 minutes for full test suite
- **Defect Density**: <1 critical bug per 1000 lines of code

### Quality Indicators

- **Build Success Rate**: >98%
- **Mean Time to Recovery**: <2 hours
- **Customer Satisfaction**: >4.5/5.0
- **Performance SLA Compliance**: >99%

### Monitoring and Alerting

```python
# Quality monitoring integration
def test_quality_metrics():
    """Monitor and report quality metrics."""
    metrics = {
        'test_coverage': get_test_coverage(),
        'performance_sla': check_performance_sla(),
        'security_vulnerabilities': scan_vulnerabilities(),
        'customer_satisfaction': get_satisfaction_score()
    }
    
    # Alert if metrics fall below thresholds
    for metric, value in metrics.items():
        if not meets_quality_threshold(metric, value):
            send_quality_alert(metric, value)
```

## Troubleshooting

### Common Issues

1. **Test Database Connection**
   ```bash
   # Check database connectivity
   python -m flask test-db
   ```

2. **Missing Dependencies**
   ```bash
   # Reinstall dependencies
   pip install -r requirements.txt
   ```

3. **Environment Variables**
   ```bash
   # Verify environment setup
   python -c "import os; print(os.environ.get('FLASK_ENV'))"
   ```

4. **Port Conflicts**
   ```bash
   # Check if port 5000 is available
   lsof -i :5000
   ```

### Debugging Test Failures

1. **Run with verbose output**: `pytest -v`
2. **Use debugger**: `pytest --pdb`
3. **Check logs**: Review application and test logs
4. **Isolate test**: Run failing test in isolation

### Performance Issues

1. **Database queries**: Check for N+1 queries
2. **Memory usage**: Profile memory consumption
3. **Test parallelization**: Reduce parallel workers if needed
4. **Mock external services**: Ensure external calls are mocked

## Best Practices Summary

1. **Write tests first**: Follow TDD/BDD practices
2. **Keep tests simple**: One assertion per test when possible  
3. **Use descriptive names**: Tests should be self-documenting
4. **Mock external dependencies**: Keep tests fast and reliable
5. **Maintain test data**: Keep fixtures clean and realistic
6. **Review test coverage**: Aim for high coverage with meaningful tests
7. **Run tests frequently**: Integrate testing into development workflow
8. **Update tests with code**: Keep tests synchronized with implementation

## Resources

- [pytest Documentation](https://docs.pytest.org/)
- [Flask Testing Documentation](https://flask.palletsprojects.com/en/2.0.x/testing/)
- [Selenium Documentation](https://selenium-python.readthedocs.io/)
- [Testing Best Practices](https://testdriven.io/blog/modern-tdd/)

---

For questions or issues with testing, please contact the development team or create an issue in the GitHub repository.