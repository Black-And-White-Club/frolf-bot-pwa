<script lang="ts">
	import { adminStore, type AdminBackfillCheckResult } from '$lib/stores/admin.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
	const SUPPORTED_EXTENSIONS = new Set(['csv', 'xlsx']);

	let title = $state('');
	let location = $state('');
	let dateValue = $state(''); // datetime-local input value (local time)
	let mode = $state('SINGLES');
	let selectedFile = $state<File | null>(null);
	let selectedFileName = $state('');
	let notes = $state('');
	let validationError = $state<string | null>(null);
	let fileInputKey = $state(0);

	let checkResult = $state<AdminBackfillCheckResult | null>(null);
	let checkLoading = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	const canSubmit = $derived(
		!adminStore.loading &&
			!!auth.user &&
			!!selectedFile &&
			title.trim().length > 0 &&
			location.trim().length > 0 &&
			dateValue.length > 0
	);

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

		if (!file) return;
		if (file.size === 0) {
			validationError = 'Selected file is empty.';
			return;
		}
		if (file.size > MAX_UPLOAD_BYTES) {
			validationError = 'Selected file exceeds 10MB.';
			return;
		}
		if (!SUPPORTED_EXTENSIONS.has(getExtension(file.name))) {
			validationError = 'Only .csv and .xlsx files are supported.';
			return;
		}

		selectedFile = file;
		selectedFileName = file.name;
	}

	async function runBackfillCheck() {
		if (!auth.user || !dateValue) {
			checkResult = null;
			return;
		}
		checkLoading = true;
		try {
			const dt = new Date(dateValue);
			if (isNaN(dt.getTime())) return;
			const guildId = auth.user.activeClubUuid || auth.user.guildId;
			checkResult = await adminStore.backfillCheck(guildId, auth.user.id, dt);
		} finally {
			checkLoading = false;
		}
	}

	function handleDateChange() {
		checkResult = null;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(runBackfillCheck, 600);
	}

	function resetForm() {
		title = '';
		location = '';
		dateValue = '';
		mode = 'SINGLES';
		selectedFile = null;
		selectedFileName = '';
		notes = '';
		validationError = null;
		checkResult = null;
		fileInputKey += 1;
	}

	async function handleSubmit() {
		validationError = null;
		if (!auth.user || !selectedFile) return;
		if (!title.trim() || !location.trim() || !dateValue) {
			validationError = 'Title, location, and date are required.';
			return;
		}

		const dt = new Date(dateValue);
		if (isNaN(dt.getTime())) {
			validationError = 'Invalid date.';
			return;
		}
		if (dt >= new Date()) {
			validationError = 'Backfill date must be in the past.';
			return;
		}

		const guildId = auth.user.activeClubUuid || auth.user.guildId;

		await adminStore.backfillRound({
			guildId,
			adminId: auth.user.id,
			title: title.trim(),
			location: location.trim(),
			startTime: dt,
			mode,
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

	<!-- Warning: subsequent finalized rounds -->
	{#if checkResult && checkResult.subsequent_round_count > 0}
		<div
			class="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-400"
		>
			<strong>Tag ordering warning:</strong>
			{checkResult.subsequent_round_count} round{checkResult.subsequent_round_count !== 1
				? 's were'
				: ' was'} finalized after this date ({checkResult.round_titles.join(', ')}). Tag numbers for
			those rounds may not reflect the backfill round. You can still proceed.
		</div>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2">
		<div class="space-y-2">
			<label
				for="backfill-title"
				class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				Round Title
			</label>
			<input
				id="backfill-title"
				type="text"
				bind:value={title}
				placeholder="e.g. Sprinkle Valley Round 3"
				disabled={adminStore.loading}
				class="w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#007474] focus:outline-none"
			/>
		</div>

		<div class="space-y-2">
			<label
				for="backfill-location"
				class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				Location
			</label>
			<input
				id="backfill-location"
				type="text"
				bind:value={location}
				placeholder="e.g. Sprinkle Valley DGC"
				disabled={adminStore.loading}
				class="w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#007474] focus:outline-none"
			/>
		</div>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		<div class="space-y-2">
			<label
				for="backfill-date"
				class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				Round Date &amp; Time (past only)
			</label>
			<input
				id="backfill-date"
				type="datetime-local"
				bind:value={dateValue}
				max={new Date().toISOString().slice(0, 16)}
				oninput={handleDateChange}
				onblur={handleDateChange}
				disabled={adminStore.loading}
				class="w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#007474] focus:outline-none"
			/>
			{#if checkLoading}
				<p class="text-xs text-[var(--guild-text-secondary)]">Checking for subsequent rounds…</p>
			{/if}
		</div>

		<div class="space-y-2">
			<label
				for="backfill-mode"
				class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				Mode
			</label>
			<select
				id="backfill-mode"
				bind:value={mode}
				disabled={adminStore.loading}
				class="w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#007474] focus:outline-none"
			>
				<option value="SINGLES">Singles</option>
				<option value="DOUBLES">Doubles</option>
			</select>
		</div>
	</div>

	<div class="space-y-2">
		<label
			for="backfill-file"
			class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
		>
			Scorecard File (.csv or .xlsx)
		</label>
		{#key fileInputKey}
			<input
				id="backfill-file"
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
			for="backfill-notes"
			class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
		>
			Notes (optional)
		</label>
		<textarea
			id="backfill-notes"
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
			Creates a historical round and runs the import pipeline. A Discord embed will be posted as a
			new message.
		</p>
		<button
			type="button"
			onclick={handleSubmit}
			disabled={!canSubmit}
			class="bg-liquid-skobeloff rounded-lg px-4 py-2 font-['Space_Grotesk'] text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
		>
			{adminStore.loading ? 'Submitting…' : 'Submit Backfill Round'}
		</button>
	</div>
</div>
