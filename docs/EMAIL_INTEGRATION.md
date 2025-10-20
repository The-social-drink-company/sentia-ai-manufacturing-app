# Email Integration Documentation

## Overview

The CapLiquify Manufacturing Platform now includes comprehensive email notification capabilities using Microsoft Graph API. This system supports both admin notifications and data upload notifications using the configured email addresses.

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```env
# Microsoft Email Configuration
MICROSOFT_EMAIL_CLIENT_ID=peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM
MICROSOFT_EMAIL_CLIENT_SECRET=c16d6fba-0e6b-45ea-a016-eb697ff7a7ae
MICROSOFT_EMAIL_TENANT_ID=common
MICROSOFT_EMAIL_SCOPE=https://graph.microsoft.com/.default

# Email Addresses
ADMIN_EMAIL=admin@app.sentiaspirits.com
DATA_EMAIL=data@app.sentiaspirits.com
```

## Services

### 1. EmailService (`services/email/EmailService.js`)

Core service for sending emails via Microsoft Graph API.

**Key Methods:**
- `sendEmail(emailData)` - Send custom email
- `sendAdminNotification(subject, body, attachments)` - Send admin notification
- `sendDataUploadNotification(subject, body, attachments)` - Send data upload notification
- `sendSystemAlert(alertType, message, context)` - Send system alert
- `testConfiguration()` - Test email configuration

### 2. NotificationService (`services/email/NotificationService.js`)

High-level service for different types of notifications.

**Key Methods:**
- `sendSystemHealthAlert(level, component, message, metrics)` - System health alerts
- `sendDataImportNotification(status, details)` - Data import notifications
- `sendUserActionNotification(action, user, details)` - User action notifications
- `sendPerformanceAlert(metric, value, threshold, unit)` - Performance alerts
- `sendDataQualityAlert(dataset, qualityIssues)` - Data quality alerts
- `sendExcelUploadNotification(filename, recordCount, results)` - Excel upload notifications

### 3. EmailUtils (`services/email/emailUtils.js`)

Utility class for easy integration throughout the application.

**Key Methods:**
- `notifyAdmin(subject, message, level)` - Quick admin notification
- `notifyDataUpload(subject, message, level)` - Quick data upload notification
- `alertSystemError(component, error, context)` - System error alert
- `notifyDataImportSuccess(filename, recordCount, details)` - Data import success
- `notifyDataImportError(filename, error, details)` - Data import error
- `notifyExcelUpload(filename, recordCount, results)` - Excel upload notification

## API Endpoints

All email endpoints are available under `/api/email/`:

### Test Configuration
```
GET /api/email/test
```

### Send Custom Email
```
POST /api/email/send
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "body": "Email body content",
  "isHtml": true,
  "attachments": []
}
```

### Send Admin Notification
```
POST /api/email/admin
Content-Type: application/json

{
  "subject": "Admin Alert",
  "body": "Alert message content",
  "attachments": []
}
```

### Send Data Upload Notification
```
POST /api/email/data
Content-Type: application/json

{
  "subject": "Data Upload Alert",
  "body": "Upload message content",
  "attachments": []
}
```

### Send System Alert
```
POST /api/email/system-alert
Content-Type: application/json

{
  "alertType": "error",
  "message": "System error occurred",
  "context": {
    "component": "database",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Send Data Processing Notification
```
POST /api/email/data-processing
Content-Type: application/json

{
  "processType": "Excel Import",
  "status": "success",
  "details": {
    "filename": "data.xlsx",
    "recordCount": 1000
  }
}
```

## Usage Examples

### 1. Basic Integration

```javascript
import EmailUtils from './services/email/emailUtils.js';

// Send admin notification
await EmailUtils.notifyAdmin(
  'System Maintenance',
  'Scheduled maintenance will begin at 2 AM',
  'info'
);

// Send data upload notification
await EmailUtils.notifyDataUpload(
  'New Data Available',
  'Sales data for Q4 has been uploaded',
  'success'
);
```

### 2. System Monitoring Integration

```javascript
// In your monitoring service
import EmailUtils from './services/email/emailUtils.js';

// Alert on system errors
try {
  // Some system operation
} catch (error) {
  await EmailUtils.alertSystemError(
    'Database Service',
    error.message,
    { 
      timestamp: new Date().toISOString(),
      userId: req.user?.id 
    }
  );
}

// Alert on performance issues
if (responseTime > 5000) {
  await EmailUtils.alertPerformance(
    'API Response Time',
    responseTime,
    5000,
    'ms'
  );
}
```

### 3. Data Import Integration

```javascript
// In your data import service
import EmailUtils from './services/email/emailUtils.js';

try {
  const result = await importData(file);
  
  // Notify success
  await EmailUtils.notifyDataImportSuccess(
    file.originalname,
    result.recordCount,
    {
      processingTime: result.processingTime,
      validRecords: result.validRecords,
      errorRecords: result.errorRecords
    }
  );
} catch (error) {
  // Notify error
  await EmailUtils.notifyDataImportError(
    file.originalname,
    error.message,
    {
      errorType: error.name,
      stack: error.stack
    }
  );
}
```

### 4. Excel Upload Integration

```javascript
// In your Excel upload handler
import EmailUtils from './services/email/emailUtils.js';

const processExcelUpload = async (file, results) => {
  try {
    // Process the file
    const processedData = await processFile(file);
    
    // Send notification
    await EmailUtils.notifyExcelUpload(
      file.originalname,
      processedData.length,
      {
        sheets: processedData.sheets,
        columns: processedData.columns,
        processingTime: processedData.processingTime
      }
    );
  } catch (error) {
    await EmailUtils.notifyDataUpload(
      'Excel Upload Failed',
      `Failed to process ${file.originalname}: ${error.message}`,
      'error'
    );
  }
};
```

## Email Templates

The system includes pre-formatted HTML email templates with:

- **Admin Notifications**: Dark header with Sentia branding
- **Data Upload Notifications**: Green header for data processing
- **System Alerts**: Color-coded alerts (error=red, warning=yellow, info=blue, success=green)
- **Responsive Design**: Works on desktop and mobile devices

## Error Handling

All email operations include comprehensive error handling:

- Authentication failures are logged and retried
- Network errors are caught and logged
- Invalid email addresses are validated before sending
- Rate limiting is handled automatically by Microsoft Graph API

## Testing

Test the email configuration:

```bash
# Test via API
curl -X GET http://localhost:5000/api/email/test

# Test notifications
curl -X GET http://localhost:5000/api/email/test-notifications
```

Or programmatically:

```javascript
import EmailUtils from './services/email/emailUtils.js';

// Test email configuration
const emailTest = await EmailUtils.testEmail();
console.log(emailTest);

// Test notification service
const notificationTest = await EmailUtils.testNotifications();
console.log(notificationTest);
```

## Security Considerations

1. **Credentials**: Store Microsoft Graph credentials securely in environment variables
2. **Rate Limiting**: Microsoft Graph API has rate limits - the service handles this automatically
3. **Validation**: All email addresses are validated before sending
4. **Logging**: All email operations are logged for audit purposes

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Check Microsoft Graph credentials and permissions
2. **Email Not Sent**: Verify recipient email addresses and network connectivity
3. **Template Issues**: Check HTML formatting in email bodies

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=debug` in your environment variables.

## Future Enhancements

- Email templates customization
- Bulk email capabilities
- Email scheduling
- Advanced attachment handling
- Email analytics and tracking
