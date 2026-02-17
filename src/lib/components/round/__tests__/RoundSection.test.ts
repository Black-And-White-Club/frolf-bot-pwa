import { render } from '@testing-library/svelte';
import { test, expect } from 'vitest';
import RoundSectionTestHelper from './RoundSectionTestHelper.svelte';

test('renders header and badges and round content', () => {
	const { getByText, getByTestId } = render(RoundSectionTestHelper, {
		props: {
			title: 'Upcoming',
			badges: [{ label: 'My Badge', color: 'secondary' }]
		}
	});

	expect(getByText('Upcoming')).toBeTruthy();
	expect(getByText('My Badge')).toBeTruthy();
	// Should render the content passed to the snippet
	expect(getByTestId('round-card-r1')).toBeTruthy();
	expect(getByText('Test Round Content')).toBeTruthy();
});
