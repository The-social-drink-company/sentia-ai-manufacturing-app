import React, { createContext, useContext, useState, useEffect } from 'react';
import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';
import { MsalProvider, useMsal, useAccount, useIsAuthenticated } from '@azure/msal-react';

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || 'your-client-id-here',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false
  }
};

// Graph API scopes
const graphScopes = {
  // Basic user info and file access
  basic: [
    'User.Read',
    'Files.Read',
    'Files.Read.All'
  ],
  // SharePoint and advanced permissions
  advanced: [
    'User.Read',
    'Files.ReadWrite',
    'Files.ReadWrite.All', 
    'Sites.Read.All',
    'Sites.ReadWrite.All'
  ]
};

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

const MicrosoftAuthContext = createContext();

export const useMicrosoftAuth = () => {
  const context = useContext(MicrosoftAuthContext);
  if (!context) {
    throw new Error('useMicrosoftAuth must be used within MicrosoftAuthProvider');
  }
  return context;
};

const MicrosoftAuthContextProvider = ({ children }) => {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const isAuthenticated = useIsAuthenticated();
  
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Login to Microsoft
  const loginToMicrosoft = async (scopes = graphScopes.basic) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loginRequest = {
        scopes: scopes,
        prompt: 'select_account'
      };
      
      const response = await instance.loginPopup(loginRequest);
      
      if (response.account) {
        setAccessToken(response.accessToken);
        return response;
      }
    } catch (error) {
      console.error('Microsoft login error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get access token silently
  const getAccessToken = async (scopes = graphScopes.basic) => {
    if (!account) {
      throw new Error('No account found. Please login first.');
    }
    
    try {
      const silentRequest = {
        scopes: scopes,
        account: account
      };
      
      const response = await instance.acquireTokenSilent(silentRequest);
      setAccessToken(response.accessToken);
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Fallback to interactive method
        const response = await instance.acquireTokenPopup({
          scopes: scopes,
          account: account
        });
        setAccessToken(response.accessToken);
        return response.accessToken;
      }
      throw error;
    }
  };

  // Logout from Microsoft
  const logoutFromMicrosoft = async () => {
    setIsLoading(true);
    try {
      await instance.logoutPopup({
        account: account,
        postLogoutRedirectUri: window.location.origin
      });
      setAccessToken(null);
    } catch (error) {
      console.error('Microsoft logout error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has advanced permissions
  const hasAdvancedPermissions = () => {
    return accessToken && account?.idTokenClaims?.scp?.includes('Sites.Read.All');
  };

  // Request advanced permissions
  const requestAdvancedPermissions = async () => {
    return await getAccessToken(graphScopes.advanced);
  };

  // Get current user info
  const getUserInfo = () => {
    if (!account) return null;
    
    return {
      displayName: account.name,
      username: account.username,
      email: account.username,
      id: account.localAccountId,
      tenantId: account.tenantId
    };
  };

  const value = {
    // State
    isAuthenticated,
    account,
    accessToken,
    isLoading,
    error,
    userInfo: getUserInfo(),
    
    // Actions
    loginToMicrosoft,
    logoutFromMicrosoft,
    getAccessToken,
    hasAdvancedPermissions,
    requestAdvancedPermissions,
    
    // Utilities
    clearError: () => setError(null)
  };

  return (
    <MicrosoftAuthContext.Provider value={value}>
      {children}
    </MicrosoftAuthContext.Provider>
  );
};

// Main provider that wraps both MSAL and our context
export const MicrosoftAuthProvider = ({ children }) => {
  return (
    <MsalProvider instance={msalInstance}>
      <MicrosoftAuthContextProvider>
        {children}
      </MicrosoftAuthContextProvider>
    </MsalProvider>
  );
};

export default MicrosoftAuthProvider;