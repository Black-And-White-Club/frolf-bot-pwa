import { dashboardScreen } from '../../screens/dashboard.screen';
import { leaderboardScreen } from '../../screens/leaderboard.screen';

type ExpectLeaderboardLoadedOptions = {
	minRows?: number;
};

function wrapVoid(): Cypress.Chainable<void> {
	return cy.wrap(undefined, { log: false }) as Cypress.Chainable<void>;
}

Cypress.Commands.add('expectDashboardLoaded', () => {
	dashboardScreen.expectLoaded();
	return wrapVoid();
});

Cypress.Commands.add('expectLeaderboardLoaded', (options: ExpectLeaderboardLoadedOptions = {}) => {
	leaderboardScreen.expectLoaded(options);
	return wrapVoid();
});
