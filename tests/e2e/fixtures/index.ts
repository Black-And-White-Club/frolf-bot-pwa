import { test as base, expect } from '@playwright/test';
import { installMockNats, type PlaywrightMockNats } from './mock-nats.fixture';
import {
	arrangeAuth,
	arrangeGuest,
	visitMockMode,
	visitWithToken,
	type ArrangeAuthOptions,
	type ArrangeGuestOptions
} from './auth.fixture';
import {
	arrangeSnapshot,
	wsConnect,
	wsEmit,
	wsStubRequest,
	wsRunScenario,
	wsAssertPublished,
	type ArrangeSnapshotOptions,
	type WsConnectOptions,
	type WsEmitOptions,
	type WsRunScenarioOptions
} from './snapshot.fixture';

export type {
	ArrangeAuthOptions,
	ArrangeGuestOptions,
	ArrangeSnapshotOptions,
	WsConnectOptions,
	WsEmitOptions,
	WsRunScenarioOptions
};
export type { PublishedMessage } from './mock-nats.fixture';

export type FrolfFixtures = {
	mockNats: PlaywrightMockNats;
	arrangeAuth: (options?: ArrangeAuthOptions) => Promise<void>;
	arrangeGuest: (options?: ArrangeGuestOptions) => Promise<void>;
	arrangeSnapshot: (options?: ArrangeSnapshotOptions) => void;
	wsConnect: (options?: WsConnectOptions) => Promise<void>;
	wsEmit: (subject: string, payload: unknown, options?: WsEmitOptions) => void;
	wsStubRequest: (subject: string, payload: unknown, options?: WsEmitOptions) => void;
	wsRunScenario: (fixturePath: string, options?: WsRunScenarioOptions) => void;
	wsAssertPublished: (
		subject: string,
		predicate?: (e: import('./mock-nats.fixture').PublishedMessage) => boolean
	) => import('./mock-nats.fixture').PublishedMessage[];
	visitMockMode: (path?: string) => Promise<void>;
	visitWithToken: (path?: string, token?: string) => Promise<void>;
};

export const test = base.extend<FrolfFixtures>({
	mockNats: async ({ page }, use) => {
		const mock = await installMockNats(page);
		await use(mock);
		mock.close();
	},

	arrangeAuth: async ({ page }, use) => {
		await use((options?: ArrangeAuthOptions) => arrangeAuth(page, options));
	},

	arrangeGuest: async ({ page }, use) => {
		await use((options?: ArrangeGuestOptions) => arrangeGuest(page, options));
	},

	arrangeSnapshot: async ({ mockNats }, use) => {
		await use((options?: ArrangeSnapshotOptions) => arrangeSnapshot(mockNats, options));
	},

	wsConnect: async ({ mockNats }, use) => {
		await use((options?: WsConnectOptions) => wsConnect(mockNats, options));
	},

	wsEmit: async ({ mockNats }, use) => {
		await use((subject, payload, options) => wsEmit(mockNats, subject, payload, options));
	},

	wsStubRequest: async ({ mockNats }, use) => {
		await use((subject, payload, options) => wsStubRequest(mockNats, subject, payload, options));
	},

	wsRunScenario: async ({ mockNats }, use) => {
		await use((fixturePath, options) => wsRunScenario(mockNats, fixturePath, options));
	},

	wsAssertPublished: async ({ mockNats }, use) => {
		await use((subject, predicate) => wsAssertPublished(mockNats, subject, predicate));
	},

	visitMockMode: async ({ page }, use) => {
		await use((path) => visitMockMode(page, path));
	},

	visitWithToken: async ({ page }, use) => {
		await use((path, token) => visitWithToken(page, path, token));
	}
});

export { expect };
