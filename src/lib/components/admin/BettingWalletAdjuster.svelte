<script lang="ts">
	import { adminStore } from '$lib/stores/admin.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { tagStore } from '$lib/stores/tags.svelte';
	import { userProfiles } from '$lib/stores/userProfiles.svelte';

	let selectedMemberId = $state('');
	let amountStr = $state('');
	let reason = $state('');
	let validationError = $state<string | null>(null);

	const amount = $derived(parseInt(amountStr));
	const isValidAmount = $derived(!isNaN(amount) && amount !== 0 && amountStr !== '');
	const clubUuid = $derived(auth.user?.activeClubUuid ?? null);
	const bettingAccess = $derived(auth.bettingAccess);
	const canSubmit = $derived(
		selectedMemberId !== '' &&
			isValidAmount &&
			reason.trim() !== '' &&
			!!clubUuid &&
			bettingAccess.state !== 'disabled' &&
			!adminStore.loading
	);
	const memberOptions = $derived(
		[...tagStore.tagList].sort((a, b) => {
			const nameA = userProfiles.getDisplayName(a.memberId);
			const nameB = userProfiles.getDisplayName(b.memberId);
			return nameA.localeCompare(nameB);
		})
	);

	function resetForm() {
		selectedMemberId = '';
		amountStr = '';
		reason = '';
		validationError = null;
	}

	async function handleSubmit() {
		validationError = null;

		if (!clubUuid) {
			validationError = 'Active club UUID is missing.';
			return;
		}

		if (bettingAccess.state === 'disabled') {
			validationError = 'Betting is not enabled for this club.';
			return;
		}

		if (!canSubmit) return;

		await adminStore.adjustBettingWallet(clubUuid, selectedMemberId, amount, reason.trim());

		if (adminStore.successMessage) {
			resetForm();
		}
	}
</script>

<div class="space-y-4 rounded-xl border border-[#B89B5E]/20 bg-[var(--guild-surface)] px-5 py-4">
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

	<div
		class="rounded-lg border border-[#B89B5E]/20 bg-[#B89B5E]/5 px-3 py-2 text-xs text-[var(--guild-text-secondary)]"
	>
		{#if bettingAccess.state === 'frozen'}
			Betting is frozen for members, but admin cleanup and wallet corrections remain available.
		{:else}
			These adjustments affect the separate seasonal betting wallet only. Leaderboard standings stay
			unchanged.
		{/if}
	</div>

	<form
		onsubmit={(event) => {
			event.preventDefault();
			handleSubmit();
		}}
		class="space-y-4"
	>
		<div class="space-y-1.5">
			<label
				for="betting-wallet-member"
				class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				Player
			</label>
			{#if tagStore.loading}
				<p class="text-sm text-[var(--guild-text-secondary)]">Loading players…</p>
			{:else}
				<select
					id="betting-wallet-member"
					bind:value={selectedMemberId}
					disabled={adminStore.loading}
					class="w-full rounded-lg border border-[#B89B5E]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#B89B5E] focus:outline-none disabled:opacity-60"
				>
					<option value="">Select a player…</option>
					{#each memberOptions as member (member.memberId)}
						<option value={member.memberId}>
							{userProfiles.getDisplayName(member.memberId)}{member.currentTag != null
								? ` (#${member.currentTag})`
								: ''}
						</option>
					{/each}
				</select>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label
				for="betting-wallet-amount"
				class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				Wallet Delta
			</label>
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={() => {
						if (amountStr && !isNaN(parseInt(amountStr))) {
							amountStr = String(-Math.abs(parseInt(amountStr)));
						}
					}}
					class="rounded-lg border border-[#B89B5E]/30 px-3 py-2 font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)] transition-colors hover:text-[var(--guild-text)]"
					title="Make negative">−</button
				>
				<input
					id="betting-wallet-amount"
					type="number"
					placeholder="e.g. 50 or -20"
					bind:value={amountStr}
					disabled={adminStore.loading}
					class="flex-1 rounded-lg border border-[#B89B5E]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#B89B5E] focus:outline-none disabled:opacity-60"
				/>
				<button
					type="button"
					onclick={() => {
						if (amountStr && !isNaN(parseInt(amountStr))) {
							amountStr = String(Math.abs(parseInt(amountStr)));
						}
					}}
					class="rounded-lg border border-[#B89B5E]/30 px-3 py-2 font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)] transition-colors hover:text-[var(--guild-text)]"
					title="Make positive">+</button
				>
			</div>
			{#if amountStr && isNaN(parseInt(amountStr))}
				<p class="text-xs text-red-400">Enter a valid integer (e.g. 50 or -20)</p>
			{:else if amountStr === '0' || amount === 0}
				<p class="text-xs text-red-400">Delta cannot be zero</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label
				for="betting-wallet-reason"
				class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				Reason <span class="text-red-400">*</span>
			</label>
			<input
				id="betting-wallet-reason"
				type="text"
				placeholder="Reason for the betting wallet change…"
				bind:value={reason}
				disabled={adminStore.loading}
				maxlength="255"
				required
				class="w-full rounded-lg border border-[#B89B5E]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#B89B5E] focus:outline-none disabled:opacity-60"
			/>
		</div>

		{#if selectedMemberId && isValidAmount}
			<div
				class="rounded-lg border border-[#B89B5E]/15 bg-[#B89B5E]/5 px-3 py-2 text-xs text-[var(--guild-text-secondary)]"
			>
				<span class="font-medium text-[var(--guild-text)]">
					{userProfiles.getDisplayName(selectedMemberId)}
				</span>
				will receive a betting-wallet adjustment of
				<span class="font-mono font-medium {amount > 0 ? 'text-[#B89B5E]' : 'text-red-400'}">
					{amount > 0 ? '+' : ''}{amount}
				</span>
				points
			</div>
		{/if}

		<div class="flex justify-end gap-2 border-t border-[#B89B5E]/10 pt-3">
			<button
				type="button"
				onclick={resetForm}
				disabled={adminStore.loading}
				class="rounded-lg border border-[#B89B5E]/30 px-3 py-1.5 font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)] transition-colors hover:text-[var(--guild-text)] disabled:opacity-40"
			>
				Reset
			</button>
			<button
				type="submit"
				disabled={!canSubmit}
				class="rounded-lg bg-[#B89B5E] px-4 py-2 font-['Space_Grotesk'] text-sm font-medium text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
			>
				{adminStore.loading ? 'Adjusting…' : 'Adjust Betting Wallet'}
			</button>
		</div>
	</form>
</div>
