# Working Capital Management Module

## Overview

The Working Capital Management module provides comprehensive financial monitoring and optimization tools for manufacturing operations. It integrates with Xero accounting software to provide real-time financial data and intelligent recommendations.

## Features

### Core Functionality
- **Real-time Working Capital Metrics**: Current ratio, quick ratio, cash conversion cycle
- **Accounts Receivable Management**: DSO tracking, aging analysis, collection insights
- **Accounts Payable Optimization**: DPO management, discount opportunities, aging reports
- **Cash Flow Forecasting**: 90-day projections with scenario analysis
- **Optimization Recommendations**: AI-powered suggestions for improving working capital

### Data Sources
- **Xero Integration**: Live financial data from connected Xero organization
- **Mock Data Fallback**: Sample data when Xero is not connected
- **Real-time Updates**: Automatic data refresh every 15 minutes

### Audit & Compliance
- **Comprehensive Audit Trail**: All user actions logged with compliance standards
- **SOX Compliance**: Financial data access tracking
- **GDPR Compliance**: Data privacy and protection
- **Performance Monitoring**: Response times and system metrics

## Xero Integration Setup

### Prerequisites

1. **Xero Developer Account**: Create at [https://developer.xero.com](https://developer.xero.com)
2. **Xero App Registration**: Register your application in Xero Developer Portal
3. **OAuth 2.0 Configuration**: Set up OAuth endpoints and scopes

### Environment Variables

Add these variables to your `.env` file or Render environment settings:

```bash
# Xero OAuth Configuration
VITE_XERO_CLIENT_ID=your-xero-client-id-here
XERO_CLIENT_SECRET=your-xero-client-secret-here

# Optional: Custom redirect URI (defaults to current domain)
# XERO_REDIRECT_URI=https://your-domain.com/auth/xero/callback
```

### Xero App Configuration

In your Xero Developer Portal app settings:

1. **App Type**: Web Application
2. **Redirect URI**: `https://your-domain.com/auth/xero/callback`
3. **Scopes Required**:
   - `accounting.transactions` - Read invoices and bills
   - `accounting.contacts` - Read customer and supplier information
   - `accounting.settings` - Read organization settings
   - `accounting.reports.read` - Access financial reports

### OAuth Flow

1. User clicks "Connect to Xero" button
2. Redirected to Xero authorization page
3. User grants permissions to your app
4. Xero redirects back with authorization code
5. App exchanges code for access/refresh tokens
6. Tokens stored securely in localStorage
7. API calls authenticated with Bearer token

### Data Mapping

| Xero Data | Working Capital Use |
|-----------|-------------------|
| Invoices (AUTHORISED) | Accounts Receivable aging |
| Bills (AUTHORISED) | Accounts Payable aging |
| Bank Accounts | Cash position |
| Balance Sheet Report | Working capital calculation |
| Profit & Loss Report | Cash flow analysis |

## Component Architecture

### Hooks
- **`useXeroIntegration`** - OAuth authentication and connection management
- **`useXeroWorkingCapitalData`** - Fetch and combine all Xero financial data
- **`useWorkingCapitalMetrics`** - Main data hook (Xero + mock fallback)
- **`useAuditTrail`** - Audit logging for all user actions

### Components
- **`XeroConnection`** - OAuth authentication UI
- **`WorkingCapitalDashboard`** - Main dashboard layout
- **`MetricCard`** - KPI display widgets
- **`AgingChart`** - AR/AP aging visualizations
- **`CashConversionCycle`** - CCC trend analysis
- **`CashFlowForecast`** - 90-day cash flow projections
- **`OptimizationRecommendations`** - AI-powered suggestions

### Services
- **`xeroService`** - Xero API integration and data processing
- **`auditService`** - Comprehensive audit logging
- **`workingCapitalService`** - Mock data and calculations

## Key Metrics Calculated

### Working Capital
- **Working Capital** = Current Assets - Current Liabilities
- **Current Ratio** = Current Assets / Current Liabilities
- **Quick Ratio** = (Current Assets - Inventory) / Current Liabilities

### Cash Conversion Cycle
- **DSO (Days Sales Outstanding)** = (Accounts Receivable / Revenue) × Days
- **DPO (Days Payable Outstanding)** = (Accounts Payable / COGS) × Days
- **DIO (Days Inventory Outstanding)** = (Inventory / COGS) × Days
- **CCC** = DSO + DIO - DPO

### Aging Analysis
- **Current** (0-30 days)
- **31-60 days**
- **61-90 days**
- **90+ days** (overdue)

## Data Refresh Strategy

### Automatic Refresh
- **Dashboard Load**: Fresh data on page load
- **Periodic Updates**: Every 15 minutes via background timer
- **Connection Events**: When Xero connection status changes

### Manual Refresh
- **User-Initiated**: Refresh button in dashboard header
- **Post-Authentication**: After successful Xero connection
- **Error Recovery**: Retry mechanism for failed API calls

### Caching Strategy
- **Xero Data**: 5-15 minute cache depending on data type
- **Mock Data**: No caching (generated fresh)
- **Connection Status**: Cached for 5 minutes

## Error Handling

### Xero API Errors
- **401 Unauthorized**: Automatic token refresh
- **Rate Limiting**: Exponential backoff retry
- **Network Issues**: Graceful fallback to cached data
- **Invalid Data**: Validation and sanitization

### User Experience
- **Loading States**: Progress indicators during data fetch
- **Error Messages**: User-friendly error descriptions
- **Fallback Data**: Sample data when APIs fail
- **Connection Guidance**: Clear instructions for Xero setup

## Security & Privacy

### Token Management
- **OAuth 2.0**: Industry-standard authentication
- **Refresh Tokens**: Automatic token renewal
- **Secure Storage**: localStorage with expiration tracking
- **Token Cleanup**: Automatic cleanup on logout/disconnect

### Data Protection
- **Data Sanitization**: Remove sensitive information from logs
- **Audit Trails**: Comprehensive activity logging
- **Error Masking**: Sensitive data masked in error messages
- **Session Management**: Automatic session timeout

### Compliance Features
- **SOX Compliance**: Financial data access tracking
- **GDPR Compliance**: Data privacy protection
- **ISO27001**: Security management standards
- **PCI DSS**: Payment data security (if applicable)

## Testing

### Unit Tests
- Service layer functions
- Data transformation logic
- Hook behavior and state management
- Component rendering and interactions

### Integration Tests
- Xero API integration
- OAuth authentication flow
- Data synchronization accuracy
- Error handling scenarios

### E2E Tests
- Complete user workflows
- Authentication processes
- Data refresh cycles
- Export functionality

## Troubleshooting

### Common Issues

**"Xero not connected" error**
- Check environment variables are set
- Verify Xero app configuration
- Confirm redirect URI matches

**"Token expired" message**
- Normal behavior - tokens refresh automatically
- Check if refresh token is still valid
- Re-authenticate if refresh fails

**No data showing**
- Verify Xero organization has transactions
- Check date ranges in API calls
- Confirm required scopes are granted

**Slow performance**
- Review API call frequency
- Check network connectivity
- Monitor rate limiting responses

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('DEBUG_WORKING_CAPITAL', 'true')
```

This will log detailed information about:
- API requests and responses
- Token refresh attempts
- Data transformation processes
- Cache hit/miss statistics

## Performance Optimization

### API Efficiency
- **Batch Requests**: Group related API calls
- **Selective Queries**: Only fetch required fields
- **Conditional Requests**: Use If-Modified-Since headers
- **Response Caching**: Cache responses appropriately

### UI Performance
- **React.memo**: Prevent unnecessary re-renders
- **useMemo/useCallback**: Optimize expensive calculations
- **Lazy Loading**: Load components on demand
- **Virtualization**: Handle large data sets efficiently

### Network Optimization
- **Request Deduplication**: Prevent duplicate API calls
- **Background Updates**: Refresh data without blocking UI
- **Progressive Loading**: Show partial data while loading
- **Offline Support**: Cache data for offline viewing

## Future Enhancements

### Planned Features
- **Multi-Currency Support**: Handle multiple currencies
- **Historical Analysis**: Trend analysis over time
- **Predictive Analytics**: ML-powered forecasting
- **Custom Alerts**: User-defined threshold alerts
- **Bulk Operations**: Mass updates and corrections

### Integration Opportunities
- **QuickBooks Online**: Alternative accounting integration
- **SAP Business One**: ERP system integration
- **Power BI**: Advanced reporting and dashboards
- **Slack/Teams**: Notification integrations
- **Email Reports**: Automated report distribution

## Support & Documentation

- **GitHub Issues**: [Report bugs or request features](https://github.com/your-repo/issues)
- **API Documentation**: Detailed endpoint documentation
- **Video Tutorials**: Step-by-step setup guides
- **Best Practices**: Implementation recommendations
- **Community Forum**: User discussions and support