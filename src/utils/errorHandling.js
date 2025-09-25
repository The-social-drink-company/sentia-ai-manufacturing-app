import { devLog } from '../lib/devLog.js';
import toast from 'react-hot-toast';

// Error types for categorization
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Determine error type from error object
export const getErrorType = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;

  // Network errors
  if (!navigator.onLine) return ERROR_TYPES.NETWORK;
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return ERROR_TYPES.NETWORK;
  }

  // HTTP status based errors
  if (error.status || error.response?.status) {
    const status = error.status || error.response?.status;
    
    switch (status) {
      case 401:
        return ERROR_TYPES.AUTHENTICATION;
      case 403:
        return ERROR_TYPES.AUTHORIZATION;
      case 404:
        return ERROR_TYPES.NOT_FOUND;
      case 422:
        return ERROR_TYPES.VALIDATION;
      case 408:
      case 504:
        return ERROR_TYPES.TIMEOUT;
      case 500:
      case 502:
      case 503:
        return ERROR_TYPES.SERVER;
      default:
        return ERROR_TYPES.UNKNOWN;
    }
  }

  // Check error message for common patterns
  const message = error.message?.toLowerCase() || '';
  if (message.includes('network') || message.includes('fetch')) {
    return ERROR_TYPES.NETWORK;
  }
  if (message.includes('timeout')) {
    return ERROR_TYPES.TIMEOUT;
  }
  if (message.includes('unauthorized') || message.includes('token')) {
    return ERROR_TYPES.AUTHENTICATION;
  }
  if (message.includes('forbidden') || message.includes('permission')) {
    return ERROR_TYPES.AUTHORIZATION;
  }

  return ERROR_TYPES.UNKNOWN;
};

// Get user-friendly error messages
export const getErrorMessage = (error) => {
  const errorType = getErrorType(error);
  
  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      return 'Network connection issue. Please check your internet connection and try again.';
    
    case ERROR_TYPES.AUTHENTICATION:
      return 'Authentication failed. Please log in again.';
    
    case ERROR_TYPES.AUTHORIZATION:
      return 'You don\'t have permission to access this resource.';
    
    case ERROR_TYPES.VALIDATION:
      return error.response?.data?.message || null;
    
    case ERROR_TYPES.NOT_FOUND:
      return 'The requested resource was not found.';
    
    case ERROR_TYPES.SERVER:
      return 'Server error occurred. Please try again later.';
    
    case ERROR_TYPES.TIMEOUT:
      return 'Request timed out. Please try again.';
    
    default:
      return error.message || null;
  }
};

// Show appropriate toast notification for error
export const showErrorToast = (error, customMessage = null) => {
  const message = customMessage || getErrorMessage(error);
  const errorType = getErrorType(error);
  
  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      toast.error(message, {
        duration: 6000,
        icon: '📡',
      });
      break;
    
    case ERROR_TYPES.AUTHENTICATION:
      toast.error(message, {
        duration: 5000,
        icon: '🔐',
      });
      break;
    
    case ERROR_TYPES.AUTHORIZATION:
      toast.error(message, {
        duration: 5000,
        icon: '⛔',
      });
      break;
    
    case ERROR_TYPES.VALIDATION:
      toast.error(message, {
        duration: 4000,
        icon: '⚠️',
      });
      break;
    
    case ERROR_TYPES.SERVER:
      toast.error(message, {
        duration: 6000,
        icon: '🔥',
      });
      break;
    
    default:
      toast.error(message, {
        duration: 4000,
      });
  }
};

// Enhanced error handling for async operations
export const handleAsyncError = async (asyncFn, errorHandler = null) => {
  try {
    return await asyncFn();
  } catch (error) {
    devLog.error('Async operation failed:', error);
    
    if (errorHandler) {
      errorHandler(error);
    } else {
      showErrorToast(error);
    }
    
    throw error;
  }
};

// Retry mechanism with exponential backoff
export const withRetry = async (
  asyncFn, 
  options = {}
) => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = (error) => getErrorType(error) === ERROR_TYPES.NETWORK
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt or if shouldn't retry
      if (attempt === maxRetries || !shouldRetry(error)) {
        break;
      }
      
      // Wait before retrying
      const waitTime = delay * Math.pow(backoff, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      devLog.log(`Retrying operation (attempt ${attempt + 2}/${maxRetries + 1})...`);
    }
  }
  
  throw lastError;
};

// Create enhanced fetch with error handling
export const createFetchWithErrorHandling = (baseOptions = {}) => {
  return async (url, options = {}) => {
    const mergedOptions = {
      ...baseOptions,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...baseOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, mergedOptions);
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        
        // Try to get error details from response body
        try {
          const errorData = await response.json();
          error.data = errorData;
          if (errorData.message) {
            error.message = errorData.message;
          }
        } catch {
          // Response body is not JSON, use status text
        }
        
        throw error;
      }
      
      return response;
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new Error('Network request failed');
        networkError.name = 'NetworkError';
        networkError.code = 'NETWORK_ERROR';
        throw networkError;
      }
      
      throw error;
    }
  };
};

// Global error handler setup
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    devLog.error('Unhandled promise rejection:', event.reason);
    
    // Prevent default browser behavior
    event.preventDefault();
    
    // Show error toast for network-related errors
    if (getErrorType(event.reason) === ERROR_TYPES.NETWORK) {
      showErrorToast(event.reason);
    }
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    devLog.error('Global error:', event.error);
    
    // Don't show toast for every JS error to avoid spam
    // ErrorBoundary will catch React errors
  });
};

// Error boundary error handler
export const reportErrorToBoundary = (error, errorInfo) => {
  devLog.error('Error boundary caught error:', error, errorInfo);
  
  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry, LogRocket, etc.
    try {
      // reportToErrorService(error, errorInfo);
    } catch (reportingError) {
      devLog.error('Failed to report error:', reportingError);
    }
  }
};

// Utility for safe JSON parsing with error handling
export const safeParse = (jsonString, 0 catch (error) {
    devLog.warn('JSON parse error:', error);
    return fallback;
  }
};

// Utility for safe localStorage operations
export const safeLocalStorage = {
  get: (key, 0 catch (error) {
      devLog.warn('LocalStorage get error:', error);
      return fallback;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      devLog.warn('LocalStorage set error:', error);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      devLog.warn('LocalStorage remove error:', error);
      return false;
    }
  }
};

export default {
  ERROR_TYPES,
  getErrorType,
  getErrorMessage,
  showErrorToast,
  handleAsyncError,
  withRetry,
  createFetchWithErrorHandling,
  setupGlobalErrorHandling,
  reportErrorToBoundary,
  safeParse,
  safeLocalStorage
};
