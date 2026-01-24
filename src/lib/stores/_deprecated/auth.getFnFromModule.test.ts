import { describe, it, expect } from 'vitest';
import { getFnFromModule } from '$lib/stores/auth';
import * as authMod from '$lib/stores/auth';

describe('getFnFromModule negative cases', () => {
	it('returns undefined for non-object module', () => {
		expect(getFnFromModule(null, ['foo'])).toBeUndefined();
		expect(getFnFromModule(undefined, ['foo'])).toBeUndefined();
	});

	it('returns undefined when default is not object', () => {
		const mod = { default: 'not-an-object' };
		expect(getFnFromModule(mod, ['x'])).toBeUndefined();
	});
});

describe('getFnFromModule negative cases', () => {
	const getFnFromModule = (authMod as unknown as Record<string, unknown>).getFnFromModule as (
		mod: unknown,
		names: string[]
	) => unknown;

	it('returns undefined for non-object module', () => {
		expect(getFnFromModule(null, ['foo'])).toBeUndefined();
		expect(getFnFromModule(undefined, ['foo'])).toBeUndefined();
	});

	it('returns undefined when default is not object', () => {
		const mod = { default: 'not-an-object' };
		expect(getFnFromModule(mod, ['x'])).toBeUndefined();
	});
});
