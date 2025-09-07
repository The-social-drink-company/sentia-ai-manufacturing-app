// Service Worker for PWA caching and offline support

const CACHE_NAME = 'sentia-manufacturing-v1.0.0';
const STATIC_CACHE = 'sentia-static-v1.0.0';
const DYNAMIC_CACHE = 'sentia-dynamic-v1.0.0';
const API_CACHE = 'sentia-api-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html',
];

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
  /\/api\/user\/.*/,
  /\/api\/markets\/.*/,
  /\/api\/dashboard\/.*/,
  /\/api\/analytics\/.*/,
];

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  static: 7 * 24 * 60 * 60 * 1000, // 7 days
  dynamic: 24 * 60 * 60 * 1000, // 24 hours
  api: 30 * 60 * 1000, // 30 minutes
};

// Maximum cache sizes
const CACHE_LIMITS = {
  static: 50,
  dynamic: 100,
  api: 200,
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE && 
                     cacheName !== API_CACHE;
            })
            .map((cacheName) => {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Claim all clients
      self.clients.claim(),
    ]).then(() => {
      console.log('Service Worker: Activation complete');
    })
  );
});

// Fetch event - handle network requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests and non-GET requests for caching
  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }

  // Different strategies for different types of requests
  if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  const cacheName = API_CACHE;
  const cacheKey = getCacheKey(request);
  
  try {
    // Try network first
    console.log('Service Worker: Fetching API request from network:', request.url);
    
    const networkResponse = await fetchWithTimeout(request, 5000);
    
    if (networkResponse.ok) {
      // Clone response for caching
      const responseToCache = networkResponse.clone();
      
      // Cache successful responses
      const cache = await caches.open(cacheName);
      await cache.put(cacheKey, responseToCache);
      
      // Clean up old API cache entries
      await cleanupCache(cacheName, CACHE_LIMITS.api);
      
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.log('Service Worker: Network failed for API request, trying cache:', error.message);
    
    // Fallback to cache
    const cachedResponse = await caches.match(cacheKey);
    
    if (cachedResponse) {
      // Check if cached response is still valid
      if (await isCacheValid(cachedResponse, CACHE_EXPIRATION.api)) {
        console.log('Service Worker: Serving API request from cache');
        return cachedResponse;
      } else {
        // Remove expired cache entry
        const cache = await caches.open(cacheName);
        await cache.delete(cacheKey);
      }
    }
    
    // Return offline response for critical API endpoints
    return createOfflineResponse(request);
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cacheName = STATIC_CACHE;
  
  // Try cache first
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('Service Worker: Serving static asset from cache:', request.url);
    return cachedResponse;
  }
  
  // Fallback to network
  try {
    console.log('Service Worker: Fetching static asset from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
      
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset:', error.message);
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    
    // Return empty response for other assets
    return new Response('', { status: 404 });
  }
}

// Handle dynamic requests with stale-while-revalidate strategy
async function handleDynamicRequest(request) {
  const cacheName = DYNAMIC_CACHE;
  const cacheKey = getCacheKey(request);
  
  // Serve from cache immediately if available
  const cachedResponse = await caches.match(cacheKey);
  
  // Background fetch to update cache
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(cacheKey, networkResponse.clone());
      
      // Clean up old dynamic cache entries
      await cleanupCache(cacheName, CACHE_LIMITS.dynamic);
    }
    return networkResponse;
  }).catch((error) => {
    console.log('Service Worker: Background fetch failed:', error.message);
  });
  
  if (cachedResponse) {
    console.log('Service Worker: Serving dynamic request from cache (stale-while-revalidate)');
    
    // Check if cache is still valid
    if (await isCacheValid(cachedResponse, CACHE_EXPIRATION.dynamic)) {
      return cachedResponse;
    }
  }
  
  // If no cache or expired, wait for network
  try {
    return await fetchPromise;
  } catch (error) {
    console.log('Service Worker: Network failed for dynamic request:', error.message);
    
    // Return cached response even if expired
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    
    return new Response('Offline', { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Utility functions

function isAPIRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  return STATIC_ASSETS.includes(pathname) ||
         pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/);
}

function getCacheKey(request) {
  const url = new URL(request.url);
  
  // Remove cache-busting parameters for API requests
  if (isAPIRequest(request)) {
    url.searchParams.delete('_t');
    url.searchParams.delete('timestamp');
  }
  
  return url.toString();
}

async function fetchWithTimeout(request, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(request, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function isCacheValid(response, maxAge) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseDate = new Date(dateHeader);
  const now = new Date();
  const age = now.getTime() - responseDate.getTime();
  
  return age < maxAge;
}

async function cleanupCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    // Remove oldest entries (assuming chronological order)
    const keysToDelete = keys.slice(0, keys.length - maxEntries);
    
    await Promise.all(
      keysToDelete.map(key => cache.delete(key))
    );
    
    console.log(`Service Worker: Cleaned up ${keysToDelete.length} entries from ${cacheName}`);
  }
}

function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  // Return appropriate offline responses based on endpoint
  if (url.pathname.includes('/api/user/')) {
    return new Response(
      JSON.stringify({
        data: null,
        success: false,
        message: 'Offline - user data unavailable',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
  
  if (url.pathname.includes('/api/')) {
    return new Response(
      JSON.stringify({
        data: [],
        success: false,
        message: 'Offline - data unavailable',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
  
  return new Response('Service Unavailable', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-actions') {
    event.waitUntil(processOfflineActions());
  }
});

async function processOfflineActions() {
  // Process any queued actions when back online
  console.log('Service Worker: Processing offline actions');
  
  // Implementation would depend on specific offline action requirements
  // This could include syncing form submissions, cache updates, etc.
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push message received');
  
  let options = {
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'sentia-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/action-view.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/action-dismiss.png',
      },
    ],
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      options = { ...options, ...payload };
    } catch (error) {
      console.error('Service Worker: Failed to parse push payload:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Sentia Manufacturing', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clients) => {
        // Focus existing window if available
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if no existing window found
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
  
  // Action tracking could be implemented here
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'GET_CACHE_STATUS':
        event.ports[0].postMessage(getCacheStatus());
        break;
        
      case 'CLEAR_CACHE':
        event.waitUntil(clearAllCaches());
        break;
        
      default:
        console.log('Service Worker: Unknown message type:', event.data.type);
    }
  }
});

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = {
      entries: keys.length,
      urls: keys.map(request => request.url),
    };
  }
  
  return status;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
  console.log('Service Worker: All caches cleared');
}