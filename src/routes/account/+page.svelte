<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { clubService } from '$lib/stores/club.svelte';

	interface Invite {
		code: string;
		role: string;
		use_count: number;
		max_uses: number | null;
		expires_at: string | null;
		created_at: string;
	}

	// --- State ---
	let invites = $state<Invite[]>([]);
	let invitesLoading = $state(false);
	let invitesError = $state<string | null>(null);

	let createRole = $state<'player' | 'editor'>('player');
	let createMaxUses = $state('');
	let createExpiresInDays = $state('');
	let creating = $state(false);
	let createError = $state<string | null>(null);

	let copyFeedback = $state<Record<string, boolean>>({});

	// Success message from link callback
	const linkSuccess = $derived(page.url.searchParams.get('success') === 'linked');
	const linkError = $derived(page.url.searchParams.get('error') === 'link_failed');

	const canManageInvites = $derived(
		auth.user?.role === 'editor' || auth.user?.role === 'admin'
	);

	// --- Redirect if not authenticated ---
	$effect(() => {
		if (auth.status !== 'validating' && !auth.isAuthenticated) {
			goto('/auth/signin');
		}
	});

	// --- Load invites on mount (editor/admin only) ---
	$effect(() => {
		if (auth.isAuthenticated && canManageInvites && auth.user?.activeClubUuid) {
			loadInvites();
		}
	});

	async function loadInvites() {
		const clubUuid = auth.user?.activeClubUuid;
		if (!clubUuid) return;
		invitesLoading = true;
		invitesError = null;
		try {
			const res = await fetch(`/api/clubs/${clubUuid}/invites`);
			if (!res.ok) throw new Error(`Failed to load invites (${res.status})`);
			const data = await res.json();
			invites = Array.isArray(data) ? data : (data.invites ?? []);
		} catch (e) {
			invitesError = e instanceof Error ? e.message : 'Failed to load invites';
		} finally {
			invitesLoading = false;
		}
	}

	async function createInvite() {
		const clubUuid = auth.user?.activeClubUuid;
		if (!clubUuid) return;
		creating = true;
		createError = null;
		try {
			const body: Record<string, unknown> = { role: createRole };
			if (createMaxUses) body.max_uses = parseInt(createMaxUses, 10);
			if (createExpiresInDays) body.expires_in_days = parseInt(createExpiresInDays, 10);

			const res = await fetch(`/api/clubs/${clubUuid}/invites`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error ?? `Failed to create invite (${res.status})`);
			}
			const invite = await res.json();
			invites = [invite, ...invites];
			createMaxUses = '';
			createExpiresInDays = '';
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to create invite';
		} finally {
			creating = false;
		}
	}

	async function revokeInvite(code: string) {
		const clubUuid = auth.user?.activeClubUuid;
		if (!clubUuid) return;
		try {
			const res = await fetch(`/api/clubs/${clubUuid}/invites/${code}`, { method: 'DELETE' });
			if (!res.ok && res.status !== 204) {
				throw new Error(`Failed to revoke invite (${res.status})`);
			}
			invites = invites.filter((inv) => inv.code !== code);
		} catch (e) {
			invitesError = e instanceof Error ? e.message : 'Failed to revoke invite';
		}
	}

	async function copyLink(code: string) {
		try {
			await navigator.clipboard.writeText(`${window.location.origin}/join?code=${code}`);
			copyFeedback = { ...copyFeedback, [code]: true };
			setTimeout(() => {
				copyFeedback = { ...copyFeedback, [code]: false };
			}, 2000);
		} catch {
			/* ignore clipboard errors */
		}
	}

	function formatExpiry(expiresAt: string | null): string {
		if (!expiresAt) return 'Never';
		const d = new Date(expiresAt);
		return d.toLocaleDateString();
	}

	function roleBadgeClass(role: string): string {
		if (role === 'admin') return 'bg-[#B89B5E]/20 text-[#B89B5E]';
		if (role === 'editor') return 'bg-[#8B7BB8]/20 text-[#8B7BB8]';
		return 'bg-[#007474]/20 text-[#007474]';
	}
</script>

<svelte:head>
	<title>Account | {clubService.info?.name ?? 'Frolf Bot'}</title>
</svelte:head>

<main class="min-h-screen bg-[var(--guild-background)] px-4 py-10">
	<div class="mx-auto max-w-2xl space-y-8">
		<!-- Page heading -->
		<div>
			<h1
				class="font-['Fraunces'] text-3xl font-bold text-[var(--guild-text)]"
				style="font-variation-settings: 'SOFT' 0, 'WONK' 0"
			>
				Account
			</h1>
			<p class="mt-1 font-['Space_Grotesk'] text-sm text-[var(--guild-text-secondary)]">
				Manage your connected accounts and club invite links.
			</p>
		</div>

		{#if linkSuccess}
			<div class="rounded-lg border border-[#007474]/40 bg-[#007474]/10 px-4 py-3 text-sm text-[#007474]">
				Provider linked successfully.
			</div>
		{/if}
		{#if linkError}
			<div class="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
				Failed to link provider. Please try again.
			</div>
		{/if}

		<!-- Section 1: Connected Accounts -->
		<section>
			<h2
				class="mb-4 font-['Fraunces'] text-xl font-bold text-[var(--guild-text)]"
				style="font-variation-settings: 'SOFT' 0, 'WONK' 0"
			>
				Connected Accounts
			</h2>

			<div class="space-y-3">
				<!-- Discord -->
				<div
					class="flex items-center justify-between rounded-xl border border-[#007474]/20 bg-[var(--guild-surface)] px-5 py-4"
				>
					<div class="flex items-center gap-3">
						<!-- Discord icon -->
						<svg class="h-6 w-6 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"
							/>
						</svg>
						<span class="font-['Space_Grotesk'] font-medium text-[var(--guild-text)]">Discord</span>
					</div>
					<a
						href="/api/auth/discord/link"
						class="rounded-lg bg-liquid-skobeloff px-4 py-2 font-['Space_Grotesk'] text-sm font-medium text-white hover:brightness-110 transition-all"
					>
						Connect Discord
					</a>
				</div>

				<!-- Google -->
				<div
					class="flex items-center justify-between rounded-xl border border-[#007474]/20 bg-[var(--guild-surface)] px-5 py-4"
				>
					<div class="flex items-center gap-3">
						<!-- Google icon -->
						<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none">
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								fill="#EA4335"
							/>
						</svg>
						<span class="font-['Space_Grotesk'] font-medium text-[var(--guild-text)]">Google</span>
					</div>
					<a
						href="/api/auth/google/link"
						class="rounded-lg bg-liquid-skobeloff px-4 py-2 font-['Space_Grotesk'] text-sm font-medium text-white hover:brightness-110 transition-all"
					>
						Connect Google
					</a>
				</div>
			</div>
		</section>

		<!-- Section 2: Invite Management (editor/admin only) -->
		{#if canManageInvites}
			<section>
				<h2
					class="mb-4 font-['Fraunces'] text-xl font-bold text-[var(--guild-text)]"
					style="font-variation-settings: 'SOFT' 0, 'WONK' 0"
				>
					Invite Links
				</h2>

				<!-- Create form -->
				<div
					class="mb-6 rounded-xl border border-[#007474]/20 bg-[var(--guild-surface)] px-5 py-5"
				>
					<h3 class="mb-4 font-['Space_Grotesk'] text-sm font-semibold text-[var(--guild-text-secondary)] uppercase tracking-wide">
						Create Invite
					</h3>
					<div class="flex flex-wrap gap-3 items-end">
						<div class="flex flex-col gap-1">
							<label
								for="create-role"
								class="font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)]"
							>
								Role
							</label>
							<select
								id="create-role"
								bind:value={createRole}
								class="rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:outline-none focus:ring-1 focus:ring-[#007474]"
							>
								<option value="player">Player</option>
								<option value="editor">Editor</option>
							</select>
						</div>
						<div class="flex flex-col gap-1">
							<label
								for="create-max-uses"
								class="font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)]"
							>
								Max Uses
							</label>
							<input
								id="create-max-uses"
								type="number"
								min="1"
								placeholder="Unlimited"
								bind:value={createMaxUses}
								class="w-28 rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] placeholder:text-[var(--guild-text-muted)] focus:outline-none focus:ring-1 focus:ring-[#007474]"
							/>
						</div>
						<div class="flex flex-col gap-1">
							<label
								for="create-expires"
								class="font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)]"
							>
								Expires (days)
							</label>
							<input
								id="create-expires"
								type="number"
								min="1"
								placeholder="Never"
								bind:value={createExpiresInDays}
								class="w-28 rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] placeholder:text-[var(--guild-text-muted)] focus:outline-none focus:ring-1 focus:ring-[#007474]"
							/>
						</div>
						<button
							onclick={createInvite}
							disabled={creating}
							class="rounded-lg bg-liquid-skobeloff px-5 py-2 font-['Space_Grotesk'] text-sm font-medium text-white hover:brightness-110 transition-all disabled:opacity-50"
						>
							{creating ? 'Creating…' : 'Create'}
						</button>
					</div>
					{#if createError}
						<p class="mt-3 text-sm text-red-400">{createError}</p>
					{/if}
				</div>

				<!-- Invite list -->
				{#if invitesLoading}
					<p class="font-['Space_Grotesk'] text-sm text-[var(--guild-text-secondary)]">
						Loading invites…
					</p>
				{:else if invitesError}
					<p class="font-['Space_Grotesk'] text-sm text-red-400">{invitesError}</p>
				{:else if invites.length === 0}
					<p class="font-['Space_Grotesk'] text-sm text-[var(--guild-text-secondary)]">
						No invite codes yet.
					</p>
				{:else}
					<div class="space-y-3">
						{#each invites as invite (invite.code)}
							<div
								class="flex flex-wrap items-center gap-3 rounded-xl border border-[#007474]/20 bg-[var(--guild-surface)] px-5 py-4"
							>
								<!-- Code -->
								<code
									class="flex-1 min-w-0 font-mono text-sm text-[var(--guild-text)] break-all"
								>
									{invite.code}
								</code>

								<!-- Role badge -->
								<span
									class="rounded-full px-2 py-0.5 font-['Space_Grotesk'] text-xs font-medium {roleBadgeClass(invite.role)}"
								>
									{invite.role}
								</span>

								<!-- Uses -->
								<span class="font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)] whitespace-nowrap">
									{invite.use_count}{invite.max_uses != null ? `/${invite.max_uses}` : ''} uses
								</span>

								<!-- Expiry -->
								<span class="font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)] whitespace-nowrap">
									Expires: {formatExpiry(invite.expires_at)}
								</span>

								<!-- Actions -->
								<div class="flex gap-2">
									<button
										onclick={() => copyLink(invite.code)}
										class="rounded-lg border border-[#007474]/30 px-3 py-1.5 font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)] hover:text-[var(--guild-text)] transition-colors"
									>
										{copyFeedback[invite.code] ? 'Copied!' : 'Copy Link'}
									</button>
									<button
										onclick={() => revokeInvite(invite.code)}
										class="rounded-lg border border-red-500/30 px-3 py-1.5 font-['Space_Grotesk'] text-xs text-red-400 hover:bg-red-500/10 transition-colors"
									>
										Revoke
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	</div>
</main>
