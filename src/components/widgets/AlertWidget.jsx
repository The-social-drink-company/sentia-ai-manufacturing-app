import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const alertIcons = {
  critical: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
  success: CheckCircleIcon
};

const alertStyles = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-900 dark:text-red-200',
    text: 'text-red-700 dark:text-red-300'
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-900 dark:text-yellow-200',
    text: 'text-yellow-700 dark:text-yellow-300'
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-200',
    text: 'text-blue-700 dark:text-blue-300'
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-900 dark:text-green-200',
    text: 'text-green-700 dark:text-green-300'
  }
};

export default function AlertWidget({
  alerts = [],
  maxAlerts = 5,
  showDismiss = true,
  onDismiss = null,
  autoHide = false,
  autoHideDelay = 5000
}) {
  const [visibleAlerts, setVisibleAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize alerts
    const loadAlerts = () => {
      setLoading(true);

      // Use provided alerts or generate mock alerts
      const alertsToShow = alerts.length > 0 ? alerts : generateMockAlerts();

      // Filter out dismissed alerts and limit to maxAlerts
      const filteredAlerts = alertsToShow
        .filter(alert => !dismissedAlerts.has(alert.id))
        .slice(0, maxAlerts);

      setVisibleAlerts(filteredAlerts);
      setLoading(false);
    };

    loadAlerts();

    // Set up auto-hide if enabled
    if (autoHide) {
      const timers = visibleAlerts.map(alert => {
        return _setTimeout(() => {
          handleDismiss(alert.id);
        }, autoHideDelay);
      });

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [alerts, maxAlerts, autoHide, autoHideDelay]);

  const generateMockAlerts = () => {
    return [
      {
        id: 'alert-1',
        severity: 'critical',
        title: 'Production Line Stopped',
        message: 'Line 3 has stopped due to equipment failure. Immediate attention required.',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        action: {
          label: 'View Details',
          url: '/production/line-3'
        }
      },
      {
        id: 'alert-2',
        severity: 'warning',
        title: 'Low Inventory Alert',
        message: 'Raw material stock for Product A is below reorder point.',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        action: {
          label: 'Reorder',
          url: '/inventory/reorder'
        }
      },
      {
        id: 'alert-3',
        severity: 'info',
        title: 'Scheduled Maintenance',
        message: 'Maintenance scheduled for Line 2 tomorrow at 2:00 PM.',
        timestamp: new Date(Date.now() - 60 * 60000).toISOString()
      },
      {
        id: 'alert-4',
        severity: 'success',
        title: 'Quality Target Achieved',
        message: 'Quality rate has exceeded 99% for the past week.',
        timestamp: new Date(Date.now() - 120 * 60000).toISOString()
      }
    ];
  };

  const handleDismiss = (_alertId) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
    setVisibleAlerts(prev => prev.filter(alert => alert.id !== alertId));

    if (onDismiss) {
      onDismiss(alertId);
    }
  };

  const formatTimestamp = (_timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Alerts
          </h3>
          <BellIcon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {[...Array(2)].map((_, _i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Alerts
          </h3>
          <div className="flex items-center space-x-2">
            {visibleAlerts.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                {visibleAlerts.length} Active
              </span>
            )}
            <BellIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {visibleAlerts.length > 0 ? (
          <div className="space-y-3">
            {visibleAlerts.map((alert) => {
              const Icon = alertIcons[alert.severity] || alertIcons.info;
              const styles = alertStyles[alert.severity] || alertStyles.info;

              return (
                <div
                  key={alert.id}
                  className={`relative p-4 rounded-lg border ${styles.bg} ${styles.border} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start">
                    <Icon className={`h-5 w-5 ${styles.icon} mt-0.5 flex-shrink-0`} />

                    <div className="ml-3 flex-1">
                      <h4 className={`text-sm font-medium ${styles.title}`}>
                        {alert.title}
                      </h4>
                      <p className={`text-sm mt-1 ${styles.text}`}>
                        {alert.message}
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(alert.timestamp)}
                        </span>

                        {alert.action && (
                          <button
                            onClick={() => window.location.href = alert.action.url}
                            className={`text-xs font-medium ${styles.icon} hover:underline`}
                          >
                            {alert.action.label} →
                          </button>
                        )}
                      </div>
                    </div>

                    {showDismiss && (
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="ml-3 flex-shrink-0 hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-1 transition-colors"
                        aria-label="Dismiss alert"
                      >
                        <XMarkIcon className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No active alerts
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              System operating normally
            </p>
          </div>
        )}

        {visibleAlerts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
              View all alerts →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}