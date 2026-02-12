<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	let email = $state('');
	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');

	async function handleSubmit() {
		status = 'loading';
		try {
			// This would trigger a NATS request via the backend to send a magic link
			// For now, we'll just mock the success state or redirect to the backend generator
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
			if (res.ok) status = 'success';
			else status = 'error';
		} catch {
			status = 'error';
		}
	}
</script>

<svelte:head>
	<title>Sign In | Frolf Bot</title>
	<meta name="description" content="Sign in to Frolf Bot to track scores and compete with your disc golf club." />
	<meta property="og:title" content="Sign In | Frolf Bot" />
	<meta property="og:description" content="Sign in to Frolf Bot to track scores and compete with your disc golf club." />
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[var(--guild-background)] p-4">
	<div class="w-full max-w-md space-y-8 rounded-xl bg-[var(--guild-surface)] p-8 shadow-2xl">
		<div class="text-center">
			<h2 class="text-guild-primary text-3xl font-bold">Sign In</h2>
			<p class="text-guild-text-secondary mt-2">Enter your email for a magic link</p>
		</div>

		{#if status === 'success'}
			<div class="rounded-lg bg-green-900/20 p-4 text-center text-green-400">
				Check your email for the magic link!
			</div>
		{:else}
			<form class="space-y-6" onsubmit={handleSubmit}>
				<div>
					<label for="email" class="block text-sm font-medium text-white/70">Email address</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						required
						class="mt-1 block w-full rounded-md border border-white/10 bg-black/20 px-4 py-2 text-white focus:border-[var(--guild-primary)] focus:ring-1 focus:ring-[var(--guild-primary)]"
					/>
				</div>

				{#if status === 'error'}
					<p class="text-sm text-red-500">Something went wrong. Please try again.</p>
				{/if}

				<button
					type="submit"
					disabled={status === 'loading'}
					class="flex w-full justify-center rounded-md bg-[var(--guild-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--guild-primary)]/90 disabled:opacity-50"
				>
					{status === 'loading' ? 'Sending...' : 'Send Magic Link'}
				</button>
			</form>
		{/if}

		<div class="text-center">
			<a href="/" class="text-sm text-white/40 hover:text-white transition">Back to Home</a>
		</div>
	</div>
</div>
