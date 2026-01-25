<script lang="ts">
	import EmptyState from './EmptyState.svelte';
</script>

<div class="unauth-view">
	<EmptyState
		icon="🔐"
		title="Sign in required"
		message="Use the /dashboard command in Discord to get a magic link"
	/>

	<div class="help-section">
		<h3>How to access:</h3>
		<ol>
			<li>Open Discord</li>
			<li>Go to your club's server</li>
			<li>Type <code>/dashboard</code></li>
			<li>Click the link sent to you</li>
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
		background: var(--forest-800);
		border-radius: 0.75rem;
		max-width: 20rem;
	}

	.help-section h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--slate-300);
		margin-bottom: 0.75rem;
	}

	.help-section ol {
		list-style: decimal inside;
		color: var(--slate-400);
		font-size: 0.875rem;
	}

	.help-section li {
		margin-bottom: 0.5rem;
	}

	.help-section code {
		background: var(--forest-700);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-family: monospace;
	}
</style>
