<script lang="ts">
	import { onMount } from 'svelte';
	import TagEditor from '$lib/components/admin/TagEditor.svelte';
	import PointAdjuster from '$lib/components/admin/PointAdjuster.svelte';
	import AdminScorecardUploader from '$lib/components/admin/AdminScorecardUploader.svelte';
	import AdminBackfillRoundUploader from '$lib/components/admin/AdminBackfillRoundUploader.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { tagStore } from '$lib/stores/tags.svelte';
	import { resolveRequestIdentity } from '$lib/utils/requestIdentity';

	onMount(async () => {
		// Fetch tag list if not already loaded (may already be populated from startup)
		const identity = resolveRequestIdentity(auth.user);
		if (tagStore.tagList.length === 0 && identity) {
			await tagStore.fetchTagList(identity.requestSubjectId);
		}
	});
</script>

<svelte:head>
	<title>Admin | Frolf Bot</title>
</svelte:head>

<div class="min-h-screen bg-[var(--guild-background)] px-4 py-10">
	<div class="mx-auto max-w-4xl space-y-8">
		<!-- Page header -->
		<div class="flex items-center gap-3">
			<h1 class="font-['Fraunces'] text-3xl font-bold text-[var(--guild-text)]">Admin Dashboard</h1>
			<span
				class="rounded-md border border-[#B89B5E]/40 bg-[#B89B5E]/10 px-2 py-0.5 font-['Space_Grotesk'] text-xs font-semibold tracking-wide text-[#B89B5E] uppercase"
			>
				Admin
			</span>
		</div>

		<!-- Two-column layout on larger screens -->
		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Tag Management -->
			<section class="space-y-3">
				<h2
					class="font-['Space_Grotesk'] text-sm font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
				>
					Tag Management
				</h2>
				<TagEditor />
			</section>

			<!-- Point Adjustment -->
			<section class="space-y-3">
				<h2
					class="font-['Space_Grotesk'] text-sm font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
				>
					Point Adjustment
				</h2>
				<PointAdjuster />
			</section>
		</div>

		<section class="space-y-3">
			<h2
				class="font-['Space_Grotesk'] text-sm font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				Manual Scorecard Upload
			</h2>
			<AdminScorecardUploader />
		</section>

		<section class="space-y-3">
			<h2
				class="font-['Space_Grotesk'] text-sm font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				Backfill Past Round
			</h2>
			<AdminBackfillRoundUploader />
		</section>
	</div>
</div>
