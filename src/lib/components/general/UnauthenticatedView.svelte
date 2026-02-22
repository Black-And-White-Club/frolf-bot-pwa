<script lang="ts">
	import EmptyState from './EmptyState.svelte';
</script>

<div class="unauth-view">
	<EmptyState
		icon="🔐"
		title="Sign in required"
		message="Use Discord or Google sign-in to access your club data."
		action={{ label: 'Go to sign in', href: '/auth/signin' }}
	/>

	<div class="help-section">
		<h3>How to access:</h3>
		<ol>
			<li>Open the sign-in page</li>
			<li>Choose Discord or Google</li>
			<li>Approve access in your provider window</li>
			<li>Return to Frolf Bot automatically</li>
		</ol>
	</div>
</div>

<style>
	.unauth-view {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		padding: 2rem;
	}

	.help-section {
		margin-top: 2rem;
		padding: 1.5rem;
		background: color-mix(in srgb, var(--guild-surface) 88%, transparent);
		border: 1px solid var(--guild-border);
		border-radius: 0.75rem;
		max-width: 24rem;
	}

	.help-section h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--guild-text);
		margin-bottom: 0.75rem;
	}

	.help-section ol {
		list-style: decimal inside;
		color: var(--guild-text-secondary);
		font-size: 0.875rem;
	}

	.help-section li {
		margin-bottom: 0.5rem;
	}
</style>
