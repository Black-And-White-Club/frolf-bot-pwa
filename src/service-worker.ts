/// <reference lib="webworker" />
const CACHE_NAME = 'frolf-bot-pwa-v1';
const OFFLINE_URL = '/offline.html';

// Workbox injectManifest will inject a precache manifest at build time as __WB_MANIFEST
type PrecacheEntry = { url: string };

const sw = self as unknown as ServiceWorkerGlobalScope & { __WB_MANIFEST?: PrecacheEntry[] };

sw.addEventListener('install', (event) => {
	const ev = event as unknown as ExtendableEvent;
	ev.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE_NAME);
			try {
				// Workbox will replace `self.__WB_MANIFEST` at build time with the precache manifest.
				// Keep the literal `self.__WB_MANIFEST` so injectManifest can find the placeholder.

				const precacheList = (self as any).__WB_MANIFEST ?? [];
				const urls = precacheList
					.map((m: { url: string }) => m.url)
					.concat([OFFLINE_URL, '/favicon.svg']);
				await cache.addAll(urls);
			} catch {
				// best-effort
			}
		})()
	);
	try {
		sw.skipWaiting();
	} catch {
		/* best-effort */
	}
});

sw.addEventListener('activate', (event) => {
	const ev = event as unknown as ExtendableEvent;
	ev.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
			try {
				await sw.clients.claim();
			} catch {
				/* best-effort */
			}
		})()
	);
});

sw.addEventListener('fetch', (event) => {
	const ev = event as unknown as FetchEvent;
	const url = new URL(ev.request.url);
	if (url.origin === sw.location.origin) {
		if (ev.request.mode === 'navigate') {
			ev.respondWith(
				(async () => {
					try {
						return await fetch(ev.request);
					} catch {
						const cache = await caches.open(CACHE_NAME);
						return (
							(await cache.match(OFFLINE_URL)) ||
							new Response('Offline', { status: 503, statusText: 'Offline' })
						);
					}
				})()
			);
			return;
		}

		// for other requests, try cache first then network
		ev.respondWith(
			caches.match(ev.request).then(
				(response) =>
					response ??
					fetch(ev.request)
						.then((r) => r)
						.catch(() => new Response('Offline', { status: 503 }))
			)
		);
	}
});

sw.addEventListener('message', (event) => {
	const ev = event as unknown as MessageEvent;
	if (ev.data && ev.data.type === 'SKIP_WAITING') {
		try {
			sw.skipWaiting();
		} catch {
			/* best-effort */
		}
	}
});
