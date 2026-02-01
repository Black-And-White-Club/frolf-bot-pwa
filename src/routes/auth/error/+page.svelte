<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Auth Error - Frolf Bot</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-[var(--guild-background)]"
	data-testid="page-auth-error"
>
	<div class="w-full max-w-md space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-[var(--guild-text)]">
				Authentication Error
			</h2>
			<p class="mt-2 text-center text-sm text-[var(--guild-text-secondary)]">
				{page.url.searchParams.get('error') || 'An error occurred during authentication.'}
			</p>
		</div>
		<div class="mt-8">
			<a
				href="/auth/signin"
				data-testid="btn-try-signin"
				class="group text-guild-surface relative flex w-full justify-center rounded-md border border-transparent bg-[var(--guild-primary)] px-4 py-2 text-sm font-medium hover:bg-[var(--guild-primary)]/90 focus:ring-2 focus:ring-[var(--guild-primary)] focus:ring-offset-2 focus:outline-none"
			>
				Try Again
			</a>
		</div>
	</div>
</div>
