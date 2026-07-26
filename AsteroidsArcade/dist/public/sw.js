const CACHE_NAME = 'asteroids-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install service worker and cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker version:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Skip waiting - force immediate activation');
        return self.skipWaiting();
      })
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming all clients');
      return self.clients.claim();
    })
  );
});

// Intercept fetch requests and serve from cache when offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NETWORK FIRST for JavaScript files - always fetch latest code
  if (url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the new version
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request);
        })
    );
    return;
  }

  // CACHE FIRST for everything else (HTML, CSS, images, etc)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          return caches.match('/');
        });
      })
  );
});
