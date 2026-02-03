/**
 * Subscription Manager
 * Routes NATS subjects to state services
 */

import { nats } from './nats.svelte';
import { roundService } from './round.svelte';
import { leaderboardService } from './leaderboard.svelte';

class SubscriptionManager {
	private unsubscribers: (() => void)[] = [];
	private id: string | null = null;
	/**
	 * Start all subscriptions for a club/guild
	 */
	start(id: string): void {
		this.stop();

		this.id = id;
		this.subscribeRoundEvents(id);
		this.subscribeLeaderboardEvents(id);
	}

	/**
	 * Stop all subscriptions
	 */
	stop(): void {
		this.unsubscribers.forEach((unsub) => unsub());
		this.unsubscribers = [];
		this.id = null;
	}

	/**
	 * Subscribe to round events
	 */
	private subscribeRoundEvents(guildId: string): void {
		// Round created
		this.unsubscribers.push(
			nats.subscribe(`round.created.v1.${guildId}`, (msg: any) => {
				roundService.handleRoundCreated(msg.data);
			})
		);

		// Round updated
		this.unsubscribers.push(
			nats.subscribe(`round.updated.v1.${guildId}`, (msg: any) => {
				roundService.handleRoundUpdated(msg.data);
			})
		);

		// Round deleted
		this.unsubscribers.push(
			nats.subscribe(`round.deleted.v1.${guildId}`, (msg: any) => {
				roundService.handleRoundDeleted(msg.data);
			})
		);

		// Round started
		this.unsubscribers.push(
			nats.subscribe(`round.started.v1.${guildId}`, (msg: any) => {
				roundService.handleRoundUpdated({
					roundId: msg.data.round_id,
					update: { state: 'started' }
				});
			})
		);

		// Round finalized
		this.unsubscribers.push(
			nats.subscribe(`round.finalized.v1.${guildId}`, (msg: any) => {
				roundService.handleRoundUpdated({
					roundId: msg.data.round_id,
					update: { state: 'finalized' }
				});
			})
		);

		// Participant joined
		this.unsubscribers.push(
			nats.subscribe(`round.participant.joined.v1.${guildId}`, (msg: any) => {
				roundService.handleParticipantJoined(msg.data);
			})
		);

		// Score updated
		this.unsubscribers.push(
			nats.subscribe(`round.participant.score.updated.v1.${guildId}`, (msg: any) => {
				roundService.handleScoreUpdated(msg.data);
			})
		);
	}

	/**
	 * Subscribe to leaderboard events
	 */
	private subscribeLeaderboardEvents(guildId: string): void {
		// Full leaderboard update
		this.unsubscribers.push(
			nats.subscribe(`leaderboard.updated.v1.${guildId}`, (msg: any) => {
				leaderboardService.setSnapshot(msg.data.leaderboard_data);
			})
		);

		// Tag updated (single entry change)
		this.unsubscribers.push(
			nats.subscribe(`leaderboard.tag.updated.v1.${guildId}`, (msg: any) => {
				leaderboardService.applyPatch({
					op: 'upsert_entry',
					entry: {
						userId: msg.data.user_id,
						tagNumber: msg.data.new_tag,
						previousTagNumber: msg.data.old_tag
					}
				});
			})
		);

		// Tag swap processed
		this.unsubscribers.push(
			nats.subscribe(`leaderboard.tag.swap.processed.v1.${guildId}`, (msg: any) => {
				leaderboardService.applyPatch({
					op: 'swap_tags',
					userIdA: msg.data.requestor_id,
					userIdB: msg.data.target_id
				});
			})
		);
	}
}

export const subscriptionManager = new SubscriptionManager();
