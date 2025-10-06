<script lang="ts">
	import type { Round } from '$lib/types/backend';
	import { addToCalendar } from '$lib/utils/calendar';
	import StatusBadge from '../StatusBadge.svelte';
	import { announce } from '$lib/stores/announcer';

	export let round: Round;
	export let showStatus: boolean = true;
	export let testid: string | undefined = undefined;
</script>

<div class="round-header" data-testid={testid}>
	<h3
		class="min-w-0 truncate pr-1 text-lg font-semibold text-[var(--guild-text)] sm:pr-1"
		data-testid={`round-title-${round.round_id}`}
	>
		{round.title}
	</h3>

	<div class="round-header__controls">
		{#if round.status === 'scheduled'}
			<!-- Simple calendar icon button -->
			<button
				on:click|stopPropagation={() => {
					addToCalendar(round);
					announce('Added to calendar');
				}}
				on:keydown|stopPropagation={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						addToCalendar(round);
						announce('Added to calendar');
					}
				}}
				class="rounded-md p-1 text-[var(--guild-secondary)] transition-colors hover:bg-[var(--guild-secondary)]/10"
				aria-label="Add round to calendar"
				title="Add to calendar"
				data-testid={`btn-add-calendar-${round.round_id}`}
			>
				<svg
					class="h-4 w-4"
					aria-hidden="true"
					focusable="false"
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
			</button>
		{/if}
		{#if showStatus}
			<StatusBadge
				status={round.status}
				count={undefined}
				showCount={false}
				testid={`status-${round.round_id}`}
			/>
		{/if}
	</div>
</div>

<style>
	.round-header {
		display: grid;
		/* Two-column layout so the controls column is fixed and badges align across cards. */
		grid-template-columns: 1fr var(--round-header-controls, 8rem);
		gap: 0.5rem;
		align-items: center;
	}

	.round-header__controls {
		display: flex;
		/* Fixed-width control column so badges line up across cards even when
       controls wrap on small screens. */
		width: var(--round-header-controls, 8rem);
		justify-content: flex-end;
		justify-self: end;
		gap: 0.5rem;
		overflow: hidden;
	}

	/* Keep controls right-aligned on larger screens as well. */
	@media (min-width: 640px) {
		.round-header {
			grid-template-columns: 1fr var(--round-header-controls, 8rem);
		}
		.round-header__controls {
			justify-self: end;
		}
	}
</style>
