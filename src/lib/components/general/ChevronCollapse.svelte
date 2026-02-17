<script lang="ts">
	type Props = {
		collapsed?: boolean;
		disabled?: boolean;
		ariaControls?: string;
		ariaLabel?: string;
		testid?: string;
		onclick?: (e: MouseEvent) => void;
		class?: string;
	};

	let {
		collapsed = true,
		disabled = false,
		ariaControls,
		ariaLabel,
		testid,
		onclick,
		class: incomingClass
	}: Props = $props();

	function handleClick(e: MouseEvent) {
		if (!disabled) {
			onclick?.(e);
		}
	}
</script>

<button
	class="chevron-collapse {incomingClass || ''}"
	type="button"
	aria-expanded={!collapsed}
	aria-controls={ariaControls}
	aria-label={ariaLabel}
	{disabled}
	data-testid={testid}
	onclick={handleClick}
>
	<svg
		class="chevron-icon"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		style="transform: rotate({collapsed ? 0 : 180}deg)"
	>
		<path
			d="M6 9l6 6 6-6"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
</button>

<style>
	.chevron-collapse {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		min-width: 44px;
		min-height: 44px;
		border-radius: 0.5rem;
		background: transparent;
		border: none;
		color: var(--guild-text-secondary);
		cursor: pointer;
		flex-shrink: 0;
		transition: all 150ms ease;
	}

	.chevron-collapse:hover:not(:disabled) {
		color: var(--guild-text);
		background: rgba(0, 0, 0, 0.05);
	}

	.chevron-collapse:focus-visible {
		outline: 2px solid var(--guild-primary);
		outline-offset: 2px;
	}

	.chevron-collapse:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.chevron-icon {
		width: 20px;
		height: 20px;
		transition: transform 200ms ease;
	}
</style>
