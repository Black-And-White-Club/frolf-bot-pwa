<script module lang="ts">
	// Module script intentionally left without browser globals. Use helper from
	// src/lib/pwa/updateSnackbarHelper.ts for programs that need to notify the UI.
</script>

<script lang="ts">
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	type Props = {
		message?: string;
		dismissible?: boolean;
	};

	let { message = 'A new version is available.', dismissible = true }: Props = $props();

	const visible = writable(false);
	let registration: ServiceWorkerRegistration | null = null;
	// Helper type so we can access a possible `waiting` worker without casting to `any`.
	type WaitingRegistration = ServiceWorkerRegistration & { waiting?: ServiceWorker };
	// Narrow worker shape: a ServiceWorker that definitely exposes postMessage.
	interface WorkerWithPostMessage extends ServiceWorker {
		postMessage(message: any): void;
	}

	// Type predicate so we can both document the runtime check and get TS narrowing.
	function isWorkerWithPostMessage(w: unknown): w is WorkerWithPostMessage {
		return !!w && typeof (w as any).postMessage === 'function';
	}
	let prevActive: Element | null = null;
	let refreshBtn = $state<HTMLButtonElement | null>(null);

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
		const maybeWorker = (registration as WaitingRegistration)?.waiting;
		if (isWorkerWithPostMessage(maybeWorker)) {
			try {
				maybeWorker.postMessage({ type: 'SKIP_WAITING' });
			} catch (err) {
				console.warn('postMessage to waiting worker failed', err);
				setTimeout(() => window.location.reload(), 500);
				return;
			}
			// Even if postMessage succeeded, reload shortly so the new SW can control the page.
			setTimeout(() => window.location.reload(), 500);
		} else {
			// No waiting worker or wrong shape — fallback to reload.
			setTimeout(() => window.location.reload(), 500);
		}
	}

	function dismiss() {
		visible.set(false);
		// restore focus if possible
		try {
			if (prevActive && (prevActive as HTMLElement).focus) (prevActive as HTMLElement).focus();
		} catch {
			/* ignore */
		}
	}
</script>

{#if $visible}
	<div
		class="fixed right-4 bottom-4 left-4 z-50 flex items-center justify-between rounded-lg border bg-[var(--guild-surface)] p-3 shadow-lg"
		role="status"
		aria-live="polite"
	>
		<div class="text-sm">{message}</div>
		<div class="flex items-center space-x-2">
			<button
				bind:this={refreshBtn}
				class="bg-liquid-skobeloff rounded px-3 py-1 text-white transition hover:brightness-110"
				onclick={refresh}
				onkeydown={(e) => e.key === 'Enter' && refresh()}>Refresh</button
			>
			{#if dismissible}
				<button class="rounded border px-3 py-1" onclick={dismiss}>Dismiss</button>
			{/if}
		</div>
	</div>
{/if}
