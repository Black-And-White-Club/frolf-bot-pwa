const CACHE_VERSION = 3;
const CACHE_NAME = `frolf-bot-pwa-v${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = ['/', OFFLINE_URL, '/favicon.svg', '/manifest.json'];

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)));
	self.skipWaiting();
});

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((names) =>
				Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
			)
			.then(() => self.clients.claim())
	);
});

// Simple runtime caching: navigation -> network-first then fallback to offline, other requests -> cache-first
self.addEventListener('fetch', (event) => {
	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request)
				.then((resp) => {
					// put a clone in the cache for future navigations
					const copy = resp.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
					return resp;
				})
				.catch(() => caches.match(OFFLINE_URL))
		);
		return;
	}

	// For non-navigation requests, try cache first then network, and cache responses
	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) return cached;
			return fetch(event.request)
				.then((response) => {
					// only cache successful GET responses
					if (
						event.request.method === 'GET' &&
						response &&
						response.status === 200 &&
						response.type !== 'opaque'
					) {
						const copy = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
					}
					return response;
				})
				.catch(() => {
					// fallback to offline for HTML, otherwise nothing
					if (event.request.destination === 'document') return caches.match(OFFLINE_URL);
					return undefined;
				});
		})
	);
});
