<script lang="ts">
	import { tick } from 'svelte';

	interface Props {
		startCollapsed?: boolean;
		collapsed?: boolean;
		onToggle?: (collapsed: boolean) => void;
		testid?: string;
		class?: string;
		style?: string;
		// Svelte 5: snippets/children props (optional). Kept permissive to accept
		// render functions/snippets passed from parents.
		header?: ((...args: any[]) => any) | undefined;
		children?: ((...args: any[]) => any) | undefined;
		// Optional explicit control width for the inner controls column. When set
		// this will be exposed as the CSS custom property `--inner-controls-width`
		// on the wrapper so descendants can align to it. Defaults to '6.25rem'.
		controlWidth?: string | undefined;
	}

	// This component uses Svelte 5 snippets instead of slots. Parents should
	// pass `header` and `children` render functions (snippets) as props.

	let {
		startCollapsed = false,
		collapsed = $bindable(startCollapsed),
		onToggle,
		testid,
		class: className = '',
		style = undefined,
		header,
		children,
		controlWidth = '6.25rem'
	}: Props = $props();

	import ChevronCollapse from '$lib/components/ChevronCollapse.svelte';

	// Merge passed style prop with our internal control-width variable so inner
	// components can align their status badges and chips from a single source.
	// We expose both `--inner-controls-width` (explicit value) and maintain a
	// compatibility mapping `--round-header-controls` that references it.
	import { setContext } from 'svelte';

	// Provide the control width to JS consumers via Svelte context as well.
	setContext('collapsible-controls', { controlWidth });

	const mergedStyle = $derived(() => {
		const base = style ? `${style.trim().replace(/;?\s*$/, '; ')}` : '';
		return (
			base +
			`--inner-controls-width: ${controlWidth}; ` +
			`--round-header-controls: var(--inner-controls-width, ${controlWidth});`
		);
	});

	// Internal state
	let mounted = $state(!collapsed);
	let animating = $state(false);
	let bodyEl = $state<HTMLElement | null>(null);
	let contentHeight = $state(0);

	// Unique ID for accessibility
	const bodyId = $derived(
		testid
			? `collapsible-body-${testid}`
			: `collapsible-body-${Math.random().toString(36).slice(2, 9)}`
	);

	// Animation duration based on user preferences
	let duration = $state(320);

	// Initialize component and set animation duration based on user prefs.
	// Persistence has been removed to keep the component a simple wrapper; if
	// you want persistence we can add an explicit `persist` prop.
	$effect(() => {
		mounted = !collapsed;

		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const mobile = window.matchMedia('(max-width: 767px)').matches;

		if (reducedMotion) {
			duration = 0;
		} else if (mobile) {
			duration = 240;
		} else {
			duration = 320;
		}

		// notify parent about initial state if provided
		onToggle?.(collapsed);
	});

	// Update content height when body element changes
	$effect(() => {
		if (bodyEl && !collapsed) {
			const resizeObserver = new ResizeObserver(() => {
				if (bodyEl && !animating) {
					contentHeight = bodyEl.scrollHeight;
				}
			});

			resizeObserver.observe(bodyEl);

			return () => resizeObserver.disconnect();
		}
	});

	async function toggle() {
		if (animating) return;

		const willCollapse = !collapsed;

		if (willCollapse) {
			await collapse();
		} else {
			await expand();
		}
	}

	async function expand() {
		if (animating) return;

		animating = true;
		mounted = true;

		await tick();

		if (!bodyEl) {
			collapsed = false;
			animating = false;
			return;
		}

		// Measure actual content height
		const targetHeight = bodyEl.scrollHeight;
		contentHeight = targetHeight;

		// Use requestAnimationFrame for smoother animations
		requestAnimationFrame(() => {
			if (!bodyEl) return;

			// Start from 0 height
			bodyEl.style.maxHeight = '0px';
			bodyEl.style.opacity = '0';

			// Force reflow
			bodyEl.offsetHeight;

			// Animate to target height - using transform for better performance
			bodyEl.style.transition = `max-height ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${duration}ms ease-out`;
			bodyEl.style.maxHeight = `${targetHeight}px`;
			bodyEl.style.opacity = '1';

			const cleanup = () => {
				if (!bodyEl) return;
				bodyEl.style.maxHeight = 'none';
				bodyEl.style.overflow = 'visible';
				bodyEl.style.transition = '';
				collapsed = false;
				animating = false;
				onToggle?.(collapsed);
			};

			if (duration === 0) {
				cleanup();
				return;
			}

			const timeout = setTimeout(cleanup, duration + 50);

			const handleTransitionEnd = (e: TransitionEvent) => {
				if (e.target !== bodyEl || e.propertyName !== 'max-height') return;
				clearTimeout(timeout);
				bodyEl?.removeEventListener('transitionend', handleTransitionEnd);
				cleanup();
			};

			bodyEl.addEventListener('transitionend', handleTransitionEnd);
		});
	}

	async function collapse() {
		if (animating || !bodyEl) return;

		animating = true;

		const startHeight = bodyEl.scrollHeight;

		// Set explicit height first
		bodyEl.style.maxHeight = `${startHeight}px`;
		bodyEl.style.overflow = 'hidden';
		bodyEl.style.transition = '';

		// Force reflow
		bodyEl.offsetHeight;

		requestAnimationFrame(() => {
			if (!bodyEl) return;

			// Animate to 0 with better easing
			bodyEl.style.transition = `max-height ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${duration}ms ease-in`;
			bodyEl.style.maxHeight = '0px';
			bodyEl.style.opacity = '0';

			const cleanup = () => {
				collapsed = true;
				animating = false;
				mounted = false;
				onToggle?.(collapsed);
			};

			if (duration === 0) {
				cleanup();
				return;
			}

			const timeout = setTimeout(cleanup, duration + 50);

			const handleTransitionEnd = (e: TransitionEvent) => {
				if (e.target !== bodyEl || e.propertyName !== 'max-height') return;
				clearTimeout(timeout);
				bodyEl?.removeEventListener('transitionend', handleTransitionEnd);
				cleanup();
			};

			bodyEl.addEventListener('transitionend', handleTransitionEnd);
		});
	}
</script>

<section class="collapsible-card {className}" {style} data-testid={testid}>
	<div class="collapsible-card__header">
		<div class="collapsible-card__header-content">
			{@render header?.()}
		</div>
		<div class="collapsible-card__controls">
			<ChevronCollapse
				{collapsed}
				disabled={animating}
				ariaControls={bodyId}
				ariaLabel={collapsed ? 'Expand section' : 'Collapse section'}
				testid={testid ? `${testid}-toggle` : undefined}
				on:toggle={toggle}
			/>
		</div>
	</div>

	{#if mounted}
		<div
			bind:this={bodyEl}
			id={bodyId}
			class="collapsible-card__body overflow-hidden"
			style="max-height: {collapsed ? '0px' : 'none'}; opacity: {collapsed ? 0 : 1};"
		>
			{@render children?.()}
		</div>
	{/if}
</section>

<style>
	.collapsible-card {
		position: relative;
	}

	.collapsible-card__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.collapsible-card__header-content {
		flex: 1 1 auto;
	}

	.collapsible-card__controls {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
	}

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

	.collapsible-card__body {
		margin-top: 0.75rem;
		/* Use will-change for better performance during animations */
		will-change: max-height, opacity;
	}

	@media (prefers-reduced-motion: reduce) {
		.collapse-btn,
		.collapsible-card__body {
			transition: none !important;
		}
	}
</style>
