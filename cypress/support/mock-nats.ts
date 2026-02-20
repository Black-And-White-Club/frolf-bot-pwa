import { Server, WebSocket as MockWebSocket } from 'mock-socket';

export interface MockNatsServer {
	server: Server;
	publishEvent: (subject: string, payload: unknown) => void;
	stubRequest: (subject: string, responsePayload: unknown) => void;
	close: () => void;
}

export function createMockNatsServer(url: string): MockNatsServer {
	const server = new Server(url);
	const clients: MockWebSocket[] = [];
	const requestStubs = new Map<string, unknown>();

	server.on('connection', (socket) => {
		clients.push(socket);

		// Handle NATS protocol handshake and messages
		socket.on('message', (data) => {
			const msg = data.toString();

			// Respond to CONNECT with OK
			if (msg.startsWith('CONNECT')) {
				socket.send('+OK\r\n');
			}

			// Respond to PING with PONG
			if (msg.startsWith('PING')) {
				socket.send('PONG\r\n');
			}

			// Handle SUB commands
			if (msg.startsWith('SUB')) {
				socket.send('+OK\r\n');
			}

			// Handle PUB commands (incoming requests from the app)
			// Format: PUB <subject> [reply-to] <#bytes>\r\n[payload]\r\n
			// Or with headers: HPUB <subject> [reply-to] <#header bytes> <#total bytes>\r\n[headers]\r\n\r\n[payload]\r\n
			if (msg.startsWith('PUB ') || msg.startsWith('HPUB ')) {
				const lines = msg.split('\r\n');
				const controlLine = lines[0].split(' ');
				const subject = controlLine[1];
				
				// Identify if there is a reply-to subject (for request/response pattern)
				let replyTo = '';
				if (controlLine.length >= 4 && (controlLine[2].startsWith('_INBOX.') || controlLine[2].length > 10)) {
					replyTo = controlLine[2];
				}

				if (replyTo && requestStubs.has(subject)) {
					// We have a stub for this request, publish it back to the reply-to inbox
					const stubData = requestStubs.get(subject);
					// mock-socket message handler is synchronous, so we use setTimeout
					// to let the app finish subscribing to the inbox before we publish the reply
					setTimeout(() => {
						publishEvent(replyTo, stubData);
					}, 10);
				}
				socket.send('+OK\r\n');
			}
		});

		// Send initial INFO
		socket.send('INFO {"server_id":"mock","version":"2.10.0","proto":1}\r\n');
	});

	function publishEvent(subject: string, payload: unknown): void {
		const payloadStr = JSON.stringify(payload);
		const msg = `MSG ${subject} 1 ${payloadStr.length}\r\n${payloadStr}\r\n`;

		clients.forEach((client) => {
			if (client.readyState === MockWebSocket.OPEN) {
				client.send(msg);
			}
		});
	}

	function stubRequest(subject: string, responsePayload: unknown): void {
		requestStubs.set(subject, responsePayload);
	}

	function close(): void {
		server.close();
		clients.length = 0;
		requestStubs.clear();
	}

	return { server, publishEvent, stubRequest, close };
}
