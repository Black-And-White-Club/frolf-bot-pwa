<script lang="ts">
	import { browser } from '$app/environment';

	let isOnline = $state(true);

	$effect(() => {
		if (!browser) return;

		isOnline = navigator.onLine;

		const handleOnline = () => (isOnline = true);
		const handleOffline = () => (isOnline = false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});
</script>

{#if !isOnline}
	<div class="offline-banner">
		<span>📡</span>
		<span>You're offline. Data may be outdated.</span>
	</div>
{/if}

<style>
	.offline-banner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background: var(--amber-600);
		color: var(--slate-900);
		padding: 0.5rem 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		z-index: 1000;
	}
</style>
