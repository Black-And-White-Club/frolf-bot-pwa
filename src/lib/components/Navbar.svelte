<script lang="ts">
	import { page } from '$app/stores';
	import ThemeToggle from './ThemeToggle.svelte';
	import HamburgerMenu from './HamburgerMenu.svelte';
	import { onMount } from 'svelte';

	let showHamburger = false;
	let isMobile = false;

	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 768; // md breakpoint
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	});

	function toggleHamburger() {
		showHamburger = !showHamburger;
	}

	function closeHamburger() {
		showHamburger = false;
	}
</script>

<nav class="bg-guild-surface border-b border-[var(--guild-border)] shadow">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 justify-between">
			<div class="flex items-center">
				<h1 class="text-guild-primary text-xl font-bold">Frolf Bot</h1>
			</div>

			{#if $page.data.session}
				<!-- User is signed in -->
				{#if isMobile}
					<!-- Mobile: Hamburger menu -->
					<div class="flex items-center">
						<button
							on:click={toggleHamburger}
							class="hover:bg-guild-surface/80 rounded-md p-2 text-[var(--guild-text-secondary)] hover:text-[var(--guild-text)] focus:ring-2 focus:ring-[var(--guild-primary)] focus:outline-none"
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
				{:else}
					<!-- Desktop: User info and theme toggle -->
					<div class="flex items-center space-x-4">
						<ThemeToggle testid="theme-toggle-navbar" />
						<span class="text-sm text-[var(--guild-text-secondary)]">
							Welcome, {$page.data.session.user?.name}!
						</span>
						<form method="POST" action="/api/auth/signout" data-testid="form-signout">
							<button
								type="submit"
								class="text-sm text-[var(--guild-primary)] hover:text-[var(--guild-primary)]/80"
								data-testid="btn-signout"
							>
								Sign out
							</button>
						</form>
					</div>
				{/if}
			{:else}
				<!-- User not signed in -->
				<div class="flex items-center">
					<ThemeToggle testid="theme-toggle-guest" />
				</div>
			{/if}
		</div>
	</div>

	<!-- Hamburger Menu Overlay -->
	{#if showHamburger && $page.data.session}
		<HamburgerMenu {closeHamburger} />
	{/if}
</nav>
