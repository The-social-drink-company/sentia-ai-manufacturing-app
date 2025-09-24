// User preferences and settings store with Zustand

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { UserPreferences, UserPreferencesState } from './types';

// Default preferences
const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  currency: 'GBP',
  numberFormat: 'UK',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  compactMode: false,
  animations: true,
  notifications: {
    desktop: true,
    email: true,
    push: false,
    sound: true
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false
  }
};

interface UserPreferencesStore extends UserPreferencesState {}

export const useUserPreferencesStore = create<UserPreferencesStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        preferences: defaultPreferences,
        isLoading: false,
        lastSynced: null,
        
        actions: {
          updatePreferences: (updates: Partial<UserPreferences>) => {
            set((state) => {
              state.preferences = { ...state.preferences, ...updates };
            });
          },

          resetPreferences: () => {
            set((state) => {
              state.preferences = defaultPreferences;
              state.lastSynced = null;
            });
          },

          syncPreferences: async () => {
            set((state) => {
              state.isLoading = true;
            });

            try {
              // In a real app, this would sync with the server
              const response = await fetch('/api/user/preferences', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(get().preferences),
              });

              if (!response.ok) {
                throw new Error('Failed to sync preferences');
              }

              set((state) => {
                state.lastSynced = new Date();
                state.isLoading = false;
              });
            } catch (error) {
              console.error('Failed to sync preferences:', error);
              set((state) => {
                state.isLoading = false;
              });
            }
          },

          exportPreferences: () => {
            const { preferences, lastSynced } = get();
            return JSON.stringify({
              preferences,
              lastSynced,
              exportedAt: new Date().toISOString(),
              version: '1.0'
            }, null, 2);
          },

          importPreferences: (data: string) => {
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.preferences && parsed.version === '1.0') {
                set((state) => {
                  state.preferences = { ...defaultPreferences, ...parsed.preferences };
                  state.lastSynced = parsed.lastSynced ? new Date(parsed.lastSynced) : null;
                });
              } else {
                throw new Error('Invalid preferences format');
              }
            } catch (error) {
              console.error('Failed to import preferences:', error);
              throw error;
            }
          }
        }
      })),
      {
        name: 'sentia-user-preferences',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          preferences: state.preferences,
          lastSynced: state.lastSynced
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Apply theme immediately on rehydration
            document.documentElement.classList.toggle(
              'dark',
              state.preferences.theme === 'dark' ||
              (state.preferences.theme === 'system' &&
                window.matchMedia('(prefers-color-scheme: dark)').matches)
            );

            // Apply accessibility preferences
            if (state.preferences.accessibility.reducedMotion) {
              document.documentElement.style.setProperty('--animation-duration', '0s');
            }

            if (state.preferences.accessibility.largeText) {
              document.documentElement.classList.add('large-text');
            }

            if (state.preferences.accessibility.highContrast) {
              document.documentElement.classList.add('high-contrast');
            }
          }
        }
      }
    )
  )
);

// Convenience hooks for specific preference sections
export const useTheme = () => {
  return useUserPreferencesStore((state) => ({
    theme: state.preferences.theme,
    setTheme: (theme: UserPreferences['theme']) =>
      state.actions.updatePreferences({ theme })
  }));
};

export const useLocalization = () => {
  return useUserPreferencesStore((state) => ({
    language: state.preferences.language,
    dateFormat: state.preferences.dateFormat,
    timeFormat: state.preferences.timeFormat,
    currency: state.preferences.currency,
    numberFormat: state.preferences.numberFormat,
    timezone: state.preferences.timezone,
    updateLocalization: (updates: Partial<Pick<UserPreferences, 'language' | 'dateFormat' | 'timeFormat' | 'currency' | 'numberFormat' | 'timezone'>>) =>
      state.actions.updatePreferences(updates)
  }));
};

export const useNotificationPreferences = () => {
  return useUserPreferencesStore((state) => ({
    notifications: state.preferences.notifications,
    updateNotifications: (notifications: Partial<UserPreferences['notifications']>) =>
      state.actions.updatePreferences({
        notifications: { ...state.preferences.notifications, ...notifications }
      })
  }));
};

export const useAccessibilityPreferences = () => {
  return useUserPreferencesStore((state) => ({
    accessibility: state.preferences.accessibility,
    updateAccessibility: (accessibility: Partial<UserPreferences['accessibility']>) =>
      state.actions.updatePreferences({
        accessibility: { ...state.preferences.accessibility, ...accessibility }
      })
  }));
};

// Theme system integration
export const initializeThemeSystem = () => {
  const store = useUserPreferencesStore.getState();
  
  // Set up theme change listener
  const unsubscribeTheme = useUserPreferencesStore.subscribe(
    (state) => state.preferences.theme,
    (theme) => {
      const isDark = theme === 'dark' || 
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      document.documentElement.classList.toggle('dark', isDark);
      
      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDark ? '#111827' : '#ffffff');
      }
    }
  );

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = () => {
    if (store.preferences.theme === 'system') {
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
    }
  };

  mediaQuery.addListener(handleSystemThemeChange);

  // Set up accessibility preferences listener
  const unsubscribeAccessibility = useUserPreferencesStore.subscribe(
    (state) => state.preferences.accessibility,
    (accessibility) => {
      // Apply reduced motion
      document.documentElement.style.setProperty(
        '--animation-duration',
        accessibility.reducedMotion ? '0s' : ''
      );

      // Apply text size
      document.documentElement.classList.toggle('large-text', accessibility.largeText);

      // Apply high contrast
      document.documentElement.classList.toggle('high-contrast', accessibility.highContrast);

      // Screen reader announcements
      if (accessibility.screenReader) {
        document.documentElement.setAttribute('data-screen-reader', 'true');
      } else {
        document.documentElement.removeAttribute('data-screen-reader');
      }
    }
  );

  // Cleanup function
  return () => {
    unsubscribeTheme();
    unsubscribeAccessibility();
    mediaQuery.removeListener(handleSystemThemeChange);
  };
};

// Validation utilities
export const validatePreferences = (preferences: Partial<UserPreferences>): string[] => {
  const errors: string[] = [];

  if (preferences.theme && !['light', 'dark', 'system'].includes(preferences.theme)) {
    errors.push('Invalid theme value');
  }

  if (preferences.dateFormat && !['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].includes(preferences.dateFormat)) {
    errors.push('Invalid date format');
  }

  if (preferences.timeFormat && !['12h', '24h'].includes(preferences.timeFormat)) {
    errors.push('Invalid time format');
  }

  if (preferences.numberFormat && !['US', 'EU', 'UK'].includes(preferences.numberFormat)) {
    errors.push('Invalid number format');
  }

  if (preferences.timezone) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: preferences.timezone });
    } catch {
      errors.push('Invalid timezone');
    }
  }

  return errors;
};