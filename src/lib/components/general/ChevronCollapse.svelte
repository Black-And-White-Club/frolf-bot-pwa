<script lang="ts">
	type Props = {
		collapsed?: boolean;
		disabled?: boolean;
		ariaControls?: string;
		ariaLabel?: string;
		dataTestid?: string;
		class?: string;
		[key: string]: any;
	};

	let {
		collapsed = true,
		disabled = false,
		dataTestid,
		class: incomingClass,
		...restProps
	}: Props = $props();

	// This value automatically updates when `collapsed` prop changes.
	const rotationClass = $derived(() => (collapsed ? '' : 'rotate-180'));
</script>

<button
	class="collapse-btn group {incomingClass}"
	type="button"
	aria-expanded={!collapsed}
	aria-controls={restProps['ariaControls']}
	aria-label={restProps['ariaLabel']}
	{disabled}
	data-testid={dataTestid}
	{...restProps}
>
	<svg
		class="transition-transform duration-200 {rotationClass}"
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<path
			d="M6 9l6 6 6-6"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
</button>

<style>
	.collapse-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		border-radius: 0.375rem;
		background: transparent;
		border: none;
		color: var(--guild-text-secondary);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.collapse-btn:hover:not(:disabled) {
		color: var(--guild-text);
		background: rgba(0, 0, 0, 0.04);
	}

	.collapse-btn:focus-visible {
		outline: 2px solid var(--guild-primary);
		outline-offset: 2px;
	}

	.collapse-btn:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
</style>
