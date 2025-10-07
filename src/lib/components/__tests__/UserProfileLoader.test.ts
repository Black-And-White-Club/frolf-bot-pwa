import { render, waitFor } from '@testing-library/svelte';
import { vi, test, expect } from 'vitest';
import UserProfileLoader from '../UserProfileLoader.svelte';
import Button from '$lib/components/Button.svelte';

test('loads UserProfile via idle fallback', async () => {
	vi.mock(
		'/Users/jace/Documents/GitHub/frolf-bot-pwa/src/lib/components/UserProfile.svelte',
		() => ({
			default: Button
		})
	);

	vi.stubGlobal('IntersectionObserver', undefined);
	vi.stubGlobal('requestIdleCallback', (cb: (deadline?: IdleDeadline) => void) => {
		cb();
		return 0;
	});

	// Minimal User shape according to src/lib/types/backend.ts
	const fakeUser = {
		user_id: 'u1',
		username: 'tester',
		guild_id: 'g1',
		role: ''
	} as unknown as import('$lib/types/backend').User;
	const rendered = render(UserProfileLoader, { props: { user: fakeUser } });

	await waitFor(() => {
		expect(rendered.getByRole('button')).toBeTruthy();
	});
});
