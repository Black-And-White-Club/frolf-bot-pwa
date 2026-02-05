<script lang="ts">
	import { clubService } from '$lib/stores/club.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	const guildName = $derived(clubService.info?.name ?? 'Frolf Bot');
	const guildIcon = $derived(clubService.info?.icon);
</script>

<div class="guild-header">
	{#if guildIcon}
		<img src={guildIcon} alt="" class="guild-icon" />
	{:else}
		<div class="guild-icon-placeholder">
			<span>🥏</span>
		</div>
	{/if}
	<div class="guild-info">
		<h1 class="guild-name">{guildName}</h1>
		{#if auth.user}
			<span class="guild-role">{auth.user.role}</span>
		{/if}
	</div>
</div>

<style>
	.guild-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.guild-icon,
	.guild-icon-placeholder {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.5rem;
		object-fit: cover;
	}

	.guild-icon-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--forest-700);
		font-size: 1.25rem;
	}

	.guild-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--slate-100);
		line-height: 1.2;
	}

	.guild-role {
		font-size: 0.75rem;
		color: var(--sage-500);
		text-transform: capitalize;
	}
</style>
