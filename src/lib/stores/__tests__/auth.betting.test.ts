// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../auth.svelte';

describe('AuthService – betting entitlement deriveds', () => {
	let auth: AuthService;

	const baseUser = {
		id: 'discord-1',
		uuid: 'user-uuid-1',
		activeClubUuid: 'club-A',
		guildId: 'guild-A',
		role: 'player' as const,
		linkedProviders: ['discord'],
		clubs: []
	};

	beforeEach(() => {
		auth = new AuthService();
	});

	describe('bettingAccess', () => {
		it('returns disabled/none default when user has no entitlements', () => {
			auth.user = { ...baseUser };
			expect(auth.bettingAccess.state).toBe('disabled');
			expect(auth.bettingAccess.source).toBe('none');
		});

		it('returns disabled/none default when user is null', () => {
			auth.user = null;
			expect(auth.bettingAccess.state).toBe('disabled');
			expect(auth.bettingAccess.source).toBe('none');
		});

		it('returns enabled when features.betting.state is enabled', () => {
			auth.user = {
				...baseUser,
				activeClubEntitlements: {
					features: {
						betting: { key: 'betting', state: 'enabled', source: 'subscription', reason: '' }
					}
				}
			};
			expect(auth.bettingAccess.state).toBe('enabled');
			expect(auth.bettingAccess.source).toBe('subscription');
		});

		it('returns frozen when features.betting.state is frozen', () => {
			auth.user = {
				...baseUser,
				activeClubEntitlements: {
					features: {
						betting: {
							key: 'betting',
							state: 'frozen',
							source: 'manual_deny',
							reason: 'Payment lapsed'
						}
					}
				}
			};
			expect(auth.bettingAccess.state).toBe('frozen');
			expect(auth.bettingAccess.reason).toBe('Payment lapsed');
		});

		it('returns disabled when features.betting.state is disabled', () => {
			auth.user = {
				...baseUser,
				activeClubEntitlements: {
					features: {
						betting: { key: 'betting', state: 'disabled', source: 'none' }
					}
				}
			};
			expect(auth.bettingAccess.state).toBe('disabled');
		});

		it('returns default when entitlements has no betting key', () => {
			auth.user = {
				...baseUser,
				activeClubEntitlements: { features: {} }
			};
			expect(auth.bettingAccess.state).toBe('disabled');
			expect(auth.bettingAccess.source).toBe('none');
		});

		it('returns default when activeClubEntitlements has no features', () => {
			auth.user = {
				...baseUser,
				activeClubEntitlements: {}
			};
			expect(auth.bettingAccess.state).toBe('disabled');
		});
	});

	describe('bettingAvailable', () => {
		it('is false when state is disabled (no user)', () => {
			auth.user = null;
			expect(auth.bettingAvailable).toBe(false);
		});

		it('is true only when state is enabled', () => {
			auth.user = {
				...baseUser,
				activeClubEntitlements: {
					features: { betting: { key: 'betting', state: 'enabled', source: 'subscription' } }
				}
			};
			expect(auth.bettingAvailable).toBe(true);
		});

		it('is false when state is frozen', () => {
			auth.user = {
				...baseUser,
				activeClubEntitlements: {
					features: { betting: { key: 'betting', state: 'frozen', source: 'subscription' } }
				}
			};
			expect(auth.bettingAvailable).toBe(false);
		});

		it('is false when state is disabled', () => {
			auth.user = {
				...baseUser,
				activeClubEntitlements: {
					features: { betting: { key: 'betting', state: 'disabled', source: 'none' } }
				}
			};
			expect(auth.bettingAvailable).toBe(false);
		});
	});

	describe('bettingVisible', () => {
		it('is false when user is null', () => {
			auth.user = null;
			expect(auth.bettingVisible).toBe(false);
		});

		it('is true when state is enabled', () => {
			auth.user = {
				...baseUser,
				activeClubEntitlements: {
					features: { betting: { key: 'betting', state: 'enabled', source: 'subscription' } }
				}
			};
			expect(auth.bettingVisible).toBe(true);
		});

		it('is true when state is frozen', () => {
			auth.user = {
				...baseUser,
				activeClubEntitlements: {
					features: { betting: { key: 'betting', state: 'frozen', source: 'subscription' } }
				}
			};
			expect(auth.bettingVisible).toBe(true);
		});

		it('is false when state is disabled', () => {
			auth.user = {
				...baseUser,
				activeClubEntitlements: {
					features: { betting: { key: 'betting', state: 'disabled', source: 'none' } }
				}
			};
			expect(auth.bettingVisible).toBe(false);
		});

		it('is false when no entitlements set', () => {
			auth.user = { ...baseUser };
			expect(auth.bettingVisible).toBe(false);
		});
	});
});
