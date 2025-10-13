<script lang="ts">
	import type { Round } from '$lib/types/backend';
	import RoundCard from '$lib/components/round/RoundCard.svelte';
	import ChevronCollapse from '$lib/components/general/ChevronCollapse.svelte';

	type Badge = {
		label: string;
		color: 'primary' | 'secondary' | 'accent';
	};

	type Props = {
		title: string;
		rounds: Round[];
		badges?: Badge[];
		showDescription?: boolean;
	};

	let { title, rounds, badges = [], showDescription = true }: Props = $props();

	const colorMap = {
		primary: 'var(--guild-primary)',
		secondary: 'var(--guild-secondary)',
		accent: 'var(--guild-accent)'
	};

	const bgColorMap = {
		primary: 'rgba(var(--guild-primary-rgb, 0, 116, 116), 0.1)',
		secondary: 'rgba(var(--guild-secondary-rgb, 139, 123, 184), 0.1)',
		accent: 'rgba(var(--guild-accent-rgb, 203, 165, 53), 0.1)'
	};

	let collapsed = $state(false);

	function toggleCollapse() {
		collapsed = !collapsed;
	}
</script>

<div class="rounds-section" data-testid={`rounds-section-${title}`}>
	<div class="section-header">
		<div class="title-and-badges">
			<h2 class="section-title">{title}</h2>
			{#if badges.length > 0}
				<div class="badges">
					{#each badges as badge}
						<span
							class="badge"
							style="background-color: {bgColorMap[badge.color]}; border: 1px solid {colorMap[
								badge.color
							]};"
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
			ariaControls="rounds-list-{title}"
			ariaLabel={collapsed ? `Expand ${title}` : `Collapse ${title}`}
			testid={`chevron-${title}`}
			onclick={toggleCollapse}
		/>
	</div>

	{#if !collapsed}
		<div class="rounds-list" id="rounds-list-{title}">
			{#each rounds as round}
				<RoundCard
					{round}
					showStatus={true}
					compact={false}
					{showDescription}
					showLocation={true}
					dataTestId={`round-card-${round.round_id}`}
				/>
			{/each}
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
		margin-bottom: 1rem;
	}

	.title-and-badges {
		display: flex;
		align-items: center;
		gap: 1rem;
		/* Keep badges visible; allow the title to shrink and truncate instead of pushing badges */
		min-width: 0;
		flex: 1 1 auto;
	}

	/* Ensure the title doesn't push badges out of view */
	.section-title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0; /* allow flex children to shrink correctly */
		flex: 1 1 auto;
	}

	/* Make badges keep their intrinsic size and not shrink */
	.badges {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
		align-items: center;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--guild-text);
		margin: 0;
	}

	.badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: nowrap;
	}

	.badge {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 700;
		border-radius: 9999px;
		white-space: nowrap;
		color: var(--guild-text);
	}

	.rounds-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.rounds-section {
			padding: 1rem;
		}

		.section-header {
			margin-bottom: 0.75rem;
		}

		.badges {
			gap: 0.25rem;
		}

		.badge {
			padding: 0.125rem 0.375rem;
			font-size: 0.625rem;
		}
	}
</style>
