import * as fs from 'node:fs';
import * as path from 'node:path';
import type { PlaywrightMockNats, PublishedMessage } from './mock-nats.fixture';
import {
	buildLeaderboardSnapshot,
	buildRoundListSnapshot,
	buildTagListSnapshot
} from '../support/event-builders';
import {
	buildPayloadFromContract,
	findExactEventContract,
	validatePayloadAgainstContract
} from '../support/ws-contracts';

export type {
	LeaderboardSnapshotResponsePayload,
	RoundCreatedEventPayload,
	RoundListResponsePayload,
	TagListResponsePayload
} from '../support/event-builders';

export type ArrangeSnapshotOptions = {
	subjectId?: string;
	rounds?: import('../support/event-builders').RoundCreatedEventPayload[];
	leaderboard?: import('../support/event-builders').LeaderboardSnapshotResponsePayload;
	tags?: import('../support/event-builders').TagListResponsePayload;
	profiles?: Record<string, unknown>;
	clubInfo?: {
		uuid?: string;
		name?: string;
		icon_url?: string | null;
	};
};

export type WsEmitOptions = {
	validate?: boolean;
};

export type WsConnectOptions = {
	timeoutMs?: number;
	minSubscriptions?: number;
	requiredSubjects?: string[];
};

export type WsRunScenarioOptions = {
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

type ScenarioDocument = {
	steps?: MaterializedScenarioStep[];
	[key: string]: unknown;
};

type ScenarioFixtureStep = MaterializedScenarioStep & {
	contract_subject?: string;
	payload_overrides?: unknown;
};

function applySubjectScope(subject: string, subjectId: string): string {
	return subject.replace('{scope_id}', subjectId).replace('{scope}', subjectId);
}

function materializeScenarioStep(
	step: ScenarioFixtureStep,
	subjectId: string
): MaterializedScenarioStep {
	if (step.subject) {
		return {
			...step,
			subject: applySubjectScope(step.subject, subjectId)
		};
	}

	if (!step.contract_subject) {
		throw new Error('Scenario step is missing both "subject" and "contract_subject"');
	}

	const contract = findExactEventContract(step.contract_subject);
	if (!contract) {
		throw new Error(`Scenario contract not found: ${step.contract_subject}`);
	}

	const subjectPattern = contract.subject_pattern || contract.subject;
	const subject = applySubjectScope(subjectPattern, subjectId);
	const payload = buildPayloadFromContract(contract, step.payload_overrides);
	return {
		action: step.action,
		validate: step.validate,
		subject,
		payload
	};
}

function loadScenarioFixture(fixturePath: string): ScenarioDocument {
	const repoRoot = path.resolve(import.meta.dirname, '../../..');
	const candidates = [
		path.resolve(repoRoot, 'tests/e2e/scenarios', fixturePath),
		path.resolve(repoRoot, 'tests/e2e/scenarios', fixturePath.replace('contracts/scenarios/', '')),
		path.resolve(repoRoot, 'cypress/fixtures', fixturePath)
	];
	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			return JSON.parse(fs.readFileSync(candidate, 'utf-8')) as ScenarioDocument;
		}
	}
	throw new Error(`Scenario fixture not found: ${fixturePath} (tried ${candidates.join(', ')})`);
}

export function arrangeSnapshot(
	mockNats: PlaywrightMockNats,
	options: ArrangeSnapshotOptions = {}
): void {
	const subjectId = options.subjectId ?? 'guild-123';
	stubRoundList(mockNats, subjectId, options);
	stubLeaderboard(mockNats, subjectId, options);
	stubTags(mockNats, subjectId, options);
	stubClubInfo(mockNats, subjectId, options);
}

function stubRoundList(
	mockNats: PlaywrightMockNats,
	subjectId: string,
	options: ArrangeSnapshotOptions
): void {
	const payload = buildRoundListSnapshot({
		rounds: options.rounds ?? [],
		profiles: options.profiles ?? {}
	});
	mockNats.stubRequest(`round.list.request.v2.${subjectId}`, payload);
}

function stubLeaderboard(
	mockNats: PlaywrightMockNats,
	subjectId: string,
	options: ArrangeSnapshotOptions
): void {
	const payload = options.leaderboard ?? buildLeaderboardSnapshot({ guild_id: subjectId });
	mockNats.stubRequest(`leaderboard.snapshot.request.v2.${subjectId}`, payload);
}

function stubTags(
	mockNats: PlaywrightMockNats,
	subjectId: string,
	options: ArrangeSnapshotOptions
): void {
	const payload = options.tags ?? buildTagListSnapshot({ guild_id: subjectId });
	mockNats.stubRequest(`leaderboard.tag.list.requested.v1.${subjectId}`, payload);
}

function stubClubInfo(
	mockNats: PlaywrightMockNats,
	subjectId: string,
	options: ArrangeSnapshotOptions
): void {
	const payload = {
		uuid: options.clubInfo?.uuid ?? subjectId,
		name: options.clubInfo?.name ?? 'Test Club',
		icon_url: options.clubInfo?.icon_url ?? null
	};
	mockNats.stubRequest(`club.info.request.v2.${subjectId}`, payload);
}

export function wsEmit(
	mockNats: PlaywrightMockNats,
	subject: string,
	payload: unknown,
	options?: WsEmitOptions
): void {
	if (options?.validate !== false) {
		try {
			validatePayloadAgainstContract(subject, payload);
		} catch {
			// validation failures are non-fatal in tests
		}
	}
	mockNats.publishEvent(subject, payload);
}

export function wsStubRequest(
	mockNats: PlaywrightMockNats,
	subject: string,
	payload: unknown
): void {
	mockNats.stubRequest(subject, payload);
}

export async function wsConnect(
	mockNats: PlaywrightMockNats,
	options: WsConnectOptions = {}
): Promise<void> {
	const timeoutMs = options.timeoutMs ?? 10_000;
	const pollIntervalMs = 100;
	const startedAt = Date.now();

	while (true) {
		if (checkSubscriptions(mockNats, options)) return;
		if (Date.now() - startedAt >= timeoutMs) throw buildTimeoutError(mockNats, options, timeoutMs);
		await new Promise((r) => setTimeout(r, pollIntervalMs));
	}
}

function buildTimeoutError(
	mockNats: PlaywrightMockNats,
	options: WsConnectOptions,
	timeoutMs: number
): Error {
	const debugState = mockNats.getDebugState();
	const discovered = new Set([...debugState.localSubjects, ...debugState.protocolSubjects]);
	const expectedMinSubscriptions =
		options.minSubscriptions ?? ((options.requiredSubjects?.length ?? 0) > 0 ? 1 : 0);
	return new Error(
		[
			`Timed out waiting for websocket subscriptions after ${timeoutMs}ms`,
			`expected_min_subscriptions=${expectedMinSubscriptions}`,
			`required_subjects=${options.requiredSubjects?.join(',') || '(none)'}`,
			`discovered_subjects=${[...discovered].join(',') || '(none)'}`
		].join('\n')
	);
}

function checkSubscriptions(mockNats: PlaywrightMockNats, options: WsConnectOptions): boolean {
	const requiredSubjects = options.requiredSubjects ?? [];
	const minSubscriptions = options.minSubscriptions ?? (requiredSubjects.length > 0 ? 1 : 0);
	const debugState = mockNats.getDebugState();
	const discovered = new Set([...debugState.localSubjects, ...debugState.protocolSubjects]);
	const missing = requiredSubjects.filter((s) => !discovered.has(s));

	return discovered.size >= minSubscriptions && missing.length === 0;
}

export function wsRunScenario(
	mockNats: PlaywrightMockNats,
	fixturePath: string,
	options: WsRunScenarioOptions = {}
): void {
	const doc = loadScenarioFixture(fixturePath);
	const steps = (doc.steps ?? []) as ScenarioFixtureStep[];
	const subjectId = options.subjectId ?? 'guild-123';

	steps.forEach((rawStep) => {
		const step = materializeScenarioStep(rawStep, subjectId);
		const action = step.action ?? options.defaultAction ?? 'emit';
		if (action === 'stub') {
			mockNats.stubRequest(step.subject, step.payload);
		} else {
			mockNats.publishEvent(step.subject, step.payload);
		}
	});
}

export function wsAssertPublished(
	mockNats: PlaywrightMockNats,
	subject: string,
	predicate?: (entry: PublishedMessage) => boolean
): PublishedMessage[] {
	const messages = mockNats.getPublishedMessages().filter((e) => e.subject === subject);
	if (messages.length === 0) {
		throw new Error(`Expected published message on subject "${subject}"`);
	}
	if (predicate && !messages.some((e) => predicate(e))) {
		throw new Error(`No published message on "${subject}" satisfied predicate`);
	}
	return messages;
}
