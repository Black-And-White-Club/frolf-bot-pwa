<script lang="ts">
	import { page } from '$app/state';
	import ThemeToggle from './ThemeToggle.svelte';
	import HamburgerMenu from './HamburgerMenu.svelte';
	import { setModalOpen } from '$lib/stores/overlay';
	import { auth } from '$lib/stores/auth.svelte';
	import { clubService } from '$lib/stores/club.svelte';
	import { userProfiles } from '$lib/stores/userProfiles.svelte';
	import { nats } from '$lib/stores/nats.svelte';

	let showHamburger = $state(false);

	type ProfileNameSource = {
		udiscName?: string | null;
		udiscUsername?: string | null;
		displayName?: string | null;
	};

	function getCustomDisplayName(discordID: string): string | null {
		if (auth.displayName && auth.displayName !== discordID) {
			return auth.displayName;
		}
		return null;
	}

	function getProfileDisplayName(profile: ProfileNameSource | null | undefined): string | null {
		if (profile?.udiscName) return profile.udiscName;
		if (profile?.udiscUsername) return profile.udiscUsername;
		if (profile?.displayName) return profile.displayName;
		return null;
	}

	function resolveDisplayName(): string {
		if (!auth.user) return 'Guest';
		const profile =
			userProfiles.getProfile(auth.user.uuid) ?? userProfiles.getProfile(auth.user.id);

		const customDisplayName = getCustomDisplayName(auth.user.id);
		if (customDisplayName) {
			return customDisplayName;
		}

		const profileDisplayName = getProfileDisplayName(profile);
		if (profileDisplayName) {
			return profileDisplayName;
		}

		return auth.user.id;
	}

	const displayName = $derived.by(() => resolveDisplayName());

	function toggleHamburger() {
		showHamburger = !showHamburger;
		try {
			setModalOpen(showHamburger);
		} catch {
			/* ignore in SSR */
		}
	}

	function closeHamburger() {
		showHamburger = false;
		try {
			setModalOpen(false);
		} catch {
			/* ignore */
		}
	}

	$effect(() => {
		if (auth.user?.clubs && nats.isConnected) {
			const ids = auth.user.clubs.map((c) => c.club_uuid);
			clubService.ensureClubsLoaded(ids);
		}
	});
</script>

<nav class="site-header">
	<div class="site-header__inner mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex w-full items-center justify-between">
			<div class="flex items-center gap-8">
				<h1 class="text-guild-primary card-title card-title--skobeloff text-xl font-bold">
					{clubService.info?.name ?? 'Frolf Bot'}
				</h1>

				<!-- Desktop Navigation Links -->
				<nav class="hidden gap-4 md:flex">
					<a
						href="/"
						class="text-[var(--guild-text-secondary)] transition-colors hover:text-[var(--guild-text)]"
					>
						Home
					</a>
					<a
						href="/rounds"
						class="text-[var(--guild-text-secondary)] transition-colors hover:text-[var(--guild-text)]"
					>
						Rounds
					</a>
					<a
						href="/leaderboard"
						class="text-[var(--guild-text-secondary)] transition-colors hover:text-[var(--guild-text)]"
					>
						Leaderboard
					</a>
					<a
						href="/docs"
						class="text-[var(--guild-text-secondary)] transition-colors hover:text-[var(--guild-text)]"
					>
						Docs
					</a>
					{#if auth.isAuthenticated}
						<a
							href="/account"
							class="text-[var(--guild-text-secondary)] transition-colors hover:text-[var(--guild-text)]"
						>
							Account
						</a>
					{/if}
					{#if auth.canAdmin}
						<a
							href="/admin"
							class="font-semibold text-[#B89B5E] transition-colors hover:text-[#B89B5E]/80"
						>
							Admin
						</a>
					{/if}
				</nav>
			</div>

			{#if page.data.session || auth.isAuthenticated}
				<!-- User is signed in -->
				<div class="flex items-center gap-4">
					<!-- Club Switcher (if multiple clubs) -->
					{#if auth.user && auth.user.clubs.length > 1}
						<div class="hidden items-center lg:flex">
							<span class="mr-2 text-xs text-[var(--guild-text-muted)]">Club:</span>
							<select
								class="cursor-pointer rounded-md border border-[var(--guild-border)] bg-[var(--guild-surface)] px-2 py-1 text-sm text-[var(--guild-text-secondary)] focus:border-[var(--guild-primary)] focus:ring-1 focus:ring-[var(--guild-primary)]"
								value={auth.user.activeClubUuid}
								onchange={(e: Event) => {
									const target = e.currentTarget as HTMLSelectElement;
									auth.switchClub(target.value);
								}}
							>
								{#each auth.user.clubs as club (club.club_uuid)}
									<option
										value={club.club_uuid}
										selected={club.club_uuid === auth.user.activeClubUuid}
									>
										{clubService.knownClubs[club.club_uuid]?.name ??
											`Club ${club.club_uuid.slice(0, 4)}`}
									</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- Mobile: Hamburger menu (visible on md and below) -->
					<div class="flex items-center md:hidden">
						<button
							onclick={toggleHamburger}
							class="hover:bg-guild-surface/80 rounded-md p-2 text-[var(--guild-text-secondary)] hover:text-[var(--guild-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--guild-primary)]/30"
							aria-label="Open menu"
						>
							<!-- Hamburger icon -->
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 6h16M4 12h16M4 18h16"
								/>
							</svg>
						</button>
					</div>

					<!-- Desktop: User info and theme toggle (visible on md and up) -->
					<div class="hidden items-center space-x-4 md:flex">
						<ThemeToggle testid="theme-toggle-navbar" />
						<span class="text-sm text-[var(--guild-text-secondary)]">
							Welcome, {displayName}!
						</span>
						{#if auth.isAuthenticated}
							<button
								onclick={() => auth.signOut()}
								class="text-sm text-[var(--guild-primary)] hover:text-[var(--guild-primary)]/80"
								data-testid="btn-signout-magic"
							>
								Sign out
							</button>
						{:else}
							<form method="POST" action="/api/auth/logout" data-testid="form-signout">
								<button
									type="submit"
									class="text-sm text-[var(--guild-primary)] hover:text-[var(--guild-primary)]/80"
									data-testid="btn-signout"
								>
									Sign out
								</button>
							</form>
						{/if}
						<a
							href="/privacy"
							class="text-xs text-[var(--guild-text-secondary)] transition-colors hover:text-[var(--guild-text)]"
							>Privacy</a
						>
					</div>
				</div>
			{:else}
				<!-- User not signed in -->
				<div class="flex items-center">
					<ThemeToggle testid="theme-toggle-guest" />
				</div>
			{/if}
		</div>
	</div>

	<!-- Hamburger Menu Overlay -->
	{#if showHamburger && (page.data.session || auth.isAuthenticated)}
		<HamburgerMenu {closeHamburger} />
	{/if}
</nav>
