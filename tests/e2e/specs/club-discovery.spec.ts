import { test, expect } from '../fixtures';

test.describe('Club Discovery', () => {
	const subjectId = 'guild-123';

	async function visitDiscovery({ arrangeAuth }: { arrangeAuth: (o?: object) => Promise<void> }) {
		await arrangeAuth({
			path: '/',
			activeClubUuid: '',
			guildId: subjectId,
			role: 'viewer',
			linkedProviders: ['discord'],
			clubs: []
		});
	}

	test('shows suggested clubs when authenticated user has no memberships', async ({
		page,
		arrangeAuth
	}) => {
		await page.route('**/api/clubs/suggestions', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([
					{
						uuid: 'club-001',
						name: 'Pier Park Club',
						icon_url: ''
					}
				])
			})
		);
		await visitDiscovery({ arrangeAuth });
		await page.waitForResponse('**/api/clubs/suggestions');

		await expect(page.getByRole('heading', { name: 'Join a Club', level: 2 })).toBeVisible();
		await expect(
			page.getByText("You're signed in but not yet a member of any club.")
		).toBeVisible();
		await expect(page.getByText('Pier Park Club')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Join' }).first()).toBeVisible();
	});

	test('shows error when joining a suggested club fails', async ({ page, arrangeAuth }) => {
		await page.route('**/api/clubs/suggestions', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([
					{
						uuid: 'club-002',
						name: 'Northwest Tags',
						icon_url: ''
					}
				])
			})
		);
		await page.route('**/api/clubs/join', (route) =>
			route.fulfill({
				status: 400,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Membership closed' })
			})
		);
		await visitDiscovery({ arrangeAuth });
		await page.waitForResponse('**/api/clubs/suggestions');

		const joinButton = page
			.locator('div.flex.items-center.justify-between')
			.filter({ hasText: 'Northwest Tags' })
			.getByRole('button', { name: 'Join' });
		const joinResponse = page.waitForResponse('**/api/clubs/join');
		await joinButton.click();
		await joinResponse;

		await expect(page.getByText('Membership closed')).toBeVisible();
	});

	test('shows error for invalid invite code join attempts', async ({ page, arrangeAuth }) => {
		await page.route('**/api/clubs/suggestions', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([])
			})
		);
		await page.route('**/api/clubs/join-by-code', (route) =>
			route.fulfill({
				status: 400,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Invalid or expired invite code' })
			})
		);
		await visitDiscovery({ arrangeAuth });
		await page.waitForResponse('**/api/clubs/suggestions');

		await page.locator('input[placeholder="Enter invite code"]').fill('BADCODE');
		const joinResponse = page.waitForResponse('**/api/clubs/join-by-code');
		await page.getByRole('button', { name: /^Join$/ }).click();
		await joinResponse;

		await expect(page.getByText('Invalid or expired invite code')).toBeVisible();
	});
});
