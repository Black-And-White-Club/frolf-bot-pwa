<script lang="ts">
	import TagEditor from '$lib/components/admin/TagEditor.svelte';
	import PointAdjuster from '$lib/components/admin/PointAdjuster.svelte';
	import BettingMarketManager from '$lib/components/admin/BettingMarketManager.svelte';
	import BettingWalletAdjuster from '$lib/components/admin/BettingWalletAdjuster.svelte';
	import AdminScorecardUploader from '$lib/components/admin/AdminScorecardUploader.svelte';
	import AdminBackfillRoundUploader from '$lib/components/admin/AdminBackfillRoundUploader.svelte';
	import UDiscIdentityEditor from '$lib/components/admin/UDiscIdentityEditor.svelte';
	import RoundEmbedRepublisher from '$lib/components/admin/RoundEmbedRepublisher.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { nats } from '$lib/stores/nats.svelte';
	import { tagStore } from '$lib/stores/tags.svelte';
	import { resolveRequestIdentity } from '$lib/utils/requestIdentity';

	let hasRequestedTagList = false;
	let identity = $derived(resolveRequestIdentity(auth.user));

	$effect(() => {
		if (!nats.isConnected || !identity || tagStore.tagList.length > 0 || hasRequestedTagList) {
			return;
		}

		hasRequestedTagList = true;
		void tagStore.fetchTagList(identity.guildId, identity.clubUuid);
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
				Betting Wallet Adjustment
			</h2>
			{#if auth.bettingVisible}
				<BettingWalletAdjuster />
			{:else}
				<div
					class="rounded-xl border border-white/10 bg-[var(--guild-surface)] px-5 py-4 text-sm text-[var(--guild-text-secondary)]"
				>
					Betting is not enabled for this club, so the seasonal betting wallet is unavailable.
				</div>
			{/if}
		</section>

		<section class="space-y-3">
			<h2
				class="font-['Space_Grotesk'] text-sm font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				Betting Market Control
			</h2>
			{#if auth.bettingVisible}
				<BettingMarketManager />
			{:else}
				<div
					class="rounded-xl border border-white/10 bg-[var(--guild-surface)] px-5 py-4 text-sm text-[var(--guild-text-secondary)]"
				>
					Betting is not enabled for this club, so market controls are unavailable.
				</div>
			{/if}
		</section>

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

		<section class="space-y-3">
			<h2
				class="font-['Space_Grotesk'] text-sm font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				UDisc Identity Editor
			</h2>
			<UDiscIdentityEditor />
		</section>

		<section class="space-y-3">
			<h2
				class="font-['Space_Grotesk'] text-sm font-semibold tracking-wide text-[var(--guild-text-secondary)] uppercase"
			>
				Republish Round Embed
			</h2>
			<RoundEmbedRepublisher />
		</section>
	</div>
</div>
