<script lang="ts">
	import { page } from '$app/stores';
	import ThemeToggle from './ThemeToggle.svelte';

	export let closeHamburger: () => void;

	function handleSignOut() {
		closeHamburger();
		// The form will handle the sign out
	}
</script>

<!-- Backdrop -->
<div
	class="bg-opacity-50 fixed inset-0 z-40 bg-black transition-opacity"
	on:click={closeHamburger}
	role="presentation"
></div>

<!-- Slide-out menu -->
<div
	class="bg-guild-surface fixed top-0 right-0 z-50 h-full w-80 transform shadow-xl transition-transform"
>
	<div class="p-6">
		<!-- Close button -->
		<div class="mb-6 flex justify-end">
			<button
				on:click={closeHamburger}
				class="hover:bg-guild-surface/80 rounded-md p-2 text-[var(--guild-text-secondary)] hover:text-[var(--guild-text)] focus:ring-2 focus:ring-[var(--guild-primary)] focus:outline-none"
				aria-label="Close menu"
			>
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- User greeting -->
		<div class="mb-6">
			<h2 class="text-lg font-semibold text-[var(--guild-text)]">
				Welcome, {$page.data.session?.user?.name}!
			</h2>
		</div>

		<!-- Theme toggle -->
		<div class="mb-6">
			<label class="mb-2 block text-sm font-medium text-[var(--guild-text-secondary)]">
				Theme
				<ThemeToggle testid="theme-toggle-hamburger" />
			</label>
		</div>

		<!-- Sign out -->
		<div class="border-t border-[var(--guild-border)] pt-6">
			<form method="POST" action="/api/auth/signout" data-testid="form-signout-mobile">
				<button
					type="submit"
					on:click={handleSignOut}
					class="text-guild-surface flex w-full justify-center rounded-md border border-transparent bg-[var(--guild-primary)] px-4 py-2 text-sm font-medium hover:bg-[var(--guild-primary)]/90 focus:ring-2 focus:ring-[var(--guild-primary)] focus:ring-offset-2 focus:outline-none"
					data-testid="btn-signout-mobile"
				>
					Sign out
				</button>
			</form>
		</div>
	</div>
</div>
