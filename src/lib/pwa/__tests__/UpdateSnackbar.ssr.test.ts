import { describe, it, expect } from 'vitest';

// This test runs in the 'server' vitest project (node environment) and ensures
// the Svelte component can be imported in an SSR-like environment without
// throwing due to accidental top-level browser global access.

describe('SSR import safety', () => {
	it('imports UpdateSnackbar without throwing', async () => {
		// relative path to the component from this test file
		await expect(import('../../components/UpdateSnackbar.svelte')).resolves.toBeTruthy();
	});
});
