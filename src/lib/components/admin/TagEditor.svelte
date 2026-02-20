<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { tagStore } from '$lib/stores/tags.svelte';
	import { adminStore } from '$lib/stores/admin.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { userProfiles } from '$lib/stores/userProfiles.svelte';

	interface EditState {
		newTagStr: string;
		removing: boolean;
	}

	// User edits stored separately from derived data so rows can be $derived
	const edits = new SvelteMap<string, EditState>();

	// Derived rows from tagList + edits overlay
	const rows = $derived(
		[...tagStore.tagList]
			.sort((a, b) => (a.currentTag ?? 9999) - (b.currentTag ?? 9999))
			.map((m) => {
				const edit = edits.get(m.memberId) ?? { newTagStr: '', removing: false };
				return { memberId: m.memberId, currentTag: m.currentTag, ...edit };
			})
	);

	// Per-row conflict errors (keyed by memberId)
	const conflicts = $derived.by(() => {
		const errors = new SvelteMap<string, string>();
		const targetTags = new SvelteMap<number, string>(); // tagNumber → memberId

		// Pass 1: detect duplicate target tags within the form
		for (const row of rows) {
			if (row.removing) continue;
			const val = parseInt(row.newTagStr);
			if (!row.newTagStr || isNaN(val) || val <= 0) continue;

			if (targetTags.has(val)) {
				const otherId = targetTags.get(val)!;
				errors.set(row.memberId, `#${val} is already assigned to another row`);
				errors.set(otherId, `#${val} is already assigned to another row`);
			} else {
				targetTags.set(val, row.memberId);
			}
		}

		// Pass 2: detect conflicts with unchanged players
		for (const row of rows) {
			if (row.removing) continue;
			const val = parseInt(row.newTagStr);
			if (!row.newTagStr || isNaN(val) || val <= 0) continue;
			if (errors.has(row.memberId)) continue;

			// A conflict exists if another player holds this tag AND is not being reassigned
			const blocker = rows.find(
				(other) =>
					other.memberId !== row.memberId &&
					other.currentTag === val &&
					!other.removing &&
					!other.newTagStr
			);
			if (blocker) {
				const blockerName = userProfiles.getDisplayName(blocker.memberId);
				errors.set(
					row.memberId,
					`#${val} is currently held by ${blockerName} (reassign or remove them in this batch)`
				);
			}
		}

		return errors;
	});

	const hasConflicts = $derived(conflicts.size > 0);

	const changedCount = $derived(
		rows.filter((r) => r.removing || (r.newTagStr !== '' && !isNaN(parseInt(r.newTagStr)))).length
	);

	function setNewTag(memberId: string, value: string) {
		const current = edits.get(memberId) ?? { newTagStr: '', removing: false };
		edits.set(memberId, { ...current, newTagStr: value });
	}

	function handleRemove(memberId: string) {
		const row = rows.find((r) => r.memberId === memberId);
		if (!row) return;
		if (row.removing) {
			edits.delete(memberId);
		} else {
			edits.set(memberId, { newTagStr: '', removing: true });
		}
	}

	function resetForm() {
		edits.clear();
	}

	async function handleSubmit() {
		if (!auth.user || hasConflicts || changedCount === 0) return;

		const guildId = auth.user.guildId;
		const adminId = auth.user.id;

		const assignments = rows
			.filter((r) => r.removing || (r.newTagStr !== '' && !isNaN(parseInt(r.newTagStr))))
			.map((r) => ({
				userId: r.memberId,
				tagNumber: r.removing ? 0 : parseInt(r.newTagStr)
			}));

		await adminStore.submitTagAssignments(guildId, adminId, assignments);

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

	{#if tagStore.loading}
		<p class="text-sm text-[var(--guild-text-secondary)]">Loading players…</p>
	{:else if tagStore.error}
		<p class="text-sm text-red-400">{tagStore.error}</p>
	{:else if rows.length === 0}
		<p class="text-sm text-[var(--guild-text-secondary)]">No players found.</p>
	{:else}
		<!-- Editable tag table -->
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-[#007474]/10">
						<th class="pb-2 text-left font-['Space_Grotesk'] text-xs font-semibold text-[var(--guild-text-secondary)] uppercase tracking-wide">
							Player
						</th>
						<th class="pb-2 text-center font-['Space_Grotesk'] text-xs font-semibold text-[var(--guild-text-secondary)] uppercase tracking-wide">
							Current
						</th>
						<th class="pb-2 text-center font-['Space_Grotesk'] text-xs font-semibold text-[var(--guild-text-secondary)] uppercase tracking-wide">
							New Tag
						</th>
						<th class="pb-2 text-right font-['Space_Grotesk'] text-xs font-semibold text-[var(--guild-text-secondary)] uppercase tracking-wide">
							Action
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[#007474]/5">
					{#each rows as row (row.memberId)}
						{@const conflict = conflicts.get(row.memberId)}
						<tr>
							<!-- Player -->
							<td class="py-2 pr-2">
								<div class="flex items-center gap-2">
									<img
										src={userProfiles.getAvatarUrl(row.memberId, 32)}
										alt=""
										class="h-7 w-7 rounded-full"
										loading="lazy"
									/>
									<span class="text-[var(--guild-text)] truncate max-w-[120px]">
										{userProfiles.getDisplayName(row.memberId)}
									</span>
								</div>
							</td>

							<!-- Current tag -->
							<td class="py-2 text-center text-[var(--guild-text-secondary)]">
								{#if row.currentTag != null}
									<span class="font-mono">#{row.currentTag}</span>
								{:else}
									<span class="text-xs opacity-40">—</span>
								{/if}
							</td>

							<!-- New tag input -->
							<td class="py-2 text-center">
								{#if row.removing}
									<span class="font-['Space_Grotesk'] text-xs text-red-400 italic">Removing</span>
								{:else}
									<div class="flex flex-col items-center gap-1">
										<input
											type="number"
											min="1"
											max="200"
											placeholder="—"
											value={row.newTagStr}
											oninput={(e) => setNewTag(row.memberId, (e.currentTarget as HTMLInputElement).value)}
											disabled={adminStore.loading}
											class="w-16 rounded-lg border px-2 py-1 text-center font-['Space_Grotesk'] text-sm text-[var(--guild-text)] bg-[var(--guild-surface-elevated)] focus:outline-none focus:ring-1 focus:ring-[#007474] transition-colors {conflict
												? 'border-red-500/60'
												: 'border-[#007474]/30'}"
										/>
										{#if conflict}
											<span class="text-[10px] text-red-400 max-w-[120px] text-center leading-tight">
												{conflict}
											</span>
										{/if}
									</div>
								{/if}
							</td>

							<!-- Action -->
							<td class="py-2 text-right">
								<button
									type="button"
									onclick={() => handleRemove(row.memberId)}
									disabled={adminStore.loading}
									class={row.removing
										? "rounded-lg border border-[#007474]/30 px-3 py-1.5 font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)] hover:text-[var(--guild-text)] transition-colors"
										: "rounded-lg border border-red-500/30 px-3 py-1.5 font-['Space_Grotesk'] text-xs text-red-400 hover:bg-red-500/10 transition-colors"}
								>
									{row.removing ? 'Undo' : 'Remove'}
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Submit row -->
		<div class="flex items-center justify-between border-t border-[#007474]/10 pt-3">
			<span class="font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)]">
				{changedCount} change{changedCount !== 1 ? 's' : ''}
			</span>
			<div class="flex gap-2">
				<button
					type="button"
					onclick={resetForm}
					disabled={adminStore.loading || changedCount === 0}
					class="rounded-lg border border-[#007474]/30 px-3 py-1.5 font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)] hover:text-[var(--guild-text)] transition-colors disabled:opacity-40"
				>
					Reset
				</button>
				<button
					type="button"
					onclick={handleSubmit}
					disabled={adminStore.loading || hasConflicts || changedCount === 0}
					class="rounded-lg bg-liquid-skobeloff px-4 py-2 font-['Space_Grotesk'] text-sm font-medium text-white hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{adminStore.loading ? 'Submitting…' : 'Submit Batch'}
				</button>
			</div>
		</div>
	{/if}
</div>
