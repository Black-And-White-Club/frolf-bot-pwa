<script lang="ts">
	import type { Round } from '$lib/types/backend';

	export let round: Round;
	export let compact: boolean = false;
	export let testid: string | undefined = undefined;
	export let showDescription: boolean = true;
	export let showLocation: boolean = true;

	// Accept explicit fields when callers prefer to control what the component renders
	export let description: string | undefined = undefined;
	export let location: string | undefined = undefined;
	export let start_time: string | undefined = undefined;

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
	<div data-testid={testid}>
		{#if showDescription && localDescription()}
			<!-- Limit description line length so it doesn't stretch the entire card on wide screens -->
			<p
				class="mb-1 line-clamp-2 max-w-[55ch] text-left text-sm text-[var(--guild-text-secondary)] md:max-w-[48ch]"
			>
				{localDescription()}
			</p>
		{/if}

		{#if showLocation && localLocation()}
			<p class="mb-1 flex items-center text-sm text-[var(--guild-text-secondary)]">
				<svg
					class="mr-2 h-4 w-4 flex-shrink-0"
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
				<span class="min-w-0 flex-1 truncate">{localLocation()}</span>
			</p>
		{/if}
	</div>
{/if}

<p class="mb-1 flex items-center text-sm text-[var(--guild-text-secondary)]">
	<svg class="mr-1 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
		></path>
	</svg>
	{formatLocalStart()}
</p>
