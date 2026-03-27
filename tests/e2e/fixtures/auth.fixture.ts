import type { Page } from '@playwright/test';

export type TicketRole = 'viewer' | 'player' | 'editor' | 'admin';

export type ClubFeatureAccess = {
key: string;
state: 'disabled' | 'enabled' | 'frozen';
source: string;
reason?: string;
expires_at?: string;
};

export type ResolvedClubEntitlements = {
features?: Record<string, ClubFeatureAccess>;
resolved_at?: string;
};

export type MockTicketClaims = {
sub: string;
user_uuid: string;
active_club_uuid: string;
guild: string;
role: TicketRole;
clubs: Array<{
club_uuid: string;
role: TicketRole;
display_name: string;
avatar_url: string;
}>;
linked_providers: string[];
active_club_entitlements?: ResolvedClubEntitlements;
exp: number;
iat: number;
};

export type ArrangeAuthOptions = {
path?: string;
token?: string;
ticket?: string;
userId?: string;
userUuid?: string;
clubUuid?: string;
activeClubUuid?: string;
guildId?: string;
role?: TicketRole;
linkedProviders?: string[];
clubs?: MockTicketClaims['clubs'];
entitlements?: ResolvedClubEntitlements;
claims?: Partial<MockTicketClaims>;
};

export type ArrangeGuestOptions = {
path?: string;
};

function toBase64Url(value: string): string {
return Buffer.from(value)
.toString('base64')
.replace(/\+/g, '-')
.replace(/\//g, '_')
.replace(/=+$/, '');
}

export function buildMockTicket(claims: Partial<MockTicketClaims> = {}): string {
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

function resolveActiveClubUuid(options: ArrangeAuthOptions): string {
return options.activeClubUuid ?? options.clubUuid ?? 'guild-123';
}

function buildArrangeAuthTicket(options: ArrangeAuthOptions): string {
const activeClubUuid = resolveActiveClubUuid(options);
const role = options.role ?? 'admin';
const defaultClubs = activeClubUuid
? [
{
club_uuid: activeClubUuid,
role,
display_name: 'Mock User',
avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
}
]
: [];

return buildMockTicket({
sub: `user:${options.userId ?? 'user-1'}`,
user_uuid: options.userUuid ?? 'user-uuid-1',
active_club_uuid: activeClubUuid,
guild: options.guildId ?? activeClubUuid ?? 'guild-123',
role,
clubs: options.clubs ?? defaultClubs,
linked_providers: options.linkedProviders ?? ['discord'],
...(options.entitlements ? { active_club_entitlements: options.entitlements } : {}),
...options.claims
});
}

export async function arrangeAuth(page: Page, options: ArrangeAuthOptions = {}): Promise<void> {
const path = options.path ?? '/';
const ticket = options.ticket ?? buildArrangeAuthTicket(options);

await page.route('**/api/auth/ticket', (route) =>
route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ticket }) })
);
await page.route('**/api/auth/callback', (route) =>
route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
);

if (options.token) {
const responsePromise = page.waitForResponse('**/api/auth/callback');
await page.goto(`${path}#t=${options.token}`);
await responsePromise;
} else {
await page.goto(path);
}

await page.waitForResponse('**/api/auth/ticket');
}

export async function arrangeGuest(page: Page, options: ArrangeGuestOptions = {}): Promise<void> {
const path = options.path ?? '/';

await page.route('**/api/auth/ticket', (route) =>
route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'unauthorized' }) })
);
await page.route('**/api/auth/callback', (route) =>
route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'unauthorized' }) })
);

await page.goto(path);
await page.waitForResponse('**/api/auth/ticket');
}

export async function visitWithToken(
page: Page,
path: string = '/',
token: string = 'mock-jwt-token'
): Promise<void> {
await page.goto(`${path}#t=${token}`);
}

export async function visitMockMode(page: Page, path: string = '/'): Promise<void> {
await page.goto(`${path}?mock=true`);
}
