/// <reference lib="webworker" />

const OFFLINE_URL = '/offline.html';
const CACHE_PREFIX = 'frolf-bot-pwa';

type PrecacheEntry = { url: string; revision?: string | null };

const sw = self as unknown as ServiceWorkerGlobalScope & { __WB_MANIFEST?: PrecacheEntry[] };
// Keep the literal `self.__WB_MANIFEST` so workbox injectManifest can replace it at build time.
const precacheManifest = ((self as any).__WB_MANIFEST ?? []) as PrecacheEntry[];

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = (hash << 5) - hash + input.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

const manifestFingerprint = hashString(
	precacheManifest.map((entry) => `${entry.url}:${entry.revision ?? ''}`).join('|') || 'empty'
);
const PRECACHE_NAME = `${CACHE_PREFIX}-precache-${manifestFingerprint}`;
const RUNTIME_NAME = `${CACHE_PREFIX}-runtime-${manifestFingerprint}`;

const PRECACHE_URLS = Array.from(
	new Set(
		precacheManifest.map((entry) => entry.url).concat([OFFLINE_URL, '/favicon.ico', '/favicon.png'])
	)
);

function isCacheable(response: Response): boolean {
	return response.ok && (response.type === 'basic' || response.type === 'default');
}

async function updateRuntimeCache(request: Request): Promise<void> {
	try {
		const network = await fetch(request);
		if (!isCacheable(network)) return;
		const runtime = await caches.open(RUNTIME_NAME);
		await runtime.put(request, network.clone());
	} catch {
		// best-effort background refresh
	}
}

sw.addEventListener('install', (event) => {
	const ev = event as unknown as ExtendableEvent;
	ev.waitUntil(
		(async () => {
			const cache = await caches.open(PRECACHE_NAME);
			try {
				await cache.addAll(PRECACHE_URLS);
			} catch (error) {
				// Ensure partial caches do not survive a failed install attempt.
				await caches.delete(PRECACHE_NAME);
				throw error;
			}
		})()
	);
});

sw.addEventListener('activate', (event) => {
	const ev = event as unknown as ExtendableEvent;
	ev.waitUntil(
		(async () => {
			// Activation safety check: if required precache entries are missing,
			// do not evict older caches.
			const precache = await caches.open(PRECACHE_NAME);
			const offlineFallback = await precache.match(OFFLINE_URL);
			if (!offlineFallback) {
				console.error('[SW] Activation skipped cache cleanup: precache verification failed');
				return;
			}

			const keys = await caches.keys();
			const keep = new Set([PRECACHE_NAME, RUNTIME_NAME]);
			await Promise.all(
				keys
					.filter((key) => key.startsWith(CACHE_PREFIX) && !keep.has(key))
					.map((key) => caches.delete(key))
			);
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

	if (ev.request.mode === 'navigate') {
		ev.respondWith(
			(async () => {
				try {
					const network = await fetch(ev.request);
					if (isCacheable(network)) {
						const runtime = await caches.open(RUNTIME_NAME);
						await runtime.put(ev.request, network.clone());
					}
					return network;
				} catch {
					const runtime = await caches.open(RUNTIME_NAME);
					const cachedNavigation = await runtime.match(ev.request);
					if (cachedNavigation) return cachedNavigation;

					const precache = await caches.open(PRECACHE_NAME);
					return (
						(await precache.match(OFFLINE_URL)) ||
						new Response('Offline', { status: 503, statusText: 'Offline' })
					);
				}
			})()
		);
		return;
	}

	// Never cache API/authenticated/non-idempotent requests.
	if (url.pathname.startsWith('/api/') || ev.request.method !== 'GET') {
		return;
	}
	if (ev.request.headers.has('authorization')) {
		return;
	}

	// Cache-first with write-through and background refresh.
	ev.respondWith(
		(async () => {
			const cached = await caches.match(ev.request);
			if (cached) {
				ev.waitUntil(updateRuntimeCache(ev.request));
				return cached;
			}

			try {
				const network = await fetch(ev.request);
				if (isCacheable(network)) {
					const runtime = await caches.open(RUNTIME_NAME);
					await runtime.put(ev.request, network.clone());
				}
				return network;
			} catch {
				return new Response('Offline', { status: 503, statusText: 'Offline' });
			}
		})()
	);
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
