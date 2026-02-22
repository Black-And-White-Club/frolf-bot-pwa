/// <reference types="cypress" />
import { navScreen } from '../screens/nav.screen';
import {
	buildLeaderboardSnapshot,
	buildRoundCreated,
	buildTagListSnapshot
} from '../support/event-builders';

describe('Navigation Shell', () => {
	const subjectId = 'guild-123';
	const requiredLinks: Array<{ label: string; href: string }> = [
		{ label: 'Home', href: '/' },
		{ label: 'Rounds', href: '/rounds' },
		{ label: 'Leaderboard', href: '/leaderboard' },
		{ label: 'Docs', href: '/docs' },
		{ label: 'Account', href: '/account' }
	];

	function arrangeHome(role: 'viewer' | 'player' | 'editor' | 'admin') {
		cy.arrangeSnapshot({
			subjectId,
			rounds: [
				buildRoundCreated({
					id: 'round-nav-1',
					guild_id: subjectId,
					title: 'Navigation Round',
					state: 'scheduled',
					participants: []
				})
			],
			leaderboard: buildLeaderboardSnapshot({
				guild_id: subjectId,
				leaderboard: [{ user_id: 'user-1', tag_number: 1, total_points: 100, rounds_played: 1 }]
			}),
			tags: buildTagListSnapshot({
				guild_id: subjectId,
				members: [{ member_id: 'user-1', current_tag: 1 }]
			}),
			profiles: {
				'user-1': {
					user_id: 'user-1',
					display_name: 'Player One',
					avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
				}
			}
		});
		cy.arrangeAuth({
			path: '/',
			clubUuid: subjectId,
			guildId: subjectId,
			role,
			linkedProviders: ['discord']
		});
		cy.wsConnect();
		cy.expectDashboardLoaded();
	}

	it('shows navigation links for admin users', () => {
		arrangeHome('admin');

		for (const link of requiredLinks) {
			navScreen.expectLinkVisible(link.label, link.href);
		}
		navScreen.expectAdminLinkVisible();
		cy.get('[data-testid="skip-link"]').should('have.attr', 'href', '#main-content');
	});

	it('hides admin navigation link for non-admin users', () => {
		arrangeHome('player');

		navScreen.expectLinkVisible('Home', '/');
		navScreen.expectLinkVisible('Account', '/account');
		navScreen.expectAdminLinkMissing();
	});

	it('shows the expected menu controls for the active layout', () => {
		arrangeHome('admin');
		navScreen.expectSignOutControlVisible();

		navScreen.isCompactLayout().then((isCompact) => {
			if (!isCompact) {
				cy.get('button[aria-label="Open menu"]').should('not.be.visible');
				return;
			}

			navScreen.openHamburger();
			navScreen.hamburgerDialog().should('be.visible');
			navScreen.hamburgerDialog().contains('a', 'Admin').should('have.attr', 'href', '/admin');
			navScreen.hamburgerDialog().find('[data-testid="btn-signout-mobile"]').should('be.visible');
			navScreen.closeHamburger();
			navScreen.hamburgerDialog().should('not.exist');
		});
	});
});
