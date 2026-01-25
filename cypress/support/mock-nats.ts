import { Server, WebSocket as MockWebSocket } from 'mock-socket';

export interface MockNatsServer {
	server: Server;
	publishEvent: (subject: string, payload: unknown) => void;
	close: () => void;
}

export function createMockNatsServer(url: string): MockNatsServer {
	const server = new Server(url);
	const clients: MockWebSocket[] = [];

	server.on('connection', (socket) => {
		clients.push(socket);

		// Handle NATS protocol handshake
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

	function close(): void {
		server.close();
		clients.length = 0;
	}

	return { server, publishEvent, close };
}
