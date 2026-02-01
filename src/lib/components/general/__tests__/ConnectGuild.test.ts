/* @vitest-environment jsdom */
import { test, expect } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import ConnectGuild from '$lib/components/guild/ConnectGuild.svelte';

const mockList = async () => [
	{ id: 'g1', name: 'G1', isAdmin: true },
	{ id: 'g2', name: 'G2', isAdmin: false }
];
const mockLink = async (id: string) => ({
	success: id === 'g1',
	error: id === 'g2' ? 'not_admin' : undefined
});

test('renders guilds and handles link', async () => {
	const { getByText } = render(ConnectGuild, {
		props: { listGuilds: mockList, linkGuild: mockLink }
	});
	await waitFor(() => expect(getByText('G1')).toBeTruthy());
	const linkButton = getByText('Link');
	await fireEvent.click(linkButton);
	await waitFor(() => expect(getByText('Successfully linked!')).toBeTruthy());
});
