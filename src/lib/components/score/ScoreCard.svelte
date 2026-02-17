<script lang="ts">
	type Props = {
		playerName: string;
		score: number;
		par?: number;
		holeNumber: number;
		testid?: string;
	};

	let { playerName, score, par = 3, holeNumber, testid }: Props = $props();

	let scoreClass = $derived(
		score < par
			? 'text-[var(--guild-primary)]'
			: score > par
				? 'text-[var(--guild-text-secondary)]'
				: 'text-[var(--guild-text-secondary)]'
	);
	let scoreText = $derived(
		score === par ? 'E' : score < par ? `-${par - score}` : `+${score - par}`
	);
</script>

<div
	class="bg-guild-surface group relative overflow-hidden rounded-lg border border-[var(--guild-border)] p-4 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
	data-testid={testid}
>
	<!-- Subtle success pattern for under par -->
	{#if score < par}
		<div
			class="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,var(--guild-primary)_8px,var(--guild-primary)_9px)] opacity-[0.03] transition-opacity duration-300 group-hover:opacity-[0.06]"
		></div>
	{/if}
	<div class="flex items-center justify-between">
		<div>
			<h3 class="font-secondary text-lg font-semibold text-[var(--guild-text)]">{playerName}</h3>
			<p class="text-sm text-[var(--guild-text-secondary)]">Hole {holeNumber}</p>
		</div>
		<div class="text-right">
			{#key score}
				<div
					class="text-2xl font-bold {scoreClass} font-secondary animate-scale-pulse inline-block"
				>
					{score}
				</div>
			{/key}
			<div class="text-sm text-[var(--guild-text-secondary)]">({scoreText})</div>
		</div>
	</div>
</div>
