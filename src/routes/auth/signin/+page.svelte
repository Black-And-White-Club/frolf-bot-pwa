<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
</script>

<svelte:head>
	<title>Sign In - Frolf Bot</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-[var(--guild-background)]" data-testid="page-signin">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-[var(--guild-text)]">
				Sign in to your account
			</h2>
		</div>
		<div class="mt-8 space-y-6">
			<button
				on:click={() => signIn('discord')}
				class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-guild-surface bg-[var(--guild-primary)] hover:bg-[var(--guild-primary)]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--guild-primary)]"
				data-testid="btn-signin-discord"
			>
				Sign in with Discord
			</button>
		</div>
	</div>
</div>
