import './commands';
import { createMockNatsServer, installMockWebSocket, type PublishedMessage } from './mock-nats';
import { getMockNats, setMockNats } from './mock-state';

type CypressNatsBridge = {
	subscribe: (subject: string, handler: (payload: unknown) => void) => () => void;
	publish: (subject: string, payload: unknown) => void;
	request: (subject: string, payload: unknown, timeoutMs?: number) => Promise<unknown>;
};

type WindowWithBridge = Window &
	typeof globalThis & {
		__FROLF_CYPRESS_NATS__?: CypressNatsBridge;
	};

type CypressEnvMap = Record<string, unknown>;

function envValue(key: string): unknown {
	const env = Cypress.config('env') as CypressEnvMap | undefined;
	return env?.[key];
}

function envFlag(key: string, defaultValue: boolean): boolean {
	const value = envValue(key);
	if (value === undefined) {
		return defaultValue;
	}
	if (typeof value === 'boolean') {
		return value;
	}
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (normalized === 'true') {
			return true;
		}
		if (normalized === 'false') {
			return false;
		}
	}
	return Boolean(value);
}

function envNumber(key: string, defaultValue: number): number {
	const value = envValue(key);
	if (value === undefined) {
		return defaultValue;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : defaultValue;
}

const TEST_LOGS_ENABLED = envFlag('DEBUG_TEST_LOGS', true);
const FAILURE_WS_LOG_LIMIT = envNumber('FAILURE_WS_LOG_LIMIT', 15);

function payloadPreview(payload: unknown, maxLength: number = 180): string {
	try {
		const raw = JSON.stringify(payload);
		if (raw.length <= maxLength) {
			return raw;
		}
		return `${raw.slice(0, maxLength)}...`;
	} catch {
		return String(payload);
	}
}

function recentPublishedMessages(limit: number = FAILURE_WS_LOG_LIMIT): PublishedMessage[] {
	const mockNats = getMockNats();
	if (!mockNats) {
		return [];
	}
	const all = mockNats.getPublishedMessages();
	const safeLimit = Math.max(0, limit);
	return all.slice(-safeLimit);
}

function mockStateSummary(): string {
	const mockNats = getMockNats();
	if (!mockNats) {
		return 'mock_state=n/a';
	}

	const debugState = mockNats.getDebugState();
	const localSubjectList = debugState.localSubjects.join(',') || '(none)';
	const protocolSubjectList = debugState.protocolSubjects.join(',') || '(none)';
	const localDispatches =
		Object.entries(debugState.localDispatchesBySubject)
			.map(([subject, count]) => `${subject}:${count}`)
			.join(',') || '(none)';
	const localErrors = debugState.localHandlerErrors.join(' | ') || '(none)';
	return [
		`local_subjects=${debugState.localSubjects.length}`,
		`protocol_subjects=${debugState.protocolSubjects.length}`,
		`request_stubs=${debugState.requestStubSubjects.length}`,
		`published_count=${debugState.publishedCount}`,
		`local_list=${localSubjectList}`,
		`protocol_list=${protocolSubjectList}`,
		`local_dispatches=${localDispatches}`,
		`local_errors=${localErrors}`
	].join(', ');
}

function testTitleFromRunnable(runnable?: Mocha.Runnable): string {
	if (!runnable) {
		return 'unknown test';
	}
	if (typeof runnable.fullTitle === 'function') {
		return runnable.fullTitle();
	}
	return runnable.title || 'unknown test';
}

function domSummary(win?: Window): string {
	if (!win?.document) {
		return 'dom=n/a';
	}

	const roundCards = win.document.querySelectorAll('[data-testid="round-card"]').length;
	const leaderboardRows = win.document.querySelectorAll('[data-testid^="leaderboard-row-"]').length;
	const errorText = win.document.querySelector('.text-red-400')?.textContent?.trim();
	return `roundCards=${roundCards}, leaderboardRows=${leaderboardRows}, error=${errorText || 'none'}`;
}

function attachFailureDiagnostics(error: Error, runnable?: Mocha.Runnable): Error {
	const cypressWithState = Cypress as unknown as { state: (key: string) => unknown };
	const win = cypressWithState.state('window') as Window | undefined;
	const url = win?.location?.href ?? 'unknown';
	const title = testTitleFromRunnable(runnable);
	const wsTail = recentPublishedMessages();
	const wsPreview =
		wsTail.map((entry) => `${entry.subject} ${payloadPreview(entry.payload, 120)}`).join('\n') ||
		'(none)';
	const dom = domSummary(win);
	const mockState = mockStateSummary();

	const diagnosticBlock = [
		'[Cypress Diagnostics]',
		`test=${title}`,
		`url=${url}`,
		`ws_published_tail=${wsTail.length}`,
		`mock=${mockState}`,
		`dom=${dom}`,
		'ws_tail:',
		wsPreview
	].join('\n');

	console.error('[cypress:fail]', diagnosticBlock);
	error.message = `${error.message}\n\n${diagnosticBlock}`;
	return error;
}

Cypress.on('window:before:load', (win) => {
	const mockNats = getMockNats();
	if (!mockNats) {
		return;
	}
	installMockWebSocket(win, mockNats);
	(win as WindowWithBridge).__FROLF_CYPRESS_NATS__ = {
		subscribe: (subject, handler) => mockNats.subscribe(subject, handler),
		publish: (subject, payload) => mockNats.publish(subject, payload),
		request: (subject, payload, timeoutMs) => mockNats.request(subject, payload, timeoutMs)
	};
});

Cypress.on('fail', (error, runnable) => {
	if (!TEST_LOGS_ENABLED) {
		throw error;
	}
	throw attachFailureDiagnostics(error, runnable);
});

beforeEach(function () {
	// Create mock NATS server before each test
	setMockNats(createMockNatsServer('wss://nats.frolf-bot.com:443'));

	if (!TEST_LOGS_ENABLED) {
		return;
	}

	const title = this.currentTest?.fullTitle() ?? 'unknown test';
	Cypress.log({
		name: 'test:start',
		message: title
	});
	console.info(`[cypress:test:start] ${title}`);
});

afterEach(function () {
	const mockNats = getMockNats();

	if (TEST_LOGS_ENABLED) {
		const title = this.currentTest?.fullTitle() ?? 'unknown test';
		const state = this.currentTest?.state ?? 'unknown';
		const duration = this.currentTest?.duration ?? 0;
		const wsTail = recentPublishedMessages(10).map((entry) => entry.subject);

		Cypress.log({
			name: 'test:end',
			message: `${state} (${duration}ms)`
		});
		console.info(
			`[cypress:test:end] ${title} state=${state} duration_ms=${duration} ws_subjects=${wsTail.join(',') || '(none)'}`
		);
	}

	if (mockNats) {
		mockNats.close();
		setMockNats(null);
	}
});
