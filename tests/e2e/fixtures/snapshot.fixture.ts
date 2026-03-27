import * as fs from 'node:fs';
import * as path from 'node:path';
import type { PlaywrightMockNats, PublishedMessage } from './mock-nats.fixture';
import {
buildLeaderboardSnapshot,
buildRoundListSnapshot,
buildTagListSnapshot
} from '../support/event-builders';
import { validatePayloadAgainstContract } from '../support/ws-contracts';

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

function materializeScenarioStep(
step: MaterializedScenarioStep,
subjectId: string
): MaterializedScenarioStep {
const subject = step.subject.replace('{scope_id}', subjectId).replace('{scope}', subjectId);
return { ...step, subject };
}

function loadScenarioFixture(fixturePath: string): ScenarioDocument {
const repoRoot = path.resolve(import.meta.dirname, '../..');
const candidates = [
path.resolve(repoRoot, 'tests/e2e/scenarios', fixturePath),
path.resolve(
repoRoot,
'tests/e2e/scenarios',
fixturePath.replace('contracts/scenarios/', '')
),
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

const roundsPayload = buildRoundListSnapshot({
rounds: options.rounds ?? [],
profiles: options.profiles ?? {}
});
mockNats.stubRequest(`round.list.request.v2.${subjectId}`, roundsPayload);

const leaderboardPayload =
options.leaderboard ?? buildLeaderboardSnapshot({ guild_id: subjectId });
mockNats.stubRequest(`leaderboard.snapshot.request.v2.${subjectId}`, leaderboardPayload);

const tagsPayload = options.tags ?? buildTagListSnapshot({ guild_id: subjectId });
mockNats.stubRequest(`leaderboard.tag.list.requested.v1.${subjectId}`, tagsPayload);

const clubInfoPayload = {
uuid: options.clubInfo?.uuid ?? subjectId,
name: options.clubInfo?.name ?? 'Test Club',
icon_url: options.clubInfo?.icon_url ?? null
};
mockNats.stubRequest(`club.info.request.v2.${subjectId}`, clubInfoPayload);
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
payload: unknown,
_options?: WsEmitOptions
): void {
mockNats.stubRequest(subject, payload);
}

export async function wsConnect(
mockNats: PlaywrightMockNats,
options: WsConnectOptions = {}
): Promise<void> {
const timeoutMs = options.timeoutMs ?? 10_000;
const minSubscriptions = options.minSubscriptions ?? 1;
const requiredSubjects = options.requiredSubjects ?? [];
const pollIntervalMs = 100;
const startedAt = Date.now();

while (true) {
const debugState = mockNats.getDebugState();
const discovered = new Set([...debugState.localSubjects, ...debugState.protocolSubjects]);
const missing = requiredSubjects.filter((s) => !discovered.has(s));

if (discovered.size >= minSubscriptions && missing.length === 0) {
return;
}

if (Date.now() - startedAt >= timeoutMs) {
throw new Error(
[
`Timed out waiting for websocket subscriptions after ${timeoutMs}ms`,
`expected_min_subscriptions=${minSubscriptions}`,
`required_subjects=${requiredSubjects.join(',') || '(none)'}`,
`discovered_subjects=${[...discovered].join(',') || '(none)'}`
].join('\n')
);
}

await new Promise((r) => setTimeout(r, pollIntervalMs));
}
}

export function wsRunScenario(
mockNats: PlaywrightMockNats,
fixturePath: string,
options: WsRunScenarioOptions = {}
): void {
const doc = loadScenarioFixture(fixturePath);
const steps = (doc.steps ?? []) as MaterializedScenarioStep[];
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
