<!-- eslint-disable svelte/no-useless-children-snippet -->
<script lang="ts">
	import type { Round } from '$lib/types/backend';
	import AddToCalendarButton from '$lib/components/round/AddToCalendarButton.svelte';
	import IconTextRow from '$lib/components/general/IconTextRow.svelte';

	type Props = {
		round: Round;
		compact?: boolean;
		testid?: string;
		showDescription?: boolean;
		showLocation?: boolean;
		description?: string;
		location?: string;
		start_time?: string;
	};

	let {
		round,
		compact = false,
		testid,
		showDescription = true,
		showLocation = true,
		description,
		location,
		start_time
	}: Props = $props();

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function localDescription() {
		return description ?? round?.description;
	}

	function localLocation() {
		return location ?? round?.location;
	}

	function localStartTime() {
		return start_time ?? round?.start_time;
	}

	function formatLocalStart() {
		const v = localStartTime();
		return v ? formatDate(v) : 'TBD';
	}
</script>

{#if !compact}
	<div data-testid={testid} class="round-details-content">
		{#if showDescription && localDescription()}
			<!-- Limit description line length so it doesn't stretch the entire card on wide screens -->
			<p
				class="description line-clamp-2 max-w-[55ch] text-left text-sm text-[var(--guild-text-secondary)] md:max-w-[48ch]"
			>
				{localDescription()}
			</p>
		{/if}

		{#if showLocation && localLocation()}
			<p class="location-row text-sm text-[var(--guild-text-secondary)]">
				<IconTextRow className="" testid={`round-location-${round.round_id}`}>
					{#snippet icon()}
						<svg
							class="flex-shrink-0"
							style="width:var(--icon-size,1rem);height:var(--icon-size,1rem)"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
							></path>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
							></path>
						</svg>
					{/snippet}
					<span class="min-w-0">{localLocation()}</span>
				</IconTextRow>
			</p>
		{/if}
	</div>
{/if}

<!-- mobile floating calendar removed: the inline scheduled row contains the icon-only control -->

{#if round.status === 'scheduled'}
	<!-- tighten vertical spacing slightly so location and date rows sit closer -->
	<p class="date-row scheduled text-sm text-[var(--guild-text-secondary)]" style="--icon-size:1rem">
		<IconTextRow>
			{#snippet icon()}
				<!-- icon-only button: icon is the interactive control -->
				<AddToCalendarButton
					{round}
					showCaption={true}
					showIcon={true}
					small={true}
					captionText="Click to add to calendar"
					testid={`btn-add-calendar-inline-${round.round_id}`}
				/>
			{/snippet}

			<span class="date-text">{formatLocalStart()}</span>
		</IconTextRow>
	</p>
{:else}
	<p class="date-row text-sm text-[var(--guild-text-secondary)]">
		<IconTextRow>
			{#snippet icon()}
				<svg
					class="flex-shrink-0"
					style="width:var(--icon-size,1rem);height:var(--icon-size,1rem)"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
					></path>
				</svg>
			{/snippet}
			<span class="min-w-0">{formatLocalStart()}</span>
		</IconTextRow>
	</p>
{/if}

<style>
	/* IconTextRow provides the inline icon+text contract so no local CSS needed here */

	/* tighter spacing so stacked rows sit closer together */
	/* Default paragraph spacing inside the details block. Keep description a little looser. */
	.round-details-content p {
		margin-bottom: 0.25rem; /* reasonable default */
	}

	/* Description should have a bit more breathing room before location */
	.round-details-content p.description {
		margin-bottom: 0.5rem;
	}

	.date-row {
		margin-top: 0; /* no extra top gap */
	}

	/* ensure inline rows keep icon+text on a single line and share icon sizing */
	.round-details-content {
		--icon-size: 1rem;
	}

	.location-row,
	.date-row {
		line-height: 1.15rem; /* slightly tighter vertical rhythm */
		margin-top: 0; /* ensure no extra gap above these rows */
	}

	/* TIGHTEN: only adjust spacing between location and date rows
	   Make them sit closer together by pulling the date up slightly */
	.location-row {
		margin-bottom: 0.25rem; /* pull date row up ~4px */
	}

	/* lift the date row up a hair as well so the two rows are visually tight */
	.date-row {
		margin-bottom: 0.5rem;
	}

	/* scheduled rows should use the brand secondary (amethyst) for the icon */
	.date-row.scheduled {
		--icon-color: var(--guild-secondary);
	}

	/* Only the scheduled inline calendar should use the amethyst accent for the icon */
	/* (was .date-row .icon-row) */
</style>
