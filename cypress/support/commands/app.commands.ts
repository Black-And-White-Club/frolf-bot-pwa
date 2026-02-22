type VisitOptions = {
	onBeforeLoad?: (win: Window & typeof globalThis) => void;
};

type ArrangeAuthOptions = {
	path?: string;
	token?: string;
	ticket?: string;
	userId?: string;
	userUuid?: string;
	clubUuid?: string;
	activeClubUuid?: string;
	guildId?: string;
	role?: 'viewer' | 'player' | 'editor' | 'admin';
	linkedProviders?: string[];
	clubs?: MockTicketClaims['clubs'];
	claims?: Partial<MockTicketClaims>;
	visitOptions?: VisitOptions;
};

type TicketRole = MockTicketClaims['role'];

type MockTicketClaims = {
	sub: string;
	user_uuid: string;
	active_club_uuid: string;
	guild: string;
	role: 'viewer' | 'player' | 'editor' | 'admin';
	clubs: Array<{
		club_uuid: string;
		role: 'viewer' | 'player' | 'editor' | 'admin';
		display_name: string;
		avatar_url: string;
	}>;
	linked_providers: string[];
	exp: number;
	iat: number;
};

type ArrangeGuestOptions = {
	path?: string;
	visitOptions?: VisitOptions;
};

function toBase64Url(value: string): string {
	return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildMockTicket(claims: Partial<MockTicketClaims> = {}): string {
	const now = Math.floor(Date.now() / 1000);
	const defaultClaims: MockTicketClaims = {
		sub: 'user:user-1',
		user_uuid: 'user-uuid-1',
		active_club_uuid: 'guild-123',
		guild: 'guild-123',
		role: 'admin',
		clubs: [
			{
				club_uuid: 'guild-123',
				role: 'admin',
				display_name: 'Mock User',
				avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
			}
		],
		linked_providers: ['discord'],
		exp: now + 3600,
		iat: now
	};

	const header = toBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
	const payload = toBase64Url(JSON.stringify({ ...defaultClaims, ...claims }));
	return `${header}.${payload}.mock-signature`;
}

function resolveRole(options: ArrangeAuthOptions): TicketRole {
	return options.role ?? 'admin';
}

function resolveActiveClubUuid(options: ArrangeAuthOptions): string {
	return options.activeClubUuid ?? options.clubUuid ?? 'guild-123';
}

function buildDefaultClubs(activeClubUuid: string, role: TicketRole): MockTicketClaims['clubs'] {
	if (!activeClubUuid) {
		return [];
	}

	return [
		{
			club_uuid: activeClubUuid,
			role,
			display_name: 'Mock User',
			avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
		}
	];
}

function buildArrangeAuthTicket(options: ArrangeAuthOptions): string {
	const activeClubUuid = resolveActiveClubUuid(options);
	const role = resolveRole(options);
	const defaultClubs = buildDefaultClubs(activeClubUuid, role);

	return buildMockTicket({
		sub: `user:${options.userId ?? 'user-1'}`,
		user_uuid: options.userUuid ?? 'user-uuid-1',
		active_club_uuid: activeClubUuid,
		guild: options.guildId ?? activeClubUuid ?? 'guild-123',
		role,
		clubs: options.clubs ?? defaultClubs,
		linked_providers: options.linkedProviders ?? ['discord'],
		...options.claims
	});
}

function setupAuthInterceptions(ticket: string): void {
	cy.intercept('POST', '**/api/auth/ticket', {
		statusCode: 200,
		body: { ticket }
	}).as('authTicket');

	cy.intercept('POST', '**/api/auth/callback', {
		statusCode: 200,
		body: { ok: true }
	}).as('authCallback');
}

function visitWithAuthTicket(path: string, options: ArrangeAuthOptions): void {
	if (options.token) {
		cy.visitWithToken(path, options.token, options.visitOptions as any);
		cy.wait('@authCallback');
		return;
	}

	cy.visit(path, options.visitOptions as Cypress.VisitOptions);
}

Cypress.Commands.add(
	'visitWithToken',
	(path: string = '/', token: string = 'mock-jwt-token', options: VisitOptions = {}) => {
		cy.visit(`${path}#t=${token}`, options as Cypress.VisitOptions);
	}
);

Cypress.Commands.add('visitMockMode', (path: string = '/', options: VisitOptions = {}) => {
	cy.visit(`${path}?mock=true`, options as Cypress.VisitOptions);
});

Cypress.Commands.add('arrangeAuth', (options: ArrangeAuthOptions = {}) => {
	const path = options.path ?? '/';
	const ticket = options.ticket ?? buildArrangeAuthTicket(options);

	setupAuthInterceptions(ticket);
	visitWithAuthTicket(path, options);

	cy.wait('@authTicket', { timeout: 15000 });
});

Cypress.Commands.add('arrangeGuest', (options: ArrangeGuestOptions = {}) => {
	const path = options.path ?? '/';

	cy.intercept('POST', '**/api/auth/ticket', {
		statusCode: 401,
		body: { error: 'unauthorized' }
	}).as('authTicket');

	cy.intercept('POST', '**/api/auth/callback', {
		statusCode: 401,
		body: { error: 'unauthorized' }
	}).as('authCallback');

	cy.visit(path, options.visitOptions as Cypress.VisitOptions);
	cy.wait('@authTicket', { timeout: 15000 });
});
