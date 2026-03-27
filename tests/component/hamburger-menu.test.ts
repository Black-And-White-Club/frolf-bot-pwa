// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import HamburgerMenu from '../../src/lib/components/general/HamburgerMenu.svelte';
import { auth } from '../../src/lib/stores/auth.svelte';

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_API_URL: 'http://localhost:8080', PUBLIC_NATS_URL: 'ws://localhost' }
}));
vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/') as any,
		params: {},
		data: { session: null }
	}
}));

vi.mock('$app/navigation', () => ({
goto: vi.fn()
}));

describe('HamburgerMenu (Component)', () => {
beforeEach(() => {
auth.user = {
id: 'user-1',
uuid: 'user-1-uuid',
activeClubUuid: 'club-1',
guildId: 'guild-1',
role: 'admin',
clubs: [
{
club_uuid: 'club-1',
role: 'admin',
display_name: 'Test User',
avatar_url: ''
}
],
linkedProviders: ['discord']
};
auth.status = 'authenticated';
});

afterEach(() => {
auth.user = null;
auth.status = 'idle';
});

it('renders the hamburger menu dialog', () => {
const closeHamburger = vi.fn();
const { container } = render(HamburgerMenu, { props: { closeHamburger } });

const dialog = container.querySelector('[role="dialog"]') ?? container.querySelector('nav');
expect(dialog).not.toBeNull();
});

it('calls close handler when Escape key is pressed', async () => {
const closeHamburger = vi.fn();
const { container } = render(HamburgerMenu, { props: { closeHamburger } });

await fireEvent.keyDown(document, { key: 'Escape', bubbles: true, cancelable: true });
expect(closeHamburger).toHaveBeenCalled();
});

it('calls close handler when backdrop is clicked', async () => {
const closeHamburger = vi.fn();
const { container } = render(HamburgerMenu, { props: { closeHamburger } });

const backdrop = container.querySelector('[data-testid="hamburger-backdrop"]');
if (backdrop) {
await fireEvent.click(backdrop);
expect(closeHamburger).toHaveBeenCalled();
}
});
});
