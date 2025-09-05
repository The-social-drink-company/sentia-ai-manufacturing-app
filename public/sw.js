
// Sentia Manufacturing Dashboard - Service Worker
// Enterprise-grade caching and offline support

const CACHE_NAME = 'sentia-dashboard-v1.0.0';
const STATIC_CACHE = 'sentia-static-v1.0.0';
const API_CACHE = 'sentia-api-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Critical CSS and JS will be added by build process
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/kpi-metrics',
  '/api/dashboard-data',
  '/api/manufacturing-metrics'
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cacheFirst',
  NETWORK_FIRST: 'networkFirst',
  STALE_WHILE_REVALIDATE: 'staleWhileRevalidate'
};

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(API_CACHE)
    ]).then(() => {
      console.log('Service Worker: Static assets cached');
      self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// API request handler - Network first with cache fallback
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      cache.put(request, response.clone());
      return response;
    }
    
    // If network fails, try cache
    return await cache.match(request) || new Response('Offline', { status: 503 });
  } catch (error) {
    // Network error, try cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add offline indicator header
      const headers = new Headers(cachedResponse.headers);
      headers.append('X-Served-By', 'ServiceWorker-Cache');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    return new Response('Offline - No cached data available', { status: 503 });
  }
}

// Static asset handler - Cache first
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Page request handler - Network first with cache fallback
async function handlePageRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      return response;
    }
  } catch (error) {
    console.log('Network request failed, trying cache');
  }
  
  // Try to serve cached index.html for SPA routes
  const cache = await caches.open(STATIC_CACHE);
  return await cache.match('/index.html') || new Response('Offline', { status: 503 });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Sync any queued offline actions
  console.log('Service Worker: Background sync');
}
