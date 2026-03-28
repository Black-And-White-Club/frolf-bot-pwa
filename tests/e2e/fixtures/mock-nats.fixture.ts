import type { Page, WebSocketRoute } from '@playwright/test';

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

interface NatsClient {
	send: (data: string) => void;
}

export class PlaywrightMockNats {
	private clients: NatsClient[] = [];
	private subjectSubscriptions = new Map<string, Set<string>>();
	private requestStubs = new Map<string, unknown>();
	private publishedMessages: PublishedMessage[] = [];
	private subjectListeners = new Map<string, Set<(payload: unknown) => void>>();
	private localDispatchesBySubject = new Map<string, number>();
	private localHandlerErrors: string[] = [];

	handleConnection(ws: WebSocketRoute): void {
		const client: NatsClient = { send: (data) => ws.send(data) };
		this.clients.push(client);

		client.send(
			'INFO {"server_id":"mock","server_name":"mock","version":"2.10.0","proto":1,"headers":true,"max_payload":1048576,"auth_required":false}\r\n'
		);

		ws.onMessage((msg) => {
			const text = typeof msg === 'string' ? msg : Buffer.from(msg as Buffer).toString();
			this.processProtocolMessage(text, client.send.bind(client));
		});

		ws.onClose(() => {
			const idx = this.clients.indexOf(client);
			if (idx !== -1) this.clients.splice(idx, 1);
		});
	}

	private processProtocolMessage(msg: string, send: (data: string) => void): void {
		let cursor = 0;
		while (cursor < msg.length) {
			const lineEnd = msg.indexOf('\r\n', cursor);
			if (lineEnd === -1) break;
			const controlLine = msg.slice(cursor, lineEnd).trim();
			cursor = lineEnd + 2;
			if (!controlLine) continue;

			const command = controlLine.split(/\s+/, 1)[0] ?? '';
			switch (command) {
				case 'CONNECT':
					send('+OK\r\n');
					break;
				case 'PING':
					send('PONG\r\n');
					break;
				case 'SUB':
					this.handleSub(controlLine);
					send('+OK\r\n');
					break;
				case 'PUB':
					cursor = this.handlePub(controlLine, msg, cursor);
					send('+OK\r\n');
					break;
				case 'HPUB':
					cursor = this.handleHpub(controlLine, msg, cursor);
					send('+OK\r\n');
					break;
			}
		}
	}

	private handleSub(controlLine: string): void {
		const parts = controlLine.split(/\s+/);
		const subject = parts[1];
		const sid = parts[parts.length - 1];
		if (subject && sid) {
			const sids = this.subjectSubscriptions.get(subject) ?? new Set<string>();
			sids.add(sid);
			this.subjectSubscriptions.set(subject, sids);
		}
	}

	private handlePub(controlLine: string, msg: string, cursor: number): number {
		const parsed = this.parsePub(controlLine, msg, cursor);
		if (parsed) {
			this.recordPublished(parsed.subject, parsed.replyTo, parsed.payload);
			return parsed.nextCursor;
		}
		return cursor;
	}

	private handleHpub(controlLine: string, msg: string, cursor: number): number {
		const parsed = this.parseHpub(controlLine, msg, cursor);
		if (parsed) {
			this.recordPublished(parsed.subject, parsed.replyTo, parsed.payload);
			return parsed.nextCursor;
		}
		return cursor;
	}

	private parsePub(
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

		if (!Number.isFinite(payloadBytes) || payloadBytes < 0) return null;
		const payloadRaw = msg.slice(payloadCursor, payloadCursor + payloadBytes);
		let nextCursor = payloadCursor + payloadBytes;
		if (msg.slice(nextCursor, nextCursor + 2) === '\r\n') nextCursor += 2;

		return { subject, replyTo, payload: this.parsePayload(payloadRaw), nextCursor };
	}

	private parseHpub(
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
		)
			return null;

		const frame = msg.slice(frameCursor, frameCursor + totalBytes);
		let nextCursor = frameCursor + totalBytes;
		if (msg.slice(nextCursor, nextCursor + 2) === '\r\n') nextCursor += 2;
		const payloadRaw = frame.slice(headerBytes).replace(/^\r\n+/, '');

		return { subject, replyTo, payload: this.parsePayload(payloadRaw), nextCursor };
	}

	private parsePayload(raw: string): unknown {
		try {
			return JSON.parse(raw);
		} catch {
			return raw;
		}
	}

	private recordPublished(subject: string, replyTo: string | undefined, payload: unknown): void {
		this.publishedMessages.push({ subject, payload });

		const stubSubject = this.resolveSubjectStub(subject);
		if (!replyTo || !stubSubject) return;

		const stubData = this.requestStubs.get(stubSubject);
		setTimeout(() => {
			this.publishEvent(replyTo, stubData);
		}, 10);
	}

	private resolveSubjectStub(subject: string): string | undefined {
		if (this.requestStubs.has(subject)) return subject;
		const lastDot = subject.lastIndexOf('.');
		if (lastDot === -1) return undefined;
		const base = subject.slice(0, lastDot);
		return this.requestStubs.has(base) ? base : undefined;
	}

	publishEvent(subject: string, payload: unknown): void {
		const payloadStr = JSON.stringify(payload);
		const sids = this.subjectSubscriptions.get(subject);
		if (sids && sids.size > 0) {
			sids.forEach((sid) => {
				const msg = `MSG ${subject} ${sid} ${payloadStr.length}\r\n${payloadStr}\r\n`;
				this.clients.forEach((client) => {
					try {
						client.send(msg);
					} catch {
						// client may have disconnected
					}
				});
			});
		}
		this.notifyLocalSubscribers(subject, payload);
	}

	stubRequest(subject: string, responsePayload: unknown): void {
		this.requestStubs.set(subject, responsePayload);
	}

	subscribe(subject: string, handler: (payload: unknown) => void): () => void {
		const handlers = this.subjectListeners.get(subject) ?? new Set<(payload: unknown) => void>();
		handlers.add(handler);
		this.subjectListeners.set(subject, handlers);
		return () => {
			const current = this.subjectListeners.get(subject);
			if (!current) return;
			current.delete(handler);
			if (current.size === 0) this.subjectListeners.delete(subject);
		};
	}

	private notifyLocalSubscribers(subject: string, payload: unknown): void {
		const handlers = this.subjectListeners.get(subject);
		if (!handlers || handlers.size === 0) return;
		const prior = this.localDispatchesBySubject.get(subject) ?? 0;
		let count = 0;
		handlers.forEach((handler) => {
			try {
				handler(payload);
				count++;
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				this.localHandlerErrors.push(`${subject}: ${message}`);
			}
		});
		this.localDispatchesBySubject.set(subject, prior + count);
	}

	getPublishedMessages(): PublishedMessage[] {
		return [...this.publishedMessages];
	}

	getDebugState(): MockNatsDebugState {
		const dispatchEntries = [...this.localDispatchesBySubject.entries()].sort(([a], [b]) =>
			a.localeCompare(b)
		);
		return {
			localSubjects: [...this.subjectListeners.keys()].sort(),
			protocolSubjects: [...this.subjectSubscriptions.keys()].sort(),
			requestStubSubjects: [...this.requestStubs.keys()].sort(),
			publishedCount: this.publishedMessages.length,
			localDispatchesBySubject: Object.fromEntries(dispatchEntries),
			localHandlerErrors: [...this.localHandlerErrors]
		};
	}

	close(): void {
		this.clients.length = 0;
		this.requestStubs.clear();
		this.publishedMessages.length = 0;
		this.subjectListeners.clear();
		this.subjectSubscriptions.clear();
		this.localDispatchesBySubject.clear();
		this.localHandlerErrors.length = 0;
	}
}

export async function installMockNats(page: Page): Promise<PlaywrightMockNats> {
	const mock = new PlaywrightMockNats();
	await page.routeWebSocket(/nats\.frolf-bot\.com|localhost:4443|127\.0\.0\.1:4443/, (ws) =>
		mock.handleConnection(ws)
	);
	return mock;
}
