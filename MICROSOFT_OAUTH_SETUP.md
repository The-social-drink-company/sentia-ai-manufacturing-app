# Microsoft OAuth Authentication Setup

## Overview

The Sentia Manufacturing Dashboard now supports dual authentication methods:
1. **Email/Password**: Traditional username and password authentication
2. **Microsoft OAuth**: Single Sign-On through Azure Active Directory

## Features

- **Dual Authentication**: Users can choose between email/password or Microsoft OAuth
- **Automatic User Creation**: New users are automatically created on first Microsoft sign-in
- **Profile Synchronization**: User profile data is pulled from Microsoft Graph API
- **Secure Token Exchange**: OAuth flow handled securely through backend
- **Session Management**: Consistent session handling across both auth methods

## Setup Instructions

### 1. Azure AD Application Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: `Sentia Manufacturing Dashboard`
   - **Supported account types**: `Accounts in any organizational directory and personal Microsoft accounts`
   - **Redirect URI**: 
     - Development: `http://localhost:3000/auth/microsoft/callback`
     - Production: `https://your-domain.com/auth/microsoft/callback`

### 2. Configure Application Permissions

In your Azure AD app registration:

1. Go to **API permissions**
2. Add the following Microsoft Graph permissions:
   - `openid` (Sign in and read user profile)
   - `profile` (Read user's basic profile)  
   - `email` (Read user's email address)
   - `User.Read` (Read signed-in user's profile)

### 3. Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add description: `Sentia Manufacturing Dashboard Secret`
4. Set expiration as needed
5. Copy the secret value immediately (it won't be shown again)

### 4. Environment Variables

Add these to your `.env` file:

```env
# Microsoft OAuth Configuration
VITE_MICROSOFT_CLIENT_ID=your_application_client_id
MICROSOFT_CLIENT_ID=your_application_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret_value
MICROSOFT_TENANT_ID=common
```

### 5. Railway Production Configuration

For Railway deployments, add the environment variables in the Railway dashboard:

```env
VITE_MICROSOFT_CLIENT_ID=your_application_client_id
MICROSOFT_CLIENT_ID=your_application_client_id  
MICROSOFT_CLIENT_SECRET=your_client_secret_value
MICROSOFT_TENANT_ID=common
```

**Important**: Update redirect URIs in Azure AD to match your Railway deployment URLs:
- Development: `https://sentia-manufacturing-dashboard-development.up.railway.app/auth/microsoft/callback`
- Testing: `https://sentia-manufacturing-dashboard-testing.up.railway.app/auth/microsoft/callback`
- Production: `https://sentia-manufacturing-dashboard-production.up.railway.app/auth/microsoft/callback`

## How It Works

### User Flow

1. **Sign In Page**: User sees two options - "Sign in with Microsoft" button and traditional email/password form
2. **Microsoft OAuth**: Clicking Microsoft button redirects to Azure AD login
3. **Authentication**: User authenticates with their Microsoft account
4. **Callback**: Azure AD redirects back to `/auth/microsoft/callback`
5. **Token Exchange**: Backend exchanges authorization code for access token
6. **Profile Retrieval**: Backend fetches user profile from Microsoft Graph API
7. **User Creation/Login**: User is created in database if new, or logged in if existing
8. **Dashboard Access**: User is redirected to manufacturing dashboard

### Technical Implementation

#### Frontend Components

- `microsoftAuthService.js`: Handles OAuth flow and token management
- `MicrosoftCallbackPage.jsx`: Processes OAuth callback and displays status
- `SimpleSignIn` component: Updated with Microsoft OAuth button

#### Backend Endpoints

- `POST /api/auth/microsoft/callback`: Handles OAuth callback and user creation
- Integration with existing user service for consistent user management

#### Security Features

- **CSRF Protection**: State parameter validation
- **Secure Token Exchange**: Authorization codes exchanged server-side only
- **Profile Validation**: User profile data validated before database storage
- **Session Management**: Consistent session handling with existing auth system

## User Experience

### Sign In Options

Users now see a clean sign-in page with:

1. **Microsoft OAuth Button**: 
   - Prominent "Sign in with Microsoft" button with Microsoft logo
   - Single-click authentication for Microsoft users

2. **Email/Password Form**:
   - Traditional email and password inputs
   - Separated by "Or continue with email" divider
   - Maintains existing functionality

### First-Time Microsoft Users

When a user signs in with Microsoft for the first time:

1. **Automatic Account Creation**: User account created automatically
2. **Profile Population**: Name, email, department pulled from Microsoft
3. **Default Role**: New users assigned 'operator' role (can be changed by admin)
4. **Seamless Experience**: No additional setup required

### Existing Users

Users with existing email/password accounts can:

1. **Link Microsoft Account**: First Microsoft sign-in links to existing account
2. **Use Either Method**: Can sign in with either method going forward
3. **Profile Updates**: Microsoft profile data updates existing account info

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Check Azure AD redirect URIs match your application URLs exactly
   - Ensure both development and production URLs are configured

2. **"Client secret expired"**
   - Generate new client secret in Azure AD
   - Update environment variables

3. **"Insufficient permissions"**
   - Verify required Graph API permissions are granted
   - Admin consent may be required for organizational accounts

### Development Testing

Test the OAuth flow locally:

1. Start development servers: `npm run dev`
2. Navigate to `http://localhost:3000/auth/signin`  
3. Click "Sign in with Microsoft"
4. Complete Microsoft authentication
5. Verify redirect to dashboard

### Production Deployment

Before going live:

1. **Update Azure AD**: Add production redirect URIs
2. **Set Environment Variables**: Configure production secrets
3. **Test Authentication**: Verify OAuth flow works in production
4. **Monitor Logs**: Check server logs for authentication errors

## Security Considerations

- **Client Secrets**: Store securely and rotate regularly
- **Redirect URIs**: Keep list minimal and validate strictly
- **User Permissions**: Regularly audit user roles and access
- **Session Security**: Implement proper session timeout and rotation
- **Audit Logging**: Log authentication events for security monitoring

## Support

For Microsoft OAuth setup assistance:
- Check Azure AD documentation
- Verify environment variable configuration  
- Review server logs for authentication errors
- Test OAuth flow in development first