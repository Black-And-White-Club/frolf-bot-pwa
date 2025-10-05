<script lang="ts">
	import { onMount } from 'svelte';
	import type { Guild } from '$lib/stores/auth';
	export let listGuilds: () => Promise<Guild[]>;
	export let linkGuild: (id: string) => Promise<{ success: boolean; error?: string }>;

	let guilds: Guild[] = [];
	let loading = true;
	let message = '';

	onMount(async () => {
		loading = true;
		guilds = await listGuilds();
		loading = false;
	});

	async function doLink(id: string) {
		message = '';
		const res = await linkGuild(id);
		if (res.success) message = 'Successfully linked!';
		else if (res.error === 'not_admin') message = 'You must be an admin to link this server.';
		else message = 'Failed to link: ' + (res.error || 'unknown');
	}
</script>

{#if loading}
	<div class="loading">Loading guilds…</div>
{:else}
	<div class="container">
		{#if guilds.length === 0}
			<div class="empty">No guilds found.</div>
		{:else}
			<ul class="guild-list">
				{#each guilds as g}
					<li class="guild-item">
						<div class="guild-info">
							<strong>{g.name}</strong>
							<div class="guild-meta">ID: {g.id}</div>
						</div>
						<div class="guild-actions">
							{#if g.isAdmin}
								<button class="btn-link" on:click={() => doLink(g.id)}>Link</button>
							{:else}
								<button class="btn-disabled" disabled>Not Admin</button>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
		{#if message}
			<div class="message">{message}</div>
		{/if}
	</div>
{/if}

<style>
	.message {
		margin-top: 0.5rem;
		color: green;
	}
	.container {
		background: var(--card-bg, #fff);
		padding: 0.5rem;
		border-radius: 0.5rem;
	}
	.guild-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.guild-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.4rem 0;
		border-bottom: 1px solid #eee;
	}
	.guild-info {
		display: flex;
		flex-direction: column;
	}
	.guild-meta {
		font-size: 0.8rem;
		color: #666;
	}
	.guild-actions {
		margin-left: 1rem;
	}
	.btn-link {
		background: #0b84ff;
		color: white;
		border: none;
		padding: 0.3rem 0.6rem;
		border-radius: 0.25rem;
	}
	.btn-disabled {
		background: #ddd;
		color: #666;
		border: none;
		padding: 0.3rem 0.6rem;
		border-radius: 0.25rem;
	}
</style>
