<script lang="ts">
	import { adminStore } from '$lib/stores/admin.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { roundService } from '$lib/stores/round.svelte';
	import { resolveRequestIdentity } from '$lib/utils/requestIdentity';

	let selectedRoundId = $state('');
	let manualRoundId = $state('');
	let validationError = $state<string | null>(null);

	const recentRounds = $derived(roundService.recentCompletedRounds);
	const resolvedRoundId = $derived((manualRoundId.trim() || selectedRoundId).trim());

	const selectedRound = $derived(
		recentRounds.find((r) => r.id === resolvedRoundId) ?? null
	);

	const canSubmit = $derived(resolvedRoundId.length > 0 && !adminStore.loading && !!auth.user);

	function resetForm() {
		selectedRoundId = '';
		manualRoundId = '';
		validationError = null;
	}

	async function handleSubmit() {
		validationError = null;

		if (!auth.user) return;

		const identity = resolveRequestIdentity(auth.user);
		if (!identity?.guildId) {
			validationError = 'Discord guild identity is missing.';
			return;
		}
		if (!resolvedRoundId) {
			validationError = 'Select or enter a round.';
			return;
		}

		await adminStore.republishRoundEmbed(identity.guildId, auth.user.id, resolvedRoundId);

		if (adminStore.successMessage) {
			resetForm();
		}
	}

	async function handleRecalculate() {
		validationError = null;

		if (!auth.user) return;

		const identity = resolveRequestIdentity(auth.user);
		if (!identity?.guildId) {
			validationError = 'Discord guild identity is missing.';
			return;
		}
		if (!resolvedRoundId) {
			validationError = 'Select or enter a round.';
			return;
		}

		await adminStore.recalculateRound(identity.guildId, resolvedRoundId);

		if (adminStore.successMessage) {
			resetForm();
		}
	}
</script>

<div class="space-y-4 rounded-xl border border-[#007474]/20 bg-[var(--guild-surface)] px-5 py-4">
	{#if adminStore.successMessage}
		<div
			class="rounded-lg border border-[#007474]/40 bg-[#007474]/10 px-4 py-3 text-sm text-[#007474]"
		>
			{adminStore.successMessage}
		</div>
	{/if}
	{#if adminStore.errorMessage}
		<div class="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
			{adminStore.errorMessage}
		</div>
	{/if}
	{#if validationError}
		<div class="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
			{validationError}
		</div>
	{/if}

	<!-- Round dropdown -->
	<div class="space-y-1.5">
		<label
			for="republish-round"
			class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
		>
			Finalized Round
		</label>
		<select
			id="republish-round"
			bind:value={selectedRoundId}
			disabled={adminStore.loading}
			class="w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#007474] focus:outline-none disabled:opacity-60"
		>
			<option value="">Select a recent round…</option>
			{#each recentRounds as round (round.id)}
				<option value={round.id}>{round.title} ({round.startTime.slice(0, 10)})</option>
			{/each}
		</select>
	</div>

	<!-- Manual round ID -->
	<div class="space-y-1.5">
		<label
			for="republish-round-id"
			class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
		>
			Or Enter Round ID
		</label>
		<input
			id="republish-round-id"
			type="text"
			placeholder="UUID (overrides dropdown when set)"
			bind:value={manualRoundId}
			disabled={adminStore.loading}
			class="w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#007474] focus:outline-none disabled:opacity-60"
		/>
	</div>

	{#if selectedRound}
		<div
			class="rounded-lg border border-[#007474]/15 bg-[#007474]/5 px-3 py-2 text-xs text-[var(--guild-text-secondary)]"
		>
			<span class="font-medium text-[var(--guild-text)]">{selectedRound.title}</span>
			— {selectedRound.startTime.slice(0, 10)}
		</div>
	{/if}

	<div class="flex items-center justify-end gap-2 border-t border-[#007474]/10 pt-3">
		<button
			type="button"
			onclick={handleRecalculate}
			disabled={!canSubmit}
			class="rounded-lg border border-[#007474]/40 px-4 py-2 font-['Space_Grotesk'] text-sm font-medium text-[#007474] transition-all hover:bg-[#007474]/10 disabled:cursor-not-allowed disabled:opacity-40"
		>
			{adminStore.loading ? 'Recalculating…' : 'Recalculate Points'}
		</button>
		<button
			type="button"
			onclick={handleSubmit}
			disabled={!canSubmit}
			class="bg-liquid-skobeloff rounded-lg px-4 py-2 font-['Space_Grotesk'] text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
		>
			{adminStore.loading ? 'Publishing…' : 'Republish Embed'}
		</button>
	</div>
</div>
