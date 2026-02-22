import type { MockNatsServer } from './mock-nats';

let mockNats: MockNatsServer | null = null;

export function setMockNats(server: MockNatsServer | null): void {
	mockNats = server;
}

export function getMockNats(): MockNatsServer | null {
	return mockNats;
}
