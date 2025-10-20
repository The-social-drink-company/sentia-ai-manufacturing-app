
// Enterprise Service Worker - Advanced Caching and Offline Strategy
// CapLiquify Manufacturing Platform

const CACHE_NAME = 'sentia-manufacturing-v1.0.3';
const STATIC_CACHE = 'sentia-static-v1.0.3';
const DYNAMIC_CACHE = 'sentia-dynamic-v1.0.3';
const API_CACHE = 'sentia-api-v1.0.3';
const IMAGE_CACHE = 'sentia-images-v1.0.3';

// Cache strategies configuration
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Static assets to cache immediately (App Shell)
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/offline.html',
  // Core CSS and JS will be cached automatically by Vite
];

// API endpoints that should be cached
const CACHEABLE_API_PATTERNS = [
  //api/dashboard//,
  //api/analytics//,
  //api/inventory//,
  //api/production//,
  //api/quality//,
  //api/forecasting//,
  //api/working-capital//
];

// API endpoints that should never be cached
const NON_CACHEABLE_API_PATTERNS = [
  //api/auth//,
  //api/admin/logs/,
  //api/real-time//,
  //api/webhooks//,
  //api/live-data//
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(API_CACHE).then(cache => {
        console.log('[SW] API cache initialized');
        return cache;
      }),
      caches.open(IMAGE_CACHE).then(cache => {
        console.log('[SW] Image cache initialized');
        return cache;
      })
    ]).then(() => {
      console.log('[SW] Service worker installed successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old cache versions
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== API_CACHE &&
              cacheName !== IMAGE_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Skip Clerk authentication domains - let them handle their own requests
  if (request.url.includes('clerk.accounts.dev') || 
      request.url.includes('clerk.com') || 
      request.url.includes('clerk.dev')) {
    return;
  }
  
  event.respondWith(handleRequest(request, url));
});

// Main request handler
async function handleRequest(request, url) {
  try {
    // API requests
    if (url.pathname.startsWith('/api/')) {
      return handleAPIRequest(request, url);
    }
    
    // Static assets (JS, CSS, fonts)
    if (isStaticAsset(url.pathname)) {
      return handleStaticAsset(request);
    }
    
    // Images
    if (isImage(url.pathname)) {
      return handleImageRequest(request);
    }
    
    // Navigation requests (HTML pages)
    if (request.mode === 'navigate') {
      return handleNavigationRequest(request);
    }
    
    // Default to network first
    return handleNetworkFirst(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('[SW] Request handling error:', error);
    return handleOfflineFallback(request);
  }
}

// Handle API requests with intelligent caching
async function handleAPIRequest(request, url) {
  const pathname = url.pathname;
  
  // Never cache authentication or real-time endpoints
  if (NON_CACHEABLE_API_PATTERNS.some(pattern => pattern.test(pathname))) {
    return fetch(request);
  }
  
  // Cache dashboard and analytics data
  if (CACHEABLE_API_PATTERNS.some(pattern => pattern.test(pathname))) {
    return handleStaleWhileRevalidate(request, API_CACHE, {
      maxAge: 5 * 60 * 1000 // 5 minutes
    });
  }
  
  // Default network first for other API requests
  return handleNetworkFirst(request, API_CACHE);
}

// Handle static assets (JS, CSS, fonts)
async function handleStaticAsset(request) {
  return handleCacheFirst(request, STATIC_CACHE);
}

// Handle image requests
async function handleImageRequest(request) {
  return handleStaleWhileRevalidate(request, IMAGE_CACHE, {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
}

// Handle navigation requests (HTML pages)
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const response = await fetch(request);
    
    // Cache successful navigation responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/offline.html');
  }
}

// Cache first strategy
async function handleCacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const response = await fetch(request);
  
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  
  return response;
}

// Network first strategy
async function handleNetworkFirst(request, cacheName, options = {}) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale while revalidate strategy
async function handleStaleWhileRevalidate(request, cacheName, options = {}) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Background fetch to update cache
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Silently handle network errors in background
  });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    // Check if cache is stale
    const cacheTime = cachedResponse.headers.get('sw-cache-time');
    const maxAge = options.maxAge || 10 * 60 * 1000; // 10 minutes default
    
    if (cacheTime && (Date.now() - parseInt(cacheTime)) < maxAge) {
      return cachedResponse;
    }
  }
  
  // Wait for network if no cache or stale cache
  return fetchPromise || cachedResponse;
}

// Offline fallback
async function handleOfflineFallback(request) {
  // For navigation requests, return offline page
  if (request.mode === 'navigate') {
    return caches.match('/offline.html');
  }
  
  // For API requests, return cached data if available
  if (request.url.includes('/api/')) {
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline API response
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'No network connection available',
      cached: false
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    });
  }
  
  // For other requests, return network error
  return new Response('Offline', { status: 503 });
}

// Utility functions
function isStaticAsset(pathname) {
  return /.(js|css|woff|woff2|ttf|eot)$/.test(pathname);
}

function isImage(pathname) {
  return /.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(pathname);
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-manufacturing-data') {
    event.waitUntil(syncManufacturingData());
  }
});

// Sync manufacturing data when back online
async function syncManufacturingData() {
  try {
    console.log('[SW] Syncing manufacturing data...');
    
    // Get offline actions from IndexedDB or localStorage
    // This would sync form submissions, data updates, etc.
    
    // For now, just clear old cached API data to force fresh fetch
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    
    // Clear stale data caches
    for (const request of requests) {
      if (request.url.includes('/api/')) {
        await cache.delete(request);
      }
    }
    
    console.log('[SW] Manufacturing data sync completed');
  } catch (error) {
    console.error('[SW] Sync error:', error);
  }
}

// Handle push notifications for manufacturing alerts
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'manufacturing-alert',
      requireInteraction: data.priority === 'high',
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('[SW] Push notification error:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const action = event.action;
  const tag = event.notification.tag;
  
  event.waitUntil(
    clients.matchAll().then(clientList => {
      // Focus existing tab or open new one
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      
      // Open appropriate page based on notification
      let url = '/dashboard';
      if (tag === 'production-alert') url = '/production';
      else if (tag === 'quality-alert') url = '/quality';
      else if (tag === 'inventory-alert') url = '/inventory';
      
      return clients.openWindow(url);
    })
  );
});

console.log('[SW] Sentia Manufacturing Service Worker loaded successfully');

