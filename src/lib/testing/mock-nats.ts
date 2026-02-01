import { vi } from 'vitest';

interface MockMessage {
	subject: string;
	data: unknown;
	headers?: Record<string, string>;
}

interface MockSubscription {
	subject: string;
	handler: (msg: MockMessage) => void;
}

class MockNatsConnection {
	private subscriptions: MockSubscription[] = [];
	private closed = false;

	// Simulate receiving a message
	simulateMessage(subject: string, data: unknown, headers?: Record<string, string>): void {
		this.subscriptions
			.filter((sub) => this.matchSubject(sub.subject, subject))
			.forEach((sub) => sub.handler({ subject, data, headers }));
	}

	// Subscribe mock
	subscribe(subject: string) {
		const messages: MockMessage[] = [];
		let resolver: ((value: IteratorResult<MockMessage>) => void) | null = null;

		const subscription = {
			subject,
			handler: (msg: MockMessage) => {
				if (resolver) {
					resolver({ value: msg, done: false });
					resolver = null;
				} else {
					messages.push(msg);
				}
			}
		};

		this.subscriptions.push(subscription);

		return {
			[Symbol.asyncIterator]: () => ({
				next: () =>
					new Promise<IteratorResult<MockMessage>>((resolve) => {
						if (messages.length > 0) {
							resolve({ value: messages.shift()!, done: false });
						} else {
							resolver = resolve;
						}
					})
			}),
			unsubscribe: () => {
				const idx = this.subscriptions.indexOf(subscription);
				if (idx >= 0) this.subscriptions.splice(idx, 1);
			}
		};
	}

	// Publish mock (no-op, but can be spied)
	publish = vi.fn();

	// Headers mock
	headers() {
		const h = new Map<string, string[]>();
		return {
			append: (key: string, value: string) => {
				const existing = h.get(key) || [];
				existing.push(value);
				h.set(key, existing);
			},
			get: (key: string) => h.get(key),
			[Symbol.iterator]: () => h.entries()
		};
	}

	// Status mock
	status() {
		return {
			[Symbol.asyncIterator]: () => ({
				next: () => new Promise(() => {}) // Never resolves (no status changes in tests)
			})
		};
	}

	// Close mock
	close = vi.fn(() => {
		this.closed = true;
	});

	// Subject matching (supports wildcards)
	private matchSubject(pattern: string, subject: string): boolean {
		const patternParts = pattern.split('.');
		const subjectParts = subject.split('.');

		for (let i = 0; i < patternParts.length; i++) {
			if (patternParts[i] === '>') return true;
			if (patternParts[i] === '*') continue;
			if (patternParts[i] !== subjectParts[i]) return false;
		}

		return patternParts.length === subjectParts.length;
	}
}

// Factory function
export function createMockNatsConnection(): MockNatsConnection {
	return new MockNatsConnection();
}

// Mock the connect function
export function mockNatsConnect() {
	const mockConnection = createMockNatsConnection();

	return {
		connect: vi.fn().mockResolvedValue(mockConnection),
		connection: mockConnection
	};
}
