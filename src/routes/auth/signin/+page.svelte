<script lang="ts">
	import { page } from '$app/state';

	let email = $state('');
	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let errorMessage = $state('');

	const oauthError = $derived(page.url.searchParams.get('error') === 'oauth_failed');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		status = 'loading';
		errorMessage = '';
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
			if (res.ok) status = 'success';
			else {
				status = 'error';
				errorMessage = 'Something went wrong. Please try again.';
			}
		} catch {
			status = 'error';
			errorMessage = 'Something went wrong. Please try again.';
		}
	}
</script>

<svelte:head>
	<title>Sign In | Frolf Bot</title>
	<meta
		name="description"
		content="Sign in to Frolf Bot to track scores and compete with your disc golf club."
	/>
	<meta property="og:title" content="Sign In | Frolf Bot" />
	<meta
		property="og:description"
		content="Sign in to Frolf Bot to track scores and compete with your disc golf club."
	/>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[var(--guild-background)] p-4">
	<div class="w-full max-w-md space-y-8 rounded-xl bg-[var(--guild-surface)] p-8 shadow-2xl">
		<div class="text-center">
			<h2 class="text-guild-primary text-3xl font-bold">Sign In</h2>
			<p class="text-guild-text-secondary mt-2">Choose how you'd like to sign in</p>
		</div>

		{#if oauthError}
			<div class="rounded-lg bg-red-900/20 p-3 text-center text-sm text-red-400">
				Sign-in failed. Please try again.
			</div>
		{/if}

		<!-- Social sign-in buttons -->
		<div class="space-y-3">
			<a
				href="/api/auth/discord/login"
				class="flex w-full items-center justify-center gap-3 rounded-md bg-[#5865F2] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 127.14 96.36">
					<path
						fill="currentColor"
						d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
					/>
				</svg>
				Sign in with Discord
			</a>

			<a
				href="/api/auth/google/login"
				class="flex w-full items-center justify-center gap-3 rounded-md border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 48 48">
					<path
						fill="#FFC107"
						d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
					/>
					<path
						fill="#FF3D00"
						d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
					/>
					<path
						fill="#4CAF50"
						d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
					/>
					<path
						fill="#1976D2"
						d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
					/>
				</svg>
				Sign in with Google
			</a>
		</div>

		<div class="flex items-center gap-4">
			<div class="flex-1 border-t border-white/10"></div>
			<span class="text-xs text-white/40">or</span>
			<div class="flex-1 border-t border-white/10"></div>
		</div>

		<!-- Magic link form -->
		{#if status === 'success'}
			<div class="rounded-lg bg-green-900/20 p-4 text-center text-green-400">
				Check your email for the magic link!
			</div>
		{:else}
			<form class="space-y-4" onsubmit={handleSubmit}>
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
					<p class="text-sm text-red-500">{errorMessage}</p>
				{/if}

				<button
					type="submit"
					disabled={status === 'loading'}
					class="flex w-full justify-center rounded-md bg-liquid-skobeloff px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
				>
					{status === 'loading' ? 'Sending...' : 'Send Magic Link'}
				</button>
			</form>
		{/if}

		<div class="text-center">
			<a href="/" class="text-sm text-white/40 transition hover:text-white">Back to Home</a>
		</div>
	</div>
</div>
