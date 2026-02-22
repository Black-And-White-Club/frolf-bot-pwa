/// <reference types="cypress" />
import { pwaScreen } from '../screens/pwa.screen';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

describe('PWA Shell UX', () => {
	const subjectId = 'guild-123';

	function visitDashboard() {
		cy.arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
		});
		cy.arrangeAuth({ path: '/', clubUuid: subjectId, guildId: subjectId, role: 'player' });
		cy.wsConnect();
		cy.expectDashboardLoaded();
	}

	function clearInstallDismissalFlag() {
		cy.window().then((win) => {
			win.sessionStorage.removeItem('pwa-prompt-dismissed');
		});
	}

	function dispatchBeforeInstallPrompt(outcome: 'accepted' | 'dismissed') {
		cy.window().then((win) => {
			const evt = new win.Event('beforeinstallprompt') as Event & {
				prompt: () => Promise<void>;
				userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
			};
			Object.assign(evt, {
				prompt: () => Promise.resolve(),
				userChoice: Promise.resolve({ outcome })
			});
			win.dispatchEvent(evt);
		});
	}

	function dispatchFirstInteraction() {
		cy.window().then((win) => {
			win.dispatchEvent(new win.Event('pointerdown'));
		});
	}

	it('shows and hides offline indicator on network events', () => {
		visitDashboard();

		cy.window().then((win) => {
			win.dispatchEvent(new Event('offline'));
		});
		pwaScreen.offlineBanner().should('exist').and('contain', "You're offline");

		cy.window().then((win) => {
			win.dispatchEvent(new Event('online'));
		});
		pwaScreen.offlineBanner().should('not.exist');
	});

	it('dismisses install prompt for current session', () => {
		visitDashboard();

		clearInstallDismissalFlag();
		cy.wait(250);
		dispatchBeforeInstallPrompt('dismissed');
		pwaScreen.installPrompt().should('not.exist');
		dispatchFirstInteraction();

		pwaScreen.installPrompt().should('be.visible');
		pwaScreen.dismissInstallPrompt();
		pwaScreen.installPrompt().should('not.exist');
		cy.window().then((win) => {
			expect(win.sessionStorage.getItem('pwa-prompt-dismissed')).to.eq('true');
		});
	});

	it('handles accepted install prompt flow', () => {
		visitDashboard();

		clearInstallDismissalFlag();
		cy.wait(250);
		dispatchBeforeInstallPrompt('accepted');
		pwaScreen.installPrompt().should('not.exist');
		dispatchFirstInteraction();

		pwaScreen.installPrompt().should('be.visible');
		pwaScreen.clickInstall();
		pwaScreen.installPrompt().should('not.exist');
	});
});
