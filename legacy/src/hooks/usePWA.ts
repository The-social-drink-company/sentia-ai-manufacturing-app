import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAStatus {
  isInstalled: boolean;
  isInstallable: boolean;
  isOffline: boolean;
  isUpdateAvailable: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
}

export const usePWA = () => {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>({
    isInstalled: false,
    isInstallable: false,
    isOffline: !navigator.onLine,
    isUpdateAvailable: false,
    installPrompt: null
  });

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = isStandalone || (window.navigator as any).standalone;
      
      setPwaStatus(prev => ({ ...prev, isInstalled }));
    };

    checkInstalled();

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(reg => {
          setRegistration(reg);
          console.log('[PWA] Service Worker registered');

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setPwaStatus(prev => ({ ...prev, isUpdateAvailable: true }));
                  console.log('[PWA] New update available');
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setPwaStatus(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e
      }));
      console.log('[PWA] Install prompt ready');
    };

    // Handle app installed
    const handleAppInstalled = () => {
      setPwaStatus(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null
      }));
      console.log('[PWA] App installed');
    };

    // Handle online/offline status
    const handleOnline = () => {
      setPwaStatus(prev => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      setPwaStatus(prev => ({ ...prev, isOffline: true }));
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Media query listener for installed state
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      mediaQuery.removeEventListener('change', checkInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!pwaStatus.installPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      await pwaStatus.installPrompt.prompt();
      const { outcome } = await pwaStatus.installPrompt.userChoice;
      
      console.log(`[PWA] User response to install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        setPwaStatus(prev => ({
          ...prev,
          isInstallable: false,
          installPrompt: null
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA] Install failed:', error);
      return false;
    }
  }, [pwaStatus.installPrompt]);

  const updateApp = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      }
      
      console.log('[PWA] Cache cleared');
      return true;
    }
    return false;
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('[PWA] Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) return false;
    }

    if (registration?.showNotification) {
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });
      return true;
    }

    return false;
  }, [registration, requestNotificationPermission]);

  const subscribeToPushNotifications = useCallback(async () => {
    if (!registration || !('PushManager' in window)) {
      return null;
    }

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY
      });

      console.log('[PWA] Push subscription created');
      return subscription;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      return null;
    }
  }, [registration]);

  const registerBackgroundSync = useCallback(async (tag: string) => {
    if (!registration || !('sync' in registration)) {
      return false;
    }

    try {
      await (registration as any).sync.register(tag);
      console.log(`[PWA] Background sync registered: ${tag}`);
      return true;
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
      return false;
    }
  }, [registration]);

  return {
    ...pwaStatus,
    installApp,
    updateApp,
    clearCache,
    requestNotificationPermission,
    sendNotification,
    subscribeToPushNotifications,
    registerBackgroundSync
  };
};