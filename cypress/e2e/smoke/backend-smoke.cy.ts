function envValue(key: string): unknown {
	const env = Cypress.config('env') as Record<string, unknown> | undefined;
	return env?.[key];
}

function envFlag(key: string, defaultValue: boolean): boolean {
	const value = envValue(key);
	if (value === undefined) {
		return defaultValue;
	}
	if (typeof value === 'boolean') {
		return value;
	}
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (normalized === 'true') {
			return true;
		}
		if (normalized === 'false') {
			return false;
		}
	}
	return Boolean(value);
}

function envText(key: string, defaultValue: string): string {
	const value = envValue(key);
	if (typeof value === 'string' && value.trim().length > 0) {
		return value;
	}
	return defaultValue;
}

describe('Real Backend Smoke', () => {
	before(function () {
		if (!envFlag('SMOKE_REAL_BACKEND', false)) {
			this.skip();
		}
	});

	it('loads the dashboard shell with an auth token', () => {
		const path = envText('SMOKE_PATH', '/');
		const token = envText('SMOKE_TOKEN', 'mock-jwt-token');
		cy.arrangeAuth({ path, token });

		cy.expectDashboardLoaded();
	});
});
