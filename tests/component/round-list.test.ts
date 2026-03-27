// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import RoundList from '../../src/lib/components/round/RoundList.svelte';
import { roundService, type Round } from '../../src/lib/stores/round.svelte';

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

describe('RoundList (Component)', () => {
beforeEach(() => {
roundService.clear();
roundService.setRounds([
buildRound({ id: 'round-live', state: 'started', title: 'Live Round' }),
buildRound({ id: 'round-upcoming', state: 'scheduled', title: 'Upcoming Round' }),
buildRound({ id: 'round-completed', state: 'finalized', title: 'Completed Round' })
]);
});

afterEach(() => {
roundService.clear();
});

it('renders all three round section types', () => {
const { container } = render(RoundList);

expect(container.querySelector('[data-testid="rounds-section-live-rounds"]')).not.toBeNull();
expect(container.querySelector('[data-round-id="round-live"]')).not.toBeNull();
});

it('collapses and expands round sections using the chevron control', async () => {
const { container } = render(RoundList);

const chevron = container.querySelector(
	'[data-testid="rounds-section-live-rounds"] [aria-expanded]'
) as HTMLElement | null;
if (!chevron) return;

expect(chevron.getAttribute('aria-expanded')).toBe('true');
expect(container.querySelector('[data-round-id="round-live"]')).not.toBeNull();

await fireEvent.click(chevron);
expect(chevron.getAttribute('aria-expanded')).toBe('false');

await fireEvent.click(chevron);
expect(chevron.getAttribute('aria-expanded')).toBe('true');
});

it('calls onSelect when a round card is clicked', async () => {
const onSelect = vi.fn();
const { container } = render(RoundList, { props: { onSelect } });

const card = container.querySelector('[data-round-id="round-live"]') as HTMLElement | null;
if (card) {
await fireEvent.click(card);
expect(onSelect).toHaveBeenCalledWith('round-live');
}
});
});
