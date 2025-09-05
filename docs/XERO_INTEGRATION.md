# Xero Accounting Integration

This document describes the Xero accounting software integration for the Sentia Manufacturing Dashboard.

## Overview

The Xero integration provides seamless connectivity between the manufacturing dashboard and Xero accounting software, enabling:

- **Financial Data Sync**: Automatically sync financial data between systems
- **Invoice Management**: Create and manage invoices in Xero
- **Contact Management**: Sync customer and supplier contacts
- **Product/Item Management**: Manage inventory items across both systems
- **Financial Reporting**: Access Xero financial reports and analytics

## Configuration

### Environment Variables

The following environment variables need to be configured in your `.env` file:

```env
# Xero Accounting Integration
XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
XERO_REDIRECT_URI=http://localhost:5000/api/xero/callback
XERO_SCOPE=accounting.transactions,accounting.contacts,accounting.settings
```

### API Credentials

- **Client ID**: `9C0CAB921C134476A249E48BBECB8C4B`
- **Client Secret**: `f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5`
- **Redirect URI**: `http://localhost:5000/api/xero/callback`

## Installation

### 1. Install Xero Node.js SDK

```bash
npm install xero-node
```

### 2. Install Xero MCP Server (for Cursor integration)

```bash
# Install globally
npm install -g xero-mcp

# Or install locally
npm install xero-mcp
```

### 3. Start Xero MCP Server

```bash
# Using npm script
npm run xero:mcp

# Or directly
node scripts/start-xero-mcp.js

# Or on Windows
start-xero-mcp.bat
```

## API Endpoints

### Authentication

#### GET `/api/xero/auth`
Initiates the Xero OAuth flow.

**Response:**
```json
{
  "success": true,
  "authUrl": "https://login.xero.com/identity/connect/authorize?...",
  "message": "Redirect user to this URL to authorize Xero access"
}
```

#### GET `/api/xero/callback`
Handles the OAuth callback from Xero.

**Query Parameters:**
- `code`: Authorization code from Xero
- `state`: State parameter for security

**Response:**
```json
{
  "success": true,
  "message": "Successfully connected to Xero",
  "tokenSet": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1234567890
  }
}
```

### Organizations

#### GET `/api/xero/organizations`
Get connected Xero organizations.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "organizations": [
    {
      "organisationID": "uuid",
      "name": "Company Name",
      "shortCode": "COMP",
      "isDemoCompany": false
    }
  ],
  "message": "Successfully fetched organizations"
}
```

### Contacts

#### GET `/api/xero/contacts`
Get contacts from Xero.

**Query Parameters:**
- `tenantId`: Xero organization ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 100)

**Headers:**
- `Authorization: Bearer <access_token>`

#### POST `/api/xero/contacts`
Create or update a contact in Xero.

**Body:**
```json
{
  "tenantId": "organization-uuid",
  "contactData": {
    "name": "Customer Name",
    "emailAddress": "customer@example.com",
    "phones": [
      {
        "phoneType": "MOBILE",
        "phoneNumber": "+1234567890"
      }
    ]
  }
}
```

### Invoices

#### GET `/api/xero/invoices`
Get invoices from Xero.

**Query Parameters:**
- `tenantId`: Xero organization ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 100)

#### POST `/api/xero/invoices`
Create an invoice in Xero.

**Body:**
```json
{
  "tenantId": "organization-uuid",
  "invoiceData": {
    "type": "ACCREC",
    "contact": {
      "contactID": "contact-uuid"
    },
    "lineItems": [
      {
        "description": "Product Description",
        "quantity": 1,
        "unitAmount": 100.00,
        "accountCode": "200"
      }
    ],
    "date": "2024-01-01",
    "dueDate": "2024-01-31"
  }
}
```

### Items/Products

#### GET `/api/xero/items`
Get items/products from Xero.

#### POST `/api/xero/items`
Create or update an item in Xero.

**Body:**
```json
{
  "tenantId": "organization-uuid",
  "itemData": {
    "code": "PROD001",
    "name": "Product Name",
    "description": "Product Description",
    "unitPrice": 100.00,
    "purchaseDetails": {
      "unitPrice": 80.00
    },
    "salesDetails": {
      "unitPrice": 100.00
    }
  }
}
```

### Testing

#### GET `/api/xero/test`
Test the Xero connection.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "organizations": 1,
  "message": "Successfully connected to Xero"
}
```

## Cursor Integration

### Setting up MCP Server in Cursor

1. Open Cursor settings
2. Navigate to Extensions > MCP Servers
3. Add a new server with the following configuration:
   - **Name**: `xero`
   - **Command**: `xero-mcp`
   - **Args**: `["--config", "/path/to/xero-mcp-config.json"]`

### MCP Server Configuration

The MCP server configuration is stored in `xero-mcp-config.json`:

```json
{
  "xero": {
    "clientId": "9C0CAB921C134476A249E48BBECB8C4B",
    "clientSecret": "f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5",
    "redirectUri": "http://localhost:5000/api/xero/callback",
    "scopes": [
      "accounting.transactions",
      "accounting.contacts", 
      "accounting.settings",
      "accounting.reports.read"
    ]
  },
  "server": {
    "port": 3001,
    "host": "localhost"
  }
}
```

## Usage Examples

### 1. Authenticate with Xero

```javascript
// Get authorization URL
const response = await fetch('/api/xero/auth');
const { authUrl } = await response.json();

// Redirect user to authUrl
window.location.href = authUrl;
```

### 2. Get Organizations

```javascript
const response = await fetch('/api/xero/organizations', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const { organizations } = await response.json();
```

### 3. Create a Contact

```javascript
const contactData = {
  tenantId: 'organization-uuid',
  contactData: {
    name: 'New Customer',
    emailAddress: 'customer@example.com'
  }
};

const response = await fetch('/api/xero/contacts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify(contactData)
});
```

### 4. Create an Invoice

```javascript
const invoiceData = {
  tenantId: 'organization-uuid',
  invoiceData: {
    type: 'ACCREC',
    contact: { contactID: 'contact-uuid' },
    lineItems: [{
      description: 'Manufacturing Service',
      quantity: 1,
      unitAmount: 1000.00,
      accountCode: '200'
    }],
    date: new Date().toISOString().split('T')[0]
  }
};

const response = await fetch('/api/xero/invoices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify(invoiceData)
});
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Human-readable error description"
}
```

Common error scenarios:
- **401 Unauthorized**: Invalid or missing access token
- **400 Bad Request**: Missing required parameters
- **500 Internal Server Error**: Xero API errors or server issues

## Security Considerations

1. **Token Storage**: Access tokens should be stored securely (encrypted database, secure session management)
2. **HTTPS**: Always use HTTPS in production
3. **Token Refresh**: Implement automatic token refresh before expiration
4. **Scope Limitation**: Only request necessary OAuth scopes
5. **Environment Variables**: Never commit credentials to version control

## Troubleshooting

### Common Issues

1. **"No access token provided"**
   - Ensure user has completed OAuth flow
   - Check that token is being passed in Authorization header

2. **"Failed to connect to Xero"**
   - Verify API credentials are correct
   - Check network connectivity
   - Ensure Xero app is properly configured

3. **"Tenant ID is required"**
   - Get organization ID from `/api/xero/organizations` endpoint
   - Pass tenantId in request parameters

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

### Testing Connection

Use the test endpoint to verify connectivity:
```bash
curl -X GET http://localhost:5000/api/xero/test \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Support

For issues related to:
- **Xero API**: Check [Xero Developer Documentation](https://developer.xero.com/)
- **Integration**: Check server logs and error messages
- **MCP Server**: Verify configuration and Cursor settings
