<script lang="ts">
	import ChevronCollapse from '$lib/components/general/ChevronCollapse.svelte';
	import type { Snippet } from 'svelte';

	export type Badge = {
		label: string;
		color: 'primary' | 'secondary' | 'accent';
	};

	type Props = {
		title: string;
		badges?: Badge[];
		initiallyCollapsed?: boolean;
		children: Snippet;
	};

	let { title, badges = [], initiallyCollapsed = false, children }: Props = $props();

	const bgColorMap = {
		primary: 'rgb(var(--guild-primary-rgb, 0 116 116) / 0.2)',
		secondary: 'rgb(var(--guild-secondary-rgb, 139 123 184) / 0.2)',
		accent: 'rgb(var(--guild-accent-rgb, 184 155 94) / 0.2)'
	};

	// Local UI state must remain writable and also react to parent prop updates.
	// eslint-disable-next-line svelte/prefer-writable-derived
	let collapsed = $state(false);
	$effect(() => {
		collapsed = initiallyCollapsed;
	});

	const sectionId = $derived(`rounds-list-${title.toLowerCase().replace(/\s+/g, '-')}`);

	function toggleCollapse() {
		collapsed = !collapsed;
	}
</script>

<div
	class="rounds-section"
	data-testid={`rounds-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
>
	<div class="section-header">
		<div class="title-and-badges">
			<h2 class="section-title">{title}</h2>
			{#if badges.length > 0}
				<div class="badges">
					{#each badges as badge (badge.label)}
						<span
							class="badge"
							class:glow-secondary={badge.color === 'secondary'}
							style="background-color: {bgColorMap[
								badge.color
							]}; border: 1px solid rgb(var(--guild-{badge.color}-rgb, var(--guild-primary-rgb)) / 0.8); backdrop-filter: blur(4px);"
						>
							{badge.label}
						</span>
					{/each}
				</div>
			{/if}
		</div>

		<ChevronCollapse
			{collapsed}
			disabled={false}
			ariaControls={sectionId}
			ariaLabel={collapsed ? `Expand ${title}` : `Collapse ${title}`}
			testid={`chevron-${title.toLowerCase().replace(/\s+/g, '-')}`}
			onclick={toggleCollapse}
		/>
	</div>

	{#if !collapsed}
		<div class="rounds-content" id={sectionId}>
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.rounds-section {
		background: var(--guild-surface);
		border: 1px solid var(--guild-border);
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0; /* Margin handled by content when expanded */
	}

	/* Add margin only when expanded to separate header from content */
	.rounds-content {
		margin-top: 1rem;
	}

	.title-and-badges {
		display: flex;
		align-items: center;
		gap: 1rem;
		/* Keep badges visible; allow the title to shrink and truncate instead of pushing badges */
		min-width: 0;
		flex: 1 1 auto;
	}

	.section-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--guild-text);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0; /* allow flex children to shrink correctly */
		flex: 1 1 auto;
	}

	.badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: nowrap;
		flex-shrink: 0;
	}

	.badge {
		/* Use flex for perfect centering */
		display: inline-flex;
		align-items: center;
		justify-content: center;

		/* Text sizing */
		font-family: var(--font-secondary);
		font-size: 0.875rem; /* 14px */
		font-weight: 600;
		color: var(--guild-text);
		white-space: nowrap;

		/* Sizing & Shape */
		height: 1.75rem; /* Fixed height for consistency */
		min-width: 1.75rem; /* Match height to ensure circle for single digits */
		padding: 0 0.75rem; /* Horizontal padding for text pills */
		border-radius: 9999px;
		transition: all 0.2s ease;
	}

	.badge.glow-secondary {
		box-shadow: 0 0 10px rgba(139, 123, 184, 0.3);
	}
	/* Mobile adjustments */
	@media (max-width: 768px) {
		.rounds-section {
			padding: 1rem;
		}

		.badges {
			gap: 0.25rem;
		}

		.badge {
			padding: 0.125rem 0.375rem;
			font-size: 0.625rem;
			height: 1.25rem;
			min-width: 1.25rem;
		}
	}
</style>
