<script lang="ts">
	import type { Round } from '$lib/types/backend';
	import { cn } from '$lib/utils';
	import RoundHeader from './RoundHeader.svelte';
	import RoundDetails from './RoundDetails.svelte';
	import ParticipantDisplay from './ParticipantDisplay.svelte';

	type Props = {
		round: Round;
		showStatus?: boolean;
		compact?: boolean;
		dataTestId?: string;
		showDescription?: boolean;
		showLocation?: boolean;
		title?: string;
		description?: string;
		location?: string;
		start_time?: string;
		participants?: any[];
		status?: string;
		par_total?: number;
		collapsed?: boolean;
		class?: string;
	};

	let {
		round,
		showStatus = true,
		compact = false,
		dataTestId,
		showDescription = true,
		showLocation = true,
		title,
		description,
		location,
		start_time,
		participants,
		status,
		par_total,
		collapsed = false,
		class: incomingClass
	}: Props = $props();

	// title prop may be provided by callers; reference to avoid unused-var lint
	void title;

	const localDescription = $derived(description ?? round?.description);
	const localLocation = $derived(location ?? round?.location);
	const localStartTime = $derived(start_time ?? round?.start_time);
	const localParticipants = $derived(participants ?? round?.participants);
	const localStatus = $derived(status ?? round?.status);
	const localParTotal = $derived(par_total ?? (round as any)?.par_total ?? (round as any)?.par);
</script>

<div
	class={cn(
		'round-card',
		'bg-guild-surface w-full rounded-xl border border-[var(--guild-border)] shadow-sm',
		incomingClass
	)}
	style="padding: var(--round-outer-padding, {compact ? '1rem' : '1.5rem'});"
	data-testid={dataTestId}
>
	<div class="round-card-inner">
		<RoundHeader {round} {showStatus} />

		{#if !collapsed}
			<div class="round-card-body">
				<RoundDetails
					{round}
					{compact}
					{showDescription}
					{showLocation}
					description={localDescription}
					location={localLocation}
					start_time={localStartTime}
				/>
				<ParticipantDisplay
					{round}
					{compact}
					participants={localParticipants}
					status={localStatus}
					par_total={localParTotal}
				/>
			</div>
		{/if}
	</div>
</div>

<style>
	.round-card-inner {
		width: 100%;
		max-width: var(--round-inner-max-width, 720px);
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.round-card-body {
		margin-top: 0.5rem;
	}
</style>
