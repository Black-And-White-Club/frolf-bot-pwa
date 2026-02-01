<script lang="ts">
	import '../styles/app.css';
	import { page } from '$app/state';
	import Navbar from '$lib/components/general/Navbar.svelte';
	import ThemeProvider from '$lib/components/general/ThemeProvider.svelte';
	import ThemeToggle from '$lib/components/general/ThemeToggle.svelte';
	import InstallPrompt from '$lib/components/pwa/InstallPrompt.svelte';
	import OfflineIndicator from '$lib/components/pwa/OfflineIndicator.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { appInit } from '$lib/stores/init.svelte';

	// These are client-only, non-critical components — load them lazily to keep the
	// initial bundle smaller. Use Svelte 5 `$state` so updates are reactive.
	let LiveAnnouncer = $state<any>(null);
	let UpdateSnackbarClient = $state<any>(null);
	// Defer importing PWA helpers so they don't bloat the initial layout chunk.
	// We'll dynamically import them after the app is idle.

	let swListener: (ev: Event) => void;

	onMount(async () => {
		// Register the service worker after the browser is idle so we don't
		// block the main thread or inflate the initial JS bundle.
		const registerLater = async () => {
			try {
				const [{ registerServiceWorker }, { showUpdate }] = await Promise.all([
					import('$lib/pwa/registerServiceWorker'),
					import('$lib/pwa/updateSnackbarHelper')
				]);

				// call registration (best-effort)
				try {
					await registerServiceWorker?.();
				} catch {
					// swallow errors — registration is non-critical
				}

				// create listener that calls the lazily-imported showUpdate helper
				swListener = (e: Event) => {
					const ev = e as CustomEvent<ServiceWorkerRegistration>;
					try {
						if (browser) showUpdate?.(ev.detail);
					} catch {
						/* ignore */
					}
				};

				if (browser && swListener)
					window.addEventListener('sw:waiting', swListener as EventListener);
			} catch (err) {
				// best-effort: don't block rendering if imports fail

				console.warn('deferred SW registration failed', err);
			}
		};

		if ('requestIdleCallback' in window) {
			(window as any).requestIdleCallback(registerLater, { timeout: 2000 });
		} else {
			// fallback: register after brief timeout
			setTimeout(registerLater, 2000);
		}

		// Lazy-load a11y and update UI components after hydration so they don't
		// inflate the initial JS payload.
		try {
			const [live, upd] = await Promise.all([
				import('$lib/components/general/LiveAnnouncer.svelte'),
				import('$lib/components/general/UpdateSnackbar.client.svelte')
			]);
			LiveAnnouncer = live.default;
			UpdateSnackbarClient = upd.default;
		} catch (err) {
			// best-effort, keep app usable without these features

			console.warn('deferred client components failed to load', err);
		}
	});

	onDestroy(() => {
		if (swListener && browser)
			window.removeEventListener('sw:waiting', swListener as EventListener);
	});

	onMount(() => {
		// Defer heavy initialization (NATS, OTel) until the main thread is idle
		// This significantly improves Total Blocking Time (TBT) and LCP
		const initWork = () => {
			appInit.initialize();
		};

		let idleHandle: number;
		let timeoutHandle: any; // using any for runtimes where NodeJS might be involved in types

		if ('requestIdleCallback' in window) {
			idleHandle = (window as any).requestIdleCallback(initWork, { timeout: 3000 });
		} else {
			timeoutHandle = setTimeout(initWork, 100);
		}

		return () => {
			if (idleHandle) (window as any).cancelIdleCallback(idleHandle);
			if (timeoutHandle) clearTimeout(timeoutHandle);
			appInit.teardown();
		};
	});

	let { children } = $props();

	import { modalOpen } from '$lib/stores/overlay';
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
	<!-- Preconnect to common image CDN to reduce LCP latency (reported by Lighthouse) -->
	<link rel="dns-prefetch" href="https://images.unsplash.com" />
	<link rel="preconnect" href="https://images.unsplash.com" crossorigin="anonymous" />
	<link rel="preconnect" href="https://cdn.discordapp.com" crossorigin="anonymous" />
	<link rel="preconnect" href="https://nats.frolf-bot.com" crossorigin="anonymous" />
</svelte:head>

<!-- Skip link for keyboard/mobile users -->
<a href="#main-content" class="sr-only p-2 focus:not-sr-only" data-testid="skip-link"
	>Skip to content</a
>

<ThemeProvider>
	<OfflineIndicator />
	{#if LiveAnnouncer}
		<LiveAnnouncer />
	{/if}
	{#if UpdateSnackbarClient}
		<UpdateSnackbarClient />
	{/if}
	{#if appInit.isLoading}
		<div class="flex min-h-screen items-center justify-center bg-[#081212]">
			<div class="text-center">
				<div
					class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#007474] border-t-transparent"
				></div>
				<p class="text-white/60">Connecting...</p>
			</div>
		</div>
	{:else if appInit.error}
		<div class="flex min-h-screen items-center justify-center bg-[#081212]">
			<div class="max-w-md p-6 text-center">
				<div class="mb-2 text-xl text-red-400">Connection Error</div>
				<p class="mb-4 text-white/60">{appInit.error}</p>
				<button
					class="rounded bg-[#007474] px-4 py-2 text-white transition hover:bg-[#008B8B]"
					onclick={() => appInit.initialize()}
				>
					Retry
				</button>
			</div>
		</div>
	{:else if page.data.session}
		<!-- User is signed in -->
		<div class="app-container">
			<Navbar />
			<main id="main-content" aria-hidden={$modalOpen} class="app-main">
				{@render children?.()}
			</main>
		</div>
	{:else}
		<!-- User is not signed in -->
		<div class="flex min-h-screen items-center justify-center bg-[var(--guild-background)]">
			<div class="w-full max-w-md space-y-8">
				<div class="flex justify-end">
					<ThemeToggle testid="theme-toggle-guest" />
				</div>
				<div>
					<h1 class="text-guild-primary text-center text-3xl font-extrabold">Frolf Bot PWA</h1>
					<p class="text-guild-text-secondary mt-2 text-center text-sm">
						Sign in with Discord to access your disc golf games.
					</p>
				</div>
				<div>
					<a
						href="/auth/signin"
						data-testid="btn-signin"
						class="group text-guild-surface relative flex w-full justify-center rounded-md border border-transparent bg-[var(--guild-primary)] px-4 py-2 text-sm font-medium hover:bg-[var(--guild-primary)]/90 focus:ring-2 focus:ring-[var(--guild-primary)] focus:ring-offset-2 focus:outline-none"
					>
						Sign In
					</a>
				</div>
			</div>
		</div>
	{/if}
	<InstallPrompt />
</ThemeProvider>
