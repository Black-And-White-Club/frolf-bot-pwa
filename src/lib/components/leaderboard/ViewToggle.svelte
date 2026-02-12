<script lang="ts">
	type ViewMode = 'tags' | 'season';

	let { mode, onchange }: { mode: ViewMode; onchange: (mode: ViewMode) => void } = $props();
</script>

<div class="view-toggle" role="tablist">
	<button
		class="toggle-tab"
		class:active={mode === 'tags'}
		role="tab"
		aria-selected={mode === 'tags'}
		onclick={() => onchange('tags')}
	>
		Tags
	</button>
	<button
		class="toggle-tab"
		class:active={mode === 'season'}
		role="tab"
		aria-selected={mode === 'season'}
		onclick={() => onchange('season')}
	>
		Season
	</button>
</div>

<style>
	.view-toggle {
		display: inline-flex;
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.toggle-tab {
		font-family: var(--font-secondary, 'Space Grotesk', sans-serif);
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		border: none;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
		background: transparent;
		color: var(--guild-text-secondary, #9ca3af);
	}

	.toggle-tab.active {
		background: var(--guild-primary, #007474);
		color: #fff;
	}

	.toggle-tab:not(.active):hover {
		color: var(--guild-text, #e5e7eb);
	}
</style>
