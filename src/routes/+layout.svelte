<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import Navbar from '$lib/components/Navbar.svelte';
	import ThemeProvider from '$lib/components/ThemeProvider.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import LiveAnnouncer from '$lib/components/LiveAnnouncer.svelte';
	import UpdateSnackbarClient from '$lib/components/UpdateSnackbar.client.svelte';
	import { showUpdate } from '$lib/pwa/updateSnackbarHelper';
	import { registerServiceWorker } from '$lib/pwa/registerServiceWorker';

	let swListener: (ev: Event) => void;

	onMount(async () => {
		try {
			const reg = await registerServiceWorker();
			// server may return the registration; we already dispatch sw:waiting from registerServiceWorker
		} catch {
			// best-effort
		}

		swListener = (e: Event) => {
			const ev = e as CustomEvent<ServiceWorkerRegistration>;
			try {
				if (browser) showUpdate(ev.detail);
			} catch {
				/* ignore */
			}
		};
		if (browser) window.addEventListener('sw:waiting', swListener as EventListener);
	});

	onDestroy(() => {
		if (swListener && browser)
			window.removeEventListener('sw:waiting', swListener as EventListener);
	});

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
	<!-- Preconnect to common image CDN to reduce LCP latency (reported by Lighthouse) -->
	<link rel="dns-prefetch" href="https://images.unsplash.com" />
	<link rel="preconnect" href="https://images.unsplash.com" crossorigin="anonymous" />
</svelte:head>

<!-- Skip link for keyboard/mobile users -->
<a href="#main-content" class="sr-only p-2 focus:not-sr-only" data-testid="skip-link"
	>Skip to content</a
>

<ThemeProvider>
	<LiveAnnouncer />
	<UpdateSnackbarClient />
	{#if $page.data.session}
		<!-- User is signed in -->
		<div class="min-h-screen bg-[var(--guild-background)]">
			<Navbar />
			<main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
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
</ThemeProvider>
