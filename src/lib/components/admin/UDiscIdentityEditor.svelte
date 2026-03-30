<script lang="ts">
	import { tagStore } from '$lib/stores/tags.svelte';
	import { adminStore } from '$lib/stores/admin.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { userProfiles } from '$lib/stores/userProfiles.svelte';
	import { resolveRequestIdentity } from '$lib/utils/requestIdentity';

	let selectedUserId = $state('');
	let manualUserId = $state('');
	let udiscUsername = $state('');
	let udiscName = $state('');
	let validationError = $state<string | null>(null);

	const identity = $derived(resolveRequestIdentity(auth.user));
	const guildId = $derived(identity?.guildId ?? null);

	const targetUserId = $derived((manualUserId.trim() || selectedUserId).trim());

	const memberOptions = $derived(
		[...tagStore.tagList].sort((a, b) => {
			const nameA = userProfiles.getDisplayName(a.memberId);
			const nameB = userProfiles.getDisplayName(b.memberId);
			return nameA.localeCompare(nameB);
		})
	);

	const hasAtLeastOneField = $derived(
		udiscUsername.trim().length > 0 || udiscName.trim().length > 0
	);

	const canSubmit = $derived(
		targetUserId.length > 0 &&
			hasAtLeastOneField &&
			!adminStore.loading &&
			!!guildId
	);

	function resetForm() {
		selectedUserId = '';
		manualUserId = '';
		udiscUsername = '';
		udiscName = '';
		validationError = null;
	}

	async function handleSubmit() {
		validationError = null;

		if (!guildId) {
			validationError = 'Club or Discord guild identity is missing.';
			return;
		}
		if (!targetUserId) {
			validationError = 'Select or enter a target user.';
			return;
		}
		if (!hasAtLeastOneField) {
			validationError = 'Enter at least one of UDisc Username or UDisc Display Name.';
			return;
		}

		const username = udiscUsername.trim() || undefined;
		const name = udiscName.trim() || undefined;

		await adminStore.updateUDiscIdentity(guildId, targetUserId, username, name);

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

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
		class="space-y-4"
	>
		<!-- Player select -->
		<div class="space-y-1.5">
			<label
				for="udisc-user"
				class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				Player
			</label>
			{#if tagStore.loading}
				<p class="text-sm text-[var(--guild-text-secondary)]">Loading players…</p>
			{:else}
				<select
					id="udisc-user"
					bind:value={selectedUserId}
					disabled={adminStore.loading}
					class="w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#007474] focus:outline-none disabled:opacity-60"
				>
					<option value="">Select a player…</option>
					{#each memberOptions as m (m.memberId)}
						<option value={m.memberId}>
							{userProfiles.getDisplayName(m.memberId)}{m.currentTag != null
								? ` (#${m.currentTag})`
								: ''}
						</option>
					{/each}
				</select>
			{/if}
		</div>

		<!-- Manual Discord ID -->
		<div class="space-y-1.5">
			<label
				for="udisc-manual-id"
				class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				Or Enter Discord ID
			</label>
			<input
				id="udisc-manual-id"
				type="text"
				placeholder="Discord user ID (overrides dropdown)"
				bind:value={manualUserId}
				disabled={adminStore.loading}
				class="w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#007474] focus:outline-none disabled:opacity-60"
			/>
		</div>

		<!-- UDisc Username -->
		<div class="space-y-1.5">
			<label
				for="udisc-username"
				class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				UDisc Username
			</label>
			<input
				id="udisc-username"
				type="text"
				placeholder="e.g. standstillpower"
				bind:value={udiscUsername}
				disabled={adminStore.loading}
				class="w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#007474] focus:outline-none disabled:opacity-60"
			/>
		</div>

		<!-- UDisc Display Name -->
		<div class="space-y-1.5">
			<label
				for="udisc-name"
				class="font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				UDisc Display Name
			</label>
			<input
				id="udisc-name"
				type="text"
				placeholder="e.g. Kevin Kunkel"
				bind:value={udiscName}
				disabled={adminStore.loading}
				class="w-full rounded-lg border border-[#007474]/30 bg-[var(--guild-surface-elevated)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#007474] focus:outline-none disabled:opacity-60"
			/>
		</div>

		<p class="font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)]">
			At least one of Username or Display Name is required.
		</p>

		<!-- Submit -->
		<div class="flex justify-end gap-2 border-t border-[#007474]/10 pt-3">
			<button
				type="button"
				onclick={resetForm}
				disabled={adminStore.loading}
				class="rounded-lg border border-[#007474]/30 px-3 py-1.5 font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)] transition-colors hover:text-[var(--guild-text)] disabled:opacity-40"
			>
				Reset
			</button>
			<button
				type="submit"
				disabled={!canSubmit}
				class="bg-liquid-skobeloff rounded-lg px-4 py-2 font-['Space_Grotesk'] text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
			>
				{adminStore.loading ? 'Saving…' : 'Save UDisc Identity'}
			</button>
		</div>
	</form>
</div>
