import { render, fireEvent } from '@testing-library/svelte';
import UpdateSnackbar from '../UpdateSnackbar.svelte';
import { showUpdate } from '$lib/pwa/updateSnackbarHelper';
import { describe, it, expect } from 'vitest';

class FakeReg {
	waiting = { postMessage: () => {} };
}

describe('UpdateSnackbar', () => {
	it('shows when showUpdate is called and refresh/dismiss buttons work', async () => {
		const { getByText, queryByText, findByText } = render(UpdateSnackbar);
		showUpdate(new FakeReg() as unknown as ServiceWorkerRegistration);
		await findByText('A new version is available.');

		const refresh = getByText('Refresh');
		await fireEvent.click(refresh);
		// refresh triggers a reload, we cannot assert reload, but no error should be thrown

		const dismiss = getByText('Dismiss');
		await fireEvent.click(dismiss);
		// snackbar should be removed
		expect(queryByText('A new version is available.')).toBeNull();
	});
});
