<script context="module" lang="ts">
	// Module script intentionally left without browser globals. Use helper from
	// src/lib/pwa/updateSnackbarHelper.ts for programs that need to notify the UI.
</script>

<script lang="ts">
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	const visible = writable(false);
	let registration: ServiceWorkerRegistration | null = null;
	let prevActive: Element | null = null;
	let refreshBtn: HTMLButtonElement | null = null;

	function handleShow(ev: Event) {
		const e = ev as CustomEvent<ServiceWorkerRegistration>;
		registration = e.detail;
		// save previous active element so we can restore focus
		try {
			prevActive = document.activeElement;
		} catch {
			prevActive = null;
		}
		visible.set(true);
		// focus will be applied on next tick via binding to refreshBtn
	}

	if (browser) {
		onMount(() => {
			window.addEventListener('sw:show', handleShow as EventListener);
			return () => window.removeEventListener('sw:show', handleShow as EventListener);
		});
	}

	function refresh() {
		if (!registration) return;
		const worker = (registration as any).waiting;
		if (worker && typeof worker.postMessage === 'function')
			worker.postMessage({ type: 'SKIP_WAITING' });
		// fallback: reload after a short delay
		setTimeout(() => location.reload(), 500);
	}

	function dismiss() {
		visible.set(false);
		// restore focus if possible
		try {
			if (prevActive && (prevActive as HTMLElement).focus) (prevActive as HTMLElement).focus();
		} catch {}
	}
</script>

{#if $visible}
	<div
		class="fixed right-4 bottom-4 left-4 z-50 flex items-center justify-between rounded-lg border bg-[var(--guild-surface)] p-3 shadow-lg"
		role="status"
		aria-live="polite"
	>
		<div class="text-sm">A new version is available.</div>
		<div class="flex items-center space-x-2">
			<button
				bind:this={refreshBtn}
				class="rounded bg-[var(--guild-primary)] px-3 py-1 text-white"
				on:click={refresh}
				on:keydown={(e) => e.key === 'Enter' && refresh()}>Refresh</button
			>
			<button class="rounded border px-3 py-1" on:click={dismiss}>Dismiss</button>
		</div>
	</div>
{/if}
