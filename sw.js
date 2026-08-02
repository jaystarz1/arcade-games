/* The Mix It Shop — root service worker.
   Lives at repo root so its scope covers both the arcade/ shell and the
   game files beside it. space-invaders/ registers its own worker with a
   deeper scope and keeps managing its own cache. All paths are relative
   because GitHub Pages serves this repo from a subpath. */

const CACHE_NAME = 'mixit-arcade-v1';

const PRECACHE = [
  './',
  './index.html',
  './arcade/',
  './arcade/index.html',
  './arcade/favicon.svg',
  './arcade/favicon-64.png',
  './arcade/apple-touch-icon.png',
  './arcade/icon-192.png',
  './arcade/icon-512.png',
  './manifest.json',
  './arcade.html',
  './night-driver.html',
  './galaga.html',
  './pole-position.html',
  './tron.html',
  './star-wars.html',
  './after-burner.html',
  './grand-prix.html',
  './mission-command.html',
  './AsteroidsArcade/dist/public/index.html',
  './lunar-lander/dist/index.html',
  './ice-breaker-game/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n.startsWith('mixit-arcade-') && n !== CACHE_NAME)
          .map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isHTML = event.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  if (isHTML) {
    // Network-first so shell and game updates land immediately.
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first for assets (posters, dist bundles, fonts, sounds),
    // filling the cache as games get played.
    event.respondWith(
      caches.match(event.request).then((hit) => hit || fetch(event.request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return res;
      }))
    );
  }
});
