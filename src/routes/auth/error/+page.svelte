<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Auth Error - Frolf Bot</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-[var(--guild-background)]" data-testid="page-auth-error">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-[var(--guild-text)]">
				Authentication Error
			</h2>
			<p class="mt-2 text-center text-sm text-[var(--guild-text-secondary)]">
				{$page.url.searchParams.get('error') || 'An error occurred during authentication.'}
			</p>
		</div>
		<div class="mt-8">
			<a
				href="/auth/signin"
				data-testid="btn-try-signin"
				class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-guild-surface bg-[var(--guild-primary)] hover:bg-[var(--guild-primary)]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--guild-primary)]"
			>
				Try Again
			</a>
		</div>
	</div>
</div>
