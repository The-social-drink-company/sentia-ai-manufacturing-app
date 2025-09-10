import React, { useState, useEffect } from 'react';
import { 
  KeyIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { logError } from '../../services/observability/structuredLogger.js';

const ApiKeyManagement = () => {
  const [apiKeys, setApiKeys] = useState({});
  const [visibleKeys, setVisibleKeys] = useState({});
  const [connectionStatus, setConnectionStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  // Comprehensive API integration configuration
  const API_SERVICES = {
    // Financial & Accounting
    xero: {
      name: 'Xero Accounting',
      category: 'Financial',
      description: 'Complete accounting and financial management',
      fields: [
        { key: 'XERO_CLIENT_ID', label: 'Client ID', type: 'text', required: true },
        { key: 'XERO_CLIENT_SECRET', label: 'Client Secret', type: 'password', required: true },
        { key: 'XERO_REDIRECT_URI', label: 'Redirect URI', type: 'url', required: true },
        { key: 'XERO_TENANT_ID', label: 'Tenant ID', type: 'text', required: false }
      ],
      capabilities: ['invoicing', 'payments', 'reporting', 'tax-calculations', 'bank-reconciliation'],
      icon: '💰',
      documentation: 'https://developer.xero.com/documentation/'
    },

    // E-commerce Platforms
    shopify: {
      name: 'Shopify Multi-Store',
      category: 'E-commerce',
      description: 'Multi-store Shopify integration for order and inventory management',
      fields: [
        { key: 'SHOPIFY_API_KEY', label: 'API Key', type: 'password', required: true },
        { key: 'SHOPIFY_SECRET_KEY', label: 'Secret Key', type: 'password', required: true },
        { key: 'SHOPIFY_SHOP_DOMAIN', label: 'Shop Domain', type: 'text', required: true },
        { key: 'SHOPIFY_ACCESS_TOKEN', label: 'Access Token', type: 'password', required: true }
      ],
      capabilities: ['product-management', 'order-processing', 'inventory-sync', 'customer-data'],
      icon: '🛒',
      documentation: 'https://shopify.dev/docs/api'
    },

    amazon: {
      name: 'Amazon Selling Partner API',
      category: 'E-commerce',
      description: 'Amazon marketplace integration for all regions',
      fields: [
        { key: 'AMAZON_SP_API_ACCESS_KEY', label: 'Access Key', type: 'password', required: true },
        { key: 'AMAZON_SP_API_SECRET_KEY', label: 'Secret Key', type: 'password', required: true },
        { key: 'AMAZON_SP_API_ROLE_ARN', label: 'Role ARN', type: 'text', required: true },
        { key: 'AMAZON_SP_API_CLIENT_ID', label: 'Client ID', type: 'text', required: true },
        { key: 'AMAZON_SP_API_CLIENT_SECRET', label: 'Client Secret', type: 'password', required: true },
        { key: 'AMAZON_SP_API_REFRESH_TOKEN', label: 'Refresh Token', type: 'password', required: true },
        { key: 'AMAZON_MARKETPLACE_IDS', label: 'Marketplace IDs (comma-separated)', type: 'text', required: true }
      ],
      capabilities: ['inventory-management', 'order-processing', 'fba-operations', 'advertising', 'analytics'],
      icon: '📦',
      documentation: 'https://developer-docs.amazon.com/sp-api/'
    },

    unleashed: {
      name: 'Unleashed Inventory',
      category: 'Inventory',
      description: 'Advanced inventory and warehouse management',
      fields: [
        { key: 'UNLEASHED_API_ID', label: 'API ID', type: 'text', required: true },
        { key: 'UNLEASHED_API_KEY', label: 'API Key', type: 'password', required: true },
        { key: 'UNLEASHED_BASE_URL', label: 'Base URL', type: 'url', required: true }
      ],
      capabilities: ['inventory-tracking', 'warehouse-management', 'purchase-orders', 'stock-levels'],
      icon: '📊',
      documentation: 'https://apidocs.unleashedsoftware.com/'
    },

    microsoft: {
      name: 'Microsoft Graph API',
      category: 'Productivity',
      description: 'Excel, SharePoint, and Office 365 integration',
      fields: [
        { key: 'MICROSOFT_CLIENT_ID', label: 'Client ID', type: 'text', required: true },
        { key: 'MICROSOFT_CLIENT_SECRET', label: 'Client Secret', type: 'password', required: true },
        { key: 'MICROSOFT_TENANT_ID', label: 'Tenant ID', type: 'text', required: true },
        { key: 'MICROSOFT_SCOPE', label: 'Scope', type: 'text', required: false, default: 'Files.ReadWrite.All Sites.ReadWrite.All' }
      ],
      capabilities: ['excel-integration', 'sharepoint-sync', 'teams-notifications', 'file-management'],
      icon: '📋',
      documentation: 'https://docs.microsoft.com/en-us/graph/'
    },

    // AI Services
    openai: {
      name: 'OpenAI GPT-4',
      category: 'AI & ML',
      description: 'Advanced AI capabilities for analysis and automation',
      fields: [
        { key: 'OPENAI_API_KEY', label: 'API Key', type: 'password', required: true },
        { key: 'OPENAI_ORGANIZATION', label: 'Organization ID', type: 'text', required: false },
        { key: 'OPENAI_MODEL', label: 'Default Model', type: 'select', options: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'], default: 'gpt-4' }
      ],
      capabilities: ['text-generation', 'code-generation', 'analysis', 'function-calling'],
      icon: '🤖',
      documentation: 'https://platform.openai.com/docs'
    },

    anthropic: {
      name: 'Anthropic Claude',
      category: 'AI & ML',
      description: 'Advanced reasoning and manufacturing intelligence',
      fields: [
        { key: 'ANTHROPIC_API_KEY', label: 'API Key', type: 'password', required: true },
        { key: 'ANTHROPIC_MODEL', label: 'Default Model', type: 'select', options: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'], default: 'claude-3-sonnet' }
      ],
      capabilities: ['reasoning', 'analysis', 'coding', 'manufacturing-intelligence'],
      icon: '🧠',
      documentation: 'https://docs.anthropic.com/'
    }
  };

  useEffect(() => {
    loadApiKeys();
    checkConnectionStatus();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/api-keys');
      if (response.ok) {
        const keys = await response.json();
        setApiKeys(keys);
      }
    } catch (error) {
      logError('Failed to load API keys', { component: 'ApiKeyManagement' }, error);
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/admin/api-keys/status');
      if (response.ok) {
        const status = await response.json();
        setConnectionStatus(status);
      }
    } catch (error) {
      logError('Failed to check connection status', { component: 'ApiKeyManagement' }, error);
    }
  };

  const saveApiKey = async (serviceId, fieldKey, value) => {
    try {
      setSaving({ ...saving, [`${serviceId}_${fieldKey}`]: true });
      
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: serviceId,
          key: fieldKey,
          value: value
        })
      });

      if (response.ok) {
        setApiKeys(prev => ({
          ...prev,
          [serviceId]: {
            ...prev[serviceId],
            [fieldKey]: value
          }
        }));
        
        // Refresh connection status
        setTimeout(checkConnectionStatus, 1000);
      }
    } catch (error) {
      logError('Failed to save API key', { 
        component: 'ApiKeyManagement', 
        serviceId, 
        fieldKey 
      }, error);
    } finally {
      setSaving(prev => ({ ...prev, [`${serviceId}_${fieldKey}`]: false }));
    }
  };

  const toggleVisibility = (serviceId, fieldKey) => {
    const key = `${serviceId}_${fieldKey}`;
    setVisibleKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const testConnection = async (serviceId) => {
    try {
      setSaving({ ...saving, [`${serviceId}_test`]: true });
      
      const response = await fetch(`/api/admin/api-keys/test/${serviceId}`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      setConnectionStatus(prev => ({
        ...prev,
        [serviceId]: result.status === 'success' ? 'connected' : 'error'
      }));
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        [serviceId]: 'error'
      }));
    } finally {
      setSaving(prev => ({ ...prev, [`${serviceId}_test`]: false }));
    }
  };

  const getConnectionStatusIcon = (serviceId) => {
    const status = connectionStatus[serviceId];
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />;
    }
  };

  const renderServiceCard = (serviceId, service) => {
    const serviceKeys = apiKeys[serviceId] || {};
    
    return (
      <div key={serviceId} className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{service.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                <p className="text-sm text-gray-500">{service.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getConnectionStatusIcon(serviceId)}
              <span className="text-sm text-gray-600 capitalize">
                {connectionStatus[serviceId] || 'Not configured'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {service.capabilities.map((capability) => (
              <span
                key={capability}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {capability}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {service.fields.map((field) => {
              const currentValue = serviceKeys[field.key] || '';
              const isVisible = visibleKeys[`${serviceId}_${field.key}`];
              const isSaving = saving[`${serviceId}_${field.key}`];

              return (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  <div className="relative">
                    {field.type === 'select' ? (
                      <select
                        value={currentValue}
                        onChange={(e) => saveApiKey(serviceId, field.key, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSaving}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'password' && !isVisible ? 'password' : 'text'}
                        value={currentValue}
                        onChange={(e) => saveApiKey(serviceId, field.key, e.target.value)}
                        placeholder={field.default || `Enter ${field.label}`}
                        className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSaving}
                      />
                    )}
                    
                    {field.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => toggleVisibility(serviceId, field.key)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {isVisible ? 
                          <EyeSlashIcon className="h-4 w-4 text-gray-400" /> : 
                          <EyeIcon className="h-4 w-4 text-gray-400" />
                        }
                      </button>
                    )}
                    
                    {isSaving && (
                      <div className="absolute inset-y-0 right-8 flex items-center">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-between">
            <a
              href={service.documentation}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              View Documentation
              <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 7l10 10M17 7v10" />
              </svg>
            </a>
            
            <button
              onClick={() => testConnection(serviceId)}
              disabled={saving[`${serviceId}_test`]}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving[`${serviceId}_test`] ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const groupedServices = Object.entries(API_SERVICES).reduce((acc, [id, service]) => {
    if (!acc[service.category]) acc[service.category] = [];
    acc[service.category].push([id, service]);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">API Integration Management</h2>
        <p className="text-gray-600">
          Configure and manage all external service integrations. All keys are securely stored and automatically synchronized with the MCP server.
        </p>
      </div>

      {Object.entries(groupedServices).map(([category, services]) => (
        <div key={category} className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">{category} Services</h3>
          <div className="grid gap-6 lg:grid-cols-2">
            {services.map(([serviceId, service]) => renderServiceCard(serviceId, service))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApiKeyManagement;