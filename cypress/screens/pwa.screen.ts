import { selectors } from '../support/selectors';

export const pwaScreen = {
	offlineBanner() {
		return cy.get(selectors.offlineBanner);
	},
	installPrompt() {
		return cy.get(selectors.installPrompt);
	},
	dismissInstallPrompt() {
		cy.get(selectors.installPromptDismiss).click();
	},
	clickInstall() {
		cy.get(selectors.installPromptInstall).click();
	}
} as const;
