const CACHE_NAME = 'frolf-bot-pwa-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // try to cache essential shell; ignore failures for optional assets
  try { await cache.addAll(['/', OFFLINE_URL, '/favicon.svg']); } catch { /* best-effort */ }
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // cleanup old caches
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  // only handle same-origin requests for offline caching/fallback
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin) {
    if (event.request.mode === 'navigate') {
      event.respondWith((async () => {
        try {
          return await fetch(event.request);
        } catch {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match(OFFLINE_URL)) || new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })());
      return;
    }

    // for other requests, try cache first then network
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request).catch(() => response))
    );
  }
  // for cross-origin, let the network handle it
});

// Listen for messages from the page to skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    try { self.skipWaiting(); } catch { /* best-effort */ }
  }
});
