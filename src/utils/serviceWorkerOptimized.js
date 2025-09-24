/**
 * Optimized Service Worker for Performance Enhancement
 * Implements intelligent caching, background sync, and offline support
 */

const CACHE_NAME = 'sentia-manufacturing-v1';
const STATIC_CACHE = 'sentia-static-v1';
const DYNAMIC_CACHE = 'sentia-dynamic-v1';
const API_CACHE = 'sentia-api-v1';

// Cache strategies
const CACHE_STRATEGIES = {
  STATIC_ASSETS: 'cache-first',
  API_DATA: 'network-first',
  IMAGES: 'cache-first',
  FONTS: 'cache-first',
  DOCUMENTS: 'network-first'
};

// Cache configuration
const CACHE_CONFIG = {
  // Static assets (JS, CSS, images)
  static: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100
  },
  // API responses
  api: {
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50
  },
  // Images
  images: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 200
  },
  // Fonts
  fonts: {
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    maxEntries: 20
  }
};

// URL patterns for different cache strategies
const URL_PATTERNS = {
  static: [
    /\.js$/,
    /\.css$/,
    /\.woff2?$/,
    /\.ttf$/,
    /\.eot$/
  ],
  images: [
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
    /\.svg$/,
    /\.webp$/
  ],
  api: [
    /\/api\/.*$/,
    /\/graphql/
  ]
};

// Performance monitoring
const performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  offlineRequests: 0
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Pre-cache critical static assets
      return cache.addAll([
        '/',
        '/static/js/bundle.js',
        '/static/css/main.css',
        '/manifest.json'
      ]).catch((error) => {
        console.warn('Service Worker: Failed to cache some static assets:', error);
      });
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Determine cache strategy based on URL
  const strategy = getCacheStrategy(url);
  
  event.respondWith(
    handleRequest(request, strategy)
  );
});

// Handle different types of requests with appropriate strategies
async function handleRequest(request, strategy) {
  const url = new URL(request.url);
  
  try {
    switch (strategy) {
      case 'cache-first':
        return await cacheFirst(request);
      
      case 'network-first':
        return await networkFirst(request);
      
      case 'stale-while-revalidate':
        return await staleWhileRevalidate(request);
      
      default:
        return await networkFirst(request);
    }
  } catch (error) {
    console.error('Service Worker: Request failed:', error);
    return await getOfflineFallback(request);
  }
}

// Cache-first strategy (for static assets)
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    return cachedResponse;
  }
  
  performanceMetrics.cacheMisses++;
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    const cache = await getCacheForRequest(request);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network-first strategy (for API calls)
async function networkFirst(request) {
  try {
    performanceMetrics.networkRequests++;
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await getCacheForRequest(request);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    performanceMetrics.offlineRequests++;
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      performanceMetrics.cacheHits++;
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale-while-revalidate strategy (for frequently updated data)
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  // Return cached version immediately if available
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = getCacheForRequest(request);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Get appropriate cache for request type
async function getCacheForRequest(request) {
  const url = new URL(request.url);
  
  if (URL_PATTERNS.static.some(pattern => pattern.test(url.pathname))) {
    return await caches.open(STATIC_CACHE);
  } else if (URL_PATTERNS.images.some(pattern => pattern.test(url.pathname))) {
    return await caches.open(DYNAMIC_CACHE);
  } else if (URL_PATTERNS.api.some(pattern => pattern.test(url.pathname))) {
    return await caches.open(API_CACHE);
  } else {
    return await caches.open(DYNAMIC_CACHE);
  }
}

// Determine cache strategy for URL
function getCacheStrategy(url) {
  if (URL_PATTERNS.static.some(pattern => pattern.test(url.pathname))) {
    return 'cache-first';
  } else if (URL_PATTERNS.images.some(pattern => pattern.test(url.pathname))) {
    return 'cache-first';
  } else if (URL_PATTERNS.api.some(pattern => pattern.test(url.pathname))) {
    return 'network-first';
  } else {
    return 'stale-while-revalidate';
  }
}

// Offline fallback
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // Return cached version if available
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return a basic offline response
  return new Response(
    JSON.stringify({ 
      error: 'Offline', 
      message: 'This resource is not available offline' 
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Background sync implementation
async function doBackgroundSync() {
  try {
    // Sync offline data when connection is restored
    const offlineData = await getOfflineData();
    
    for (const data of offlineData) {
      try {
        await fetch(data.url, {
          method: data.method,
          body: data.body,
          headers: data.headers
        });
        
        // Remove from offline storage after successful sync
        await removeOfflineData(data.id);
      } catch (error) {
        console.error('Service Worker: Failed to sync offline data:', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Message handling for client communication
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    case 'GET_PERFORMANCE_METRICS':
      event.ports[0].postMessage({ 
        type: 'PERFORMANCE_METRICS', 
        metrics: performanceMetrics 
      });
      break;
  }
});

// Cache management utilities
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    totalSize += requests.length;
  }
  
  return totalSize;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Utility functions for offline data management
async function getOfflineData() {
  // Implementation depends on your offline storage strategy
  // This could use IndexedDB, localStorage, or other storage mechanisms
  return [];
}

async function removeOfflineData(id) {
  // Implementation depends on your offline storage strategy
  console.log('Removing offline data:', id);
}

// Performance monitoring
setInterval(() => {
  console.log('Service Worker Performance:', performanceMetrics);
}, 60000); // Log every minute

console.log('Service Worker: Loaded successfully');
