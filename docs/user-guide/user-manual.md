# Sentia Manufacturing Dashboard - User Manual

## Table of Contents
1. [Dashboard Overview](#dashboard-overview)
2. [Product Management](#product-management)
3. [Demand Forecasting](#demand-forecasting)
4. [Stock Optimization](#stock-optimization)
5. [Production Scheduling](#production-scheduling)
6. [API Integrations](#api-integrations)
7. [Data Import/Export](#data-importexport)
8. [Reporting & Analytics](#reporting--analytics)
9. [User Management](#user-management)
10. [System Administration](#system-administration)

## Dashboard Overview

### Main Dashboard Features

The main dashboard provides a comprehensive overview of your manufacturing operations:

**Key Performance Indicators (KPIs)**
- Total Revenue (current month vs. previous month)
- Inventory Value across all locations
- Production Efficiency percentage
- Order Fulfillment Rate
- Cash Flow Status

**Quick Actions Panel**
- Generate New Forecast
- Create Production Schedule
- Import Sales Data
- View Critical Alerts
- Access Recent Reports

**Charts and Visualizations**
- Sales trends by product and region
- Inventory levels by location
- Production capacity utilization
- Forecast accuracy metrics

### Real-time Alerts System

The dashboard displays color-coded alerts:
- **Red**: Critical issues requiring immediate attention
- **Yellow**: Warnings that need monitoring
- **Green**: Normal operations or positive status
- **Blue**: Information updates

**Common Alert Types:**
- Stock out warnings
- Production delays
- Integration failures
- Forecast accuracy issues
- Quality control problems

## Product Management

### Product Catalog Structure

Sentia's product catalog is organized around:
- **3 Product Types**: GABA Red, GABA Black, GABA Gold
- **3 Regional Variants**: UK, EU, USA
- **9 Total SKUs**: Each product x region combination

### Adding Products

1. **Navigate to Products Module**
   - Click **Products** in main navigation
   - Select **Add New Product**

2. **Product Information Form**
   ```
   Product Name: [e.g., "GABA Red UK"]
   SKU: [Must be unique, e.g., "GABA-RED-UK"]
   Cost Price: [Manufacturing cost in local currency]
   Selling Price: [Retail price]
   Lead Time: [Production lead time in days]
   Market: [UK/EU/USA dropdown]
   Product Type: [Red/Black/Gold dropdown]
   ```

3. **Advanced Settings**
   - Minimum order quantity
   - Maximum batch size
   - Quality control parameters
   - Regulatory compliance info

### Managing Existing Products

**Edit Product Details:**
- Click on any product in the catalog
- Modify fields as needed
- Save changes (requires appropriate permissions)

**Bulk Operations:**
- Select multiple products using checkboxes
- Apply bulk price updates
- Update lead times across products
- Export product data to CSV

**Product Performance Metrics:**
- Profit margins by product
- Sales velocity analysis
- Inventory turnover rates
- Regional performance comparison

## Demand Forecasting

### Forecasting Methods Available

**1. Simple Moving Average**
- Best for: Stable demand patterns
- Period: Configurable (default 12 weeks)
- Use case: Basic forecasting needs

**2. Exponential Smoothing**
- Best for: Trending data
- Alpha parameter: Auto-optimized or manual
- Use case: Products with growth trends

**3. Seasonal Decomposition**
- Best for: Products with seasonal patterns
- Identifies: Trend, seasonality, residual
- Use case: Holiday or seasonal products

**4. ARIMA (Advanced)**
- Best for: Complex time series
- Auto-parameter selection available
- Use case: Sophisticated forecasting needs

### Creating Forecasts

**Step 1: Select Parameters**
```
Products: [Select one or multiple]
Time Horizon: [4 weeks to 52 weeks]
Forecasting Method: [Choose from available methods]
Historical Period: [Data range to analyze]
```

**Step 2: Generate Forecast**
- Click **Generate Forecast**
- Wait for processing (typically 10-30 seconds)
- Review results in interactive charts

**Step 3: Validate Results**
- Check forecast accuracy metrics
- Compare with historical patterns
- Adjust parameters if needed
- Save approved forecasts

### Forecast Accuracy Metrics

**Mean Absolute Error (MAE)**
- Average absolute difference between actual and predicted
- Lower values indicate better accuracy

**Mean Absolute Percentage Error (MAPE)**
- Percentage-based accuracy measure
- Industry benchmark: <15% for good accuracy

**Root Mean Square Error (RMSE)**
- Emphasizes larger errors
- Useful for identifying outliers

### Forecast Management

**Saving and Naming Forecasts:**
- Custom forecast names
- Version control
- Historical forecast archive
- Export capabilities

**Forecast Comparison:**
- Side-by-side method comparison
- Performance tracking over time
- Best method identification
- Automated method selection

## Stock Optimization

### Inventory Optimization Features

**Safety Stock Calculation:**
- Service level targets (95%, 98%, 99.5%)
- Demand variability analysis
- Lead time uncertainty
- Custom safety factors

**Reorder Point Determination:**
- Lead time demand calculation
- Safety stock inclusion
- Supplier reliability factors
- Seasonal adjustments

**Economic Order Quantity (EOQ):**
- Optimal order size calculation
- Carrying cost optimization
- Order frequency balance
- Quantity discount consideration

### Multi-location Inventory

**Supported Locations:**
- Own warehouses (UK, EU, USA)
- Amazon FBA centers
- Third-party logistics providers
- In-transit inventory

**Allocation Optimization:**
- Demand-based allocation
- Cost-optimized distribution
- Service level maintenance
- Transportation cost inclusion

### Setting Optimization Parameters

**Cost Parameters:**
```
Holding Cost Rate: [Annual percentage, e.g., 25%]
Order Cost: [Fixed cost per order]
Stockout Cost: [Lost sales penalty]
Transportation Costs: [Per unit shipping]
```

**Service Level Targets:**
```
A-Class Items: 99.5% service level
B-Class Items: 98% service level  
C-Class Items: 95% service level
```

**Constraints:**
```
Maximum Inventory Investment: [Budget limit]
Warehouse Capacity: [Space constraints]
Minimum Order Quantities: [Supplier requirements]
```

## Production Scheduling

### Scheduling Components

**Jobs (Production Orders):**
- Product to manufacture
- Quantity required
- Due date
- Priority level
- Quality requirements

**Resources (Production Assets):**
- Manufacturing equipment
- Labor resources
- Capacity (units per hour)
- Operating costs
- Availability schedules

**Constraints:**
- Resource capacity limits
- Setup times between products
- Quality control requirements
- Maintenance schedules

### Creating Production Schedules

**Step 1: Define Planning Horizon**
- Start date (typically today)
- End date (usually 2-4 weeks out)
- Working calendar setup

**Step 2: Add Production Jobs**
- Import from sales orders
- Manual job creation
- Bulk job import from CSV
- Recurring job templates

**Step 3: Set Optimization Objectives**
- Minimize total completion time
- Maximize resource utilization
- Meet due date commitments
- Minimize setup costs

**Step 4: Run Optimization**
- Constraint satisfaction solving
- Multiple algorithm options
- Real-time progress tracking
- Feasibility checking

### Schedule Management

**Schedule Approval Process:**
- Review optimized schedule
- Manual adjustments if needed
- Stakeholder approval
- Schedule publication

**Real-time Updates:**
- Job status tracking
- Resource availability changes
- Rush order handling
- Schedule re-optimization

**Performance Monitoring:**
- On-time delivery metrics
- Resource utilization rates
- Schedule adherence
- Efficiency improvements

## API Integrations

### Supported Integrations

**Amazon SP-API Integration:**
- Order management
- Inventory synchronization
- Sales reporting
- FBA shipment tracking
- Performance metrics

**Shopify API Integration:**
- Multi-store management
- Order processing
- Product synchronization
- Customer data
- Payment tracking

**Financial System Integration:**
- Xero accounting connectivity
- Multi-currency support
- Tax calculation
- Financial reporting

### Setting Up Integrations

**Amazon SP-API Setup:**
1. Navigate to **Integrations** > **Amazon**
2. Enter API credentials:
   ```
   Client ID: [From Amazon Developer Console]
   Client Secret: [Secure credential]
   Refresh Token: [OAuth token]
   Marketplace IDs: [UK: A1F83G8C2ARO7P, USA: ATVPDKIKX0DER]
   ```
3. Test connection
4. Configure sync schedules
5. Map product SKUs

**Shopify Setup:**
1. Go to **Integrations** > **Shopify**
2. For each store (UK, EU, USA):
   ```
   Store URL: [your-store.myshopify.com]
   API Key: [From Shopify admin]
   Password: [Private app password]
   Webhook Secret: [For real-time updates]
   ```
3. Test connectivity
4. Configure product mapping
5. Set up order sync

### Integration Monitoring

**Health Dashboard:**
- Connection status indicators
- Last sync timestamps
- Error logs and alerts
- Data sync volumes
- Performance metrics

**Troubleshooting Common Issues:**
- Authentication failures: Check credentials
- Rate limiting: Review API call frequency
- Data mapping errors: Verify SKU matching
- Sync delays: Monitor queue status

## Data Import/Export

### Supported File Formats

**Import Formats:**
- CSV (Comma Separated Values)
- Excel (.xlsx, .xls)
- JSON (for API integration)
- XML (for legacy systems)

**Export Formats:**
- CSV for data analysis
- Excel for reporting
- PDF for documentation
- JSON for API consumption

### Data Import Process

**Step 1: Prepare Data File**
- Use provided templates
- Validate data format
- Check required fields
- Remove duplicates

**Step 2: Upload File**
- Select import type (products, sales, inventory)
- Choose file from computer
- Map columns to system fields
- Set import options

**Step 3: Validate and Process**
- Review data preview
- Fix validation errors
- Confirm import settings
- Start processing

**Step 4: Monitor Progress**
- Real-time progress tracking
- Error reporting
- Success confirmation
- Import summary

### Common Import Types

**Sales Data Import:**
```
Required Fields:
- Date (YYYY-MM-DD format)
- Product SKU
- Quantity Sold
- Sales Channel
- Market Region
```

**Inventory Data Import:**
```
Required Fields:
- Product SKU
- Location
- Quantity Available
- Unit Cost
- Last Updated Date
```

**Product Catalog Import:**
```
Required Fields:
- Product Name
- SKU (unique)
- Cost Price
- Selling Price
- Lead Time (days)
```

### Data Quality Controls

**Validation Rules:**
- Duplicate detection
- Format verification
- Range checking
- Reference validation
- Business rule enforcement

**Error Handling:**
- Detailed error reports
- Line-by-line error identification
- Suggestion for corrections
- Partial import options
- Rollback capabilities

## Reporting & Analytics

### Standard Reports

**Sales Performance Reports:**
- Revenue by product/region/channel
- Sales trend analysis
- Year-over-year comparisons
- Seasonal pattern analysis
- Top/bottom performers

**Inventory Reports:**
- Stock levels by location
- Inventory valuation
- Turnover analysis
- Stockout incidents
- Carrying cost analysis

**Production Reports:**
- Manufacturing efficiency
- Resource utilization
- Quality metrics
- Schedule adherence
- Cost analysis

**Financial Reports:**
- Profit margin analysis
- Working capital reports
- Cash flow projections
- Currency impact analysis
- Cost center performance

### Custom Report Builder

**Creating Custom Reports:**
1. Select **Reports** > **Custom Report Builder**
2. Choose data sources (products, sales, inventory)
3. Select dimensions (time, product, location)
4. Add measures (quantity, revenue, costs)
5. Apply filters and sorting
6. Choose visualization type
7. Save and schedule report

**Report Scheduling:**
- Daily, weekly, monthly frequencies
- Email distribution lists
- Automated generation
- Export format selection
- Conditional delivery rules

### Analytics Dashboard

**Interactive Visualizations:**
- Drag-and-drop chart builder
- Real-time data updates
- Drill-down capabilities
- Export to various formats
- Sharing and collaboration

**Key Performance Indicators:**
- Customizable KPI widgets
- Target vs. actual tracking
- Trend indicators
- Alert thresholds
- Historical comparisons

## User Management

### User Roles and Permissions

**Role-Based Access Control:**

**Administrator:**
- Full system access
- User management
- System configuration
- Security settings
- Integration management

**Manager:**
- View all modules
- Create/edit forecasts
- Manage production schedules
- Access all reports
- Limited user management

**Operator:**
- Dashboard access
- View reports
- Data entry capabilities
- Basic forecasting
- Production monitoring

**Viewer:**
- Read-only access
- Dashboard viewing
- Report access
- No editing capabilities
- Limited data export

### Managing User Accounts

**Adding New Users:**
1. Navigate to **Admin** > **User Management**
2. Click **Add User**
3. Fill user details:
   ```
   First Name: [Required]
   Last Name: [Required]  
   Email: [Must be unique]
   Role: [Select from dropdown]
   Initial Password: [System generated or manual]
   ```
4. Send welcome email
5. User activates account

**User Account Management:**
- Reset passwords
- Update roles and permissions
- Deactivate accounts
- View login history
- Monitor user activity

### Security Settings

**Password Policies:**
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers
- Special character requirements
- Regular password changes
- No password reuse

**Session Management:**
- Automatic timeout after inactivity
- Secure session tokens
- Single sign-on support
- Multi-device management
- Force logout capabilities

## System Administration

### System Configuration

**General Settings:**
```
Company Information:
- Company Name
- Address and Contact Details
- Time Zone Settings
- Currency Preferences
- Language Options
```

**Business Settings:**
```
Fiscal Year Configuration:
- Financial year start/end dates
- Reporting periods
- Budget cycles

Operating Parameters:
- Default lead times
- Safety stock percentages
- Service level targets
- Optimization preferences
```

### Maintenance Features

**Database Maintenance:**
- Data cleanup routines
- Archive old data
- Rebuild indexes
- Performance monitoring
- Backup verification

**System Health Monitoring:**
- Server performance metrics
- Database connectivity
- API integration status
- User session monitoring
- Error rate tracking

**Automated Tasks:**
- Scheduled forecasting runs
- Inventory optimization
- Data synchronization
- Report generation
- Backup procedures

### Security and Compliance

**Security Monitoring:**
- Failed login attempts
- Unusual access patterns
- Data access logs
- System changes tracking
- Compliance reporting

**Backup and Recovery:**
- Automated daily backups
- Point-in-time recovery
- Disaster recovery procedures
- Data retention policies
- Business continuity planning

**Compliance Features:**
- Audit trail maintenance
- Data privacy controls
- Regulatory reporting
- Access control verification
- Security assessment tools

## Troubleshooting Common Issues

### Performance Issues

**Slow Dashboard Loading:**
- Clear browser cache
- Check internet connection
- Verify system status
- Reduce concurrent users
- Contact support if persistent

**Forecast Generation Delays:**
- Reduce forecast horizon
- Limit number of products
- Check data quality
- Monitor system resources
- Use off-peak hours

### Integration Problems

**Amazon API Connectivity:**
- Verify credentials
- Check rate limiting
- Review marketplace settings
- Update refresh tokens
- Monitor error logs

**Shopify Sync Issues:**
- Test store connectivity
- Verify webhook settings
- Check product mapping
- Review order sync logs
- Restart integration service

### Data Quality Issues

**Import Failures:**
- Validate file format
- Check required fields
- Remove duplicate records
- Verify data ranges
- Use provided templates

**Forecast Accuracy:**
- Review historical data quality
- Check for seasonal patterns
- Adjust forecasting parameters
- Consider external factors
- Update demand drivers

## Getting Additional Help

### Support Channels

**Documentation:**
- Online help system
- Video tutorials
- FAQ section
- Best practices guides
- Release notes

**Support Services:**
- Email support: support@sentia-manufacturing.com
- Live chat during business hours
- Phone support for critical issues
- Screen sharing sessions
- On-site training available

**Community Resources:**
- User forums
- Best practices sharing
- Feature requests
- Beta testing program
- User group meetings

### Training Options

**Self-paced Learning:**
- Interactive tutorials
- Video library
- Practice environments
- Progress tracking
- Certification programs

**Instructor-led Training:**
- New user orientation
- Advanced feature training
- Custom workflow training
- Administrator certification
- Regular webinars

This completes the comprehensive user manual for the Sentia Manufacturing Dashboard. Each section provides detailed instructions for effectively using all system features.