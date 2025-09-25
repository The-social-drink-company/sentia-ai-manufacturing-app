import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  UserCircleIcon,
  ShoppingCartIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChevronDownIcon,
  PlayIcon,
  PauseIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'order' | 'inventory' | 'alert' | 'system' | 'user_action' | 'production' | 'quality';
  title: string;
  description: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  timestamp: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'warning' | 'info';
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: {
    order_id?: string;
    product_id?: string;
    quantity?: number;
    value?: number;
    location?: string;
    market?: string;
    [key: string]: any;
  };
  quick_actions?: {
    id: string;
    label: string;
    action: string;
    variant: 'primary' | 'secondary' | 'danger';
  }[];
  read: boolean;
}

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
}

type ActivityFilter = 'all' | 'orders' | 'inventory' | 'alerts' | 'production' | 'user_actions';

const ACTIVITY_FEED_ENDPOINT = '/api/activity/feed';

export function ActivityFeed({ className = '', maxItems = 50 }: ActivityFeedProps) {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Fetch activity feed
  const { data: activities = [], isLoading, error, refetch } = useQuery({
    queryKey: ['activity-feed', filter, maxItems],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: maxItems.toString(),
        ...(filter !== 'all' && { type: filter === 'user_actions' ? 'user_action' : filter })
      });
      
      const response = await fetch(`${ACTIVITY_FEED_ENDPOINT}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch activity feed');
      
      const data = await response.json() as ActivityItem[];
      
      // Update unread count
      const unread = data.filter(item => !item.read).length;
      setUnreadCount(unread);
      
      return data;
    },
    refetchInterval: isAutoRefresh ? 10000 : false, // Refetch every 10 seconds if auto-refresh is on
  });

  // WebSocket connection for real-time updates
  const { lastMessage, connectionStatus } = useWebSocket('/ws/activity-feed', {
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === 'new_activity' || data.type === 'activity_update') {
          refetch();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    },
  });

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const markAsRead = async (itemId: string) => {
    try {
      await fetch(`${ACTIVITY_FEED_ENDPOINT}/${itemId}/read`, {
        method: 'POST',
      });
      refetch();
    } catch (error) {
      console.error('Failed to mark activity as read:', error);
    }
  };

  const executeQuickAction = async (itemId: string, actionId: string) => {
    try {
      await fetch(`${ACTIVITY_FEED_ENDPOINT}/${itemId}/actions/${actionId}`, {
        method: 'POST',
      });
      refetch();
    } catch (error) {
      console.error('Failed to execute quick action:', error);
    }
  };

  const getActivityIcon = (type: ActivityItem['type'], status: ActivityItem['status']) => {
    const iconClass = "h-5 w-5";
    
    switch (type) {
      case 'order':
        return <ShoppingCartIcon className={`${iconClass} text-blue-500`} />;
      case 'inventory':
        return <CubeIcon className={`${iconClass} text-green-500`} />;
      case 'alert':
        return <ExclamationTriangleIcon className={`${iconClass} text-red-500`} />;
      case 'production':
        return <PlayIcon className={`${iconClass} text-purple-500`} />;
      case 'quality':
        return <CheckCircleIcon className={`${iconClass} text-indigo-500`} />;
      case 'user_action':
        return <UserCircleIcon className={`${iconClass} text-gray-500`} />;
      case 'system':
        return <ArrowPathIcon className={`${iconClass} text-amber-500`} />;
      default:
        return <ClockIcon className={`${iconClass} text-gray-400`} />;
    }
  };

  const getStatusColor = (status: ActivityItem['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-amber-600 bg-amber-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'info': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIndicator = (priority: ActivityItem['priority']) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 border-l-4';
      case 'high': return 'border-l-amber-500 border-l-4';
      case 'medium': return 'border-l-yellow-500 border-l-2';
      case 'low': return 'border-l-green-500 border-l-2';
      default: return 'border-l-gray-300 border-l-2';
    }
  };

  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities;
    
    const typeMap: Record<ActivityFilter, ActivityItem['type'][]> = {
      'all': [],
      'orders': ['order'],
      'inventory': ['inventory'],
      'alerts': ['alert'],
      'production': ['production', 'quality'],
      'user_actions': ['user_action', 'system']
    };
    
    return activities.filter(activity => 
      typeMap[filter]?.includes(activity.type)
    );
  }, [activities, filter]);

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-gray-300 rounded-full animate-pulse" />
            <span className="text-sm text-gray-500">Loading activities...</span>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-red-500 rounded-full" />
            <span className="text-sm text-red-600">Connection Error</span>
          </div>
        </div>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Failed to load activity feed</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-sm text-gray-500">
              {connectionStatus === 'connected' ? 'Live' : 'Offline'}
            </span>
          </div>
          
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`p-2 rounded-lg transition-colors ${
              isAutoRefresh 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={isAutoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
          >
            {isAutoRefresh ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        <FunnelIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
        {(['all', 'orders', 'inventory', 'alerts', 'production', 'user_actions'] as ActivityFilter[]).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-3 py-1 text-sm rounded-lg whitespace-nowrap transition-colors ${
              filter === filterType
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {filterType === 'user_actions' ? 'User Actions' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            {filterType !== 'all' && (
              <span className="ml-1 text-xs opacity-75">
                ({activities.filter(a => 
                  filterType === 'user_actions' 
                    ? ['user_action', 'system'].includes(a.type)
                    : filterType === 'production'
                    ? ['production', 'quality'].includes(a.type)
                    : a.type === filterType
                ).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredActivities.length === 0 ? (
        <div className="text-center py-8">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No recent activity</p>
          <p className="text-sm text-gray-500">
            {filter === 'all' ? 'Activities will appear here as they happen' : `No ${filter} activities found`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${getPriorityIndicator(item.priority)} ${
                  !item.read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => !item.read && markAsRead(item.id)}
              >
                {/* User Avatar or Activity Icon */}
                <div className="flex-shrink-0">
                  {item.user ? (
                    <div className="relative">
                      {item.user.avatar ? (
                        <img
                          src={item.user.avatar}
                          alt={item.user.name}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <UserCircleIcon className="h-6 w-6 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-white rounded-full flex items-center justify-center border">
                        {getActivityIcon(item.type, item.status)}
                      </div>
                    </div>
                  ) : (
                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {getActivityIcon(item.type, item.status)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                        {!item.read && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {item.user && (
                          <span>{item.user.name} • {item.user.role}</span>
                        )}
                        <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                        {item.metadata?.market && (
                          <span>Market: {item.metadata.market}</span>
                        )}
                      </div>

                      {/* Metadata */}
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          {item.metadata.order_id && (
                            <div>
                              <span className="text-gray-500">Order:</span>
                              <span className="ml-1 font-medium">#{item.metadata.order_id}</span>
                            </div>
                          )}
                          {item.metadata.quantity && (
                            <div>
                              <span className="text-gray-500">Quantity:</span>
                              <span className="ml-1 font-medium">{item.metadata.quantity.toLocaleString()}</span>
                            </div>
                          )}
                          {item.metadata.value && (
                            <div>
                              <span className="text-gray-500">Value:</span>
                              <span className="ml-1 font-medium">{formatValue(item.metadata.value)}</span>
                            </div>
                          )}
                          {item.metadata.location && (
                            <div>
                              <span className="text-gray-500">Location:</span>
                              <span className="ml-1 font-medium">{item.metadata.location}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Quick Actions */}
                      {item.quick_actions && item.quick_actions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.quick_actions.map((action) => (
                            <button
                              key={action.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                executeQuickAction(item.id, action.id);
                              }}
                              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                action.variant === 'primary'
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  : action.variant === 'danger'
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(item.id);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <EllipsisHorizontalIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}