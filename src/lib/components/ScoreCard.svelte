<script lang="ts">
	export let playerName: string;
	export let score: number;
	export let par: number = 3; // Default par for a hole
	export let holeNumber: number;
	export let testid: string | undefined = undefined;

	$: scoreClass =
		score < par
			? 'text-[var(--guild-primary)]'
			: score > par
				? 'text-[var(--guild-text-secondary)]'
				: 'text-[var(--guild-text-secondary)]';
	$: scoreText = score === par ? 'E' : score < par ? `-${par - score}` : `+${score - par}`;
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
			<div class="text-2xl font-bold {scoreClass} font-secondary">{score}</div>
			<div class="text-sm text-[var(--guild-text-secondary)]">({scoreText})</div>
		</div>
	</div>
</div>
