import { describe, it, expect } from 'vitest';

describe('SSR import safety - ThemeProvider component', () => {
	it('imports ThemeProvider.svelte without throwing', async () => {
		await expect(import('../../components/ThemeProvider.svelte')).resolves.toBeTruthy();
	});
});
