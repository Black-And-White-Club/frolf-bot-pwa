import { createCypressContractAdapter } from '../../../packages/ws-contract-testkit/src/cypress-adapter.mjs';
import { EVENT_CONTRACT_CATALOG } from '../event-contracts.generated';
import {
	buildLeaderboardSnapshot,
	buildLeaderboardTagSwapProcessed,
	buildLeaderboardTagUpdated,
	buildLeaderboardUpdated,
	buildRoundCreated,
	buildRoundDeleted,
	buildRoundListSnapshot,
	buildRoundParticipantJoined,
	buildRoundParticipantScoreUpdated,
	buildRoundStarted,
	buildTagListSnapshot
} from '../event-builders';
import type {
	LeaderboardSnapshotResponsePayload,
	LeaderboardTagSwapProcessedEventPayload,
	LeaderboardTagUpdatedEventPayload,
	LeaderboardUpdatedEventPayload,
	RoundCreatedEventPayload,
	RoundDeletedEventPayload,
	RoundListResponsePayload,
	RoundParticipantJoinedEventPayload,
	RoundParticipantScoreUpdatedEventPayload,
	RoundStartedEventPayload,
	TagListResponsePayload
} from '../event-builders';
import { getMockNats } from '../mock-state';
import type { PublishedMessage } from '../mock-nats';
import { validatePayloadAgainstContract } from '../ws-contracts';

type EmitOptions = {
	validate?: boolean;
};

type WsConnectOptions = {
	timeoutMs?: number;
	minSubscriptions?: number;
	requiredSubjects?: string[];
};

type CypressNatsBridge = {
	publish: (subject: string, payload: unknown) => void;
};

type WsRunScenarioOptions = {
	subjectId?: string;
	defaultAction?: 'emit' | 'stub';
	validate?: boolean;
};

type MaterializedScenarioStep = {
	subject: string;
	payload: unknown;
	validate?: boolean;
	action?: 'emit' | 'stub';
};

type ArrangeSnapshotOptions = {
	subjectId?: string;
	rounds?: RoundListResponsePayload['rounds'];
	leaderboard?: LeaderboardSnapshotResponsePayload;
	tags?: TagListResponsePayload;
	profiles?: Record<string, unknown>;
	clubInfo?: {
		uuid?: string;
		name?: string;
		icon_url?: string | null;
	};
};

type ClubInfoPayload = {
	uuid: string;
	name: string;
	icon_url: string | null;
};

const contractAdapter = createCypressContractAdapter({
	catalog: EVENT_CONTRACT_CATALOG,
	placeholders: ['{scope_id}', '{scope}']
});

function wrapVoid(): Cypress.Chainable<void> {
	return cy.wrap(undefined, { log: false }) as Cypress.Chainable<void>;
}

function requireMockNats() {
	const mockNats = getMockNats();
	if (!mockNats) {
		throw new Error('Mock NATS is not initialized');
	}
	return mockNats;
}

function waitForSubscriptions(options: WsConnectOptions = {}): Cypress.Chainable<void> {
	const timeoutMs = options.timeoutMs ?? 10_000;
	const minSubscriptions = options.minSubscriptions ?? 1;
	const requiredSubjects = options.requiredSubjects ?? [];
	const pollIntervalMs = 100;
	const startedAt = Date.now();

	return cy.wrap(null, { log: false }).then(() => {
		return new Cypress.Promise<void>((resolve, reject) => {
			const poll = () => {
				const mockNats = requireMockNats();
				const debugState = mockNats.getDebugState();
				const discoveredSubjects = new Set([
					...debugState.localSubjects,
					...debugState.protocolSubjects
				]);
				const missingSubjects = requiredSubjects.filter(
					(subject) => !discoveredSubjects.has(subject)
				);

				if (discoveredSubjects.size >= minSubscriptions && missingSubjects.length === 0) {
					resolve();
					return;
				}

				if (Date.now() - startedAt >= timeoutMs) {
					reject(
						new Error(
							[
								`Timed out waiting for websocket subscriptions after ${timeoutMs}ms`,
								`expected_min_subscriptions=${minSubscriptions}`,
								`required_subjects=${requiredSubjects.join(',') || '(none)'}`,
								`discovered_subjects=${[...discoveredSubjects].join(',') || '(none)'}`
							].join('\n')
						)
					);
					return;
				}

				setTimeout(poll, pollIntervalMs);
			};

			poll();
		});
	}) as Cypress.Chainable<void>;
}

function getCypressBridge(): CypressNatsBridge | null {
	const cypressWithState = Cypress as unknown as {
		state: (key: string) => unknown;
	};

	const currentWindow = cypressWithState.state('window') as
		| (Window & typeof globalThis & { __FROLF_CYPRESS_NATS__?: CypressNatsBridge })
		| undefined;

	return currentWindow?.__FROLF_CYPRESS_NATS__ ?? null;
}

function shouldValidate(options?: EmitOptions): boolean {
	return options?.validate !== false;
}

function emit(subject: string, payload: unknown, options?: EmitOptions): void {
	if (shouldValidate(options)) {
		validatePayloadAgainstContract(subject, payload);
	}
	const bridge = getCypressBridge();
	if (bridge) {
		bridge.publish(subject, payload);
		return;
	}
	requireMockNats().publishEvent(subject, payload);
}

function stub(subject: string, payload: unknown, options?: EmitOptions): void {
	if (shouldValidate(options)) {
		validatePayloadAgainstContract(subject, payload);
	}
	requireMockNats().stubRequest(subject, payload);
}

function buildRoundSnapshotPayload(options: ArrangeSnapshotOptions): RoundListResponsePayload {
	return buildRoundListSnapshot({
		rounds: options.rounds ?? [],
		profiles: options.profiles ?? {}
	});
}

function buildLeaderboardSnapshotPayload(
	options: ArrangeSnapshotOptions,
	subjectId: string
): LeaderboardSnapshotResponsePayload {
	return options.leaderboard ?? buildLeaderboardSnapshot({ guild_id: subjectId });
}

function buildTagSnapshotPayload(
	options: ArrangeSnapshotOptions,
	subjectId: string
): TagListResponsePayload {
	return options.tags ?? buildTagListSnapshot({ guild_id: subjectId });
}

function buildClubInfoSnapshotPayload(
	options: ArrangeSnapshotOptions,
	subjectId: string
): ClubInfoPayload {
	return {
		uuid: options.clubInfo?.uuid ?? subjectId,
		name: options.clubInfo?.name ?? 'Test Club',
		icon_url: options.clubInfo?.icon_url ?? null
	};
}

Cypress.Commands.add('getMockNats', () => {
	return cy.wrap(getMockNats());
});

Cypress.Commands.add('wsConnect', (options?: WsConnectOptions) => {
	requireMockNats();
	return waitForSubscriptions(options);
});

Cypress.Commands.add('wsEmit', (subject: string, payload: unknown, options?: EmitOptions) => {
	emit(subject, payload, options);
	return wrapVoid();
});

Cypress.Commands.add(
	'wsStubRequest',
	(subject: string, payload: unknown, options?: EmitOptions) => {
		stub(subject, payload, options);
		return wrapVoid();
	}
);

Cypress.Commands.add(
	'wsAssertPublished',
	(subject: string, predicate?: (entry: PublishedMessage) => boolean) => {
		const messages = requireMockNats()
			.getPublishedMessages()
			.filter((entry) => entry.subject === subject);
		if (messages.length === 0) {
			throw new Error(`Expected published message on subject "${subject}"`);
		}
		if (predicate && !messages.some((entry) => predicate(entry))) {
			throw new Error(`No published message on "${subject}" satisfied predicate`);
		}
		return cy.wrap(messages);
	}
);

Cypress.Commands.add('wsRunScenario', (fixturePath: string, options: WsRunScenarioOptions = {}) => {
	return cy.fixture(fixturePath).then((doc: unknown) => {
		const materialized = contractAdapter.materializeScenarioDocument(doc, {
			subjectId: options.subjectId,
			fileLabel: fixturePath
		});

		if (!materialized.ok) {
			throw new Error(
				`Invalid scenario fixture "${fixturePath}":\n- ${materialized.errors.join('\n- ')}`
			);
		}

		const steps = materialized.steps as MaterializedScenarioStep[];
		steps.forEach((step, index) => {
			const action = step.action ?? options.defaultAction ?? 'emit';
			const validate = typeof step.validate === 'boolean' ? step.validate : options.validate;

			if (action === 'stub') {
				stub(step.subject, step.payload, { validate });
				return;
			}

			emit(step.subject, step.payload, { validate });
			Cypress.log({
				name: 'scenario',
				message: `step#${index + 1} ${action} ${step.subject}`
			});
		});

		return wrapVoid();
	});
});

Cypress.Commands.add('arrangeSnapshot', (options: ArrangeSnapshotOptions = {}) => {
	const subjectId = options.subjectId ?? 'guild-123';

	const roundsPayload = buildRoundSnapshotPayload(options);
	stub(`round.list.request.v1.${subjectId}`, roundsPayload, { validate: false });

	const leaderboardPayload = buildLeaderboardSnapshotPayload(options, subjectId);
	stub(`leaderboard.snapshot.request.v1.${subjectId}`, leaderboardPayload, { validate: false });

	const tagsPayload = buildTagSnapshotPayload(options, subjectId);
	stub(`leaderboard.tag.list.requested.v1.${subjectId}`, tagsPayload, { validate: false });

	const clubInfoPayload = buildClubInfoSnapshotPayload(options, subjectId);
	stub(`club.info.request.v1.${subjectId}`, clubInfoPayload, { validate: false });

	return wrapVoid();
});

Cypress.Commands.add(
	'emitRoundCreated',
	(subjectId: string, payload: Partial<RoundCreatedEventPayload> = {}) => {
		emit(`round.created.v1.${subjectId}`, buildRoundCreated({ guild_id: subjectId, ...payload }), {
			validate: false
		});
		return wrapVoid();
	}
);

Cypress.Commands.add(
	'emitRoundStarted',
	(subjectId: string, payload: Partial<RoundStartedEventPayload> = {}) => {
		emit(`round.started.v1.${subjectId}`, buildRoundStarted(payload), { validate: false });
		return wrapVoid();
	}
);

Cypress.Commands.add(
	'emitRoundParticipantJoined',
	(subjectId: string, payload: Partial<RoundParticipantJoinedEventPayload> = {}) => {
		emit(`round.participant.joined.v1.${subjectId}`, buildRoundParticipantJoined(payload), {
			validate: false
		});
		return wrapVoid();
	}
);

Cypress.Commands.add(
	'emitRoundParticipantScoreUpdated',
	(subjectId: string, payload: Partial<RoundParticipantScoreUpdatedEventPayload> = {}) => {
		emit(
			`round.participant.score.updated.v1.${subjectId}`,
			buildRoundParticipantScoreUpdated(payload),
			{
				validate: false
			}
		);
		return wrapVoid();
	}
);

Cypress.Commands.add(
	'emitRoundDeleted',
	(subjectId: string, payload: Partial<RoundDeletedEventPayload> = {}) => {
		emit(`round.deleted.v1.${subjectId}`, buildRoundDeleted(payload), { validate: false });
		return wrapVoid();
	}
);

Cypress.Commands.add(
	'emitLeaderboardUpdated',
	(subjectId: string, payload: Partial<LeaderboardUpdatedEventPayload> = {}) => {
		emit(
			`leaderboard.updated.v1.${subjectId}`,
			buildLeaderboardUpdated({ guild_id: subjectId, ...payload }),
			{
				validate: false
			}
		);
		return wrapVoid();
	}
);

Cypress.Commands.add(
	'emitLeaderboardTagUpdated',
	(subjectId: string, payload: Partial<LeaderboardTagUpdatedEventPayload> = {}) => {
		emit(`leaderboard.tag.updated.v1.${subjectId}`, buildLeaderboardTagUpdated(payload), {
			validate: false
		});
		return wrapVoid();
	}
);

Cypress.Commands.add(
	'emitLeaderboardTagSwapProcessed',
	(subjectId: string, payload: Partial<LeaderboardTagSwapProcessedEventPayload> = {}) => {
		emit(
			`leaderboard.tag.swap.processed.v1.${subjectId}`,
			buildLeaderboardTagSwapProcessed(payload),
			{
				validate: false
			}
		);
		return wrapVoid();
	}
);

Cypress.Commands.add('publishNatsEvent', (subject: string, payload: unknown) => {
	emit(subject, payload, { validate: false });
	return wrapVoid();
});

Cypress.Commands.add('stubNatsRequest', (subject: string, payload: unknown) => {
	stub(subject, payload, { validate: false });
	return wrapVoid();
});

Cypress.Commands.add('mockNats', () => {
	requireMockNats();
	return wrapVoid();
});

Cypress.Commands.add('sendNatsMessage', (subject: string, payload: unknown) => {
	emit(subject, payload, { validate: false });
	return wrapVoid();
});
