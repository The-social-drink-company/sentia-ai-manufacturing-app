/**
 * API Client for centralized API communication
 * Handles all HTTP requests to the backend with proper error handling
 */

import axios from 'axios';
import { logError, logDebug } from '../../utils/logger';

// Get API base URL from environment or use default
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    logDebug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data
    });

    return config;
  },
  (error) => {
    logError('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    logDebug(`API Response: ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          logError('Unauthorized access - redirecting to login');
          localStorage.removeItem('authToken');
          window.location.href = '/auth/signin';
          break;

        case 403:
          // Forbidden
          logError('Access forbidden', error);
          break;

        case 404:
          // Not found
          logError('Resource not found', error);
          break;

        case 500:
          // Server error
          logError('Server error', error);
          break;

        default:
          logError(`API Error ${status}:`, error);
      }

      // Return a standardized error object
      return Promise.reject({
        status,
        message: data?.message || error.message,
        data: data
      });
    } else if (error.request) {
      // Request made but no response received
      logError('No response from server:', error);
      return Promise.reject({
        status: 0,
        message: 'No response from server. Please check your connection.',
        data: null
      });
    } else {
      // Something else happened
      logError('Request setup error:', error);
      return Promise.reject({
        status: -1,
        message: error.message,
        data: null
      });
    }
  }
);

// Convenience methods for common HTTP verbs
export const api = {
  get: (url, params = {}) => apiClient.get(url, { params }),
  post: (url, data = {}) => apiClient.post(url, data),
  put: (url, data = {}) => apiClient.put(url, data),
  patch: (url, data = {}) => apiClient.patch(url, data),
  delete: (url) => apiClient.delete(url),
};

// Specific API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
  },

  // Dashboard
  dashboard: {
    overview: '/dashboard/overview',
    metrics: '/dashboard/metrics',
    widgets: '/dashboard/widgets',
  },

  // Manufacturing
  manufacturing: {
    jobs: '/manufacturing/jobs',
    resources: '/manufacturing/resources',
    capacity: '/manufacturing/capacity',
    schedule: '/manufacturing/schedule',
  },

  // Financial
  financial: {
    overview: '/financial/overview',
    cashflow: '/financial/cashflow',
    workingCapital: '/financial/working-capital',
    whatIf: '/financial/what-if',
  },

  // Analytics
  analytics: {
    reports: '/analytics/reports',
    forecasts: '/analytics/forecasts',
    insights: '/analytics/insights',
  },

  // Admin
  admin: {
    users: '/admin/users',
    settings: '/admin/settings',
    logs: '/admin/logs',
  },
};

export default apiClient;