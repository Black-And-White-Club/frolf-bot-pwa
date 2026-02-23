<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { nats } from '$lib/stores/nats.svelte';

	type ClubSuggestion = {
		uuid: string;
		name: string;
		icon_url?: string;
	};

	let suggestions = $state<ClubSuggestion[]>([]);
	let loadingSuggestions = $state(false);
	let joinStatus = $state<Record<string, 'idle' | 'loading' | 'error'>>({});
	let joinError = $state<Record<string, string>>({});

	let inviteCode = $state('');
	let codeStatus = $state<'idle' | 'loading' | 'error' | 'success'>('idle');
	let codeError = $state('');

	async function loadSuggestions() {
		loadingSuggestions = true;
		try {
			const res = await fetch('/api/clubs/suggestions');
			if (res.ok) {
				suggestions = await res.json();
			}
		} catch {
			// Non-fatal — suggestions are optional
		} finally {
			loadingSuggestions = false;
		}
	}

	async function joinClub(clubUUID: string) {
		joinStatus[clubUUID] = 'loading';
		joinError[clubUUID] = '';
		try {
			const res = await fetch('/api/clubs/join', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ club_uuid: clubUUID })
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				joinStatus[clubUUID] = 'error';
				joinError[clubUUID] = data.error || 'Failed to join club';
				return;
			}
			await afterJoin();
		} catch {
			joinStatus[clubUUID] = 'error';
			joinError[clubUUID] = 'Failed to join club. Please try again.';
		}
	}

	async function joinByCode() {
		if (!inviteCode.trim()) return;
		codeStatus = 'loading';
		codeError = '';
		try {
			const res = await fetch('/api/clubs/join-by-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: inviteCode.trim() })
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				codeStatus = 'error';
				codeError = data.error || 'Invalid or expired invite code';
				return;
			}
			codeStatus = 'success';
			await afterJoin();
		} catch {
			codeStatus = 'error';
			codeError = 'Something went wrong. Please try again.';
		}
	}

	async function afterJoin() {
		// Refresh the session token to pick up new club membership
		await auth.refreshSession();
		// Reconnect NATS with the new token so permissions update immediately
		if (auth.token) {
			await nats.disconnect();
			await nats.connect(auth.token);
		}
	}

	$effect(() => {
		loadSuggestions();
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-[var(--guild-background)] p-4">
	<div class="w-full max-w-lg space-y-8 rounded-xl bg-[var(--guild-surface)] p-8 shadow-2xl">
		<div class="text-center">
			<h2 class="text-guild-primary text-3xl font-bold">Join a Club</h2>
			<p class="text-guild-text-secondary mt-2">
				You're signed in but not yet a member of any club.
			</p>
		</div>

		<!-- Discord guild suggestions -->
		{#if loadingSuggestions}
			<div class="flex justify-center py-4">
				<div
					class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80"
				></div>
			</div>
		{:else if suggestions.length > 0}
			<div class="space-y-3">
				<h3 class="text-sm font-semibold tracking-wide text-white/60 uppercase">
					Clubs on your Discord servers
				</h3>
				{#each suggestions as club (club.uuid)}
					<div
						class="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
					>
						<div class="flex items-center gap-3">
							{#if club.icon_url}
								<img
									src={club.icon_url}
									alt={club.name}
									class="h-10 w-10 rounded-full object-cover"
									loading="lazy"
									decoding="async"
								/>
							{:else}
								<div
									class="bg-liquid-skobeloff/30 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
								>
									{club.name[0]}
								</div>
							{/if}
							<span class="font-medium text-white">{club.name}</span>
						</div>
						<div class="flex flex-col items-end gap-1">
							<button
								onclick={() => joinClub(club.uuid)}
								disabled={joinStatus[club.uuid] === 'loading'}
								class="bg-liquid-skobeloff rounded-md px-4 py-1.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
							>
								{joinStatus[club.uuid] === 'loading' ? 'Joining...' : 'Join'}
							</button>
							{#if joinError[club.uuid]}
								<p class="text-xs text-red-400">{joinError[club.uuid]}</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Divider if both sections shown -->
		{#if suggestions.length > 0}
			<div class="flex items-center gap-4">
				<div class="flex-1 border-t border-white/10"></div>
				<span class="text-xs text-white/40">or</span>
				<div class="flex-1 border-t border-white/10"></div>
			</div>
		{/if}

		<!-- Invite code entry -->
		<div class="space-y-3">
			<h3 class="text-sm font-semibold tracking-wide text-white/60 uppercase">
				Have an invite code?
			</h3>
			<form
				class="flex gap-2"
				onsubmit={(e) => {
					e.preventDefault();
					joinByCode();
				}}
			>
				<input
					type="text"
					bind:value={inviteCode}
					placeholder="Enter invite code"
					class="flex-1 rounded-md border border-white/10 bg-black/20 px-4 py-2 text-white placeholder:text-white/30 focus:border-[var(--guild-primary)] focus:ring-1 focus:ring-[var(--guild-primary)] focus:outline-none"
				/>
				<button
					type="submit"
					disabled={codeStatus === 'loading' || !inviteCode.trim()}
					class="bg-liquid-skobeloff rounded-md px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
				>
					{codeStatus === 'loading' ? 'Joining...' : 'Join'}
				</button>
			</form>
			{#if codeStatus === 'error'}
				<p class="text-sm text-red-400">{codeError}</p>
			{/if}
		</div>

		<div class="text-center">
			<button
				onclick={() => auth.signOut()}
				class="text-sm text-white/40 transition hover:text-white"
			>
				Sign out
			</button>
		</div>
	</div>
</div>
