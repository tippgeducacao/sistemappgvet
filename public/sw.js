// Service Worker with network-first strategy for HTML and stale-while-revalidate for assets
const CACHE_NAME = 'ppgvet-cache-v4';

// Install event - activate immediately
self.addEventListener('install', (event) => {
  console.log('SW v4 installing');
  self.skipWaiting(); // Activate new SW immediately
});

// Fetch event - network-first for HTML, stale-while-revalidate for assets
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same origin
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  
  // Network-first for HTML and navigation requests
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Stale-while-revalidate for static assets
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/lovable-uploads/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
          
          // Return cached version immediately, update in background
          return cachedResponse || fetchPromise;
        });
      })
    );
  }
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('SW v4 activating');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});