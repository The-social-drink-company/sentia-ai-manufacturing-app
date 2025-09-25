import React, { useEffect, useState } from 'react';
import { useInventoryLevels } from '../../hooks/useRealTimeData';
import { ExclamationTriangleIcon, XMarkIcon, BellAlertIcon } from '@heroicons/react/24/solid';

const InventoryAlerts = ({ className = '' }) => {
  const { levels, alerts, connectionState } = useInventoryLevels();
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [showAll, setShowAll] = useState(false);

  const activeAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.sku));
  const displayedAlerts = showAll ? activeAlerts : activeAlerts.slice(0, 3);

  const dismissAlert = (sku) => {
    setDismissedAlerts(prev => new Set([...prev, sku]));
  };

  const getAlertStyles = (type) => {
    switch (type) {
      case 'critical':
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-900 dark:text-red-200',
          message: 'text-red-700 dark:text-red-300'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          title: 'text-yellow-900 dark:text-yellow-200',
          message: 'text-yellow-700 dark:text-yellow-300'
        };
      default:
        return {
          container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-900 dark:text-blue-200',
          message: 'text-blue-700 dark:text-blue-300'
        };
    }
  };

  const getStockLevelIndicator = (percentage) => {
    const width = Math.min(100, Math.max(0, percentage));
    let color = 'bg-green-500';
    if (width <= 25) color = 'bg-red-500';
    else if (width <= 50) color = 'bg-yellow-500';

    return (
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    );
  };

  if (connectionState !== 'connected') {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Alert Header */}
      {activeAlerts.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellAlertIcon className="h-5 w-5 text-red-600 animate-bounce" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Inventory Alerts ({activeAlerts.length})
            </h3>
          </div>
          {activeAlerts.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showAll ? 'Show Less' : `Show All (${activeAlerts.length})`}
            </button>
          )}
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        {displayedAlerts.map((alert, index) => {
          const styles = getAlertStyles(alert.type);
          return (
            <div
              key={`${alert.sku}-${index}`}
              className={`
                border rounded-lg p-4 transition-all duration-300 animate-slide-in
                ${styles.container}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className={`h-5 w-5 mt-0.5 ${styles.icon}`} />
                  <div className="flex-1">
                    <p className={`font-medium ${styles.title}`}>
                      {alert.message}
                    </p>
                    <p className={`text-sm mt-1 ${styles.message}`}>
                      SKU: {alert.sku}
                    </p>
                    {alert.timestamp && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.sku)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Low Stock Items */}
      {levels.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Critical Stock Levels
          </h4>
          <div className="space-y-3">
            {levels
              .filter(item => item.criticalLevel)
              .slice(0, 5)
              .map((item, index) => (
                <div key={`stock-${item.sku}-${index}`} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {item.name || item.sku}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.quantity} / {item.reorderPoint} units
                    </span>
                  </div>
                  {getStockLevelIndicator(item.stockPercentage)}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* No Alerts State */}
      {activeAlerts.length === 0 && levels.every(item => !item.criticalLevel) && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                All inventory levels normal
              </p>
              <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                No critical stock alerts at this time
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAlerts;
