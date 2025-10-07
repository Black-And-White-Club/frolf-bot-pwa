const CACHE_NAME = 'frolf-bot-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
  OFFLINE_URL
];

self.addEventListener('install', (event) => {
  // Pre-cache static assets
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Always try network first for navigations (so we can fall back to offline page)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Update cache in the background
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // For other requests, use cache-first for static assets and network fallback
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      // Optionally cache successful GET responses for future
      if (request.method === 'GET' && res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return res;
    }).catch(() => {
      // As a last resort, try to serve from cache
      return caches.match(OFFLINE_URL);
    }))
  );
});
