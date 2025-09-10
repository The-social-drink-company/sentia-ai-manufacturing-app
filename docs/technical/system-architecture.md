# Sentia Manufacturing Dashboard - System Architecture

## Overview

The Sentia Manufacturing Dashboard is built using a modern web application architecture with Flask as the backend framework, PostgreSQL as the primary database, and Railway for cloud hosting. The system integrates with external APIs for e-commerce and financial data synchronization.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ HTML/CSS/JS     │◄──►│ Flask App       │◄──►│ PostgreSQL      │
│ Responsive UI   │    │ REST API        │    │ (Neon)          │
│ Charts.js       │    │ Authentication  │    │ Vector Support  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         v                       v                       v
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   External      │    │   Services      │    │   Infrastructure│
│   APIs          │    │                 │    │                 │
│ Amazon SP-API   │◄──►│ Forecasting     │    │ Railway Hosting │
│ Shopify API     │    │ Optimization    │    │ Redis Cache     │
│ Xero API        │    │ Scheduling      │    │ Celery Tasks    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technology Stack

### Backend Framework
- **Flask 2.3+**: Python web framework
- **Flask-SQLAlchemy**: ORM for database interactions
- **Flask-Login**: User session management
- **Flask-Migrate**: Database schema migrations
- **Flask-CORS**: Cross-origin resource sharing

### Database Layer
- **PostgreSQL 14+**: Primary database (Neon hosted)
- **Vector Support**: For advanced analytics
- **Connection Pooling**: Optimized for production load
- **Automatic Backups**: Point-in-time recovery

### Frontend Technologies
- **HTML5/CSS3**: Modern web standards
- **JavaScript ES6+**: Interactive functionality
- **Chart.js**: Data visualizations
- **Bootstrap 5**: Responsive design framework
- **HTMX**: Enhanced interactivity

### Infrastructure
- **Railway**: Cloud hosting platform
- **Neon**: Serverless PostgreSQL
- **Redis**: Caching and session storage
- **Celery**: Asynchronous task processing
- **GitHub Actions**: CI/CD pipeline

### Development Tools
- **Python 3.13**: Primary development language
- **Poetry/Pip**: Dependency management
- **Pytest**: Unit and integration testing
- **GitHub**: Version control and collaboration
- **Claude Code**: AI-assisted development

## Application Structure

### Directory Organization

```
sentia-manufacturing-dashboard/
├── app/
│   ├── __init__.py              # Flask application factory
│   ├── models/                  # Database models
│   │   ├── __init__.py
│   │   ├── user.py             # User authentication
│   │   ├── product.py          # Product catalog
│   │   ├── job.py              # Manufacturing jobs
│   │   ├── resource.py         # Production resources
│   │   ├── schedule.py         # Production schedules
│   │   ├── forecast.py         # Demand forecasts
│   │   └── ...
│   ├── routes/                  # HTTP route handlers
│   │   ├── __init__.py
│   │   ├── main.py             # Main dashboard routes
│   │   ├── api.py              # REST API endpoints
│   │   ├── auth.py             # Authentication routes
│   │   └── admin.py            # Admin panel routes
│   ├── services/               # Business logic layer
│   │   ├── forecasting_service.py
│   │   ├── stock_optimization_service.py
│   │   ├── constraint_solver.py
│   │   └── api_integration_service.py
│   ├── templates/              # HTML templates
│   │   ├── base.html
│   │   ├── dashboard.html
│   │   ├── auth/
│   │   └── admin/
│   ├── static/                 # CSS, JavaScript, images
│   └── utils/                  # Utility functions
├── migrations/                 # Database migrations
├── tests/                     # Test suite
├── docs/                      # Documentation
├── config.py                  # Configuration settings
└── run.py                     # Application entry point
```

### Database Schema Design

#### Core Entities

**Users Table**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

**Products Table**
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    product_type VARCHAR(50) NOT NULL, -- Red, Black, Gold
    market VARCHAR(50) NOT NULL,       -- UK, EU, USA
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    lead_time_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Manufacturing Jobs**
```sql
CREATE TABLE jobs (
    id INTEGER PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    due_date DATE NOT NULL,
    priority INTEGER DEFAULT 3,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

**Production Resources**
```sql
CREATE TABLE resources (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    capacity_per_hour INTEGER DEFAULT 0,
    hourly_cost DECIMAL(8,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Business Intelligence Tables

**Historical Sales**
```sql
CREATE TABLE historical_sales (
    id INTEGER PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    sales_channel_id INTEGER REFERENCES sales_channels(id),
    date DATE NOT NULL,
    quantity_sold INTEGER NOT NULL,
    revenue DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Forecasts**
```sql
CREATE TABLE forecasts (
    id INTEGER PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    forecast_date DATE NOT NULL,
    predicted_demand INTEGER NOT NULL,
    confidence_level DECIMAL(5,2),
    method_used VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);
```

**Inventory Levels**
```sql
CREATE TABLE inventory_levels (
    id INTEGER PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    location VARCHAR(100) NOT NULL,
    quantity_available INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    reorder_point INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Design

### RESTful Endpoints

#### Authentication Endpoints
```
POST   /api/auth/login          # User login
POST   /api/auth/logout         # User logout  
POST   /api/auth/refresh        # Token refresh
GET    /api/auth/profile        # Get user profile
PUT    /api/auth/profile        # Update profile
```

#### Product Management
```
GET    /api/products            # List all products
POST   /api/products            # Create new product
GET    /api/products/{id}       # Get product details
PUT    /api/products/{id}       # Update product
DELETE /api/products/{id}       # Delete product
GET    /api/products/search     # Search products
```

#### Forecasting API
```
POST   /api/forecasts/generate  # Generate new forecast
GET    /api/forecasts           # List forecasts
GET    /api/forecasts/{id}      # Get forecast details
PUT    /api/forecasts/{id}      # Update forecast
DELETE /api/forecasts/{id}      # Delete forecast
GET    /api/forecasts/accuracy  # Get accuracy metrics
```

#### Stock Optimization
```
POST   /api/stock/optimize      # Run optimization
GET    /api/stock/levels        # Get current levels
PUT    /api/stock/levels        # Update stock levels
GET    /api/stock/alerts        # Get stock alerts
POST   /api/stock/reorder       # Generate reorder report
```

#### Production Scheduling
```
POST   /api/schedules/create    # Create new schedule
GET    /api/schedules           # List schedules
GET    /api/schedules/{id}      # Get schedule details
PUT    /api/schedules/{id}      # Update schedule
POST   /api/schedules/optimize  # Optimize schedule
GET    /api/resources           # List resources
```

### API Response Format

**Standard Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "email",
      "issue": "Email format is invalid"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Authentication & Authorization

**JWT Token Based Authentication**
- Bearer token in Authorization header
- Token expiration: 24 hours
- Refresh token: 30 days
- Role-based access control (RBAC)

**Permission Levels:**
```python
PERMISSIONS = {
    'admin': ['create', 'read', 'update', 'delete', 'manage_users'],
    'manager': ['create', 'read', 'update', 'delete'],
    'operator': ['create', 'read', 'update'],
    'viewer': ['read']
}
```

## Service Layer Architecture

### Forecasting Service

**Core Algorithms:**
- Simple Moving Average
- Exponential Smoothing (Holt-Winters)
- Seasonal ARIMA
- Linear Regression with trends

**Service Structure:**
```python
class EnhancedForecastingService:
    def __init__(self):
        self.models = {
            'sma': SimpleMovingAverage(),
            'exp_smooth': ExponentialSmoothing(),
            'arima': ARIMAModel(),
            'regression': LinearRegression()
        }
    
    def generate_forecast(self, product_id, method, horizon):
        # Implementation details
        pass
    
    def validate_accuracy(self, forecast_id):
        # Accuracy calculation
        pass
```

### Stock Optimization Service

**Optimization Features:**
- Economic Order Quantity (EOQ)
- Safety stock calculation
- Reorder point optimization
- Multi-location allocation

**Service Methods:**
```python
class StockOptimizationService:
    def calculate_safety_stock(self, product_id, service_level):
        # Safety stock calculation
        pass
    
    def optimize_reorder_points(self, constraints):
        # Reorder point optimization
        pass
    
    def allocate_inventory(self, demand_forecast):
        # Multi-location allocation
        pass
```

### Production Scheduling Service

**Constraint Solving:**
- Resource capacity constraints
- Due date requirements
- Setup time optimization
- Quality control integration

**Optimization Engine:**
```python
class ConstraintSolver:
    def __init__(self):
        self.solver = cp_model.CpSolver()
    
    def create_schedule(self, jobs, resources, constraints):
        # Constraint programming implementation
        pass
    
    def optimize_makespan(self, schedule):
        # Schedule optimization
        pass
```

## External Integrations

### Amazon SP-API Integration

**Supported Operations:**
- Order management
- Inventory synchronization  
- Sales reporting
- FBA shipment tracking
- Performance metrics

**Integration Architecture:**
```python
class AmazonSPClient:
    def __init__(self, credentials):
        self.client_id = credentials['client_id']
        self.client_secret = credentials['client_secret']
        self.refresh_token = credentials['refresh_token']
    
    async def get_orders(self, marketplace_id, date_range):
        # Order retrieval implementation
        pass
    
    async def sync_inventory(self, products):
        # Inventory synchronization
        pass
```

### Shopify API Integration

**Multi-Store Support:**
- UK Store: sentia-uk.myshopify.com
- EU Store: sentia-eu.myshopify.com  
- USA Store: sentia-usa.myshopify.com

**Integration Features:**
```python
class ShopifyClient:
    def __init__(self, store_config):
        self.stores = {
            'uk': ShopifyStore(store_config['uk']),
            'eu': ShopifyStore(store_config['eu']),
            'usa': ShopifyStore(store_config['usa'])
        }
    
    async def sync_all_stores(self):
        # Multi-store synchronization
        pass
```

## Security Architecture

### Data Protection

**Encryption at Rest:**
- Database encryption (AES-256)
- Sensitive data hashing (bcrypt)
- API key encryption
- File storage encryption

**Encryption in Transit:**
- TLS 1.3 for all connections
- Certificate-based authentication
- Secure API communication
- VPN for admin access

### Access Control

**Role-Based Access Control (RBAC):**
```python
@require_permission('forecasting')
@log_user_activity('forecast_generation')
def generate_forecast():
    # Function implementation
    pass
```

**Audit Logging:**
- All user actions logged
- API access tracking
- Data modification history
- Security event monitoring

### Compliance Features

**GDPR Compliance:**
- Data portability
- Right to erasure
- Consent management
- Privacy by design

**SOC 2 Type II:**
- Security controls
- Availability monitoring
- Processing integrity
- Confidentiality measures

## Deployment Architecture

### Environment Structure

**Development Environment:**
- Local development with SQLite fallback
- Railway-style services (no Docker)
- Hot reloading for rapid development
- Mock external API responses

**Testing Environment:**
- Automated testing pipeline
- PostgreSQL test database
- Integration test scenarios
- Performance testing

**Production Environment:**
- Railway cloud hosting
- Neon PostgreSQL database
- Redis for caching
- Automated scaling

### CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
name: Deploy to Railway
on:
  push:
    branches: [development, test, production]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.13'
      - name: Run tests
        run: pytest
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway
        uses: railway-deploy@v3
```

### Monitoring and Observability

**Application Monitoring:**
- Real-time performance metrics
- Error tracking and alerting
- User activity monitoring
- API endpoint monitoring

**Infrastructure Monitoring:**
- Database performance
- Memory and CPU usage
- Network connectivity
- Storage utilization

**Alerting System:**
```python
class MonitoringService:
    def __init__(self):
        self.alerts = {
            'high_cpu': 80,
            'low_memory': 90,
            'api_errors': 5,
            'db_slow_queries': 2000
        }
    
    def check_system_health(self):
        # Health check implementation
        pass
```

## Performance Optimization

### Database Optimization

**Indexing Strategy:**
```sql
-- Product lookups
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_type_market ON products(product_type, market);

-- Sales queries
CREATE INDEX idx_sales_product_date ON historical_sales(product_id, date);
CREATE INDEX idx_sales_channel_date ON historical_sales(sales_channel_id, date);

-- Forecast queries
CREATE INDEX idx_forecasts_product_date ON forecasts(product_id, forecast_date);
```

**Query Optimization:**
- Proper JOIN usage
- Pagination for large datasets
- Materialized views for complex aggregations
- Connection pooling

### Caching Strategy

**Redis Caching:**
- Forecast results caching
- Product catalog caching
- User session caching
- API response caching

**Cache Configuration:**
```python
CACHE_CONFIG = {
    'forecasts': {'ttl': 3600},      # 1 hour
    'products': {'ttl': 1800},       # 30 minutes  
    'reports': {'ttl': 900},         # 15 minutes
    'api_responses': {'ttl': 300}    # 5 minutes
}
```

### Asynchronous Processing

**Celery Task Queue:**
```python
@celery.task
def generate_forecast_async(product_id, method, horizon):
    # Long-running forecast generation
    pass

@celery.task  
def sync_external_data():
    # Background data synchronization
    pass
```

## Disaster Recovery

### Backup Strategy

**Database Backups:**
- Automated daily full backups
- Hourly incremental backups
- Point-in-time recovery capability
- Cross-region backup replication

**Application Backups:**
- Code repository backups
- Configuration backups
- Uploaded file backups
- Environment variable backups

### Recovery Procedures

**RTO/RPO Targets:**
- Recovery Time Objective: 4 hours
- Recovery Point Objective: 1 hour
- Maximum acceptable downtime: 8 hours
- Data loss tolerance: Minimal

**Recovery Testing:**
- Monthly recovery drills
- Backup integrity verification
- Failover testing
- Documentation updates

This comprehensive system architecture documentation provides the technical foundation for understanding, maintaining, and extending the Sentia Manufacturing Dashboard system.