import React, { useState, useEffect, useCallback } from 'react';
import { 
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  BellIcon,
  BellSlashIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useRealtime } from '../RealtimeProvider';
import { useTheme } from '../../theming';

export const AlertsPanel = ({
  className = '',
  maxAlerts = 20,
  showAcknowledged = false,
  autoAcknowledgeTimeout = null, // Auto-acknowledge after X seconds
  soundEnabled = false,
  ...props
}) => {
  const { 
    alerts, 
    allAlerts, 
    acknowledgeAlert, 
    clearAcknowledgedAlerts,
    subscribe,
    STREAM_TYPES 
  } = useRealtime();
  const { resolvedTheme } = useTheme();
  
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp'); // timestamp, severity, type
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [mutedSeverities, setMutedSeverities] = useState(new Set());

  // Handle new alert notifications
  const handleNewAlert = useCallback((data) => {
    // Play sound notification if enabled
    if (soundEnabled && !mutedSeverities.has(data.severity)) {
      const audio = new Audio('/notification.mp3'); // Add notification sound file
      audio.play().catch(() => {}); // Ignore errors if sound file not found
    }

    // Auto-acknowledge low-severity alerts if timeout is set
    if (autoAcknowledgeTimeout && data.severity === 'low') {
      setTimeout(() => {
        acknowledgeAlert(data.id);
      }, autoAcknowledgeTimeout);
    }
  }, [soundEnabled, mutedSeverities, autoAcknowledgeTimeout, acknowledgeAlert]);

  // Subscribe to alert notifications
  useEffect(() => {
    const unsubscribe = subscribe(STREAM_TYPES.ALERTS_NOTIFICATIONS, handleNewAlert);
    return unsubscribe;
  }, [subscribe, handleNewAlert, STREAM_TYPES.ALERTS_NOTIFICATIONS]);

  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return ExclamationCircleIcon;
      case 'high':
        return ExclamationTriangleIcon;
      case 'medium':
        return InformationCircleIcon;
      case 'low':
        return CheckCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  // Get severity color classes
  const getSeverityColors = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          icon: 'text-red-500'
        };
      case 'high':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-800 dark:text-orange-200',
          icon: 'text-orange-500'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-200',
          icon: 'text-yellow-500'
        };
      case 'low':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-200',
          icon: 'text-blue-500'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-200 dark:border-gray-800',
          text: 'text-gray-800 dark:text-gray-200',
          icon: 'text-gray-500'
        };
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return new Date(timestamp).toLocaleString();
  };

  // Filter and sort alerts
  const processedAlerts = (showAcknowledged ? allAlerts : alerts)
    .filter(alert => {
      if (filter === 'all') return true;
      return alert.severity === filter || alert.type === filter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'timestamp':
        default:
          return b.timestamp - a.timestamp;
      }
    })
    .slice(0, maxAlerts);

  // Get alert type label
  const getAlertTypeLabel = (type) => {
    const labels = {
      production: 'Production',
      quality: 'Quality',
      equipment: 'Equipment',
      inventory: 'Inventory',
      energy: 'Energy',
      safety: 'Safety',
      maintenance: 'Maintenance',
      system: 'System'
    };
    return labels[type] || type;
  };

  const cardClasses = `
    rounded-lg border shadow-sm
    ${resolvedTheme === 'dark'
      ? 'bg-slate-800 border-slate-700'
      : 'bg-white border-gray-200'
    }
  `;

  const textPrimaryClasses = resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryClasses = resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const textMutedClasses = resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`${cardClasses} ${className}`} {...props}>
      {/* Header */}
      <div className={`
        flex items-center justify-between p-4 border-b
        ${resolvedTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'}
      `}>
        <div className="flex items-center">
          <BellIcon className="w-5 h-5 mr-2 text-red-500" />
          <h3 className={`font-semibold ${textPrimaryClasses}`}>
            Live Alerts
          </h3>
          <span className={`
            ml-2 px-2 py-1 rounded-full text-xs font-medium
            ${alerts.length > 0 
              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }
          `}>
            {alerts.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sound toggle */}
          <button
            onClick={() => setMutedSeverities(prev => 
              prev.size > 0 ? new Set() : new Set(['low', 'medium', 'high', 'critical'])
            )}
            className={`
              p-1 rounded transition-colors
              ${mutedSeverities.size > 0 
                ? 'text-gray-400' 
                : 'text-blue-500'
              }
            `}
            title={`Notifications ${mutedSeverities.size > 0 ? 'muted' : 'enabled'}`}
          >
            {mutedSeverities.size > 0 ? 
              <BellSlashIcon className="w-4 h-4" /> : 
              <BellIcon className="w-4 h-4" />
            }
          </button>

          {/* Clear acknowledged */}
          {allAlerts.some(alert => alert.acknowledged) && (
            <button
              onClick={clearAcknowledgedAlerts}
              className={`
                text-xs px-2 py-1 rounded transition-colors
                ${resolvedTheme === 'dark'
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-slate-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className={`
        p-3 border-b flex flex-wrap gap-2 items-center justify-between
        ${resolvedTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'}
      `}>
        {/* Filters */}
        <div className="flex flex-wrap gap-1">
          {['all', 'critical', 'high', 'medium', 'low'].map(filterOption => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`
                px-2 py-1 rounded text-xs font-medium transition-colors
                ${filter === filterOption
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }
              `}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={`
            text-xs px-2 py-1 rounded border
            ${resolvedTheme === 'dark'
              ? 'bg-slate-700 border-slate-600 text-gray-300'
              : 'bg-white border-gray-300 text-gray-700'
            }
          `}
        >
          <option value="timestamp">Latest First</option>
          <option value="severity">By Severity</option>
          <option value="type">By Type</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="max-h-96 overflow-y-auto">
        {processedAlerts.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {processedAlerts.map((alert) => {
              const SeverityIcon = getSeverityIcon(alert.severity);
              const severityColors = getSeverityColors(alert.severity);
              const isExpanded = expandedAlert === alert.id;

              return (
                <div
                  key={alert.id}
                  className={`
                    p-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50
                    ${alert.acknowledged ? 'opacity-60' : ''}
                  `}
                >
                  <div className="flex items-start space-x-3">
                    {/* Severity Icon */}
                    <div className={`
                      flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                      ${severityColors.bg} ${severityColors.border} border
                    `}>
                      <SeverityIcon className={`w-4 h-4 ${severityColors.icon}`} />
                    </div>

                    {/* Alert Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-sm font-medium ${textPrimaryClasses}`}>
                            {alert.title}
                          </h4>
                          <span className={`
                            inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                            ${severityColors.bg} ${severityColors.text}
                          `}>
                            {getAlertTypeLabel(alert.type)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <span className={`text-xs ${textMutedClasses}`}>
                            {formatTimestamp(alert.timestamp)}
                          </span>

                          {!alert.acknowledged && (
                            <button
                              onClick={() => acknowledgeAlert(alert.id)}
                              className={`
                                text-xs px-2 py-1 rounded transition-colors
                                ${resolvedTheme === 'dark'
                                  ? 'text-blue-400 hover:bg-blue-900/30'
                                  : 'text-blue-600 hover:bg-blue-50'
                                }
                              `}
                            >
                              Acknowledge
                            </button>
                          )}
                        </div>
                      </div>

                      <p className={`text-sm ${textSecondaryClasses} mb-2`}>
                        {alert.message}
                      </p>

                      {/* Alert Metadata */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-xs">
                          {alert.source && (
                            <span className={textMutedClasses}>
                              Source: {alert.source}
                            </span>
                          )}
                          
                          <span className={`
                            inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium
                            ${alert.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              alert.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                              alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }
                          `}>
                            {alert.severity}
                          </span>
                        </div>

                        {alert.acknowledged && (
                          <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            Acknowledged
                          </div>
                        )}
                      </div>

                      {/* Expandable details */}
                      {alert.details && (
                        <button
                          onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                          className={`
                            mt-2 text-xs underline transition-colors
                            ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}
                          `}
                        >
                          {isExpanded ? 'Show Less' : 'Show Details'}
                        </button>
                      )}

                      {isExpanded && alert.details && (
                        <div className={`
                          mt-2 p-2 rounded text-xs
                          ${resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}
                          ${textSecondaryClasses}
                        `}>
                          {alert.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <CheckCircleIcon className={`w-12 h-12 mx-auto mb-3 text-green-500`} />
            <p className={textSecondaryClasses}>
              No active alerts
            </p>
            <p className={`text-sm mt-1 ${textMutedClasses}`}>
              All systems are operating normally
            </p>
          </div>
        )}
      </div>

      {/* Footer Summary */}
      {alerts.length > 0 && (
        <div className={`
          px-4 py-3 border-t text-xs ${textMutedClasses}
          ${resolvedTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'}
        `}>
          <div className="flex justify-between">
            <span>
              {alerts.length} active alerts
              {allAlerts.filter(a => a.acknowledged).length > 0 && 
                ` • ${allAlerts.filter(a => a.acknowledged).length} acknowledged`
              }
            </span>
            <span>
              Critical: {alerts.filter(a => a.severity === 'critical').length} • 
              High: {alerts.filter(a => a.severity === 'high').length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;