
<script lang="ts">
import '../app.css';
import { page } from '$app/stores';
import ThemeToggle from '$lib/components/ThemeToggle.svelte';
import ThemeProvider from '$lib/components/ThemeProvider.svelte';

let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
</svelte:head>

<ThemeProvider>
{#if $page.data.session}
	<!-- User is signed in -->
	<div class="min-h-screen bg-[var(--guild-background)]">
		<header class="bg-guild-surface shadow border-b border-[var(--guild-border)]">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between h-16">
					<div class="flex items-center">
						<h1 class="text-xl font-bold text-guild-primary">Frolf Bot</h1>
					</div>
				   <div class="flex items-center space-x-4">
					   <ThemeToggle testid="theme-toggle-header" />
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
				</div>
			</div>
		</header>
		<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
			{@render children?.()}
		</main>
	</div>
{:else}
	<!-- User is not signed in -->
	<div class="min-h-screen flex items-center justify-center bg-[var(--guild-background)]">
		   <div class="max-w-md w-full space-y-8">
				   <div class="flex justify-end">
				   <ThemeToggle testid="theme-toggle-guest" />
			   </div>
			   <div>
				<h1 class="text-center text-3xl font-extrabold text-guild-primary">
					Frolf Bot PWA
				</h1>
				<p class="mt-2 text-center text-sm text-guild-text-secondary">
					Sign in with Discord to access your disc golf games.
				</p>
			   </div>
			   <div>
					   <a
					   href="/auth/signin"
					   data-testid="btn-signin"
					   class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-guild-surface bg-[var(--guild-primary)] hover:bg-[var(--guild-primary)]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--guild-primary)]"
				   >
					   Sign In
				   </a>
			   </div>
		</div>
	</div>
{/if}
</ThemeProvider>
