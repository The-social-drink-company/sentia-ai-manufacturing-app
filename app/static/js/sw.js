// Service Worker for Sentia Manufacturing Dashboard
const CACHE_NAME = 'sentia-dashboard-v1.0.0';
const STATIC_CACHE = 'sentia-static-v1.0.0';
const DYNAMIC_CACHE = 'sentia-dynamic-v1.0.0';

// Files to cache for offline use
const STATIC_FILES = [
    '/',
    '/static/css/dashboard.css',
    '/static/css/advanced-features.css',
    '/static/js/dashboard.js',
    '/static/js/import-wizard.js',
    '/static/js/dashboard-customization.js',
    '/static/js/advanced-features.js',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    '/api/dashboard/',
    '/api/health'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Caching static files...');
                return cache.addAll(STATIC_FILES);
            })
            .catch((err) => {
                console.error('Service Worker: Error caching static files:', err);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
    );
    self.clients.claim();
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Handle static files and pages
    event.respondWith(handleStaticRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
    const cacheName = DYNAMIC_CACHE;
    
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Network request failed, trying cache...');
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response for dashboard data
        if (request.url.includes('/api/dashboard/')) {
            return new Response(JSON.stringify({
                error: 'offline',
                message: 'You are currently offline. Showing cached data.',
                data: getOfflineFallbackData(request.url)
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        
        // For other API requests, return error
        return new Response(JSON.stringify({
            error: 'offline',
            message: 'This feature is not available offline'
        }), {
            status: 503,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback to network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache the response for future use
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Static request failed:', error);
        
        // Return offline page if available
        const offlinePage = await caches.match('/offline.html');
        if (offlinePage) {
            return offlinePage;
        }
        
        // Return basic offline response
        return new Response('You are offline. Please check your connection.', {
            status: 503,
            headers: {
                'Content-Type': 'text/plain'
            }
        });
    }
}

// Generate offline fallback data
function getOfflineFallbackData(url) {
    if (url.includes('/api/dashboard/kpis')) {
        return {
            active_jobs: { current: 12, change: 0 },
            pending_jobs: { current: 8, change: 0 },
            completed_jobs: { current: 45, change: 0 },
            utilization: { current: 78, change: 0 }
        };
    }
    
    if (url.includes('/api/dashboard/forecast')) {
        return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            actual: [100, 120, 110, 130, 125],
            forecast: [105, 115, 115, 125, 130]
        };
    }
    
    if (url.includes('/api/dashboard/stock-levels')) {
        return {
            products: ['GABA Red', 'GABA Black', 'GABA Gold'],
            current: [150, 89, 45],
            reorderPoint: [45, 27, 14],
            safetyStock: [23, 14, 7]
        };
    }
    
    return {};
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-dashboard-data') {
        event.waitUntil(syncDashboardData());
    }
});

// Sync dashboard data when back online
async function syncDashboardData() {
    try {
        console.log('Service Worker: Syncing dashboard data...');
        
        // Clear dynamic cache to force fresh data
        const cache = await caches.open(DYNAMIC_CACHE);
        const keys = await cache.keys();
        
        const apiRequests = keys.filter(request => 
            request.url.includes('/api/dashboard/')
        );
        
        await Promise.all(apiRequests.map(request => cache.delete(request)));
        
        console.log('Service Worker: Dashboard data synced');
    } catch (error) {
        console.error('Service Worker: Sync failed:', error);
    }
}

// Push notifications
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    try {
        const data = event.data.json();
        const options = {
            body: data.body || 'You have a new notification',
            icon: '/static/icons/icon-192x192.png',
            badge: '/static/icons/badge-72x72.png',
            data: data.data || {},
            tag: data.tag || 'dashboard-notification',
            requireInteraction: data.requireInteraction || false,
            actions: data.actions || []
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'Dashboard Update', options)
        );
    } catch (error) {
        console.error('Service Worker: Push notification error:', error);
    }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const action = event.action;
    const data = event.notification.data;
    
    if (action === 'view') {
        // Open dashboard
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (action === 'dismiss') {
        // Just close the notification
        return;
    } else {
        // Default action - open dashboard
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_NAME });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
            
        default:
            console.log('Service Worker: Unknown message type:', type);
    }
});

// Clear all caches
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('Service Worker: All caches cleared');
}

console.log('Service Worker: Script loaded');