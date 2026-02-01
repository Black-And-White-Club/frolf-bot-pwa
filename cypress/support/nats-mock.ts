import { Server, WebSocket as MockWebSocket } from 'mock-socket';

interface NatsMockServer {
	server: Server;
	sendMessage: (subject: string, data: unknown, headers?: Record<string, string>) => void;
	close: () => void;
}

export function createNatsMockServer(url: string = 'wss://nats.frolf-bot.com:443'): NatsMockServer {
	const server = new Server(url);

	// Replace global WebSocket
	(globalThis as any).WebSocket = MockWebSocket;

	const sendMessage = (subject: string, data: unknown, headers?: Record<string, string>) => {
		// NATS protocol message format (simplified)
		const message = JSON.stringify({
			subject,
			data,
			headers
		});

		server.clients().forEach((client) => {
			client.send(message);
		});
	};

	const close = () => {
		server.close();
	};

	return { server, sendMessage, close };
}

// Cypress command registration
declare global {
	namespace Cypress {
		interface Chainable {
			mockNats(): Chainable<NatsMockServer>;
			sendNatsMessage(subject: string, data: unknown): Chainable<void>;
		}
	}
}

let currentMock: NatsMockServer | null = null;

Cypress.Commands.add('mockNats', () => {
	if (currentMock) {
		currentMock.close();
	}
	currentMock = createNatsMockServer();
	return cy.wrap(currentMock);
});

Cypress.Commands.add('sendNatsMessage', (subject: string, data: unknown) => {
	if (!currentMock) {
		throw new Error('NATS mock not initialized. Call cy.mockNats() first.');
	}
	currentMock.sendMessage(subject, data);
	return cy.wrap(undefined);
});

// Cleanup after each test
afterEach(() => {
	if (currentMock) {
		currentMock.close();
		currentMock = null;
	}
});
