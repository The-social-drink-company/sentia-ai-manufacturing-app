// Notification queue management store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Notification, NotificationState } from './types';
import { nanoid } from 'nanoid';

interface NotificationStore extends NotificationState {}

export const useNotificationStore = create<NotificationStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        queue: [],
        settings: {
          maxNotifications: 50,
          defaultDuration: 5000,
          enableSound: true,
          enableDesktop: true,
        },

        actions: {
          addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
            set((state) => {
              const newNotification: Notification = {
                ...notification,
                id: nanoid(),
                timestamp: new Date(),
                read: false,
              };

              // Add to queue for processing
              state.queue.push(newNotification);

              // Add to notifications list
              state.notifications.unshift(newNotification);

              // Update unread count
              state.unreadCount += 1;

              // Enforce max notifications limit
              if (state.notifications.length > state.settings.maxNotifications) {
                const removed = state.notifications.splice(state.settings.maxNotifications);
                // Subtract unread count for removed unread notifications
                const removedUnread = removed.filter(n => !n.read).length;
                state.unreadCount = Math.max(0, state.unreadCount - removedUnread);
              }

              // Auto-remove notification after duration if autoClose is true
              if (newNotification.autoClose && newNotification.duration > 0) {
                setTimeout(() => {
                  const currentState = get();
                  if (currentState.notifications.some(n => n.id === newNotification.id)) {
                    currentState.actions.removeNotification(newNotification.id);
                  }
                }, newNotification.duration);
              }
            });

            // Handle side effects after state update
            const { queue, settings } = get();
            const newNotification = queue[queue.length - 1];
            
            if (newNotification) {
              // Play sound if enabled
              if (settings.enableSound && notification.type === 'error') {
                playNotificationSound();
              }

              // Show desktop notification if enabled and permission granted
              if (settings.enableDesktop && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                  showDesktopNotification(newNotification);
                } else if (Notification.permission !== 'denied') {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      showDesktopNotification(newNotification);
                    }
                  });
                }
              }

              // Remove from queue after processing
              set((state) => {
                state.queue = state.queue.filter(n => n.id !== newNotification.id);
              });
            }
          },

          removeNotification: (id: string) => {
            set((state) => {
              const notification = state.notifications.find(n => n.id === id);
              
              if (notification) {
                state.notifications = state.notifications.filter(n => n.id !== id);
                
                if (!notification.read) {
                  state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
              }
            });
          },

          markAsRead: (id: string) => {
            set((state) => {
              const notification = state.notifications.find(n => n.id === id);
              
              if (notification && !notification.read) {
                notification.read = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
              }
            });
          },

          markAllAsRead: () => {
            set((state) => {
              state.notifications.forEach(notification => {
                notification.read = true;
              });
              state.unreadCount = 0;
            });
          },

          clearAll: () => {
            set((state) => {
              state.notifications = [];
              state.unreadCount = 0;
              state.queue = [];
            });
          },

          clearByCategory: (category: string) => {
            set((state) => {
              const removedNotifications = state.notifications.filter(n => n.category === category);
              const removedUnreadCount = removedNotifications.filter(n => !n.read).length;
              
              state.notifications = state.notifications.filter(n => n.category !== category);
              state.unreadCount = Math.max(0, state.unreadCount - removedUnreadCount);
              state.queue = state.queue.filter(n => n.category !== category);
            });
          },

          updateSettings: (settings: Partial<NotificationState['settings']>) => {
            set((state) => {
              state.settings = { ...state.settings, ...settings };
            });
          },
        },
      })),
      {
        name: 'sentia-notifications',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          notifications: state.notifications.slice(0, 20), // Only persist recent notifications
          settings: state.settings,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Recalculate unread count after rehydration
            state.unreadCount = state.notifications.filter(n => !n.read).length;
          }
        },
      }
    )
  )
);

// Convenience hooks
export const useNotifications = () => {
  return useNotificationStore((state) => ({
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
  }));
};

export const useNotificationActions = () => {
  return useNotificationStore((state) => state.actions);
};

export const useNotificationSettings = () => {
  return useNotificationStore((state) => ({
    settings: state.settings,
    updateSettings: state.actions.updateSettings,
  }));
};

// Notification type helpers
export const useNotificationsByType = (type: Notification['type']) => {
  return useNotificationStore((state) => 
    state.notifications.filter(n => n.type === type)
  );
};

export const useNotificationsByCategory = (category: string) => {
  return useNotificationStore((state) => 
    state.notifications.filter(n => n.category === category)
  );
};

export const useUnreadNotifications = () => {
  return useNotificationStore((state) => 
    state.notifications.filter(n => !n.read)
  );
};

export const usePriorityNotifications = (priority: Notification['priority']) => {
  return useNotificationStore((state) => 
    state.notifications.filter(n => n.priority === priority && !n.read)
  );
};

// Utility functions
const playNotificationSound = () => {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Silently fail if sound can't play
    });
  } catch (error) {
    // Silently fail if Audio API is not available
  }
};

const showDesktopNotification = (notification: Notification) => {
  try {
    const desktopNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/icon-192x192.png',
      tag: notification.id,
      silent: false,
    });

    desktopNotification.onclick = () => {
      window.focus();
      desktopNotification.close();
      
      // Mark as read when clicked
      const store = useNotificationStore.getState();
      store.actions.markAsRead(notification.id);
    };

    // Auto-close desktop notification after duration
    if (notification.autoClose && notification.duration > 0) {
      setTimeout(() => {
        desktopNotification.close();
      }, notification.duration);
    }
  } catch (error) {
    // Silently fail if desktop notifications are not supported
  }
};

// Notification builders
export const createNotification = {
  success: (title: string, message: string, options?: Partial<Notification>): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'success',
    title,
    message,
    priority: 'medium',
    category: 'general',
    persistent: false,
    autoClose: true,
    duration: 5000,
    ...options,
  }),

  error: (title: string, message: string, options?: Partial<Notification>): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'error',
    title,
    message,
    priority: 'high',
    category: 'error',
    persistent: true,
    autoClose: false,
    duration: 0,
    ...options,
  }),

  warning: (title: string, message: string, options?: Partial<Notification>): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'warning',
    title,
    message,
    priority: 'medium',
    category: 'general',
    persistent: false,
    autoClose: true,
    duration: 7000,
    ...options,
  }),

  info: (title: string, message: string, options?: Partial<Notification>): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'info',
    title,
    message,
    priority: 'low',
    category: 'general',
    persistent: false,
    autoClose: true,
    duration: 4000,
    ...options,
  }),

  critical: (title: string, message: string, options?: Partial<Notification>): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'error',
    title,
    message,
    priority: 'critical',
    category: 'system',
    persistent: true,
    autoClose: false,
    duration: 0,
    ...options,
  }),
};

// Notification queue management
export const getNotificationStats = () => {
  const state = useNotificationStore.getState();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    total: state.notifications.length,
    unread: state.unreadCount,
    today: state.notifications.filter(n => n.timestamp >= today).length,
    thisWeek: state.notifications.filter(n => n.timestamp >= thisWeek).length,
    byType: {
      info: state.notifications.filter(n => n.type === 'info').length,
      success: state.notifications.filter(n => n.type === 'success').length,
      warning: state.notifications.filter(n => n.type === 'warning').length,
      error: state.notifications.filter(n => n.type === 'error').length,
    },
    byPriority: {
      low: state.notifications.filter(n => n.priority === 'low').length,
      medium: state.notifications.filter(n => n.priority === 'medium').length,
      high: state.notifications.filter(n => n.priority === 'high').length,
      critical: state.notifications.filter(n => n.priority === 'critical').length,
    },
  };
};

// Cleanup old notifications
export const cleanupOldNotifications = (maxAge: number = 7 * 24 * 60 * 60 * 1000) => {
  const cutoff = new Date(Date.now() - maxAge);
  
  useNotificationStore.setState((state) => {
    const oldNotifications = state.notifications.filter(n => n.timestamp < cutoff && n.read && !n.persistent);
    const oldUnreadCount = oldNotifications.filter(n => !n.read).length;
    
    state.notifications = state.notifications.filter(n => 
      n.timestamp >= cutoff || !n.read || n.persistent
    );
    
    state.unreadCount = Math.max(0, state.unreadCount - oldUnreadCount);
  });
};

// Initialize notification system
export const initializeNotificationSystem = () => {
  // Request desktop notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Clean up old notifications periodically
  const cleanupInterval = setInterval(() => {
    cleanupOldNotifications();
  }, 60 * 60 * 1000); // Every hour

  // Return cleanup function
  return () => {
    clearInterval(cleanupInterval);
  };
};