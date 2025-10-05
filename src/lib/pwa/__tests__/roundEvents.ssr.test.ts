import { describe, it, expect } from 'vitest';

describe('SSR import safety - roundEvents store', () => {
	it('imports roundEvents store without throwing', async () => {
		await expect(import('../../stores/roundEvents')).resolves.toBeTruthy();
	});
});
