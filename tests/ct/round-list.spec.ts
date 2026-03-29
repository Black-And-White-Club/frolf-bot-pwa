import { test, expect } from '@playwright/experimental-ct-svelte';
import RoundList from '$lib/components/round/RoundList.svelte';
import type { Round } from '$lib/stores/round.svelte';

function buildRound({
	id,
	state,
	title
}: {
	id: string;
	state: Round['state'];
	title: string;
}): Round {
	return {
		id,
		guildId: 'guild-1',
		title,
		location: 'Test Course',
		description: 'CT Round',
		startTime: '2025-02-22T10:00:00.000Z',
		state,
		createdBy: 'user-1',
		eventMessageId: `event-${id}`,
		participants: []
	};
}

const rounds = [
	buildRound({ id: 'round-live', state: 'started', title: 'Live Round' }),
	buildRound({ id: 'round-upcoming', state: 'scheduled', title: 'Upcoming Round' }),
	buildRound({ id: 'round-completed', state: 'finalized', title: 'Completed Round' })
];

test.describe('RoundList (Component)', () => {
	test('renders all three round section types', async ({ mount, page }) => {
		await mount(RoundList, { hooksConfig: { rounds } });

		await expect(page.locator('[data-testid="rounds-section-live-rounds"]')).toBeVisible();
		await expect(page.locator('[data-round-id="round-live"]')).toBeVisible();
	});

	test('collapses and expands round sections using the chevron control', async ({
		mount,
		page
	}) => {
		await mount(RoundList, { hooksConfig: { rounds } });

		const chevron = page
			.locator('[data-testid="rounds-section-live-rounds"] [aria-expanded]')
			.first();
		await expect(chevron).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('[data-round-id="round-live"]')).toBeVisible();

		await chevron.click();
		await expect(chevron).toHaveAttribute('aria-expanded', 'false');

		await chevron.click();
		await expect(chevron).toHaveAttribute('aria-expanded', 'true');
	});

	test('calls onSelect when a round card is clicked', async ({ mount, page }) => {
		let selectedId: string | undefined;
		await mount(RoundList, {
			props: {
				onSelect: (id: string) => {
					selectedId = id;
				}
			},
			hooksConfig: { rounds }
		});

		await page.locator('[data-round-id="round-live"]').click();
		expect(selectedId).toBe('round-live');
	});
});
