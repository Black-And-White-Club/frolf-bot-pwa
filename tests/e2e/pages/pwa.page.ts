import type { Page, Locator } from '@playwright/test';
import { selectors } from '../support/selectors';

export class PwaPage {
constructor(private page: Page) {}
offlineBanner(): Locator { return this.page.locator(selectors.offlineBanner); }
installPrompt(): Locator { return this.page.locator(selectors.installPrompt); }
async dismissInstallPrompt(): Promise<void> { await this.page.locator(selectors.installPromptDismiss).click(); }
async clickInstall(): Promise<void> { await this.page.locator(selectors.installPromptInstall).click(); }
}
