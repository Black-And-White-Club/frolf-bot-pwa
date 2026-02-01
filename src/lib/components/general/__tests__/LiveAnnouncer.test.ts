import { render } from '@testing-library/svelte';
import LiveAnnouncer from '../LiveAnnouncer.svelte';
import { announcer } from '$lib/stores/announcer';
import { describe, it, expect } from 'vitest';

describe('LiveAnnouncer', () => {
	it('renders inside an aria-live region when announced', async () => {
		const { findByTestId, queryByText } = render(LiveAnnouncer);
		announcer.announce('test message');
		const el = await findByTestId('live-announcer');
		expect(el).toBeTruthy();
		expect(queryByText('test message')).toBeTruthy();
	});
});
