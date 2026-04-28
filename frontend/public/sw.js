const CACHE_NAME = 'janrakshak-v2';
const OFFLINE_URL = '/offline.html';

// 🏛️ Strategy 3: PWA Offline Intelligence
// tactical_fallback_db.json serves as the local data backbone when Firestore quota is exhausted or offline
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/logo.png',
    OFFLINE_URL
];

// API responses that should be cached for offline access
const API_CACHE_ROUTES = [
    '/api/needs/markers',
    '/api/needs?limit=10',
    '/api/resources',
    '/api/dashboard/stats',
    '/api/analytics/overview',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Check if it's an API call - we handle those differently
    if (event.request.url.includes('/api/')) {
        // 🛰️ Network-First for API
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // 🏛️ Strategy: Only cache GET requests
                    if (event.request.method === 'GET' && response.status === 200) {
                        const resClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, resClone);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match(event.request)) // Fallback to stale data if offline
        );
    } else {
        // 🧱 Cache-First for static assets
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).catch(() => caches.match(OFFLINE_URL));
            })
        );
    }
});
