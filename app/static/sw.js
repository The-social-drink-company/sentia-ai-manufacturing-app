/**
 * Service Worker for Sentia Manufacturing Dashboard
 * Provides offline functionality, caching, and push notifications
 */

const CACHE_NAME = 'sentia-v1.0.0';
const STATIC_CACHE = 'sentia-static-v1.0.0';
const DYNAMIC_CACHE = 'sentia-dynamic-v1.0.0';
const API_CACHE = 'sentia-api-v1.0.0';

// Files to cache on install
const STATIC_FILES = [
    '/',
    '/static/css/bootstrap.min.css',
    '/static/css/ui-enhancements.css',
    '/static/css/help-widget.css',
    '/static/js/bootstrap.bundle.min.js',
    '/static/js/ui-enhancements.js',
    '/static/js/help-widget.js',
    '/static/icons/icon-192x192.png',
    '/static/icons/icon-512x512.png',
    '/manifest.json'
];

// Routes that work offline
const OFFLINE_ROUTES = [
    '/dashboard',
    '/forecasting',
    '/inventory',
    '/production',
    '/help',
    '/profile'
];

// API endpoints to cache
const CACHEABLE_APIS = [
    '/api/products',
    '/api/dashboard-summary',
    '/api/user-preferences'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static files
            caches.open(STATIC_CACHE).then(cache => {
                console.log('Caching static files');
                return cache.addAll(STATIC_FILES);
            }),
            
            // Skip waiting to activate immediately
            self.skipWaiting()
        ])
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => 
                            cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== API_CACHE
                        )
                        .map(cacheName => {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            }),
            
            // Claim all clients
            self.clients.claim()
        ])
    );
});

// Fetch event - handle network requests
self.addEventListener('fetch', event => {
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
    
    // Handle different types of requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleAPIRequest(request));
    } else if (url.pathname.startsWith('/static/')) {
        event.respondWith(handleStaticRequest(request));
    } else {
        event.respondWith(handlePageRequest(request));
    }
});

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
    const url = new URL(request.url);
    const cache = await caches.open(API_CACHE);
    
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses for cacheable APIs
        if (networkResponse.ok && shouldCacheAPI(url.pathname)) {
            const responseClone = networkResponse.clone();
            await cache.put(request, responseClone);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('Network failed for API request, trying cache:', url.pathname);
        
        // Fallback to cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            // Add header to indicate cached response
            const response = cachedResponse.clone();
            response.headers.set('X-Served-By', 'ServiceWorker');
            return response;
        }
        
        // Return offline fallback for critical APIs
        return getOfflineAPIResponse(url.pathname);
    }
}

// Handle static file requests with cache-first strategy
async function handleStaticRequest(request) {
    const cache = await caches.open(STATIC_CACHE);
    
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        // Fallback to network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache the response
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('Failed to load static file:', request.url);
        // Return a placeholder or error response
        return new Response('Resource not available offline', { 
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Handle page requests with network-first, cache fallback
async function handlePageRequest(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses for offline routes
            const url = new URL(request.url);
            if (shouldCacheRoute(url.pathname)) {
                await cache.put(request, networkResponse.clone());
            }
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('Network failed for page request, trying cache:', request.url);
        
        // Try cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback to offline page
        return getOfflinePage(request);
    }
}

// Check if API should be cached
function shouldCacheAPI(pathname) {
    return CACHEABLE_APIs.some(api => pathname.startsWith(api));
}

// Check if route should be cached
function shouldCacheRoute(pathname) {
    return OFFLINE_ROUTES.some(route => 
        pathname === route || pathname.startsWith(route + '/')
    );
}

// Get offline API response
function getOfflineAPIResponse(pathname) {
    // Return appropriate offline responses for different APIs
    if (pathname.includes('/dashboard-summary')) {
        return new Response(JSON.stringify({
            success: false,
            offline: true,
            message: 'Dashboard data unavailable offline',
            data: {
                total_products: 'N/A',
                active_jobs: 'N/A',
                inventory_value: 'N/A'
            }
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'X-Served-By': 'ServiceWorker-Offline'
            }
        });
    }
    
    // Generic offline response
    return new Response(JSON.stringify({
        success: false,
        offline: true,
        message: 'This feature requires an internet connection'
    }), {
        status: 503,
        headers: { 
            'Content-Type': 'application/json',
            'X-Served-By': 'ServiceWorker-Offline'
        }
    });
}

// Get offline page
async function getOfflinePage(request) {
    const cache = await caches.open(STATIC_CACHE);
    
    // Try to return cached homepage or a basic offline page
    const offlineResponse = await cache.match('/') || await cache.match('/offline.html');
    
    if (offlineResponse) {
        return offlineResponse;
    }
    
    // Return basic offline HTML
    return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline - Sentia Manufacturing</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                    background: #f8f9fa;
                    color: #495057;
                    text-align: center;
                }
                .offline-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    color: #6c757d;
                }
                .retry-btn {
                    background: #0d6efd;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    margin-top: 1rem;
                }
                .retry-btn:hover {
                    background: #0b5ed7;
                }
            </style>
        </head>
        <body>
            <div class="offline-icon">📡</div>
            <h1>You're Offline</h1>
            <p>This page isn't available offline. Please check your internet connection.</p>
            <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
            
            <script>
                // Auto-retry when online
                window.addEventListener('online', () => {
                    window.location.reload();
                });
            </script>
        </body>
        </html>
    `, {
        headers: { 
            'Content-Type': 'text/html',
            'X-Served-By': 'ServiceWorker-Offline'
        }
    });
}

// Push notification event
self.addEventListener('push', event => {
    console.log('Push notification received:', event);
    
    let notificationData = {
        title: 'Sentia Manufacturing',
        body: 'You have a new notification',
        icon: '/static/icons/icon-192x192.png',
        badge: '/static/icons/badge-72x72.png',
        tag: 'sentia-notification',
        requireInteraction: false,
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/static/icons/action-view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/static/icons/action-dismiss.png'
            }
        ]
    };
    
    // Parse push data if available
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = { ...notificationData, ...data };
        } catch (error) {
            console.error('Error parsing push data:', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// Notification click event
self.addEventListener('notificationclick', event => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    const action = event.action;
    const notification = event.notification;
    
    if (action === 'dismiss') {
        // Just close the notification
        return;
    }
    
    // Default action or 'view' action
    const urlToOpen = notification.data?.url || '/dashboard';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // Check if app is already open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin)) {
                    client.focus();
                    client.navigate(urlToOpen);
                    return;
                }
            }
            
            // Open new window/tab
            return clients.openWindow(urlToOpen);
        })
    );
});

// Background sync event
self.addEventListener('sync', event => {
    console.log('Background sync:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// Perform background sync
async function doBackgroundSync() {
    try {
        // Sync offline actions, update cache, etc.
        console.log('Performing background sync...');
        
        // Example: sync offline data
        await syncOfflineData();
        
        console.log('Background sync completed');
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Sync offline data
async function syncOfflineData() {
    // This would sync any data that was stored offline
    // For example: form submissions, user preferences, etc.
    
    const offlineData = await getOfflineData();
    
    for (const data of offlineData) {
        try {
            await fetch(data.url, {
                method: data.method,
                headers: data.headers,
                body: data.body
            });
            
            // Remove from offline storage after successful sync
            await removeFromOfflineStorage(data.id);
            
        } catch (error) {
            console.error('Failed to sync offline data:', error);
        }
    }
}

// Get offline data (placeholder - would use IndexedDB)
async function getOfflineData() {
    // This would retrieve offline data from IndexedDB
    return [];
}

// Remove from offline storage (placeholder)
async function removeFromOfflineStorage(id) {
    // This would remove synced data from IndexedDB
    console.log('Removing synced data:', id);
}

// Message handling from main thread
self.addEventListener('message', event => {
    console.log('Service Worker received message:', event.data);
    
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_URLS':
            cacheUrls(payload.urls);
            break;
            
        case 'CLEAR_CACHE':
            clearCache(payload.cacheNames);
            break;
            
        case 'GET_CACHE_SIZE':
            getCacheSize().then(size => {
                event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
            });
            break;
            
        default:
            console.log('Unknown message type:', type);
    }
});

// Cache specific URLs
async function cacheUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    for (const url of urls) {
        try {
            await cache.add(url);
            console.log('Cached URL:', url);
        } catch (error) {
            console.error('Failed to cache URL:', url, error);
        }
    }
}

// Clear specific caches
async function clearCache(cacheNames) {
    for (const cacheName of cacheNames) {
        try {
            await caches.delete(cacheName);
            console.log('Cleared cache:', cacheName);
        } catch (error) {
            console.error('Failed to clear cache:', cacheName, error);
        }
    }
}

// Get total cache size
async function getCacheSize() {
    let totalSize = 0;
    
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const key of keys) {
            const response = await cache.match(key);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }
    
    return totalSize;
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

console.log('Service Worker loaded');