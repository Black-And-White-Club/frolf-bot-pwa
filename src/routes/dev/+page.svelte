<script lang="ts">
	import TagHistoryChart from '$lib/components/leaderboard/TagHistoryChart.svelte';
	import type { TagHistoryEntry } from '$lib/stores/tags.svelte';

	const ME = 'user-123';

	function entry(id: number, tagNumber: number, daysAgo: number): TagHistoryEntry {
		const d = new Date();
		d.setDate(d.getDate() - daysAgo);
		return {
			id,
			tagNumber,
			newMemberId: ME,
			oldMemberId: 'user-other',
			reason: 'round_swap',
			createdAt: d.toISOString()
		};
	}

	const improving: TagHistoryEntry[] = [
		entry(1, 47, 90),
		entry(2, 38, 70),
		entry(3, 42, 55),
		entry(4, 31, 40),
		entry(5, 27, 28),
		entry(6, 22, 14),
		entry(7, 18, 5)
	];

	const volatile_: TagHistoryEntry[] = [
		entry(1, 20, 60),
		entry(2, 35, 50),
		entry(3, 12, 40),
		entry(4, 44, 30),
		entry(5, 8, 20),
		entry(6, 29, 10),
		entry(7, 15, 2)
	];

	const minimal: TagHistoryEntry[] = [entry(1, 33, 14), entry(2, 21, 1)];

	const scenarios: { label: string; data: TagHistoryEntry[] }[] = [
		{ label: 'Improving', data: improving },
		{ label: 'Volatile', data: volatile_ },
		{ label: 'Minimal (2 pts)', data: minimal },
		{ label: 'Empty', data: [] }
	];
</script>

<div class="dev-page">
	<h1>Component Preview</h1>

	<section>
		<h2>TagHistoryChart</h2>
		<div class="grid">
			{#each scenarios as s (s.label)}
				<div class="card">
					<p class="label">{s.label}</p>
					<TagHistoryChart history={s.data} memberId={ME} />
				</div>
			{/each}
		</div>
	</section>
</div>

<style>
	.dev-page {
		padding: 2rem;
		max-width: 900px;
		margin: 0 auto;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--guild-text);
		margin-bottom: 2rem;
	}

	h2 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--guild-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 1rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
		gap: 1rem;
	}

	.card {
		background: var(--guild-surface-elevated, #142020);
		border: 1px solid var(--guild-border);
		border-radius: 0.75rem;
		padding: 1rem;
	}

	.label {
		font-size: 0.75rem;
		color: var(--guild-text-secondary);
		margin-bottom: 0.5rem;
		font-weight: 600;
	}
</style>
