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

	interface TagEditRow {
		memberId: string;
		currentTag: number | null;
		newTagStr: string;
		removing: boolean;
	}

	// User edits stored separately from derived data so rows can be $derived
	const edits = new SvelteMap<string, EditState>();

	function parseRequestedTag(row: TagEditRow): number | null {
		if (row.removing || !row.newTagStr) {
			return null;
		}
		const parsed = parseInt(row.newTagStr);
		if (isNaN(parsed) || parsed <= 0) {
			return null;
		}
		return parsed;
	}

	function addDuplicateTargetConflicts(
		rows: TagEditRow[],
		errors: SvelteMap<string, string>
	): void {
		const targetTags = new SvelteMap<number, string>(); // tagNumber -> memberId
		for (const row of rows) {
			const requestedTag = parseRequestedTag(row);
			if (requestedTag == null) {
				continue;
			}

			const existingOwner = targetTags.get(requestedTag);
			if (!existingOwner) {
				targetTags.set(requestedTag, row.memberId);
				continue;
			}

			const message = `#${requestedTag} is already assigned to another row`;
			errors.set(row.memberId, message);
			errors.set(existingOwner, message);
		}
	}

	function addUnchangedHolderConflicts(
		rows: TagEditRow[],
		errors: SvelteMap<string, string>
	): void {
		for (const row of rows) {
			const requestedTag = parseRequestedTag(row);
			if (requestedTag == null || errors.has(row.memberId)) {
				continue;
			}

			const blocker = rows.find(
				(other) =>
					other.memberId !== row.memberId &&
					other.currentTag === requestedTag &&
					!other.removing &&
					!other.newTagStr
			);
			if (!blocker) {
				continue;
			}

			const blockerName = userProfiles.getDisplayName(blocker.memberId);
			errors.set(
				row.memberId,
				`#${requestedTag} is currently held by ${blockerName} (reassign or remove them in this batch)`
			);
		}
	}

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

		addDuplicateTargetConflicts(rows, errors);
		addUnchangedHolderConflicts(rows, errors);

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

<div class="space-y-4 rounded-xl border border-[#007474]/20 bg-[var(--guild-surface)] px-5 py-4">
	<!-- Feedback banners -->
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
						<th
							class="pb-2 text-left font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
						>
							Player
						</th>
						<th
							class="pb-2 text-center font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
						>
							Current
						</th>
						<th
							class="pb-2 text-center font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
						>
							New Tag
						</th>
						<th
							class="pb-2 text-right font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
						>
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
										decoding="async"
									/>
									<span class="max-w-[120px] truncate text-[var(--guild-text)]">
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
											oninput={(e) =>
												setNewTag(row.memberId, (e.currentTarget as HTMLInputElement).value)}
											disabled={adminStore.loading}
											class="w-16 rounded-lg border bg-[var(--guild-surface-elevated)] px-2 py-1 text-center font-['Space_Grotesk'] text-sm text-[var(--guild-text)] transition-colors focus:ring-1 focus:ring-[#007474] focus:outline-none {conflict
												? 'border-red-500/60'
												: 'border-[#007474]/30'}"
										/>
										{#if conflict}
											<span
												class="max-w-[120px] text-center text-[10px] leading-tight text-red-400"
											>
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
										? "rounded-lg border border-[#007474]/30 px-3 py-1.5 font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)] transition-colors hover:text-[var(--guild-text)]"
										: "rounded-lg border border-red-500/30 px-3 py-1.5 font-['Space_Grotesk'] text-xs text-red-400 transition-colors hover:bg-red-500/10"}
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
					class="rounded-lg border border-[#007474]/30 px-3 py-1.5 font-['Space_Grotesk'] text-xs text-[var(--guild-text-secondary)] transition-colors hover:text-[var(--guild-text)] disabled:opacity-40"
				>
					Reset
				</button>
				<button
					type="button"
					onclick={handleSubmit}
					disabled={adminStore.loading || hasConflicts || changedCount === 0}
					class="bg-liquid-skobeloff rounded-lg px-4 py-2 font-['Space_Grotesk'] text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{adminStore.loading ? 'Submitting…' : 'Submit Batch'}
				</button>
			</div>
		</div>
	{/if}
</div>
