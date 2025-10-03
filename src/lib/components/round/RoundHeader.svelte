<script lang="ts">
	import type { Round } from '$lib/types/backend';
	import { addToCalendar } from '$lib/utils/calendar';
	import StatusBadge from '../StatusBadge.svelte';
import { announce } from '$lib/stores/announcer'

	export let round: Round;
	export let showStatus: boolean = true;
	export let testid: string | undefined = undefined;
</script>

<div class="flex justify-between items-start mb-3" data-testid={testid}>
	<h3 class="text-lg font-semibold text-[var(--guild-text)] truncate" data-testid={`round-title-${round.round_id}`}>{round.title}</h3>
	<div class="flex items-center space-x-2 flex-shrink-0">
		{#if round.status === 'scheduled'}
			<!-- Simple calendar icon button -->
			<button
				on:click|stopPropagation={() => { addToCalendar(round); announce('Added to calendar') }}
				on:keydown|stopPropagation={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addToCalendar(round); announce('Added to calendar') } }}
				class="p-1 rounded-md hover:bg-[var(--guild-secondary)]/10 text-[var(--guild-secondary)] transition-colors"
				aria-label="Add round to calendar"
				title="Add to calendar"
				data-testid={`btn-add-calendar-${round.round_id}`}
			>
				<svg class="w-4 h-4" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
				</svg>
			</button>
		{/if}
		{#if showStatus}
			<StatusBadge status={round.status} count={undefined} showCount={false} testid={`status-${round.round_id}`} />
		{/if}
	</div>
</div>
