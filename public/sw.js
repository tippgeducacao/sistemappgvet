// Service Worker for caching assets
const CACHE_NAME = 'ppgvet-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/src/main.tsx',
  '/assets/index.css',
  '/assets/index.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Only cache GET requests for same origin
  if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          return response || fetch(event.request).then((fetchResponse) => {
            // Clone the response as it can only be consumed once
            const responseClone = fetchResponse.clone();
            
            // Cache assets with long-term caching strategy
            if (fetchResponse.ok && (
              event.request.url.includes('/assets/') ||
              event.request.url.includes('/lovable-uploads/') ||
              event.request.url.includes('.js') ||
              event.request.url.includes('.css') ||
              event.request.url.includes('.png') ||
              event.request.url.includes('.jpg') ||
              event.request.url.includes('.svg')
            )) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            
            return fetchResponse;
          });
        })
    );
  }
});

// Activate event - clean up old caches
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