<script lang="ts">
	import Dashboard from '$lib/components/dashboard/Dashboard.svelte';
	import { clubService } from '$lib/stores/club.svelte';
	import { page } from '$app/stores';

	const mode = $derived(
		($page.url.searchParams.get('mode') as 'default' | 'tv' | 'compact' | null) ?? 'default'
	);
</script>

<svelte:head>
	<title>{clubService.info?.name ?? 'Frolf Bot'}</title>
	<meta name="description" content="Your disc golf dashboard — recent rounds, stats, and club activity at a glance." />
	<meta property="og:title" content={clubService.info?.name ?? 'Frolf Bot'} />
	<meta property="og:description" content="Your disc golf dashboard — recent rounds, stats, and club activity at a glance." />
</svelte:head>

<Dashboard {mode} />
