// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_USE_MOCK: 'false'
	}
}));

const authState = {
	isAuthenticated: true,
	token: 'test-token',
	user: {
		activeClubUuid: 'club-123',
		guildId: 'guild-123',
		clubs: [{ club_uuid: 'club-123', role: 'admin' }],
		linkedProviders: []
	},
	status: 'authenticated',
	initialize: vi.fn(async () => ({ authenticated: true, switchedClubWithDataLoad: true })),
	switchClub: vi.fn(async () => true),
	signOut: vi.fn()
};

const natsState = {
	connect: vi.fn(async () => {}),
	disconnect: vi.fn(async () => {}),
	onReconnect: vi.fn(() => () => {}),
	destroy: vi.fn()
};

vi.mock('../auth.svelte', () => ({
	auth: authState
}));

vi.mock('../nats.svelte', () => ({
	nats: natsState
}));

vi.mock('../subscriptions.svelte', () => ({
	subscriptionManager: {
		start: vi.fn(),
		stop: vi.fn()
	}
}));

vi.mock('../dataLoader.svelte', () => ({
	dataLoader: {
		loadInitialData: vi.fn(async () => {}),
		clearData: vi.fn()
	}
}));

vi.mock('../club.svelte', () => ({
	clubService: {
		loadClubInfo: vi.fn(async () => {}),
		clear: vi.fn()
	}
}));

vi.mock('$lib/otel/tracing', () => ({
	initTracing: vi.fn(async () => {})
}));

vi.mock('$lib/otel/metrics', () => ({
	initMetrics: vi.fn(async () => {})
}));

vi.mock('$lib/otel/logging', () => ({
	initLogs: vi.fn(async () => {})
}));

describe('appInit reconnect recovery', () => {
	beforeEach(() => {
		vi.resetModules();
		natsState.connect.mockClear();
		natsState.onReconnect.mockClear();
		authState.initialize.mockClear();
		authState.initialize.mockResolvedValue({
			authenticated: true,
			switchedClubWithDataLoad: true
		});
		authState.isAuthenticated = true;
		authState.token = 'test-token';
	});

	it('registers reconnect recovery when auth already switched clubs and preloaded data', async () => {
		const { appInit } = await import('../init.svelte');

		await appInit.initialize();

		expect(authState.initialize).toHaveBeenCalledTimes(1);
		expect(natsState.connect).not.toHaveBeenCalled();
		expect(natsState.onReconnect).toHaveBeenCalledTimes(1);
	});
});

describe('onClubJoined', () => {
	beforeEach(() => {
		vi.resetModules();
		natsState.connect.mockClear();
		natsState.disconnect.mockClear();
		natsState.onReconnect.mockClear();
		authState.initialize.mockClear();
		authState.switchClub.mockClear();
		authState.switchClub.mockResolvedValue(true);
		authState.isAuthenticated = true;
		authState.token = 'test-token';
		// Restore clubs to default between tests
		authState.user = {
			activeClubUuid: 'club-123',
			guildId: 'guild-123',
			clubs: [{ club_uuid: 'club-123', role: 'admin' }],
			linkedProviders: []
		};
	});

	it('returning member: fetches scoped token, reconnects NATS, preserves live mode', async () => {
		authState.initialize.mockResolvedValue({ authenticated: true, switchedClubWithDataLoad: true });
		const { appInit } = await import('../init.svelte');
		await appInit.initialize();

		await appInit.onClubJoined('club-new');

		expect(authState.switchClub).toHaveBeenCalledWith('club-new', { reloadData: false });
		expect(natsState.disconnect).toHaveBeenCalledTimes(1);
		expect(natsState.connect).toHaveBeenCalledWith('test-token');
		expect(appInit.needsClub).toBe(false);
		expect(appInit.mode).toBe('live');
	});

	it('first club join: reconnects NATS and transitions from needs-club to live mode', async () => {
		authState.initialize.mockResolvedValue({
			authenticated: true,
			switchedClubWithDataLoad: false
		});
		authState.user = { ...authState.user, clubs: [] };
		const { appInit } = await import('../init.svelte');
		await appInit.initialize();

		expect(appInit.needsClub).toBe(true);
		expect(natsState.onReconnect).not.toHaveBeenCalled();

		await appInit.onClubJoined('club-new');

		expect(authState.switchClub).toHaveBeenCalledWith('club-new', { reloadData: false });
		expect(natsState.disconnect).toHaveBeenCalledTimes(1);
		expect(natsState.connect).toHaveBeenCalledWith('test-token');
		expect(appInit.needsClub).toBe(false);
		expect(appInit.mode).toBe('live');
		expect(appInit.status).toBe('ready');
		expect(natsState.onReconnect).toHaveBeenCalledTimes(1);
	});
});
