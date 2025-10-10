import { describe, it, expect } from 'vitest';

// This test runs in the 'server' vitest project (node environment) and ensures
// the Svelte component can be imported in an SSR-like environment without
// throwing due to accidental top-level browser global access.

describe('SSR import safety', () => {
	it('imports UpdateSnackbar without throwing', async () => {
		// Import the component using a relative path so SSR import-safety tests
		// exercise the real file system resolution (no path alias).
		await expect(
			import('../../src/lib/components/general/UpdateSnackbar.svelte')
		).resolves.toBeTruthy();
	});
});
