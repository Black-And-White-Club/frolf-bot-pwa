/// <reference types="cypress" />

import type {
	LeaderboardSnapshotResponsePayload,
	LeaderboardTagSwapProcessedEventPayload,
	LeaderboardTagUpdatedEventPayload,
	LeaderboardUpdatedEventPayload,
	RoundCreatedEventPayload,
	RoundDeletedEventPayload,
	RoundParticipantJoinedEventPayload,
	RoundParticipantScoreUpdatedEventPayload,
	RoundStartedEventPayload,
	TagListResponsePayload
} from './event-builders';
import type { PublishedMessage } from './mock-nats';

type VisitOptions = {
	onBeforeLoad?: Partial<Omit<Cypress.VisitOptions, 'url'>>['onBeforeLoad'];
};

type WsEmitOptions = {
	validate?: boolean;
};

type WsRunScenarioOptions = {
	subjectId?: string;
	defaultAction?: 'emit' | 'stub';
	validate?: boolean;
};

type WsConnectOptions = {
	timeoutMs?: number;
	minSubscriptions?: number;
	requiredSubjects?: string[];
};

type ArrangeAuthOptions = {
	path?: string;
	token?: string;
	ticket?: string;
	userId?: string;
	userUuid?: string;
	clubUuid?: string;
	activeClubUuid?: string;
	guildId?: string;
	role?: 'viewer' | 'player' | 'editor' | 'admin';
	linkedProviders?: string[];
	clubs?: Array<{
		club_uuid: string;
		role: 'viewer' | 'player' | 'editor' | 'admin';
		display_name: string;
		avatar_url: string;
	}>;
	claims?: Record<string, unknown>;
	visitOptions?: VisitOptions;
};

type ArrangeGuestOptions = {
	path?: string;
	visitOptions?: VisitOptions;
};

type ArrangeSnapshotOptions = {
	subjectId?: string;
	rounds?: RoundCreatedEventPayload[];
	leaderboard?: LeaderboardSnapshotResponsePayload;
	tags?: TagListResponsePayload;
	profiles?: Record<string, unknown>;
	clubInfo?: {
		uuid?: string;
		name?: string;
		icon_url?: string | null;
	};
};

type ExpectLeaderboardLoadedOptions = {
	minRows?: number;
};

declare global {
	namespace Cypress {
		interface Chainable {
			getMockNats(): Chainable<any>;
			wsConnect(options?: WsConnectOptions): Chainable<void>;
			wsEmit(subject: string, payload: unknown, options?: WsEmitOptions): Chainable<void>;
			wsStubRequest(subject: string, payload: unknown, options?: WsEmitOptions): Chainable<void>;
			wsRunScenario(fixturePath: string, options?: WsRunScenarioOptions): Chainable<void>;
			wsAssertPublished(
				subject: string,
				predicate?: (entry: PublishedMessage) => boolean
			): Chainable<PublishedMessage[]>;
			arrangeAuth(options?: ArrangeAuthOptions): Chainable<void>;
			arrangeGuest(options?: ArrangeGuestOptions): Chainable<void>;
			arrangeSnapshot(options?: ArrangeSnapshotOptions): Chainable<void>;
			emitRoundCreated(
				subjectId: string,
				payload?: Partial<RoundCreatedEventPayload>
			): Chainable<void>;
			emitRoundStarted(
				subjectId: string,
				payload?: Partial<RoundStartedEventPayload>
			): Chainable<void>;
			emitRoundParticipantJoined(
				subjectId: string,
				payload?: Partial<RoundParticipantJoinedEventPayload>
			): Chainable<void>;
			emitRoundParticipantScoreUpdated(
				subjectId: string,
				payload?: Partial<RoundParticipantScoreUpdatedEventPayload>
			): Chainable<void>;
			emitRoundDeleted(
				subjectId: string,
				payload?: Partial<RoundDeletedEventPayload>
			): Chainable<void>;
			emitLeaderboardUpdated(
				subjectId: string,
				payload?: Partial<LeaderboardUpdatedEventPayload>
			): Chainable<void>;
			emitLeaderboardTagUpdated(
				subjectId: string,
				payload?: Partial<LeaderboardTagUpdatedEventPayload>
			): Chainable<void>;
			emitLeaderboardTagSwapProcessed(
				subjectId: string,
				payload?: Partial<LeaderboardTagSwapProcessedEventPayload>
			): Chainable<void>;
			publishNatsEvent(subject: string, payload: unknown): Chainable<void>;
			stubNatsRequest(subject: string, payload: unknown): Chainable<void>;
			mockNats(): Chainable<void>;
			sendNatsMessage(subject: string, payload: unknown): Chainable<void>;
			visitWithToken(path?: string, token?: string, options?: VisitOptions): Chainable<void>;
			visitMockMode(path?: string, options?: VisitOptions): Chainable<void>;
			step(message: string, details?: unknown): Chainable<void>;
			dumpPublishedMessages(label?: string, limit?: number): Chainable<PublishedMessage[]>;
			expectDashboardLoaded(): Chainable<void>;
			expectLeaderboardLoaded(options?: ExpectLeaderboardLoadedOptions): Chainable<void>;
		}
	}
}

import './custom_commands';

export {};
