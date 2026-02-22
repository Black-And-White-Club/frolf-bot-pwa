import type { PublishedMessage } from '../mock-nats';

function wrapVoid(): Cypress.Chainable<void> {
	return cy.wrap(undefined, { log: false }) as Cypress.Chainable<void>;
}

function payloadPreview(payload: unknown, maxLength: number = 220): string {
	try {
		const raw = JSON.stringify(payload);
		if (raw.length <= maxLength) {
			return raw;
		}
		return `${raw.slice(0, maxLength)}...`;
	} catch {
		return String(payload);
	}
}

Cypress.Commands.add('step', (message: string, details?: unknown) => {
	Cypress.log({
		name: 'step',
		message,
		consoleProps: () => ({
			details
		})
	});

	if (details !== undefined) {
		cy.log(`[step] ${message}: ${payloadPreview(details, 180)}`);
		return wrapVoid();
	}

	cy.log(`[step] ${message}`);
	return wrapVoid();
});

Cypress.Commands.add(
	'dumpPublishedMessages',
	(
		label: string = 'published-messages',
		limit: number = 20
	): Cypress.Chainable<PublishedMessage[]> => {
		const safeLimit = Math.max(0, limit);

		return cy.getMockNats().then((mockNats) => {
			const messages = (mockNats?.getPublishedMessages?.() ?? []) as PublishedMessage[];
			const tail = messages.slice(-safeLimit);
			const subjects = tail.map((entry) => entry.subject);

			Cypress.log({
				name: 'ws',
				message: `${label} (${tail.length})`,
				consoleProps: () => ({
					total: messages.length,
					tail
				})
			});
			cy.log(`[ws] ${label}: ${subjects.join(', ') || '(none)'}`);

			return cy.wrap(tail, { log: false });
		});
	}
);
