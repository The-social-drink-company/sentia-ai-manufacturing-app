
// Service Worker Registration for Sentia Dashboard
import { devLog } from '../lib/devLog';
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content available
            showUpdateNotification();
          }
        });
      });
      
      devLog.log('Service Worker registered successfully');
      return registration;
    } catch (error) {
      devLog.error('Service Worker registration failed:', error);
    }
  }
};

const showUpdateNotification = () => {
  // Show update available notification
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50';
  notification.innerHTML = `
    <div class="flex items-center space-x-3">
      <div>New version available!</div>
      <button onclick="window.location.reload()" class="bg-blue-800 px-3 py-1 rounded text-sm">
        Update
      </button>
    </div>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 10000);
};

