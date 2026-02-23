<script lang="ts">
	import { adminStore } from '$lib/stores/admin.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { roundService } from '$lib/stores/round.svelte';

	const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
	const SUPPORTED_EXTENSIONS = new Set(['csv', 'xlsx']);

	let selectedRoundId = $state('');
	let manualRoundId = $state('');
	let notes = $state('');
	let selectedFile = $state<File | null>(null);
	let selectedFileName = $state('');
	let validationError = $state<string | null>(null);
	let fileInputKey = $state(0);

	const recentRounds = $derived(roundService.recentCompletedRounds);
	const resolvedRoundId = $derived((manualRoundId.trim() || selectedRoundId).trim());

	const selectedRoundEventMessageId = $derived.by(() => {
		if (!resolvedRoundId) {
			return '';
		}
		const round = roundService.rounds.find((entry) => entry.id === resolvedRoundId);
		return round?.eventMessageId ?? '';
	});

	const canSubmit = $derived(
		!adminStore.loading && !!auth.user && !!selectedFile && resolvedRoundId.length > 0
	);

	function resetForm() {
		selectedRoundId = '';
		manualRoundId = '';
		notes = '';
		selectedFile = null;
		selectedFileName = '';
		validationError = null;
		fileInputKey += 1;
	}

	function getExtension(name: string): string {
		const parts = name.toLowerCase().split('.');
		return parts.length > 1 ? parts[parts.length - 1] : '';
	}

	function handleFileInput(event: Event) {
		validationError = null;
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;
		selectedFile = null;
		selectedFileName = '';

		if (!file) {
			return;
		}
		if (file.size === 0) {
			validationError = 'Selected file is empty.';
			return;
		}
		if (file.size > MAX_UPLOAD_BYTES) {
			validationError = 'Selected file exceeds 10MB.';
			return;
		}

		const extension = getExtension(file.name);
		if (!SUPPORTED_EXTENSIONS.has(extension)) {
			validationError = 'Only .csv and .xlsx files are supported.';
			return;
		}

		selectedFile = file;
		selectedFileName = file.name;
	}

	async function handleSubmit() {
		validationError = null;
		if (!auth.user || !selectedFile) {
			return;
		}
		if (!resolvedRoundId) {
			validationError = 'Round ID is required.';
			return;
		}

		await adminStore.uploadScorecard({
			guildId: auth.user.guildId,
			userId: auth.user.id,
			roundId: resolvedRoundId,
			eventMessageId: selectedRoundEventMessageId,
			file: selectedFile,
			notes
		});

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

	<div class="space-y-2">
		<label
			for="admin-scorecard-round"
			class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
		>
			Recent Finalized Rounds
		</label>
		<select
			id="admin-scorecard-round"
			class="w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#007474] focus:outline-none"
			bind:value={selectedRoundId}
			disabled={adminStore.loading}
		>
			<option value="">Select a recent round</option>
			{#each recentRounds as round (round.id)}
				<option value={round.id}>{round.title} ({round.startTime.slice(0, 10)})</option>
			{/each}
		</select>
	</div>

	<div class="space-y-2">
		<label
			for="admin-scorecard-round-id"
			class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
		>
			Or Enter Round ID
		</label>
		<input
			id="admin-scorecard-round-id"
			type="text"
			bind:value={manualRoundId}
			placeholder="UUID (overrides dropdown when set)"
			disabled={adminStore.loading}
			class="w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#007474] focus:outline-none"
		/>
	</div>

	<div class="space-y-2">
		<label
			for="admin-scorecard-file"
			class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
		>
			Scorecard File (.csv or .xlsx)
		</label>
		{#key fileInputKey}
			<input
				id="admin-scorecard-file"
				type="file"
				accept=".csv,.xlsx"
				onchange={handleFileInput}
				disabled={adminStore.loading}
				class="block w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] file:mr-3 file:rounded-md file:border-0 file:bg-[#007474]/20 file:px-3 file:py-1 file:font-['Space_Grotesk'] file:text-xs file:font-semibold file:text-[#007474]"
			/>
		{/key}
		{#if selectedFileName}
			<p class="text-xs text-[var(--guild-text-secondary)]">Selected: {selectedFileName}</p>
		{/if}
	</div>

	<div class="space-y-2">
		<label
			for="admin-scorecard-notes"
			class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
		>
			Notes (optional)
		</label>
		<textarea
			id="admin-scorecard-notes"
			bind:value={notes}
			rows={2}
			disabled={adminStore.loading}
			class="w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#007474] focus:outline-none"
		></textarea>
	</div>

	{#if validationError}
		<p class="text-sm text-red-400">{validationError}</p>
	{/if}

	<div class="flex items-center justify-between border-t border-[#007474]/10 pt-3">
		<p class="font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)]">
			Admin upload overwrites existing round participants with imported rows.
		</p>
		<button
			type="button"
			onclick={handleSubmit}
			disabled={!canSubmit}
			class="bg-liquid-skobeloff rounded-lg px-4 py-2 font-['Space_Grotesk'] text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
		>
			{adminStore.loading ? 'Uploading…' : 'Upload Scorecard'}
		</button>
	</div>
</div>
