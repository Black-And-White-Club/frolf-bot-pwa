// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import StatCard from '$lib/components/general/StatCard.svelte';

describe('StatCard', () => {
	it('loads and renders an icon when the import succeeds', async () => {
		const { getByTestId, getByText, container } = render(StatCard, {
			props: { label: 'Players', value: 7, icon: 'players', color: 'secondary', testid: 'stat-2' }
		});

		const root = getByTestId('stat-2');
		expect(root).toBeTruthy();
		expect(getByText('Players')).toBeTruthy();
		expect(getByText('7')).toBeTruthy();

		// wait for dynamic import to resolve and an icon svg to be present
		await waitFor(() => {
			const icon = container.querySelector('.icon > svg');
			expect(icon).toBeTruthy();
		});
	});
});
