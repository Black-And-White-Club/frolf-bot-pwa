import { Server, WebSocket as MockWebSocket } from 'mock-socket';

export interface PublishedMessage {
	subject: string;
	payload: unknown;
}

export type MockNatsDebugState = {
	localSubjects: string[];
	protocolSubjects: string[];
	requestStubSubjects: string[];
	publishedCount: number;
	localDispatchesBySubject: Record<string, number>;
	localHandlerErrors: string[];
};

export interface MockNatsServer {
	server: Server;
	publishEvent: (subject: string, payload: unknown) => void;
	stubRequest: (subject: string, responsePayload: unknown) => void;
	subscribe: (subject: string, handler: (payload: unknown) => void) => () => void;
	publish: (subject: string, payload: unknown) => void;
	request: (subject: string, payload: unknown, timeoutMs?: number) => Promise<unknown>;
	getPublishedMessages: () => PublishedMessage[];
	getDebugState: () => MockNatsDebugState;
	close: () => void;
}

export function createMockNatsServer(url: string): MockNatsServer {
	const server = new Server(url);
	const clients: Array<{ readyState: number; send: (data: string) => void }> = [];
	const requestStubs = new Map<string, unknown>();
	const publishedMessages: PublishedMessage[] = [];
	const subjectListeners = new Map<string, Set<(payload: unknown) => void>>();
	const subjectSubscriptions = new Map<string, Set<string>>();
	const localDispatchesBySubject = new Map<string, number>();
	const localHandlerErrors: string[] = [];

	server.on('connection', (socket) => {
		const client = socket as unknown as {
			readyState: number;
			send: (data: string) => void;
			on: (event: 'message', listener: (data: unknown) => void) => void;
		};
		clients.push(client);

		// Handle NATS protocol handshake and messages
		client.on('message', (data: unknown) => {
			const msg = String(data);
			processProtocolMessage(
				msg,
				requestStubs,
				publishedMessages,
				publishEvent,
				client.send.bind(client),
				(subject, sid) => {
					const sids = subjectSubscriptions.get(subject) ?? new Set<string>();
					sids.add(sid);
					subjectSubscriptions.set(subject, sids);
				}
			);
		});

		// Send initial INFO
		client.send(
			'INFO {"server_id":"mock","server_name":"mock","version":"2.10.0","proto":1,"headers":true,"max_payload":1048576,"auth_required":false}\r\n'
		);
	});

	function publishEvent(subject: string, payload: unknown): void {
		const payloadStr = JSON.stringify(payload);
		const sids = subjectSubscriptions.get(subject);

		if (sids && sids.size > 0) {
			sids.forEach((sid) => {
				const msg = `MSG ${subject} ${sid} ${payloadStr.length}\r\n${payloadStr}\r\n`;
				clients.forEach((client) => {
					if (client.readyState === MockWebSocket.OPEN) {
						client.send(msg);
					}
				});
			});
		}

		notifyLocalSubscribers(subject, payload);
	}

	function stubRequest(subject: string, responsePayload: unknown): void {
		requestStubs.set(subject, responsePayload);
	}

	function subscribe(subject: string, handler: (payload: unknown) => void): () => void {
		const handlers = subjectListeners.get(subject) ?? new Set<(payload: unknown) => void>();
		handlers.add(handler);
		subjectListeners.set(subject, handlers);

		return () => {
			const current = subjectListeners.get(subject);
			if (!current) return;
			current.delete(handler);
			if (current.size === 0) {
				subjectListeners.delete(subject);
			}
		};
	}

	function publish(subject: string, payload: unknown): void {
		publishedMessages.push({ subject, payload });
		publishEvent(subject, payload);
	}

	function request(subject: string, payload: unknown, timeoutMs: number = 5000): Promise<unknown> {
		publishedMessages.push({ subject, payload });
		const stubSubject = resolveSubjectStub(subject, requestStubs);
		if (!stubSubject) {
			return new Promise((_, reject) => {
				setTimeout(() => {
					reject(new Error(`No stubbed response for subject "${subject}"`));
				}, timeoutMs);
			});
		}

		return Promise.resolve(requestStubs.get(stubSubject));
	}

	function getPublishedMessages(): PublishedMessage[] {
		return [...publishedMessages];
	}

	function getDebugState(): MockNatsDebugState {
		const dispatchEntries = [...localDispatchesBySubject.entries()].sort(([a], [b]) =>
			a.localeCompare(b)
		);
		return {
			localSubjects: [...subjectListeners.keys()].sort(),
			protocolSubjects: [...subjectSubscriptions.keys()].sort(),
			requestStubSubjects: [...requestStubs.keys()].sort(),
			publishedCount: publishedMessages.length,
			localDispatchesBySubject: Object.fromEntries(dispatchEntries),
			localHandlerErrors: [...localHandlerErrors]
		};
	}

	function notifyLocalSubscribers(subject: string, payload: unknown): void {
		const handlers = subjectListeners.get(subject);
		if (!handlers || handlers.size === 0) {
			return;
		}
		const priorDispatches = localDispatchesBySubject.get(subject) ?? 0;
		let subjectDispatchCount = 0;

		handlers.forEach((handler) => {
			try {
				handler(payload);
				subjectDispatchCount += 1;
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				localHandlerErrors.push(`${subject}: ${message}`);
			}
		});

		localDispatchesBySubject.set(subject, priorDispatches + subjectDispatchCount);
	}

	function close(): void {
		server.close();
		clients.length = 0;
		requestStubs.clear();
		publishedMessages.length = 0;
		subjectListeners.clear();
		subjectSubscriptions.clear();
		localDispatchesBySubject.clear();
		localHandlerErrors.length = 0;
	}

	return {
		server,
		publishEvent,
		stubRequest,
		subscribe,
		publish,
		request,
		getPublishedMessages,
		getDebugState,
		close
	};
}

export function installMockWebSocket(
	win: Window & typeof globalThis,
	mockNats: MockNatsServer
): void {
	const OriginalWebSocket = win.WebSocket;
	const MockServerWebSocket = (mockNats.server as any).WebSocket as typeof WebSocket;

	function shouldMock(url: string): boolean {
		return (
			url.includes('nats.frolf-bot.com') ||
			url.includes('localhost:4443') ||
			url.includes('127.0.0.1:4443')
		);
	}

	function PatchedWebSocket(
		this: unknown,
		url: string | URL,
		protocols?: string | string[]
	): WebSocket {
		const urlStr = url.toString();
		if (shouldMock(urlStr)) {
			return new MockServerWebSocket(urlStr, protocols);
		}
		return new OriginalWebSocket(url, protocols);
	}

	PatchedWebSocket.prototype = OriginalWebSocket.prototype;
	Object.defineProperties(PatchedWebSocket, {
		CONNECTING: { value: OriginalWebSocket.CONNECTING },
		OPEN: { value: OriginalWebSocket.OPEN },
		CLOSING: { value: OriginalWebSocket.CLOSING },
		CLOSED: { value: OriginalWebSocket.CLOSED }
	});

	win.WebSocket = PatchedWebSocket as unknown as typeof WebSocket;
}

function resolveSubjectStub(subject: string, stubs: Map<string, unknown>): string | undefined {
	if (stubs.has(subject)) {
		return subject;
	}

	const lastDot = subject.lastIndexOf('.');
	if (lastDot === -1) {
		return undefined;
	}

	const baseSubject = subject.slice(0, lastDot);
	if (stubs.has(baseSubject)) {
		return baseSubject;
	}

	return undefined;
}

function processProtocolMessage(
	msg: string,
	requestStubs: Map<string, unknown>,
	publishedMessages: PublishedMessage[],
	publishEvent: (subject: string, payload: unknown) => void,
	send: (data: string) => void,
	onSubscribe: (subject: string, sid: string) => void
): void {
	const context: ProtocolMessageContext = {
		msg,
		requestStubs,
		publishedMessages,
		publishEvent,
		send,
		onSubscribe
	};

	let cursor = 0;
	while (cursor < msg.length) {
		const controlLine = readControlLine(msg, cursor);
		if (!controlLine) {
			break;
		}

		cursor = handleProtocolControlLine(controlLine.controlLine, controlLine.nextCursor, context);
	}
}

type ProtocolMessageContext = {
	msg: string;
	requestStubs: Map<string, unknown>;
	publishedMessages: PublishedMessage[];
	publishEvent: (subject: string, payload: unknown) => void;
	send: (data: string) => void;
	onSubscribe: (subject: string, sid: string) => void;
};

type ControlLineData = {
	controlLine: string;
	nextCursor: number;
};

function readControlLine(msg: string, cursor: number): ControlLineData | null {
	const lineEnd = msg.indexOf('\r\n', cursor);
	if (lineEnd === -1) {
		return null;
	}

	return {
		controlLine: msg.slice(cursor, lineEnd).trim(),
		nextCursor: lineEnd + 2
	};
}

function handleProtocolControlLine(
	controlLine: string,
	cursor: number,
	context: ProtocolMessageContext
): number {
	if (!controlLine) {
		return cursor;
	}

	switch (readControlCommand(controlLine)) {
		case 'CONNECT':
			context.send('+OK\r\n');
			return cursor;
		case 'PING':
			context.send('PONG\r\n');
			return cursor;
		case 'SUB':
			handleProtocolSub(controlLine, context);
			return cursor;
		case 'PUB':
			return handleProtocolPub(controlLine, cursor, context);
		case 'HPUB':
			return handleProtocolHpub(controlLine, cursor, context);
		default:
			return cursor;
	}
}

function readControlCommand(controlLine: string): string {
	return controlLine.split(/\s+/, 1)[0] ?? '';
}

function handleProtocolSub(controlLine: string, context: ProtocolMessageContext): void {
	const parsedSub = parseSub(controlLine);
	if (parsedSub) {
		context.onSubscribe(parsedSub.subject, parsedSub.sid);
	}
	context.send('+OK\r\n');
}

function handleProtocolPub(
	controlLine: string,
	cursor: number,
	context: ProtocolMessageContext
): number {
	const parsed = parsePub(controlLine, context.msg, cursor);
	if (!parsed) {
		context.send('+OK\r\n');
		return cursor;
	}

	recordPublished(
		parsed.subject,
		parsed.replyTo,
		parsed.payload,
		context.requestStubs,
		context.publishedMessages,
		context.publishEvent
	);
	context.send('+OK\r\n');
	return parsed.nextCursor;
}

function handleProtocolHpub(
	controlLine: string,
	cursor: number,
	context: ProtocolMessageContext
): number {
	const parsed = parseHpub(controlLine, context.msg, cursor);
	if (!parsed) {
		context.send('+OK\r\n');
		return cursor;
	}

	recordPublished(
		parsed.subject,
		parsed.replyTo,
		parsed.payload,
		context.requestStubs,
		context.publishedMessages,
		context.publishEvent
	);
	context.send('+OK\r\n');
	return parsed.nextCursor;
}

function parseSub(controlLine: string): { subject: string; sid: string } | null {
	const parts = controlLine.split(/\s+/);
	if (parts.length < 3) {
		return null;
	}

	const subject = parts[1];
	const sid = parts[parts.length - 1];
	if (!subject || !sid) {
		return null;
	}

	return { subject, sid };
}

function parsePub(
	controlLine: string,
	msg: string,
	payloadCursor: number
): { subject: string; replyTo?: string; payload: unknown; nextCursor: number } | null {
	const parts = controlLine.split(/\s+/);
	if (parts.length < 3) return null;

	const subject = parts[1];
	if (!subject) return null;

	let replyTo: string | undefined;
	let payloadBytes: number;

	if (parts.length === 4) {
		replyTo = parts[2];
		payloadBytes = Number(parts[3]);
	} else {
		payloadBytes = Number(parts[2]);
	}

	if (!Number.isFinite(payloadBytes) || payloadBytes < 0) {
		return null;
	}

	const payloadRaw = msg.slice(payloadCursor, payloadCursor + payloadBytes);
	let nextCursor = payloadCursor + payloadBytes;
	if (msg.slice(nextCursor, nextCursor + 2) === '\r\n') {
		nextCursor += 2;
	}

	return {
		subject,
		replyTo,
		payload: parsePayload(payloadRaw),
		nextCursor
	};
}

function parseHpub(
	controlLine: string,
	msg: string,
	frameCursor: number
): { subject: string; replyTo?: string; payload: unknown; nextCursor: number } | null {
	const parts = controlLine.split(/\s+/);
	if (parts.length < 4) return null;

	const subject = parts[1];
	if (!subject) return null;

	let replyTo: string | undefined;
	let headerBytes: number;
	let totalBytes: number;

	if (parts.length === 5) {
		replyTo = parts[2];
		headerBytes = Number(parts[3]);
		totalBytes = Number(parts[4]);
	} else {
		headerBytes = Number(parts[2]);
		totalBytes = Number(parts[3]);
	}

	if (
		!Number.isFinite(headerBytes) ||
		!Number.isFinite(totalBytes) ||
		headerBytes < 0 ||
		totalBytes < headerBytes
	) {
		return null;
	}

	const frame = msg.slice(frameCursor, frameCursor + totalBytes);
	let nextCursor = frameCursor + totalBytes;
	if (msg.slice(nextCursor, nextCursor + 2) === '\r\n') {
		nextCursor += 2;
	}

	const payloadRaw = frame.slice(headerBytes).replace(/^\r\n+/, '');

	return {
		subject,
		replyTo,
		payload: parsePayload(payloadRaw),
		nextCursor
	};
}

function parsePayload(payloadRaw: string): unknown {
	try {
		return JSON.parse(payloadRaw);
	} catch {
		return payloadRaw;
	}
}

function recordPublished(
	subject: string,
	replyTo: string | undefined,
	payload: unknown,
	requestStubs: Map<string, unknown>,
	publishedMessages: PublishedMessage[],
	publishEvent: (subject: string, payload: unknown) => void
): void {
	publishedMessages.push({ subject, payload });

	const stubSubject = resolveSubjectStub(subject, requestStubs);
	if (!replyTo || !stubSubject) {
		return;
	}

	const stubData = requestStubs.get(stubSubject);
	// mock-socket message handler is synchronous, so we use setTimeout
	// to let the app finish subscribing to the inbox before we publish the reply
	setTimeout(() => {
		publishEvent(replyTo, stubData);
	}, 10);
}
