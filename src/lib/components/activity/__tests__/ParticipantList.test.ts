// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import ParticipantList from '$lib/components/activity/ParticipantList.svelte';
import type { ActivityParticipant } from '$lib/discord';

function makeParticipant(id: string, username: string, avatar?: string): ActivityParticipant {
	return { discordId: id, username, avatar: avatar ?? null };
}

describe('ParticipantList', () => {
	it('renders nothing when participants list is empty', () => {
		const { container } = render(ParticipantList, { props: { participants: [] } });
		expect(container.querySelector('[title]')).toBeNull();
	});

	it('renders "In channel:" label when participants are present', () => {
		const participants = [makeParticipant('1', 'Alice')];
		const { getByText } = render(ParticipantList, { props: { participants } });
		expect(getByText(/In channel:/)).toBeTruthy();
	});

	it('shows initials when participant has no avatar', () => {
		const participants = [makeParticipant('1', 'alice')];
		const { getByText } = render(ParticipantList, { props: { participants } });
		expect(getByText('AL')).toBeTruthy();
	});

	it('renders an img tag when participant has an avatar hash', () => {
		const participants = [makeParticipant('123', 'Bob', 'abc123hash')];
		const { container } = render(ParticipantList, { props: { participants } });
		const img = container.querySelector('img');
		expect(img).toBeTruthy();
		expect(img?.src).toContain('cdn.discordapp.com/avatars/123/abc123hash.png');
	});

	it('shows at most 5 participants', () => {
		const participants = Array.from({ length: 7 }, (_, i) =>
			makeParticipant(String(i), `user${i}`)
		);
		const { container } = render(ParticipantList, { props: { participants } });
		// Max 5 visible avatars, each has a title attribute
		const avatars = container.querySelectorAll('[title]');
		expect(avatars.length).toBe(5);
	});

	it('shows overflow count when more than 5 participants', () => {
		const participants = Array.from({ length: 8 }, (_, i) =>
			makeParticipant(String(i), `user${i}`)
		);
		const { getByText } = render(ParticipantList, { props: { participants } });
		expect(getByText('+3')).toBeTruthy();
	});

	it('does not show overflow badge when exactly 5 participants', () => {
		const participants = Array.from({ length: 5 }, (_, i) =>
			makeParticipant(String(i), `user${i}`)
		);
		const { container } = render(ParticipantList, { props: { participants } });
		expect(container.textContent).not.toContain('+');
	});
});
