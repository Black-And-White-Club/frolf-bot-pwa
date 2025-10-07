import { render, waitFor } from '@testing-library/svelte';
import { vi, test, expect } from 'vitest';
import LeaderboardLoader from '../LeaderboardLoader.svelte';
import Button from '$lib/components/Button.svelte';

test('loads Leaderboard via requestIdleCallback fallback', async () => {
	// Mock dynamic import
	// return a small real Svelte component as the mocked module so Svelte runtime can mount it
	vi.mock(
		'/Users/jace/Documents/GitHub/frolf-bot-pwa/src/lib/components/Leaderboard.svelte',
		() => ({
			default: Button
		})
	);

	// Ensure no IntersectionObserver so loader falls back to requestIdleCallback
	vi.stubGlobal('IntersectionObserver', undefined);
	vi.stubGlobal('requestIdleCallback', (cb: (deadline?: IdleDeadline) => void) => {
		cb();
		return 0;
	});

	const rendered = render(LeaderboardLoader, { props: { entries: [] } });

	await waitFor(() => {
		expect(rendered.getByRole('button')).toBeTruthy();
	});
});
