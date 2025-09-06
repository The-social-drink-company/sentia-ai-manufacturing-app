import { devLog } from '../../../lib/devLog.js';
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  ServerIcon,
  BellIcon,
  EnvelopeIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../../lib/utils'
import { useAuthRole } from '../../../hooks/useAuthRole.jsx'

const SettingCard = ({ category, title, description, children, icon: Icon, warning = false }) => {
  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-lg border p-6",
      warning 
        ? "border-yellow-300 dark:border-yellow-700" 
        : "border-gray-200 dark:border-gray-700"
    )}>
      <div className="flex items-start space-x-4">
        <div className={cn(
          "p-2 rounded-lg",
          warning
            ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
            : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

const SettingRow = ({ 
  label, 
  value, 
  type = 'text', 
  options = [], 
  sensitive = false, 
  editable = true,
  onChange,
  onSave,
  environment = 'development',
  description
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [showValue, setShowValue] = useState(false)
  const { hasPermission } = useAuthRole()

  const canEdit = editable && 
    hasPermission('admin.settings.edit') && 
    (environment !== 'production' || hasPermission('admin.production.edit'))

  const handleSave = () => {
    onSave?.(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const displayValue = sensitive && !showValue && value 
    ? '••••••••••••••••'
    : value || '(not set)'

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
          {environment === 'production' && (
            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
              PROD
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {isEditing ? (
          <div className="flex items-center space-x-2">
            {type === 'select' ? (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : type === 'boolean' ? (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editValue}
                  onChange={(e) => setEditValue(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </label>
            ) : (
              <input
                type={sensitive && !showValue ? 'password' : type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                style={{ minWidth: '200px' }}
              />
            )}
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:text-green-800"
              title="Save"
            >
              <CheckIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Cancel"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className={cn(
              "text-sm px-3 py-1 rounded",
              sensitive 
                ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-mono"
                : "text-gray-700 dark:text-gray-300"
            )}>
              {type === 'boolean' ? (value ? 'Enabled' : 'Disabled') : displayValue}
            </span>
            
            {sensitive && value && (
              <button
                onClick={() => setShowValue(!showValue)}
                className="p-1 text-gray-500 hover:text-gray-700"
                title={showValue ? "Hide" : "Show"}
              >
                {showValue ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            )}
            
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-blue-500 hover:text-blue-700"
                title="Edit"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const AdminSettings = () => {
  const { hasPermission } = useAuthRole()
  const queryClient = useQueryClient()
  const currentEnv = process.env.NODE_ENV || 'development'

  // Fetch system settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        application: {
          app_name: 'Sentia Manufacturing Dashboard',
          app_version: '1.0.0',
          maintenance_mode: false,
          max_file_size: '10MB',
          session_timeout: 3600,
          timezone: 'UTC'
        },
        security: {
          require_mfa: true,
          password_policy: 'strong',
          login_attempts: 5,
          lockout_duration: 900,
          session_security: 'high',
          api_rate_limit: 1000
        },
        email: {
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_username: 'noreply@company.com',
          smtp_password: 'app-password-here',
          smtp_encryption: 'tls',
          from_address: 'noreply@company.com',
          from_name: 'Sentia Manufacturing'
        },
        notifications: {
          error_notifications: true,
          maintenance_alerts: true,
          security_alerts: true,
          performance_alerts: false,
          slack_webhook: '',
          teams_webhook: ''
        },
        performance: {
          cache_enabled: true,
          cache_ttl: 3600,
          database_pool_size: 20,
          api_timeout: 30,
          log_level: 'info',
          enable_metrics: true
        },
        integrations: {
          shopify_enabled: true,
          amazon_enabled: false,
          xero_enabled: true,
          analytics_enabled: true,
          sentry_dsn: 'https://sentry.io/projects/123'
        }
      }
    },
    refetchInterval: 60000
  })

  const updateSetting = useMutation({
    mutationFn: async ({ category, key, value }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      devLog.log(`Updating ${category}.${key} to:`, value)
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'settings'])
    }
  })

  const handleSettingChange = (category, key, value) => {
    updateSetting.mutate({ category, key, value })
  }

  if (!hasPermission('admin.settings.view')) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheckIcon className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to view system settings.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure application behavior and system preferences
          </p>
        </div>
        
        {currentEnv === 'production' && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                Production Environment - Changes require approval
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Settings sections */}
      <div className="space-y-6">
        {/* Application Settings */}
        <SettingCard
          category="application"
          title="Application Settings"
          description="Core application configuration and behavior"
          icon={Cog6ToothIcon}
        >
          <div className="space-y-1">
            <SettingRow
              label="Application Name"
              value={settings?.application.app_name}
              onSave={(value) => handleSettingChange('application', 'app_name', value)}
              environment={currentEnv}
            />
            <SettingRow
              label="Version"
              value={settings?.application.app_version}
              editable={false}
              environment={currentEnv}
            />
            <SettingRow
              label="Maintenance Mode"
              value={settings?.application.maintenance_mode}
              type="boolean"
              onSave={(value) => handleSettingChange('application', 'maintenance_mode', value)}
              environment={currentEnv}
              description="Enable to put the application in maintenance mode"
            />
            <SettingRow
              label="Max File Size"
              value={settings?.application.max_file_size}
              onSave={(value) => handleSettingChange('application', 'max_file_size', value)}
              environment={currentEnv}
            />
            <SettingRow
              label="Session Timeout (seconds)"
              value={settings?.application.session_timeout}
              type="number"
              onSave={(value) => handleSettingChange('application', 'session_timeout', parseInt(value))}
              environment={currentEnv}
            />
          </div>
        </SettingCard>

        {/* Security Settings */}
        <SettingCard
          category="security"
          title="Security Settings"
          description="Authentication, authorization, and security policies"
          icon={ShieldCheckIcon}
          warning={currentEnv === 'production'}
        >
          <div className="space-y-1">
            <SettingRow
              label="Require MFA"
              value={settings?.security.require_mfa}
              type="boolean"
              onSave={(value) => handleSettingChange('security', 'require_mfa', value)}
              environment={currentEnv}
              description="Require multi-factor authentication for all users"
            />
            <SettingRow
              label="Password Policy"
              value={settings?.security.password_policy}
              type="select"
              options={[
                { value: 'weak', label: 'Weak' },
                { value: 'medium', label: 'Medium' },
                { value: 'strong', label: 'Strong' }
              ]}
              onSave={(value) => handleSettingChange('security', 'password_policy', value)}
              environment={currentEnv}
            />
            <SettingRow
              label="Max Login Attempts"
              value={settings?.security.login_attempts}
              type="number"
              onSave={(value) => handleSettingChange('security', 'login_attempts', parseInt(value))}
              environment={currentEnv}
            />
            <SettingRow
              label="Lockout Duration (seconds)"
              value={settings?.security.lockout_duration}
              type="number"
              onSave={(value) => handleSettingChange('security', 'lockout_duration', parseInt(value))}
              environment={currentEnv}
            />
            <SettingRow
              label="API Rate Limit (per hour)"
              value={settings?.security.api_rate_limit}
              type="number"
              onSave={(value) => handleSettingChange('security', 'api_rate_limit', parseInt(value))}
              environment={currentEnv}
            />
          </div>
        </SettingCard>

        {/* Email Settings */}
        <SettingCard
          category="email"
          title="Email Configuration"
          description="SMTP settings for system notifications and user communications"
          icon={EnvelopeIcon}
        >
          <div className="space-y-1">
            <SettingRow
              label="SMTP Host"
              value={settings?.email.smtp_host}
              onSave={(value) => handleSettingChange('email', 'smtp_host', value)}
              environment={currentEnv}
            />
            <SettingRow
              label="SMTP Port"
              value={settings?.email.smtp_port}
              type="number"
              onSave={(value) => handleSettingChange('email', 'smtp_port', parseInt(value))}
              environment={currentEnv}
            />
            <SettingRow
              label="SMTP Username"
              value={settings?.email.smtp_username}
              onSave={(value) => handleSettingChange('email', 'smtp_username', value)}
              environment={currentEnv}
            />
            <SettingRow
              label="SMTP Password"
              value={settings?.email.smtp_password}
              sensitive={true}
              onSave={(value) => handleSettingChange('email', 'smtp_password', value)}
              environment={currentEnv}
            />
            <SettingRow
              label="From Address"
              value={settings?.email.from_address}
              type="email"
              onSave={(value) => handleSettingChange('email', 'from_address', value)}
              environment={currentEnv}
            />
          </div>
        </SettingCard>

        {/* Notifications */}
        <SettingCard
          category="notifications"
          title="Notification Settings"
          description="Configure system alerts and notification channels"
          icon={BellIcon}
        >
          <div className="space-y-1">
            <SettingRow
              label="Error Notifications"
              value={settings?.notifications.error_notifications}
              type="boolean"
              onSave={(value) => handleSettingChange('notifications', 'error_notifications', value)}
              environment={currentEnv}
            />
            <SettingRow
              label="Maintenance Alerts"
              value={settings?.notifications.maintenance_alerts}
              type="boolean"
              onSave={(value) => handleSettingChange('notifications', 'maintenance_alerts', value)}
              environment={currentEnv}
            />
            <SettingRow
              label="Security Alerts"
              value={settings?.notifications.security_alerts}
              type="boolean"
              onSave={(value) => handleSettingChange('notifications', 'security_alerts', value)}
              environment={currentEnv}
            />
            <SettingRow
              label="Slack Webhook"
              value={settings?.notifications.slack_webhook}
              sensitive={true}
              onSave={(value) => handleSettingChange('notifications', 'slack_webhook', value)}
              environment={currentEnv}
              description="Webhook URL for Slack notifications"
            />
          </div>
        </SettingCard>

        {/* Performance Settings */}
        <SettingCard
          category="performance"
          title="Performance & Monitoring"
          description="System performance settings and monitoring configuration"
          icon={CpuChipIcon}
        >
          <div className="space-y-1">
            <SettingRow
              label="Cache Enabled"
              value={settings?.performance.cache_enabled}
              type="boolean"
              onSave={(value) => handleSettingChange('performance', 'cache_enabled', value)}
              environment={currentEnv}
            />
            <SettingRow
              label="Cache TTL (seconds)"
              value={settings?.performance.cache_ttl}
              type="number"
              onSave={(value) => handleSettingChange('performance', 'cache_ttl', parseInt(value))}
              environment={currentEnv}
            />
            <SettingRow
              label="Database Pool Size"
              value={settings?.performance.database_pool_size}
              type="number"
              onSave={(value) => handleSettingChange('performance', 'database_pool_size', parseInt(value))}
              environment={currentEnv}
            />
            <SettingRow
              label="Log Level"
              value={settings?.performance.log_level}
              type="select"
              options={[
                { value: 'error', label: 'Error' },
                { value: 'warn', label: 'Warning' },
                { value: 'info', label: 'Info' },
                { value: 'debug', label: 'Debug' }
              ]}
              onSave={(value) => handleSettingChange('performance', 'log_level', value)}
              environment={currentEnv}
            />
            <SettingRow
              label="Enable Metrics Collection"
              value={settings?.performance.enable_metrics}
              type="boolean"
              onSave={(value) => handleSettingChange('performance', 'enable_metrics', value)}
              environment={currentEnv}
            />
          </div>
        </SettingCard>

        {/* Integrations */}
        <SettingCard
          category="integrations"
          title="External Integrations"
          description="Enable/disable external service integrations"
          icon={ServerIcon}
        >
          <div className="space-y-1">
            <SettingRow
              label="Shopify Integration"
              value={settings?.integrations.shopify_enabled}
              type="boolean"
              onSave={(value) => handleSettingChange('integrations', 'shopify_enabled', value)}
              environment={currentEnv}
            />
            <SettingRow
              label="Amazon SP-API"
              value={settings?.integrations.amazon_enabled}
              type="boolean"
              onSave={(value) => handleSettingChange('integrations', 'amazon_enabled', value)}
              environment={currentEnv}
            />
            <SettingRow
              label="Xero Accounting"
              value={settings?.integrations.xero_enabled}
              type="boolean"
              onSave={(value) => handleSettingChange('integrations', 'xero_enabled', value)}
              environment={currentEnv}
            />
            <SettingRow
              label="Analytics Tracking"
              value={settings?.integrations.analytics_enabled}
              type="boolean"
              onSave={(value) => handleSettingChange('integrations', 'analytics_enabled', value)}
              environment={currentEnv}
            />
            <SettingRow
              label="Sentry DSN"
              value={settings?.integrations.sentry_dsn}
              sensitive={true}
              onSave={(value) => handleSettingChange('integrations', 'sentry_dsn', value)}
              environment={currentEnv}
              description="Error tracking and monitoring"
            />
          </div>
        </SettingCard>
      </div>
    </div>
  )
}

export default AdminSettings