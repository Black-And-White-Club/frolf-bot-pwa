<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
</script>

<svelte:head>
	<title>Sign In - Frolf Bot</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-[var(--guild-background)]"
	data-testid="page-signin"
>
	<div class="w-full max-w-md space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-[var(--guild-text)]">
				Sign in to your account
			</h2>
		</div>
		<div class="mt-8 space-y-6">
			<button
				on:click={() => signIn('discord')}
				class="group text-guild-surface relative flex w-full justify-center rounded-md border border-transparent bg-[var(--guild-primary)] px-4 py-2 text-sm font-medium hover:bg-[var(--guild-primary)]/90 focus:ring-2 focus:ring-[var(--guild-primary)] focus:ring-offset-2 focus:outline-none"
				data-testid="btn-signin-discord"
			>
				Sign in with Discord
			</button>
		</div>
	</div>
</div>
