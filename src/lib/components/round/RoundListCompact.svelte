<script lang="ts">
	import RoundListCard from './RoundListCard.svelte';

	type Round = {
		id: string;
		guildId: string;
		title: string;
		location: string;
		description: string;
		startTime: string;
		state: 'scheduled' | 'started' | 'finalized' | 'cancelled';
		createdBy: string;
		eventMessageId: string;
		participants: Array<{
			userId: string;
			response: 'accepted' | 'declined' | 'tentative';
			score: number | null;
			tagNumber: number | null;
		}>;
	};

	let { rounds, limit = 5 }: { rounds: Round[]; limit?: number } = $props();

	const sortedRounds = $derived(
		[...rounds]
			.sort((a, b) => {
				const stateOrder = { started: 0, scheduled: 1, finalized: 2, cancelled: 3 };
				return (stateOrder[a.state] ?? 4) - (stateOrder[b.state] ?? 4);
			})
			.slice(0, limit)
	);
</script>

<div class="space-y-2">
	{#each sortedRounds as round (round.id)}
		<RoundListCard {round} />
	{/each}
	{#if rounds.length > limit}
		<p class="pt-2 text-center text-xs text-slate-500">+{rounds.length - limit} more</p>
	{/if}
</div>
