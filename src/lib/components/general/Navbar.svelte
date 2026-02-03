<script lang="ts">
	import { page } from '$app/state';
	import ThemeToggle from './ThemeToggle.svelte';
	import HamburgerMenu from './HamburgerMenu.svelte';
	import { setModalOpen } from '$lib/stores/overlay';
	import { auth } from '$lib/stores/auth.svelte';
	import { guildService } from '$lib/stores/guild.svelte';

	let showHamburger = $state(false);

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
</script>

<nav class="site-header">
	<div class="site-header__inner mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex w-full items-center justify-between">
			<div class="flex items-center gap-8">
				<h1 class="text-guild-primary card-title card-title--skobeloff text-xl font-bold">
					{guildService.info?.name ?? 'Frolf Bot'}
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
				</nav>
			</div>

			{#if page.data.session || auth.isAuthenticated}
				<!-- User is signed in -->
				<div class="flex items-center gap-4">
					<!-- Club Switcher (if multiple clubs) -->
					{#if auth.user && auth.user.clubs.length > 1}
						<div class="hidden items-center lg:flex">
							<span class="text-xs text-[var(--guild-text-muted)] mr-2">Club:</span>
							<select 
								class="bg-[var(--guild-surface)] text-sm text-[var(--guild-text-secondary)] border border-[var(--guild-border)] rounded-md focus:ring-1 focus:ring-[var(--guild-primary)] focus:border-[var(--guild-primary)] cursor-pointer py-1 px-2"
								value={auth.user.activeClubUuid}
								onchange={(e: Event) => {
									const target = e.currentTarget as HTMLSelectElement;
									auth.switchClub(target.value);
								}}
							>
								{#each auth.user.clubs as club}
									<option value={club.club_uuid} selected={club.club_uuid === auth.user.activeClubUuid}>
										{club.club_uuid.slice(0, 8)}... ({club.role})
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
							Welcome, {auth.displayName}!
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
							<form method="POST" action="/api/auth/signout" data-testid="form-signout">
								<button
									type="submit"
									class="text-sm text-[var(--guild-primary)] hover:text-[var(--guild-primary)]/80"
									data-testid="btn-signout"
								>
									Sign out
								</button>
							</form>
						{/if}
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
	{#if showHamburger && page.data.session}
		<HamburgerMenu {closeHamburger} />
	{/if}
</nav>
