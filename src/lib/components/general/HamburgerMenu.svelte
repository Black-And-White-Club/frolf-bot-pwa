<script lang="ts">
	import { page } from '$app/state';
	import ThemeToggle from './ThemeToggle.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { setModalOpen } from '$lib/stores/overlay';

	type Props = {
		closeHamburger: () => void;
		dataTestId?: string;
	};

	let { closeHamburger, dataTestId }: Props = $props();

	let menuEl = $state<HTMLElement | null>(null);
	let previouslyFocused = $state<HTMLElement | null>(null);

	// Derive test IDs from base dataTestId
	const themeToggleTestId = $derived(
		dataTestId ? `${dataTestId}-theme-toggle` : 'theme-toggle-hamburger'
	);
	const formSignoutTestId = $derived(
		dataTestId ? `${dataTestId}-form-signout` : 'form-signout-mobile'
	);
	const btnSignoutTestId = $derived(
		dataTestId ? `${dataTestId}-btn-signout` : 'btn-signout-mobile'
	);

	function handleSignOut() {
		closeHamburger();
		// The form will handle the sign out
	}

	function getFocusable(container: HTMLElement) {
		const selectors = [
			'a[href]',
			'area[href]',
			'input:not([disabled])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'button:not([disabled])',
			'iframe',
			'object',
			'embed',
			'[contenteditable]',
			'[tabindex]:not([tabindex="-1"])'
		].join(',');
		return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
			(el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length
		);
	}

	function onKeyDown(e: KeyboardEvent) {
		if (!menuEl) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			closeHamburger();
			return;
		}

		if (e.key === 'Tab') {
			const focusable = getFocusable(menuEl);
			if (focusable.length === 0) {
				e.preventDefault();
				return;
			}
			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		}
	}

	onMount(() => {
		// mark modal open for the rest of the app (layout will hide main content)
		setModalOpen(true);

		// capture previously focused element so we can restore focus
		previouslyFocused = (document.activeElement as HTMLElement) || null;

		// focus the dialog container for accessibility
		requestAnimationFrame(() => {
			if (!menuEl) return;
			const focusable = getFocusable(menuEl);
			if (focusable.length) {
				focusable[0].focus();
			} else {
				menuEl.focus();
			}
		});

		document.addEventListener('keydown', onKeyDown, true);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', onKeyDown, true);
		try {
			previouslyFocused?.focus();
		} catch {
			/* ignore */
		}
		// clear modal open flag
		try {
			setModalOpen(false);
		} catch {
			/* ignore */
		}
	});
</script>

<!-- Backdrop -->
<div
	class="bg-opacity-50 fixed inset-0 z-40 bg-black transition-opacity"
	onclick={closeHamburger}
	role="presentation"
	aria-hidden="true"
></div>

<!-- Slide-out menu -->
<div
	class="bg-[var(--guild-surface)] fixed top-0 right-0 z-50 h-full w-80 transform shadow-xl transition-all duration-200"
	role="dialog"
	aria-modal="true"
	aria-labelledby="hamburger-title"
	bind:this={menuEl}
	tabindex="-1"
>
	<div class="p-6">
		<!-- Close button -->
		<div class="mb-6 flex justify-end">
			<button
				onclick={closeHamburger}
				class="hover:bg-guild-surface/80 rounded-md p-2 text-[var(--guild-text-secondary)] hover:text-[var(--guild-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--guild-primary)]/30"
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
			<h2 id="hamburger-title" class="text-lg font-semibold text-[var(--guild-text)]">
				Welcome, {page.data.session?.user?.name}!
			</h2>
		</div>

		<!-- Navigation Links -->
		<nav class="mb-6 flex flex-col gap-2">
			<a
				href="/"
				class="block rounded-md px-4 py-2 text-[var(--guild-text)] transition-colors hover:bg-[var(--guild-surface-elevated)]"
				onclick={closeHamburger}
			>
				Home
			</a>
			<a
				href="/rounds"
				class="block rounded-md px-4 py-2 text-[var(--guild-text)] transition-colors hover:bg-[var(--guild-surface-elevated)]"
				onclick={closeHamburger}
			>
				Rounds
			</a>
			<a
				href="/leaderboard"
				class="block rounded-md px-4 py-2 text-[var(--guild-text)] transition-colors hover:bg-[var(--guild-surface-elevated)]"
				onclick={closeHamburger}
			>
				Leaderboard
			</a>
			<a
				href="/docs"
				class="block rounded-md px-4 py-2 text-[var(--guild-text)] transition-colors hover:bg-[var(--guild-surface-elevated)]"
				onclick={closeHamburger}
			>
				Docs
			</a>
		</nav>

		<!-- Theme toggle -->
		<div class="mb-6">
			<div class="flex items-center justify-between rounded-md px-4 py-2">
				<span class="text-sm font-medium text-[var(--guild-text)]">Theme</span>
				<div class="flex items-center gap-2">
					<ThemeToggle testid={themeToggleTestId} size="sm" />
				</div>
			</div>
		</div>

		<!-- Sign out -->
		<div class="border-t border-[var(--guild-border)] pt-6">
			<form method="POST" action="/api/auth/logout" data-testid={formSignoutTestId}>
				<button
					type="submit"
					onclick={handleSignOut}
					class="text-guild-surface flex w-full justify-center rounded-md border border-transparent bg-liquid-skobeloff px-4 py-2 text-sm font-medium hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--guild-primary)]/30"
					data-testid={btnSignoutTestId}
				>
					Sign out
				</button>
			</form>
		</div>
	</div>
</div>
