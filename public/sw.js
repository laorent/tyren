const CACHE_NAME = 'tyren-v9';
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/icon-192.svg?v=2',
    '/icon-512.svg?v=2'
];

// Force update immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
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
    // API requests always go to network, never cache
    if (event.request.url.includes('/api/')) {
        return;
    }

    // Network-First for main page and navigation to prevent white screen
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/');
            })
        );
        return;
    }

    // Standard Cache-First for assets (icons, etc)
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
