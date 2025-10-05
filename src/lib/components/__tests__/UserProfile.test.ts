/* @vitest-environment jsdom */
import { render, fireEvent } from '@testing-library/svelte';
import { test, expect, vi } from 'vitest';
import UserProfile from '../UserProfile.svelte';
import type { UserRoleEnum } from '$lib/types/backend';

const user = {
	user_id: 'u1',
	username: 'TestUser',
	total_rounds: 5,
	best_score: 10,
	average_score: 8.5,
	guild_id: 'g1',
	role: 'User' as UserRoleEnum
};

test('renders user info and responds to click', async () => {
	const onClick = vi.fn();
	const { getByTestId, getByText } = render(UserProfile, {
		props: { user, onClick, testid: 'user-card' }
	});
	getByText('TestUser');
	getByText('Rounds played: 5');
	await fireEvent.click(getByTestId('user-card'));
	expect(onClick).toHaveBeenCalled();
});
