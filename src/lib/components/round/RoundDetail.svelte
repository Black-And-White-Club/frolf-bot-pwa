<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { roundActionsService } from '$lib/stores/roundActions.svelte';
	import { roundService } from '$lib/stores/round.svelte';
	import { userProfiles } from '$lib/stores/userProfiles.svelte';
	import ParticipantRow from './ParticipantRow.svelte';

	type Props = {
		roundId: string;
	};

	type ParticipantResponse = 'ACCEPT' | 'DECLINE' | 'TENTATIVE';

	type EditRoundForm = {
		title: string;
		description: string;
		startTime: string;
		timezone: string;
		location: string;
	};

	const FALLBACK_TIMEZONE = 'America/Chicago';

	let { roundId }: Props = $props();

	let round = $derived(roundService.rounds.find((r) => r.id === roundId));
	let currentUserId = $derived(auth.user?.id ?? '');

	let confirmedParticipants = $derived(
		round?.participants
			.filter((participant) => participant.response === 'accepted')
			.sort((a, b) => {
				const sortBucket = (participant: { score: number | null; isDNF?: boolean }) => {
					if (participant.isDNF) return 1;
					if (participant.score === null) return 2;
					return 0;
				};

				const bucketA = sortBucket(a);
				const bucketB = sortBucket(b);
				if (bucketA !== bucketB) return bucketA - bucketB;
				if (bucketA === 0) return (a.score ?? 0) - (b.score ?? 0);
				return participantName(a).localeCompare(participantName(b));
			}) ?? []
	);

	let currentParticipant = $derived(
		round?.participants.find((participant) => participant.userId === currentUserId) ?? null
	);

	let statusBadge = $derived.by(() => {
		if (!round) return { text: 'Unknown', class: 'status-unknown' };

		switch (round.state) {
			case 'started':
				return { text: 'Live Now', class: 'status-live' };
			case 'scheduled':
				return { text: 'Upcoming', class: 'status-upcoming' };
			case 'finalized':
				return { text: 'Complete', class: 'status-complete' };
			case 'cancelled':
				return { text: 'Cancelled', class: 'status-cancelled' };
			default:
				return { text: 'Unknown', class: 'status-unknown' };
		}
	});

	let formattedDate = $derived.by(() => {
		if (!round) return '';
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(round.startTime));
	});

	let leader = $derived.by(() => {
		if (confirmedParticipants.length === 0) return null;
		return confirmedParticipants[0];
	});

	let holesCompleted = $derived.by(() => {
		if (!round || round.state === 'scheduled') return null;
		const totalHoles = round.holes ?? 18;
		const current = round.currentHole ?? 0;
		return { current, total: totalHoles };
	});

	let showScoreGrid = $derived(round?.state === 'started' || round?.state === 'finalized');
	let canRespond = $derived(
		auth.isAuthenticated &&
			auth.activeRole !== 'viewer' &&
			(round?.state === 'scheduled' || round?.state === 'started')
	);
	let canSubmitScore = $derived(
		auth.isAuthenticated &&
			auth.activeRole !== 'viewer' &&
			round?.state === 'started' &&
			currentParticipant?.response === 'accepted'
	);
	let canManageRound = $derived(
		Boolean(
			auth.isAuthenticated &&
				round?.state === 'scheduled' &&
				currentUserId &&
				(auth.canEdit || round.createdBy === currentUserId)
		)
	);
	let canEditRound = $derived(canManageRound);
	let canDeleteRound = $derived(canManageRound);
	let isRoundActionPending = $derived(round ? roundActionsService.isPending(round.id) : false);

	let showEditForm = $state(false);
	let scoreInput = $state('');
	let editForm = $state<EditRoundForm>({
		title: '',
		description: '',
		startTime: '',
		timezone: defaultTimezone(),
		location: ''
	});

	$effect(() => {
		if (!round || showEditForm) {
			return;
		}

		editForm = {
			title: round.title,
			description: round.description,
			startTime: toDateTimeLocal(round.startTime),
			timezone: defaultTimezone(),
			location: round.location
		};
	});

	$effect(() => {
		if (!currentParticipant) {
			return;
		}
		if (currentParticipant.score === null || currentParticipant.score === undefined) {
			return;
		}
		scoreInput = String(currentParticipant.score);
	});

	function participantName(participant: { userId: string; rawName?: string } | null): string {
		if (!participant) return '';
		if (participant.userId) return userProfiles.getDisplayName(participant.userId);
		return participant.rawName || 'Guest';
	}

	function formatRelativeScore(score: number | null | undefined, isDNF?: boolean): string {
		if (isDNF) return 'DNF';
		if (score === null || score === undefined) return '--';
		if (score === 0) return 'E';
		return score > 0 ? `+${score}` : `${score}`;
	}

	function defaultTimezone(): string {
		if (typeof Intl === 'undefined') {
			return FALLBACK_TIMEZONE;
		}
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone?.trim();
		return timezone || FALLBACK_TIMEZONE;
	}

	function toDateTimeLocal(isoTime: string): string {
		const parsedDate = new Date(isoTime);
		if (Number.isNaN(parsedDate.getTime())) {
			return '';
		}
		const timezoneOffsetMs = parsedDate.getTimezoneOffset() * 60_000;
		const localDate = new Date(parsedDate.getTime() - timezoneOffsetMs);
		return localDate.toISOString().slice(0, 16);
	}

	async function handleResponse(response: ParticipantResponse): Promise<void> {
		if (!round) return;
		await roundActionsService.setParticipantResponse(round.id, response);
	}

	async function handleLeaveRound(): Promise<void> {
		if (!round) return;
		await roundActionsService.leaveRound(round.id);
	}

	async function handleScoreSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (!round) return;
		if (currentParticipant?.response !== 'accepted') {
			roundActionsService.errorMessage = 'Join the round before submitting a score.';
			return;
		}

		const score = Number.parseInt(scoreInput, 10);
		if (!Number.isFinite(score)) {
			roundActionsService.errorMessage = 'Enter a valid integer score.';
			return;
		}

		await roundActionsService.submitScore(round.id, score);
	}

	function openEditForm(): void {
		if (!round) {
			return;
		}
		editForm = {
			title: round.title,
			description: round.description,
			startTime: toDateTimeLocal(round.startTime),
			timezone: defaultTimezone(),
			location: round.location
		};
		showEditForm = true;
	}

	function cancelEditForm(): void {
		showEditForm = false;
	}

	async function handleRoundUpdate(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (!round) return;

		if (!editForm.title.trim() || !editForm.location.trim() || !editForm.startTime.trim()) {
			roundActionsService.errorMessage = 'Title, start time, and location are required.';
			return;
		}

		const updated = await roundActionsService.updateRound(round.id, {
			title: editForm.title,
			description: editForm.description,
			startTime: editForm.startTime,
			timezone: editForm.timezone,
			location: editForm.location
		});

		if (updated) {
			showEditForm = false;
		}
	}

	async function handleRoundDelete(): Promise<void> {
		if (!round) return;
		const confirmed = window.confirm('Delete this round? This cannot be undone.');
		if (!confirmed) {
			return;
		}

		const deleted = await roundActionsService.deleteRound(round.id);
		if (deleted) {
			await goto('/rounds');
		}
	}
</script>

{#if !round}
	<div class="empty-state">
		<p class="empty-text">Round not found</p>
	</div>
{:else}
	<div class="round-detail">
		<header class="detail-header">
			<div class="header-top">
				<h1 class="round-title">{round.title}</h1>
				<div class="status-badge {statusBadge.class}">
					{statusBadge.text}
				</div>
			</div>

			<div class="header-meta">
				{#if round.location}
					<div class="meta-item">
						<span class="meta-icon">📍</span>
						<span class="meta-text">{round.location}</span>
					</div>
				{/if}

				<div class="meta-item">
					<span class="meta-icon">📅</span>
					<span class="meta-text">{formattedDate}</span>
				</div>
			</div>

			{#if round.description}
				<p class="round-description">{round.description}</p>
			{/if}

			{#if roundActionsService.errorMessage}
				<div class="action-alert error" role="alert">{roundActionsService.errorMessage}</div>
			{/if}
			{#if roundActionsService.successMessage}
				<div class="action-alert success" role="status">{roundActionsService.successMessage}</div>
			{/if}

			{#if canRespond || canSubmitScore || canEditRound || canDeleteRound}
				<section class="action-panel" aria-label="Round actions">
					{#if canRespond}
						<div class="action-group">
							<p class="group-label">RSVP</p>
							<div class="button-row">
								<button
									type="button"
									class={`action-button ${currentParticipant?.response === 'accepted' ? 'active' : ''}`}
									disabled={isRoundActionPending}
									onclick={() => handleResponse('ACCEPT')}
								>
									Join
								</button>
								<button
									type="button"
									class={`action-button ${currentParticipant?.response === 'declined' ? 'active' : ''}`}
									disabled={isRoundActionPending}
									onclick={() => handleResponse('DECLINE')}
								>
									Decline
								</button>
								{#if currentParticipant}
									<button
										type="button"
										class="action-button"
										disabled={isRoundActionPending}
										onclick={handleLeaveRound}
									>
										Leave
									</button>
								{/if}
							</div>
						</div>
					{/if}

					{#if canSubmitScore}
						<form class="action-group" onsubmit={handleScoreSubmit}>
							<label class="group-label" for="round-score-input">Submit score</label>
							<div class="score-row">
								<input
									id="round-score-input"
									type="number"
									step="1"
									bind:value={scoreInput}
									placeholder="e.g. -4"
									disabled={isRoundActionPending}
								/>
								<button type="submit" class="action-button primary" disabled={isRoundActionPending}>
									Save
								</button>
							</div>
						</form>
					{/if}

					{#if canEditRound || canDeleteRound}
						<div class="action-group">
							<p class="group-label">Organizer actions</p>
							{#if canEditRound}
								{#if showEditForm}
									<form class="edit-form" onsubmit={handleRoundUpdate}>
										<input
											type="text"
											bind:value={editForm.title}
											placeholder="Round title"
											required
											disabled={isRoundActionPending}
										/>
										<textarea
											bind:value={editForm.description}
											rows={3}
											placeholder="Description"
											disabled={isRoundActionPending}
										></textarea>
										<input
											type="datetime-local"
											bind:value={editForm.startTime}
											required
											disabled={isRoundActionPending}
										/>
										<input
											type="text"
											bind:value={editForm.timezone}
											placeholder={FALLBACK_TIMEZONE}
											disabled={isRoundActionPending}
										/>
										<input
											type="text"
											bind:value={editForm.location}
											placeholder="Location"
											required
											disabled={isRoundActionPending}
										/>
										<div class="button-row">
											<button type="submit" class="action-button primary" disabled={isRoundActionPending}
												>Save changes</button
											>
											<button
												type="button"
												class="action-button"
												onclick={cancelEditForm}
												disabled={isRoundActionPending}
											>
												Cancel
											</button>
										</div>
									</form>
								{:else}
									<button
										type="button"
										class="action-button"
										onclick={openEditForm}
										disabled={isRoundActionPending}
									>
										Edit round
									</button>
								{/if}
							{/if}

							{#if canDeleteRound}
								<button
									type="button"
									class="action-button danger"
									onclick={handleRoundDelete}
									disabled={isRoundActionPending}
								>
									Delete round
								</button>
							{/if}
						</div>
					{/if}
				</section>
			{/if}
		</header>

		{#if round.state === 'started' || round.state === 'finalized'}
			<div class="stats-bar">
				{#if holesCompleted}
					<div class="stat-item">
						<span class="stat-label">Progress</span>
						<span class="stat-value">
							Hole {holesCompleted.current} of {holesCompleted.total}
						</span>
					</div>
				{/if}

				<div class="stat-item">
					<span class="stat-label">Players</span>
					<span class="stat-value">{confirmedParticipants.length}</span>
				</div>

				{#if leader && (leader.score !== null || leader.isDNF)}
					<div class="stat-item">
						<span class="stat-label">Leader</span>
						<span class="stat-value">
							{participantName(leader)}
							<span class="leader-score">
								{formatRelativeScore(leader?.score, leader?.isDNF)}
							</span>
						</span>
					</div>
				{/if}
			</div>
		{/if}

		<section class="participants-section">
			<h2 class="section-title">
				{round.state === 'scheduled' ? 'Registered Players' : 'Leaderboard'}
			</h2>
			<div class="participants-list">
				{#if confirmedParticipants.length > 0}
					{#each confirmedParticipants as participant, idx (`${participant.userId || 'guest'}:${idx}`)}
						<ParticipantRow {participant} position={idx + 1} showScore={round.state !== 'scheduled'} />
					{/each}
				{:else}
					<div class="empty-participants">
						<p class="empty-text">No confirmed participants yet</p>
					</div>
				{/if}
			</div>
		</section>

		{#if showScoreGrid}
			<section class="score-section">
				<h2 class="section-title">Scorecard</h2>
				{#await import('../score/ScoreGrid.svelte') then { default: ScoreGrid }}
					<ScoreGrid {round} />
				{/await}
			</section>
		{/if}
	</div>
{/if}

<style>
	.round-detail {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
	}

	.detail-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		background: var(--guild-surface, #081212);
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.75rem;
	}

	.header-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.round-title {
		font-family: 'Fraunces', serif;
		font-size: 2rem;
		font-weight: 700;
		color: var(--guild-text, #e5e7eb);
		margin: 0;
		line-height: 1.2;
	}

	.status-badge {
		padding: 0.375rem 0.875rem;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.status-live {
		background: rgba(16, 185, 129, 0.15);
		color: #10b981;
		border: 1px solid rgba(16, 185, 129, 0.3);
		box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
	}

	.status-upcoming {
		background: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
		border: 1px solid rgba(245, 158, 11, 0.3);
	}

	.status-complete {
		background: rgba(100, 116, 139, 0.15);
		color: #94a3b8;
		border: 1px solid rgba(100, 116, 139, 0.3);
	}

	.status-cancelled {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.status-unknown {
		background: rgba(156, 163, 175, 0.15);
		color: #9ca3af;
		border: 1px solid rgba(156, 163, 175, 0.3);
	}

	.header-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9375rem;
		color: var(--guild-text-muted, #9ca3af);
	}

	.meta-icon {
		font-size: 1.125rem;
		line-height: 1;
	}

	.round-description {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--guild-text-muted, #9ca3af);
		line-height: 1.6;
	}

	.action-alert {
		border-radius: 0.65rem;
		padding: 0.65rem 0.85rem;
		font-family: var(--font-secondary);
		font-size: 0.875rem;
	}

	.action-alert.error {
		border: 1px solid rgba(248, 113, 113, 0.45);
		background: rgba(248, 113, 113, 0.12);
		color: #fca5a5;
	}

	.action-alert.success {
		border: 1px solid rgba(0, 116, 116, 0.45);
		background: rgba(0, 116, 116, 0.12);
		color: #8af0f0;
	}

	.action-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background: var(--guild-surface-elevated, #0f1f1f);
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.75rem;
	}

	.action-group {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.group-label {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--guild-text-muted, #9ca3af);
	}

	.button-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.action-button {
		appearance: none;
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.6rem;
		background: var(--guild-surface, #081212);
		color: var(--guild-text, #e5e7eb);
		font-family: var(--font-secondary);
		font-size: 0.85rem;
		font-weight: 600;
		padding: 0.55rem 0.8rem;
		cursor: pointer;
		transition: background 0.2s ease, border-color 0.2s ease;
	}

	.action-button:hover {
		border-color: var(--guild-primary, #007474);
	}

	.action-button.active,
	.action-button.primary {
		background: var(--guild-primary, #007474);
		border-color: var(--guild-primary, #007474);
		color: #021919;
	}

	.action-button.danger {
		background: rgba(239, 68, 68, 0.14);
		border-color: rgba(239, 68, 68, 0.45);
		color: #fca5a5;
	}

	.action-button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.score-row {
		display: flex;
		gap: 0.6rem;
		align-items: center;
	}

	.score-row input,
	.edit-form input,
	.edit-form textarea {
		width: 100%;
		border-radius: 0.6rem;
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		background: var(--guild-surface, #081212);
		color: var(--guild-text, #e5e7eb);
		padding: 0.55rem 0.7rem;
		font-family: var(--font-secondary);
		font-size: 0.875rem;
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.edit-form textarea {
		resize: vertical;
		min-height: 5rem;
	}

	.stats-bar {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		padding: 1.25rem;
		background: var(--guild-surface-elevated, #0f1f1f);
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.75rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--guild-text-muted, #9ca3af);
	}

	.stat-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--guild-text, #e5e7eb);
		font-family: 'Space Grotesk', monospace;
	}

	.leader-score {
		margin-left: 0.5rem;
		font-weight: 700;
		color: var(--primary, #007474);
	}

	.participants-section,
	.score-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--guild-text, #e5e7eb);
		margin: 0;
		padding: 0 0.5rem;
	}

	.participants-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.empty-participants,
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 150px;
		padding: 2rem;
		background: var(--guild-surface, #081212);
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.75rem;
	}

	.empty-text {
		color: var(--guild-text-muted, #9ca3af);
		font-size: 0.875rem;
		margin: 0;
	}

	@media (max-width: 640px) {
		.round-title {
			font-size: 1.5rem;
		}

		.detail-header {
			padding: 1rem;
		}

		.stats-bar {
			padding: 1rem;
			grid-template-columns: 1fr;
		}

		.header-meta {
			flex-direction: column;
			gap: 0.75rem;
		}

		.score-row {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
