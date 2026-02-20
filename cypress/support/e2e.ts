import './commands';
import { createMockNatsServer, MockNatsServer } from './mock-nats';

let mockNats: MockNatsServer | null = null;

beforeEach(() => {
	// Create mock NATS server before each test
	mockNats = createMockNatsServer('wss://nats.frolf-bot.com:443');

	// Inject mock WebSocket into window
	cy.window().then((win) => {
		// Store original WebSocket
		const OriginalWebSocket = win.WebSocket;

		// Override with mock-socket's WebSocket for NATS URL
		win.WebSocket = class extends OriginalWebSocket {
			constructor(url: string | URL, protocols?: string | string[]) {
				super(url, protocols);
				const urlStr = url.toString();
				if (urlStr.includes('nats.frolf-bot.com')) {
					// Use mock-socket for NATS connections
					return new (mockNats!.server as any).WebSocket(urlStr, protocols) as any;
				}
				// Use real WebSocket for other connections
				return new OriginalWebSocket(url, protocols) as any;
			}
		} as typeof WebSocket;
	});
});

afterEach(() => {
	if (mockNats) {
		mockNats.close();
		mockNats = null;
	}
});

// Expose mock server for tests
Cypress.Commands.add('getMockNats', () => {
	return cy.wrap(mockNats);
});

Cypress.Commands.add('publishNatsEvent', (subject: string, payload: unknown) => {
	if (mockNats) {
		mockNats.publishEvent(subject, payload);
	}
});

Cypress.Commands.add('stubNatsRequest', (subject: string, payload: unknown) => {
	if (mockNats) {
		mockNats.stubRequest(subject, payload);
	}
});
