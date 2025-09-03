# Comprehensive Development Prompts for Daniel
## Sentia Manufacturing Planning Dashboard - Sequential Build Guide

### Overview
These prompts will guide you through building the complete Sentia Manufacturing Planning Dashboard using vibe coding methodology. Execute each prompt in sequence, maintaining strict context references to prevent AI drift.

---

## PROMPT 1: Environment Setup and Project Initialization

### Context Required:
- `/context/technical-specifications/tech_stack.md`
- `/context/development-methodology/vibe_coding_guide.md`

### Objective:
Set up the complete development environment and initialize the project structure.

### Instructions for Claude:
```
Using the technical specifications in /context/technical-specifications/tech_stack.md, help me set up the development environment for the Sentia Manufacturing Planning Dashboard.

I need you to:

1. **Install and Configure Development Tools:**
   - Guide me through installing Cursor IDE with optimal settings
   - Set up Claude Code CLI integration
   - Configure GitHub CLI for repository management
   - Install Python 3.11+ with Flask and required dependencies

2. **Create Project Structure:**
   - Initialize a new Flask project with modular architecture
   - Set up the following directory structure:
     ```
     sentia-manufacturing-dashboard/
     ├── app/
     │   ├── __init__.py
     │   ├── models/
     │   ├── routes/
     │   ├── services/
     │   ├── utils/
     │   └── templates/
     ├── context/
     │   ├── business-requirements/
     │   ├── technical-specifications/
     │   ├── database-schemas/
     │   ├── api-documentation/
     │   ├── ui-components/
     │   ├── business-logic/
     │   ├── testing-scenarios/
     │   └── deployment-configs/
     ├── static/
     ├── migrations/
     ├── tests/
     ├── requirements.txt
     ├── config.py
     ├── run.py
     └── README.md
     ```

3. **Initialize Git Repository:**
   - Create GitHub repository: sentia-manufacturing-dashboard
   - Set up three branches: development, test, production
   - Configure branch protection rules
   - Create initial commit with project structure

4. **Create Configuration Files:**
   - requirements.txt with all necessary dependencies
   - config.py with environment-specific settings
   - .env template for environment variables
   - .gitignore for Python/Flask projects

Provide step-by-step commands and verify each step works correctly.
```

### Expected Deliverables:
- [ ] Complete development environment setup
- [ ] Project structure created and committed to GitHub
- [ ] All three branches (development, test, production) created
- [ ] Configuration files properly set up

---

## PROMPT 2: Database Design and Neon PostgreSQL Setup

### Context Required:
- `/context/business-requirements/sentia_business_model.md`
- `/context/database-schemas/entity_relationships.md`

### Objective:
Design and implement the database schema for the manufacturing planning system.

### Instructions for Claude:
```
Using the business requirements in /context/business-requirements/sentia_business_model.md, help me design and implement the database schema for the Sentia Manufacturing Planning Dashboard.

I need you to:

1. **Design Database Schema:**
   Based on Sentia's business model (3 products, 3 markets, 5 sales channels), create:
   - Products table (GABA Red, Black, Gold with regional variations)
   - Markets table (UK, EU, USA)
   - Sales_Channels table (Amazon UK/USA, Shopify UK/USA/EU)
   - Historical_Sales table (time series data)
   - Forecasts table (demand predictions)
   - Inventory_Levels table (current and required stock)
   - Working_Capital table (cash flow projections)
   - Users table (authentication and roles)
   - System_Settings table (configuration parameters)

2. **Set Up Neon PostgreSQL:**
   - Create three Neon database instances (development, test, production)
   - Configure connection strings for each environment
   - Set up database migrations using Flask-Migrate
   - Create initial migration files

3. **Implement SQLAlchemy Models:**
   - Create model classes in app/models/
   - Define relationships between entities
   - Add validation rules and constraints
   - Include audit fields (created_at, updated_at, created_by)

4. **Create Database Utilities:**
   - Database connection management
   - Migration scripts
   - Data seeding utilities
   - Backup and restore functions

5. **Test Database Setup:**
   - Verify connections to all three environments
   - Run initial migrations
   - Test CRUD operations
   - Validate data integrity constraints

Ensure all database operations are properly logged and include error handling.
```

### Expected Deliverables:
- [ ] Complete database schema design documented
- [ ] Three Neon PostgreSQL databases configured
- [ ] SQLAlchemy models implemented and tested
- [ ] Migration system working correctly
- [ ] Database utilities created and tested

---

## PROMPT 3: User Authentication and Role Management

### Context Required:
- `/context/business-requirements/user_roles.md`
- `/context/technical-specifications/security_requirements.md`

### Objective:
Implement secure user authentication and role-based access control.

### Instructions for Claude:
```
Using the user role requirements in /context/business-requirements/user_roles.md, help me implement a secure authentication system for the Sentia Manufacturing Planning Dashboard.

I need you to:

1. **Implement User Authentication:**
   - Create User model with secure password hashing
   - Implement login/logout functionality
   - Add session management with secure cookies
   - Create password reset functionality
   - Add account lockout after failed attempts

2. **Design Role-Based Access Control:**
   - Admin role: Full system access, user management, API configuration
   - Manager role: All planning functions, reporting, data import
   - Operator role: View dashboards, basic data entry
   - Viewer role: Read-only access to reports and dashboards

3. **Create Authentication Routes:**
   - /auth/login - User login page
   - /auth/logout - Secure logout
   - /auth/register - New user registration (admin only)
   - /auth/reset-password - Password reset flow
   - /auth/profile - User profile management

4. **Implement Security Middleware:**
   - Route protection decorators
   - Role-based access decorators
   - CSRF protection
   - Input validation and sanitization
   - Rate limiting for authentication endpoints

5. **Create User Management Interface:**
   - Admin panel for user management
   - User list with role assignments
   - User creation and editing forms
   - Role permission matrix display
   - Activity logging and audit trail

6. **Add Security Features:**
   - Password strength requirements
   - Two-factor authentication (optional)
   - Session timeout handling
   - Secure headers and HTTPS enforcement
   - SQL injection prevention

Test all authentication flows and verify security measures are working correctly.
```

### Expected Deliverables:
- [ ] Secure user authentication system implemented
- [ ] Role-based access control working
- [ ] User management interface created
- [ ] Security middleware and protections active
- [ ] All authentication flows tested and verified

---

## PROMPT 4: Data Import and Validation System

### Context Required:
- `/context/business-requirements/data_sources.md`
- `/context/business-logic/data_validation_rules.md`

### Objective:
Create robust data import system with validation and error handling.

### Instructions for Claude:
```
Using the data source requirements in /context/business-requirements/data_sources.md, help me create a comprehensive data import and validation system.

I need you to:

1. **Create Data Import Interface:**
   - File upload component with drag-and-drop functionality
   - Support for Excel (.xlsx), CSV, and JSON formats
   - Progress indicators for large file uploads
   - Preview functionality before final import
   - Batch processing for large datasets

2. **Implement Data Validation Engine:**
   - Schema validation for imported data
   - Business rule validation (e.g., positive quantities, valid dates)
   - Duplicate detection and handling
   - Missing data identification and suggestions
   - Data type conversion and formatting

3. **Build Import Processing Pipeline:**
   - Asynchronous processing for large files
   - Error logging and reporting
   - Rollback capability for failed imports
   - Data transformation and normalization
   - Conflict resolution for existing data

4. **Create Import Templates:**
   - Excel templates for each data type
   - Sample data files for testing
   - Import specification documentation
   - Field mapping configuration
   - Data format guidelines

5. **Develop Import Dashboard:**
   - Import history and status tracking
   - Error reports with detailed explanations
   - Data quality metrics and statistics
   - Import scheduling and automation
   - Export functionality for corrected data

6. **Add Data Quality Features:**
   - Automated data cleansing
   - Outlier detection and flagging
   - Data completeness scoring
   - Consistency checks across related data
   - Suggestions for data improvements

Create comprehensive error handling and user-friendly error messages for all import scenarios.
```

### Expected Deliverables:
- [ ] Data import interface with drag-and-drop functionality
- [ ] Comprehensive validation engine implemented
- [ ] Import processing pipeline working
- [ ] Import templates and documentation created
- [ ] Import dashboard with error reporting functional

---

## PROMPT 5: Demand Forecasting Engine

### Context Required:
- `/context/business-logic/forecasting_algorithms.md`
- `/context/business-requirements/seasonal_patterns.md`

### Objective:
Implement sophisticated demand forecasting with seasonal adjustments.

### Instructions for Claude:
```
Using the forecasting requirements in /context/business-logic/forecasting_algorithms.md, help me build an advanced demand forecasting engine for Sentia's manufacturing planning.

I need you to:

1. **Implement Core Forecasting Algorithms:**
   - Moving average with seasonal adjustments
   - Exponential smoothing with trend and seasonality
   - Linear regression with multiple variables
   - ARIMA model for time series analysis
   - Machine learning ensemble approach

2. **Create Seasonal Pattern Recognition:**
   - Automatic detection of seasonal cycles
   - Holiday and event impact modeling
   - Regional seasonality differences (UK vs EU vs USA)
   - Product-specific seasonal patterns
   - Year-over-year growth trend analysis

3. **Build Forecasting Service Layer:**
   - ForecastingService class with multiple algorithms
   - Model selection based on data characteristics
   - Confidence interval calculations
   - Forecast accuracy tracking and improvement
   - Real-time forecast updates

4. **Implement Variable Adjustment System:**
   - Interactive sliders for seasonality factors
   - Growth rate adjustment controls
   - Market condition modifiers
   - Promotional impact settings
   - External factor incorporation

5. **Create Forecast Validation:**
   - Backtesting against historical data
   - Accuracy metrics (MAPE, RMSE, MAE)
   - Model performance comparison
   - Forecast vs actual tracking
   - Continuous model improvement

6. **Develop Forecasting Dashboard:**
   - Visual forecast charts with confidence bands
   - Scenario comparison tools
   - Parameter adjustment interface
   - Forecast accuracy reporting
   - Export capabilities for planning

Ensure all forecasting calculations are optimized for performance and provide clear explanations of methodology.
```

### Expected Deliverables:
- [ ] Advanced forecasting algorithms implemented
- [ ] Seasonal pattern recognition working
- [ ] Forecasting service layer created
- [ ] Variable adjustment system functional
- [ ] Forecast validation and accuracy tracking active

---

## PROMPT 6: Stock Level Optimization Engine

### Context Required:
- `/context/business-logic/inventory_optimization.md`
- `/context/business-requirements/supply_chain_constraints.md`

### Objective:
Create intelligent stock level optimization with lead time and capacity constraints.

### Instructions for Claude:
```
Using the inventory optimization requirements in /context/business-logic/inventory_optimization.md, help me build a sophisticated stock level optimization engine.

I need you to:

1. **Implement Stock Optimization Algorithms:**
   - Economic Order Quantity (EOQ) calculations
   - Safety stock optimization based on service levels
   - Reorder point calculations with lead time variability
   - Multi-echelon inventory optimization
   - Capacity-constrained optimization

2. **Create Supply Chain Constraint Modeling:**
   - Lead time variability by supplier and product
   - Production capacity constraints at infusion/bottling providers
   - Seasonal capacity limitations
   - Shipping and logistics constraints
   - Working capital limitations

3. **Build Optimization Service Layer:**
   - StockOptimizationService with multiple algorithms
   - Constraint satisfaction problem solving
   - Multi-objective optimization (cost vs service level)
   - Scenario-based optimization
   - Real-time optimization updates

4. **Implement Interactive Parameter Controls:**
   - Service level target sliders (95%, 98%, 99.5%)
   - Lead time adjustment controls
   - Capacity constraint settings
   - Cost parameter inputs
   - Risk tolerance adjustments

5. **Create Stock Level Dashboard:**
   - Current vs optimal stock level visualization
   - Reorder point and quantity recommendations
   - Stock-out risk analysis
   - Carrying cost optimization
   - Purchase order suggestions

6. **Add Advanced Features:**
   - ABC analysis for inventory prioritization
   - Slow-moving inventory identification
   - Obsolescence risk assessment
   - Supplier performance impact modeling
   - Cross-docking optimization

Ensure all optimization calculations consider real business constraints and provide actionable recommendations.
```

### Expected Deliverables:
- [ ] Stock optimization algorithms implemented
- [ ] Supply chain constraint modeling working
- [ ] Optimization service layer created
- [ ] Interactive parameter controls functional
- [ ] Stock level dashboard with recommendations active

---

## PROMPT 7: Working Capital Modeling Engine

### Context Required:
- `/context/business-logic/working_capital_calculations.md`
- `/context/business-requirements/cash_flow_requirements.md`

### Objective:
Build comprehensive working capital modeling with cash flow projections.

### Instructions for Claude:
```
Using the working capital requirements in /context/business-logic/working_capital_calculations.md, help me create a sophisticated working capital modeling engine.

I need you to:

1. **Implement Working Capital Calculations:**
   - Inventory investment calculations by product/region
   - Accounts receivable modeling by sales channel
   - Accounts payable optimization by supplier terms
   - Cash conversion cycle analysis
   - Working capital turnover metrics

2. **Create Cash Flow Projection Engine:**
   - Monthly cash flow forecasting
   - Seasonal cash flow patterns
   - Growth scenario impact modeling
   - Payment terms optimization
   - Credit facility requirement calculations

3. **Build Financial Modeling Service:**
   - WorkingCapitalService with multiple scenarios
   - Sensitivity analysis for key parameters
   - Break-even analysis calculations
   - ROI calculations for inventory investments
   - Financial ratio analysis

4. **Implement Scenario Planning:**
   - Conservative vs aggressive growth scenarios
   - Best case / worst case / most likely projections
   - Stress testing under adverse conditions
   - Seasonal variation impact analysis
   - Market expansion scenario modeling

5. **Create Financial Dashboard:**
   - Working capital requirement visualization
   - Cash flow timeline charts
   - Key financial metrics display
   - Scenario comparison tools
   - Alert system for cash flow issues

6. **Add Advanced Financial Features:**
   - Days Sales Outstanding (DSO) optimization
   - Days Payable Outstanding (DPO) management
   - Inventory turnover improvement suggestions
   - Credit line utilization tracking
   - Cost of capital calculations

Ensure all financial calculations are accurate and provide clear business insights for decision-making.
```

### Expected Deliverables:
- [ ] Working capital calculation engine implemented
- [ ] Cash flow projection system working
- [ ] Financial modeling service created
- [ ] Scenario planning functionality active
- [ ] Financial dashboard with key metrics functional

---

## PROMPT 8: Main Dashboard Interface Development

### Context Required:
- `/context/ui-components/dashboard_layouts.md`
- `/context/business-requirements/user_workflows.md`

### Objective:
Create the main manufacturing planning dashboard with intuitive user interface.

### Instructions for Claude:
```
Using the UI requirements in /context/ui-components/dashboard_layouts.md, help me create a world-class manufacturing planning dashboard interface.

I need you to:

1. **Design Responsive Dashboard Layout:**
   - Mobile-first responsive design
   - Customizable widget arrangement
   - Collapsible sidebar navigation
   - Breadcrumb navigation system
   - Quick action toolbar

2. **Implement Core Dashboard Widgets:**
   - Demand forecast charts with interactive controls
   - Stock level status indicators
   - Working capital requirement meters
   - Production capacity utilization
   - Key performance indicators (KPIs)

3. **Create Interactive Data Visualizations:**
   - Chart.js integration for dynamic charts
   - Real-time data updates
   - Drill-down capabilities
   - Export functionality (PDF, Excel, PNG)
   - Customizable time ranges and filters

4. **Build User Workflow Interfaces:**
   - Data import wizard with progress tracking
   - Parameter adjustment panels with sliders
   - Scenario comparison side-by-side views
   - Report generation interface
   - Alert and notification center

5. **Implement Dashboard Customization:**
   - Drag-and-drop widget arrangement
   - Personal dashboard preferences
   - Role-based widget visibility
   - Custom color themes
   - Saved dashboard layouts

6. **Add Advanced UI Features:**
   - Real-time collaboration indicators
   - Contextual help and tooltips
   - Keyboard shortcuts
   - Progressive web app capabilities
   - Offline functionality for key features

Ensure the interface is intuitive for non-technical users while providing advanced functionality for power users.
```

### Expected Deliverables:
- [ ] Responsive dashboard layout implemented
- [ ] Core dashboard widgets functional
- [ ] Interactive data visualizations working
- [ ] User workflow interfaces created
- [ ] Dashboard customization features active

---

## PROMPT 9: API Integration Framework

### Context Required:
- `/context/api-documentation/integration_specifications.md`
- `/context/technical-specifications/api_security.md`

### Objective:
Build secure API integration framework for external systems.

### Instructions for Claude:
```
Using the integration specifications in /context/api-documentation/integration_specifications.md, help me create a robust API integration framework.

I need you to:

1. **Design API Integration Architecture:**
   - RESTful API client framework
   - OAuth 2.0 authentication handling
   - Rate limiting and retry logic
   - Error handling and logging
   - Webhook processing system

2. **Implement Shopify Integration:**
   - Product synchronization
   - Inventory level updates
   - Order data retrieval
   - Sales analytics import
   - Webhook event processing

3. **Create Amazon Seller Central Integration:**
   - Marketplace API connections
   - Inventory management sync
   - Sales data retrieval
   - FBA inventory tracking
   - Performance metrics import

4. **Build Xero Accounting Integration:**
   - Financial data synchronization
   - Invoice and payment tracking
   - Cost center mapping
   - Budget vs actual reporting
   - Tax and compliance data

5. **Develop Admin Configuration Interface:**
   - API credential management
   - Connection testing tools
   - Sync scheduling configuration
   - Error monitoring dashboard
   - Integration health checks

6. **Add Integration Monitoring:**
   - Real-time sync status tracking
   - Error alerting and notifications
   - Performance metrics monitoring
   - Data quality validation
   - Audit trail for all integrations

Ensure all API integrations are secure, reliable, and provide comprehensive error handling.
```

### Expected Deliverables:
- [ ] API integration architecture implemented
- [ ] Shopify integration working
- [ ] Amazon Seller Central integration functional
- [ ] Xero accounting integration active
- [ ] Admin configuration interface created

---

## PROMPT 10: Admin Portal Development

### Context Required:
- `/context/business-requirements/admin_requirements.md`
- `/context/technical-specifications/system_configuration.md`

### Objective:
Create comprehensive admin portal for system management and configuration.

### Instructions for Claude:
```
Using the admin requirements in /context/business-requirements/admin_requirements.md, help me build a comprehensive admin portal for system management.

I need you to:

1. **Create Admin Dashboard:**
   - System health monitoring
   - User activity analytics
   - Performance metrics display
   - Error rate tracking
   - Resource utilization monitoring

2. **Implement User Management:**
   - User creation and editing interface
   - Role assignment and permissions
   - Bulk user operations
   - User activity logging
   - Account status management

3. **Build System Configuration:**
   - Application settings management
   - Feature flag controls
   - Environment variable configuration
   - Database connection management
   - Cache and performance settings

4. **Create API Management Interface:**
   - API credential storage and encryption
   - Connection testing and validation
   - Rate limit configuration
   - Webhook endpoint management
   - Integration health monitoring

5. **Implement Security Management:**
   - Security policy configuration
   - Access log monitoring
   - Failed login attempt tracking
   - IP whitelist/blacklist management
   - Security alert configuration

6. **Add System Maintenance Tools:**
   - Database backup and restore
   - Data export and import utilities
   - System log viewer and search
   - Performance optimization tools
   - Maintenance mode controls

Ensure the admin portal is secure, intuitive, and provides comprehensive system control capabilities.
```

### Expected Deliverables:
- [ ] Admin dashboard with system monitoring
- [ ] User management interface functional
- [ ] System configuration tools working
- [ ] API management interface created
- [ ] Security management features active

---

## PROMPT 11: Testing and Quality Assurance

### Context Required:
- `/context/testing-scenarios/test_cases.md`
- `/context/business-requirements/acceptance_criteria.md`

### Objective:
Implement comprehensive testing suite and quality assurance processes.

### Instructions for Claude:
```
Using the test scenarios in /context/testing-scenarios/test_cases.md, help me create a comprehensive testing and quality assurance system.

I need you to:

1. **Implement Unit Testing:**
   - Test cases for all business logic functions
   - Database model testing
   - API endpoint testing
   - Utility function testing
   - Mock external API responses

2. **Create Integration Testing:**
   - End-to-end workflow testing
   - Database integration testing
   - External API integration testing
   - User authentication flow testing
   - Data import/export testing

3. **Build Automated Testing Pipeline:**
   - GitHub Actions CI/CD setup
   - Automated test execution on commits
   - Test coverage reporting
   - Performance testing automation
   - Security vulnerability scanning

4. **Implement User Acceptance Testing:**
   - Test scenarios for each user role
   - Business workflow validation
   - Data accuracy verification
   - Performance benchmarking
   - Usability testing protocols

5. **Create Testing Documentation:**
   - Test case documentation
   - Testing procedures manual
   - Bug reporting templates
   - Performance benchmarks
   - Quality assurance checklists

6. **Add Quality Monitoring:**
   - Code quality metrics
   - Performance monitoring
   - Error tracking and alerting
   - User feedback collection
   - Continuous improvement processes

Ensure all critical business functions are thoroughly tested and validated.
```

### Expected Deliverables:
- [ ] Comprehensive unit test suite implemented
- [ ] Integration testing framework working
- [ ] Automated testing pipeline active
- [ ] User acceptance testing procedures created
- [ ] Quality monitoring systems functional

---

## PROMPT 12: Railway Deployment and Production Setup

### Context Required:
- `/context/deployment-configs/railway_configuration.md`
- `/context/technical-specifications/production_requirements.md`

### Objective:
Deploy the application to Railway with proper production configuration.

### Instructions for Claude:
```
Using the deployment configuration in /context/deployment-configs/railway_configuration.md, help me deploy the Sentia Manufacturing Planning Dashboard to Railway.

I need you to:

1. **Configure Railway Deployment:**
   - Set up Railway project with three environments
   - Configure automatic deployments from GitHub branches
   - Set up environment variables for each environment
   - Configure custom domains and SSL certificates
   - Set up database connections to Neon PostgreSQL

2. **Implement Production Optimizations:**
   - Enable production-grade logging
   - Configure caching strategies
   - Optimize database queries and connections
   - Set up CDN for static assets
   - Enable compression and minification

3. **Create Deployment Pipeline:**
   - Automated deployment from development branch
   - Staging deployment to test environment
   - Production deployment with approval gates
   - Rollback procedures and blue-green deployment
   - Database migration automation

4. **Set Up Monitoring and Alerting:**
   - Application performance monitoring
   - Error tracking and alerting
   - Uptime monitoring
   - Resource usage monitoring
   - Custom business metrics tracking

5. **Implement Security Measures:**
   - HTTPS enforcement
   - Security headers configuration
   - Rate limiting and DDoS protection
   - Environment variable encryption
   - Access logging and monitoring

6. **Create Backup and Recovery:**
   - Automated database backups
   - Application state backups
   - Disaster recovery procedures
   - Point-in-time recovery capabilities
   - Cross-region backup replication

Ensure the production deployment is secure, scalable, and highly available.
```

### Expected Deliverables:
- [ ] Railway deployment configured for all environments
- [ ] Production optimizations implemented
- [ ] Automated deployment pipeline working
- [ ] Monitoring and alerting systems active
- [ ] Backup and recovery procedures established

---

## PROMPT 13: Documentation and User Training Materials

### Context Required:
- `/context/business-requirements/user_workflows.md`
- `/context/technical-specifications/system_architecture.md`

### Objective:
Create comprehensive documentation and user training materials.

### Instructions for Claude:
```
Using the user workflow requirements in /context/business-requirements/user_workflows.md, help me create comprehensive documentation and training materials.

I need you to:

1. **Create User Documentation:**
   - Getting started guide with screenshots
   - Feature-by-feature user manual
   - Workflow tutorials for each user role
   - Troubleshooting guide and FAQ
   - Video tutorial scripts

2. **Develop Technical Documentation:**
   - System architecture documentation
   - API documentation with examples
   - Database schema documentation
   - Deployment and maintenance guides
   - Security and compliance documentation

3. **Build Interactive Help System:**
   - In-app help tooltips and guides
   - Interactive tutorial system
   - Contextual help based on user actions
   - Search functionality for help content
   - Feedback system for documentation

4. **Create Training Materials:**
   - Role-based training curricula
   - Hands-on exercise materials
   - Assessment and certification tests
   - Training presentation slides
   - Quick reference cards

5. **Implement Knowledge Base:**
   - Searchable knowledge base system
   - Article categorization and tagging
   - User contribution system
   - Version control for documentation
   - Analytics for content usage

6. **Add Support Features:**
   - In-app support ticket system
   - Live chat integration
   - Screen sharing capabilities
   - Remote assistance tools
   - User feedback collection

Ensure all documentation is clear, comprehensive, and regularly updated.
```

### Expected Deliverables:
- [ ] Comprehensive user documentation created
- [ ] Technical documentation completed
- [ ] Interactive help system implemented
- [ ] Training materials developed
- [ ] Knowledge base and support features active

---

## PROMPT 14: Performance Optimization and Final Polish

### Context Required:
- `/context/technical-specifications/performance_requirements.md`
- `/context/business-requirements/scalability_needs.md`

### Objective:
Optimize application performance and add final polish for production readiness.

### Instructions for Claude:
```
Using the performance requirements in /context/technical-specifications/performance_requirements.md, help me optimize the application for production performance.

I need you to:

1. **Implement Performance Optimizations:**
   - Database query optimization and indexing
   - Caching strategies for frequently accessed data
   - Lazy loading for large datasets
   - Code splitting and minification
   - Image optimization and compression

2. **Add Scalability Features:**
   - Horizontal scaling preparation
   - Load balancing configuration
   - Database connection pooling
   - Asynchronous task processing
   - Microservices architecture preparation

3. **Create Performance Monitoring:**
   - Real-time performance metrics
   - Database performance monitoring
   - User experience analytics
   - Resource usage tracking
   - Performance alerting system

4. **Implement Final UI Polish:**
   - Smooth animations and transitions
   - Loading states and progress indicators
   - Error state handling and recovery
   - Accessibility improvements (WCAG compliance)
   - Cross-browser compatibility testing

5. **Add Advanced Features:**
   - Offline functionality for critical features
   - Progressive Web App (PWA) capabilities
   - Push notifications for important alerts
   - Advanced search and filtering
   - Bulk operations and batch processing

6. **Conduct Final Testing:**
   - Load testing and stress testing
   - Security penetration testing
   - Usability testing with real users
   - Cross-device compatibility testing
   - Performance benchmarking

Ensure the application meets enterprise-grade performance and reliability standards.
```

### Expected Deliverables:
- [ ] Performance optimizations implemented
- [ ] Scalability features added
- [ ] Performance monitoring active
- [ ] Final UI polish completed
- [ ] Advanced features functional and tested

---

## Execution Guidelines for Daniel

### Before Starting Each Prompt:
1. **Read the specified context files** thoroughly
2. **Understand the business requirements** for that component
3. **Review any dependencies** from previous prompts
4. **Set up your development environment** for that specific task

### While Executing Each Prompt:
1. **Reference context files explicitly** when asking Claude for help
2. **Test each component** as you build it
3. **Commit your work** regularly to the development branch
4. **Document any issues** or deviations from the prompt
5. **Ask for clarification** if requirements are unclear

### After Completing Each Prompt:
1. **Test the functionality** thoroughly
2. **Update documentation** if needed
3. **Commit and push** your changes
4. **Mark the prompt as complete** in your tracking system
5. **Prepare for the next prompt** by reviewing its requirements

### Quality Checkpoints:
- **After Prompt 4**: Verify data import and validation works correctly
- **After Prompt 7**: Test all forecasting and optimization engines
- **After Prompt 10**: Conduct full system integration testing
- **After Prompt 12**: Perform production deployment testing
- **After Prompt 14**: Complete final quality assurance review

### Success Criteria:
Each prompt should result in working, tested functionality that integrates seamlessly with previous components and meets the specified business requirements.

---

**Ready to begin with Prompt 1? Confirm your understanding and let's start building Sentia's world-class Manufacturing Planning Dashboard!**

