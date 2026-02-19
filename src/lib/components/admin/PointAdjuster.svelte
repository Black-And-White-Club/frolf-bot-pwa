<script lang="ts">
	import { tagStore } from '$lib/stores/tags.svelte';
	import { adminStore } from '$lib/stores/admin.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { userProfiles } from '$lib/stores/userProfiles.svelte';

	let selectedMemberId = $state('');
	let deltaStr = $state('');
	let reason = $state('');

	const delta = $derived(parseInt(deltaStr));
	const isValidDelta = $derived(!isNaN(delta) && delta !== 0 && deltaStr !== '');
	const canSubmit = $derived(selectedMemberId !== '' && isValidDelta && reason.trim() !== '' && !adminStore.loading);

	// Sorted list for the select dropdown
	const memberOptions = $derived(
		[...tagStore.tagList].sort((a, b) => {
			const nameA = userProfiles.getDisplayName(a.memberId);
			const nameB = userProfiles.getDisplayName(b.memberId);
			return nameA.localeCompare(nameB);
		})
	);

	function resetForm() {
		selectedMemberId = '';
		deltaStr = '';
		reason = '';
	}

	async function handleSubmit() {
		if (!auth.user || !canSubmit) return;

		const guildId = auth.user.activeClubUuid || auth.user.guildId;
		const adminId = auth.user.id;

		await adminStore.adjustPoints(guildId, adminId, selectedMemberId, delta, reason.trim());

		if (adminStore.successMessage) {
			resetForm();
		}
	}
</script>

<div class="rounded-xl border border-[#007474]/20 bg-[var(--guild-surface)] px-5 py-4 space-y-4">
	<!-- Feedback banners -->
	{#if adminStore.successMessage}
		<div class="rounded-lg border border-[#007474]/40 bg-[#007474]/10 px-4 py-3 text-sm text-[#007474]">
			{adminStore.successMessage}
		</div>
	{/if}
	{#if adminStore.errorMessage}
		<div class="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
			{adminStore.errorMessage}
		</div>
	{/if}

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
		<!-- Player select -->
		<div class="space-y-1.5">
			<label for="point-member" class="font-['Space_Grotesk'] text-xs font-semibold text-[var(--guild-text-secondary)] uppercase tracking-wide">
				Player
			</label>
			{#if tagStore.loading}
				<p class="text-sm text-[var(--guild-text-secondary)]">Loading players…</p>
			{:else}
				<select
					id="point-member"
					bind:value={selectedMemberId}
					disabled={adminStore.loading}
					class="w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:outline-none focus:ring-1 focus:ring-[#007474] disabled:opacity-60"
				>
					<option value="">Select a player…</option>
					{#each memberOptions as m (m.memberId)}
						<option value={m.memberId}>
							{userProfiles.getDisplayName(m.memberId)}{m.currentTag != null ? ` (#${m.currentTag})` : ''}
						</option>
					{/each}
				</select>
			{/if}
		</div>

		<!-- Delta input -->
		<div class="space-y-1.5">
			<label for="point-delta" class="font-['Space_Grotesk'] text-xs font-semibold text-[var(--guild-text-secondary)] uppercase tracking-wide">
				Point Delta
			</label>
			<div class="flex items-center gap-2">
				<!-- Quick toggle buttons -->
				<button
					type="button"
					onclick={() => { if (deltaStr && !isNaN(parseInt(deltaStr))) deltaStr = String(-Math.abs(parseInt(deltaStr))); }}
					class="rounded-lg border border-[#007474]/30 px-3 py-2 font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)] hover:text-[var(--guild-text)] transition-colors"
					title="Make negative"
				>−</button>
				<input
					id="point-delta"
					type="number"
					placeholder="e.g. 10 or -5"
					bind:value={deltaStr}
					disabled={adminStore.loading}
					class="flex-1 rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:outline-none focus:ring-1 focus:ring-[#007474] disabled:opacity-60"
				/>
				<button
					type="button"
					onclick={() => { if (deltaStr && !isNaN(parseInt(deltaStr))) deltaStr = String(Math.abs(parseInt(deltaStr))); }}
					class="rounded-lg border border-[#007474]/30 px-3 py-2 font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)] hover:text-[var(--guild-text)] transition-colors"
					title="Make positive"
				>+</button>
			</div>
			{#if deltaStr && isNaN(parseInt(deltaStr))}
				<p class="text-xs text-red-400">Enter a valid integer (e.g. 10 or -5)</p>
			{:else if deltaStr === '0' || delta === 0}
				<p class="text-xs text-red-400">Delta cannot be zero</p>
			{/if}
		</div>

		<!-- Reason field -->
		<div class="space-y-1.5">
			<label for="point-reason" class="font-['Space_Grotesk'] text-xs font-semibold text-[var(--guild-text-secondary)] uppercase tracking-wide">
				Reason <span class="text-red-400">*</span>
			</label>
			<input
				id="point-reason"
				type="text"
				placeholder="Brief reason for adjustment…"
				bind:value={reason}
				disabled={adminStore.loading}
				maxlength="255"
				required
				class="w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:outline-none focus:ring-1 focus:ring-[#007474] disabled:opacity-60"
			/>
		</div>

		<!-- Preview -->
		{#if selectedMemberId && isValidDelta}
			<div class="rounded-lg border border-[#007474]/15 bg-[#007474]/5 px-3 py-2 text-xs text-[var(--guild-text-secondary)]">
				<span class="font-medium text-[var(--guild-text)]">{userProfiles.getDisplayName(selectedMemberId)}</span>
				will receive
				<span class="font-mono font-medium {delta > 0 ? 'text-[#007474]' : 'text-red-400'}">
					{delta > 0 ? '+' : ''}{delta}
				</span>
				points
			</div>
		{/if}

		<!-- Submit -->
		<div class="flex justify-end gap-2 border-t border-[#007474]/10 pt-3">
			<button
				type="button"
				onclick={resetForm}
				disabled={adminStore.loading}
				class="rounded-lg border border-[#007474]/30 px-3 py-1.5 font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)] hover:text-[var(--guild-text)] transition-colors disabled:opacity-40"
			>
				Reset
			</button>
			<button
				type="submit"
				disabled={!canSubmit}
				class="rounded-lg bg-liquid-skobeloff px-4 py-2 font-['Space_Grotesk'] text-sm font-medium text-white hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
			>
				{adminStore.loading ? 'Adjusting…' : 'Adjust Points'}
			</button>
		</div>
	</form>
</div>
