<script lang="ts">
	import Dashboard from '$lib/components/dashboard/Dashboard.svelte';
	import { guildService } from '$lib/stores/guild.svelte';
	import { page } from '$app/stores';

	const mode = $derived(
		($page.url.searchParams.get('mode') as 'default' | 'tv' | 'compact' | null) ?? 'default'
	);
</script>

<svelte:head>
	<title>{guildService.info?.name ?? 'Frolf Bot'}</title>
</svelte:head>

<Dashboard {mode} />
