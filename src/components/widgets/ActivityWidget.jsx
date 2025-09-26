import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  UserIcon,
  CubeIcon,
  TruckIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const activityIcons = {
  login: UserIcon,
  inventory: CubeIcon,
  production: TruckIcon,
  financial: BanknotesIcon,
  analytics: ArrowTrendingUpIcon,
  default: ClockIcon
};

const activityColors = {
  login: 'blue',
  inventory: 'purple',
  production: 'green',
  financial: 'yellow',
  analytics: 'indigo',
  default: 'gray'
};

export default function ActivityWidget({ activities = [], maxItems = 10 }) {
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching activities or use provided prop
    const loadActivities = async () => {
      setLoading(true);
      try {
        // If activities prop is provided, use it
        if (activities && activities.length > 0) {
          setRecentActivities(activities.slice(0, maxItems));
        } else {
          // Generate mock activities for demonstration
          const mockActivities = [
            {
              id: 1,
              type: 'financial',
              user: 'John Smith',
              action: 'Updated cash flow forecast',
              timestamp: '2 minutes ago'
            },
            {
              id: 2,
              type: 'inventory',
              user: 'Sarah Johnson',
              action: 'Adjusted reorder points for raw materials',
              timestamp: '15 minutes ago'
            },
            {
              id: 3,
              type: 'production',
              user: 'Mike Chen',
              action: 'Completed production batch #2024-117',
              timestamp: '1 hour ago'
            },
            {
              id: 4,
              type: 'analytics',
              user: 'Emily Davis',
              action: 'Generated monthly OEE report',
              timestamp: '2 hours ago'
            },
            {
              id: 5,
              type: 'login',
              user: 'Robert Wilson',
              action: 'Logged into the system',
              timestamp: '3 hours ago'
            },
            {
              id: 6,
              type: 'financial',
              user: 'Lisa Anderson',
              action: 'Approved purchase order #PO-2024-892',
              timestamp: '4 hours ago'
            },
            {
              id: 7,
              type: 'inventory',
              user: 'David Martinez',
              action: 'Performed cycle count in warehouse A',
              timestamp: '5 hours ago'
            },
            {
              id: 8,
              type: 'production',
              user: 'Jennifer Lee',
              action: 'Scheduled maintenance for Line 3',
              timestamp: '6 hours ago'
            }
          ];
          setRecentActivities(mockActivities.slice(0, maxItems));
        }
      } catch (error) {
        console.error('Failed to load activities:', error);
        setRecentActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();

    // Refresh activities every minute
    const interval = setInterval(loadActivities, 60000);
    return () => clearInterval(interval);
  }, [activities, maxItems]);

  const getIcon = (type) => {
    const Icon = activityIcons[type] || activityIcons.default;
    return Icon;
  };

  const getColorClasses = (type) => {
    const color = activityColors[type] || activityColors.default;
    return {
      bg: `bg-${color}-50 dark:bg-${color}-900/20`,
      text: `text-${color}-600 dark:text-${color}-400`,
      border: `border-${color}-200 dark:border-${color}-800`
    };
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
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
            Recent Activity
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Auto-updates every minute
          </span>
        </div>

        {recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((activity) => {
              const Icon = getIcon(activity.type);
              const colors = getColorClasses(activity.type);

              return (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.user}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          {activity.action}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                        {activity.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recent activity to display
            </p>
          </div>
        )}

        {recentActivities.length >= maxItems && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
              View all activity →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}