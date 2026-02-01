// Simple mock auth provider for local dev and Storybook
import type { Guild, Session } from '$lib/stores/auth';

let _session: Session | null = null;
let _guilds: Guild[] = [
	{ id: 'g1', name: 'Frolf Park', isAdmin: true },
	{ id: 'g2', name: 'Casual League', isAdmin: false }
];

// internal function pointers so tests can override behavior explicitly
let _loginFn: () => Promise<Session | null> = async () => {
	_session = { user: { id: 'u1', name: 'Dev User', avatar_url: null }, token: 'fake-token' };
	return _session;
};

let _logoutFn: () => Promise<void> = async () => {
	_session = null;
};

let _getSessionFn: () => Promise<Session | null> = async () => _session;

export async function loginMock() {
	return _loginFn();
}
export async function logoutMock() {
	return _logoutFn();
}
export async function getSessionMock() {
	return _getSessionFn();
}

export async function listGuildsMock() {
	// simulate network latency
	return new Promise<Guild[]>((res) => setTimeout(() => res(_guilds.slice()), 50));
}

export async function linkGuildMock(guildId: string) {
	// simple validation: guild exists and user is admin
	const g = _guilds.find((x) => x.id === guildId);
	if (!g) return { success: false, error: 'not_found' };
	if (!g.isAdmin) return { success: false, error: 'not_admin' };
	// simulate link
	return { success: true };
}

export function setMockGuilds(guilds: Guild[]) {
	_guilds = guilds;
}

// Test helpers -------------------------------------------------------------
export function setLoginMock(fn: () => Promise<Session | null>) {
	_loginFn = fn;
}
export function setLogoutMock(fn: () => Promise<void>) {
	_logoutFn = fn;
}
export function setGetSessionMock(fn: () => Promise<Session | null>) {
	_getSessionFn = fn;
}
export function resetMocks() {
	_session = null;
	_loginFn = async () => {
		_session = { user: { id: 'u1', name: 'Dev User', avatar_url: null }, token: 'fake-token' };
		return _session;
	};
	_logoutFn = async () => {
		_session = null;
	};
	_getSessionFn = async () => _session;
}

export default {
	login: loginMock,
	logout: logoutMock,
	getSession: getSessionMock,
	listGuilds: listGuildsMock,
	linkGuild: linkGuildMock,
	setMockGuilds,
	// test helpers
	setLoginMock,
	setLogoutMock,
	setGetSessionMock,
	resetMocks
};
