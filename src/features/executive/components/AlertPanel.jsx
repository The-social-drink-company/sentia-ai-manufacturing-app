import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useState } from 'react';

const AlertPanel = ({ alerts, className }) => {
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const handleDismiss = (alertId) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
  };

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className={clsx(
      'rounded-lg border-2 p-4',
      className || 'border-red-500 bg-red-50'
    )}>
      <div className="flex items-start space-x-3">
        <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900">
            Critical Alerts ({visibleAlerts.length})
          </h3>
          <div className="mt-3 space-y-2">
            {visibleAlerts.map(alert => (
              <div
                key={alert.id}
                className="flex items-start justify-between p-3 bg-white rounded-lg border border-red-200"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{alert.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                  {alert.action && (
                    <button className="mt-2 text-sm font-medium text-red-600 hover:text-red-700">
                      {alert.action} →
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="ml-4 p-1 rounded-lg hover:bg-red-100 transition-colors"
                  aria-label="Dismiss alert"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertPanel;