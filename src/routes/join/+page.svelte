<script lang="ts">
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';
	import { nats } from '$lib/stores/nats.svelte';
	import { goto } from '$app/navigation';

	type InvitePreview = {
		club_uuid: string;
		club_name: string;
		icon_url?: string;
		role: string;
	};

	let preview = $state<InvitePreview | null>(null);
	let previewError = $state('');
	let joinStatus = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let joinError = $state('');

	const code = $derived(page.url.searchParams.get('code') || '');

	$effect(() => {
		if (code) {
			loadPreview(code);
		}
	});

	async function loadPreview(inviteCode: string) {
		previewError = '';
		try {
			const res = await fetch(`/api/clubs/preview?code=${encodeURIComponent(inviteCode)}`);
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				previewError = data.error || 'Invalid or expired invite code';
				return;
			}
			preview = await res.json();
		} catch {
			previewError = 'Failed to load invite details';
		}
	}

	async function joinClub() {
		if (!auth.isAuthenticated) {
			goto(`/auth/signin?redirect=/join?code=${encodeURIComponent(code)}`);
			return;
		}

		joinStatus = 'loading';
		joinError = '';
		try {
			const res = await fetch('/api/clubs/join-by-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code })
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				joinStatus = 'error';
				joinError = data.error || 'Failed to join club';
				return;
			}
			joinStatus = 'success';
			// Refresh session to pick up new membership, then reconnect NATS
			await auth.refreshSession();
			if (auth.token) {
				await nats.disconnect();
				await nats.connect(auth.token);
			}
			goto('/');
		} catch {
			joinStatus = 'error';
			joinError = 'Something went wrong. Please try again.';
		}
	}
</script>

<svelte:head>
	<title>{preview ? `Join ${preview.club_name}` : 'Join Club'} | Frolf Bot</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[var(--guild-background)] p-4">
	<div class="w-full max-w-md space-y-6 rounded-xl bg-[var(--guild-surface)] p-8 shadow-2xl">
		{#if !code}
			<!-- No code — show invite code input form -->
			<div class="text-center">
				<h2 class="text-guild-primary text-3xl font-bold">Join a Club</h2>
				<p class="text-guild-text-secondary mt-2">Enter an invite code to get started</p>
			</div>
			<form
				class="space-y-4"
				onsubmit={(e) => {
					e.preventDefault();
					const input = (e.currentTarget as HTMLFormElement).querySelector(
						'input'
					) as HTMLInputElement;
					if (input?.value.trim()) {
						goto(`/join?code=${encodeURIComponent(input.value.trim())}`);
					}
				}}
			>
				<input
					type="text"
					name="code"
					placeholder="Enter invite code"
					class="block w-full rounded-md border border-white/10 bg-black/20 px-4 py-2 text-white placeholder:text-white/30 focus:border-[var(--guild-primary)] focus:outline-none"
				/>
				<button
					type="submit"
					class="flex w-full justify-center rounded-md bg-liquid-skobeloff px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
				>
					Look up code
				</button>
			</form>
		{:else if previewError}
			<div class="text-center">
				<h2 class="text-2xl font-bold text-white">Invalid Invite</h2>
				<p class="mt-2 text-sm text-red-400">{previewError}</p>
				<a href="/join" class="mt-4 block text-sm text-white/40 hover:text-white">Try another code</a
				>
			</div>
		{:else if preview}
			<div class="text-center">
				{#if preview.icon_url}
					<img
						src={preview.icon_url}
						alt={preview.club_name}
						class="mx-auto h-20 w-20 rounded-full object-cover"
					/>
				{:else}
					<div
						class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-liquid-skobeloff/30 text-3xl font-bold text-white"
					>
						{preview.club_name[0]}
					</div>
				{/if}
				<h2 class="mt-4 text-2xl font-bold text-white">{preview.club_name}</h2>
				<p class="mt-1 text-sm text-white/60">
					You'll join as <span class="font-semibold text-white capitalize">{preview.role}</span>
				</p>
			</div>

			{#if joinStatus === 'error'}
				<p class="text-center text-sm text-red-400">{joinError}</p>
			{/if}

			{#if auth.isAuthenticated}
				<button
					onclick={joinClub}
					disabled={joinStatus === 'loading'}
					class="flex w-full justify-center rounded-md bg-liquid-skobeloff px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
				>
					{joinStatus === 'loading' ? 'Joining...' : `Join ${preview.club_name}`}
				</button>
			{:else}
				<a
					href={`/auth/signin?redirect=/join?code=${encodeURIComponent(code)}`}
					class="flex w-full justify-center rounded-md bg-liquid-skobeloff px-4 py-3 font-semibold text-white transition hover:brightness-110"
				>
					Sign in to join
				</a>
			{/if}
		{:else}
			<div class="flex justify-center py-8">
				<div class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80"></div>
			</div>
		{/if}
	</div>
</div>
