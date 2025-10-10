<script lang="ts">
	type Props = {
		className?: string;
		testid?: string;
		icon?: () => any;
		children?: () => any;
	};

	let { className = '', testid, icon, children }: Props = $props();
</script>

<div class={`icon-text-row ${className}`} data-testid={testid}>
	{@render icon?.()}
	<div class="icon-text-content">{@render children?.()}</div>
</div>

<style>
	.icon-text-row {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		vertical-align: middle; /* align with surrounding inline content */
		white-space: nowrap; /* keep icon + text on one line */
	}

	/* icon slot: ensure SVGs/icons don't shrink and share consistent size */
	.icon-text-row :global(svg) {
		flex-shrink: 0;
		width: var(--icon-size, 1rem); /* 16px default, can be overridden */
		height: var(--icon-size, 1rem);
		display: block; /* remove baseline text descender differences */
		color: var(--icon-color, currentColor);
		stroke: currentColor;
	}

	.icon-text-content {
		min-width: 0; /* allow truncation */
		display: flex;
		align-items: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
