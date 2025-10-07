import { render, waitFor } from '@testing-library/svelte';
import { vi, test, expect } from 'vitest';
import RoundCardLoader from '../RoundCardLoader.svelte';
import Button from '$lib/components/Button.svelte';

function mockIntersectionObserver(triggerImmediately = true) {
	class MockObserver {
		cb: IntersectionObserverCallback;
		constructor(cb: IntersectionObserverCallback) {
			this.cb = cb;
		}
		observe() {
			if (triggerImmediately) {
				this.cb(
					[{ isIntersecting: true } as unknown as IntersectionObserverEntry],
					this as unknown as IntersectionObserver
				);
			}
		}
		disconnect() {}
	}

	vi.stubGlobal('IntersectionObserver', MockObserver);
}

test('loads RoundCard when intersecting (success path)', async () => {
	// Mock the dynamically-imported RoundCard component (resolved path used by loader)
	// Use a simple real Svelte component so the loader can mount it in the test environment
	vi.mock(
		'/Users/jace/Documents/GitHub/frolf-bot-pwa/src/lib/components/round/RoundCard.svelte',
		() => ({
			default: Button
		})
	);

	mockIntersectionObserver(true);

	const rendered = render(RoundCardLoader, {
		props: {
			round: {
				round_id: 'r1',
				guild_id: 'g1',
				title: 'Test Round',
				status: 'active',
				participants: [],
				created_by: 'u1',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			},
			dataTestId: 'round-loader'
		}
	});

	// Wait for the dynamic import to resolve and component to render (Button is our mocked child)
	await waitFor(() => {
		expect(rendered.getByRole('button')).toBeTruthy();
	});
});

test('keeps placeholder when no intersection and no idle callback', async () => {
	// Ensure IntersectionObserver is not present and requestIdleCallback is not present
	vi.stubGlobal('IntersectionObserver', undefined);
	vi.stubGlobal('requestIdleCallback', undefined);

	const { container } = render(RoundCardLoader, {
		props: {
			round: {
				round_id: 'r2',
				guild_id: 'g1',
				title: 'No Load',
				status: 'scheduled',
				participants: [],
				created_by: 'u1',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			},
			dataTestId: 'round-loader-2'
		}
	});

	// The placeholder should be present (round-placeholder div)
	await waitFor(() => {
		expect(container.querySelector('.round-placeholder')).toBeTruthy();
	});
});
