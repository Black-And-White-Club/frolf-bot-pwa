<script lang="ts">
	export let playerName: string;
	export let score: number;
	export let par: number = 3; // Default par for a hole
	export let holeNumber: number;
	export let testid: string | undefined = undefined;

	$: scoreClass = score < par ? 'text-[var(--guild-primary)]' : score > par ? 'text-[var(--guild-text-secondary)]' : 'text-[var(--guild-text-secondary)]';
	$: scoreText = score === par ? 'E' : score < par ? `-${par - score}` : `+${score - par}`;
</script>

<div class="bg-guild-surface rounded-lg shadow-md p-4 border border-[var(--guild-border)]" data-testid={testid}>
	<div class="flex justify-between items-center">
		<div>
			<h3 class="text-lg font-semibold text-[var(--guild-text)]">{playerName}</h3>
			<p class="text-sm text-[var(--guild-text-secondary)]">Hole {holeNumber}</p>
		</div>
		<div class="text-right">
			<div class="text-2xl font-bold {scoreClass}">{score}</div>
			<div class="text-sm text-[var(--guild-text-secondary)]">({scoreText})</div>
		</div>
	</div>
</div>
