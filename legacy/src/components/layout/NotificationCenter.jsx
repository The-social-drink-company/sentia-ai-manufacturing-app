import { devLog } from '../lib/devLog.js';\nimport React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  BellIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('all');

  // Mock notifications data - would come from API/SSE
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'alert',
      title: 'Production Line A Alert',
      message: 'Efficiency dropped below 85% threshold',
      timestamp: new Date(Date.now() - 10 * 60000), // 10 minutes ago
      read: false,
      category: 'production',
      priority: 'high',
      actionUrl: '/production?line=a'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Low Stock Alert',
      message: 'GABA Powder inventory below minimum threshold (50kg remaining)',
      timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
      read: false,
      category: 'inventory',
      priority: 'medium',
      actionUrl: '/inventory?item=gaba-powder'
    },
    {
      id: '3',
      type: 'success',
      title: 'Quality Test Completed',
      message: 'Batch 2024-001 passed all quality checks',
      timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
      read: true,
      category: 'quality',
      priority: 'low',
      actionUrl: '/quality?batch=2024-001'
    },
    {
      id: '4',
      type: 'info',
      title: 'Data Import Completed',
      message: 'Successfully imported 1,250 inventory records',
      timestamp: new Date(Date.now() - 4 * 60 * 60000), // 4 hours ago
      read: true,
      category: 'system',
      priority: 'low',
      actionUrl: '/data-import'
    },
    {
      id: '5',
      type: 'alert',
      title: 'Forecast Model Update',
      message: 'New AI model deployed with 12% accuracy improvement',
      timestamp: new Date(Date.now() - 24 * 60 * 60000), // 1 day ago
      read: true,
      category: 'forecasting',
      priority: 'medium',
      actionUrl: '/forecasting'
    }
  ]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert':
        return ExclamationCircleIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      case 'success':
        return CheckCircleIcon;
      case 'info':
      default:
        return InformationCircleIcon;
    }
  };

  const getNotificationColors = (type, priority) => {
    const baseColors = {
      alert: 'text-red-600 bg-red-50 border-red-200',
      warning: 'text-amber-600 bg-amber-50 border-amber-200',
      success: 'text-green-600 bg-green-50 border-green-200',
      info: 'text-blue-600 bg-blue-50 border-blue-200'
    };

    return baseColors[type] || baseColors.info;
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return `${Math.floor(diff / 86400000)}d ago`;
    }
  };

  const getPriorityDot = (priority) => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-amber-500',
      low: 'bg-green-500'
    };
    
    return colors[priority] || colors.low;
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    return notification.category === activeTab;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const tabs = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'production', label: 'Production', count: notifications.filter(n => n.category === 'production').length },
    { id: 'quality', label: 'Quality', count: notifications.filter(n => n.category === 'quality').length },
    { id: 'inventory', label: 'Inventory', count: notifications.filter(n => n.category === 'inventory').length }
  ];

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        {/* Slide-out panel */}
        <div className="fixed inset-0 flex justify-end">
          <Transition.Child
            enter="transform transition ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-300"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center space-x-3">
                  <BellIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Notifications
                    </h2>
                    {unreadCount > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {unreadCount} unread
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                      activeTab === tab.id
                        ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={cn(
                        "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium",
                        activeTab === tab.id
                          ? "bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      )}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Notifications list */}
              <div className="flex-1 overflow-y-auto max-h-96">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <BellIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredNotifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer",
                            !notification.read && "bg-blue-50 dark:bg-blue-900/10"
                          )}
                          onClick={() => {
                            markAsRead(notification.id);
                            if (notification.actionUrl) {
                              // Would navigate to the URL
                              devLog.log('Navigate to:', notification.actionUrl);
                            }
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={cn(
                              "flex-shrink-0 p-1 rounded-full",
                              getNotificationColors(notification.type)
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className={cn(
                                    "text-sm font-medium",
                                    notification.read 
                                      ? "text-gray-700 dark:text-gray-300"
                                      : "text-gray-900 dark:text-gray-100"
                                  )}>
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {notification.message}
                                  </p>
                                </div>
                                
                                <div className="flex items-center space-x-2 ml-2">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    getPriorityDot(notification.priority)
                                  )} />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <TrashIcon className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500">
                                  <ClockIcon className="h-3 w-3" />
                                  <span>{formatTimestamp(notification.timestamp)}</span>
                                </div>
                                
                                <span className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                                  "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                )}>
                                  {notification.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                  View all notifications
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default NotificationCenter;
