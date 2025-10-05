import { describe, it, expect } from 'vitest';

// Ensure the root layout Svelte file can be imported in a Node environment
// without throwing due to accidental top-level browser global access.

describe('SSR import safety - layout', () => {
	it('imports +layout.svelte without throwing', async () => {
		await expect(import('../../../routes/+layout.svelte')).resolves.toBeTruthy();
	});
});
