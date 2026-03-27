import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class BettingPage {
constructor(private page: Page) {}

accessBadge(): Locator {
return this.page.locator('.rounded-full.border').filter({ hasText: /enabled|frozen|disabled/i }).first();
}
placeButton(): Locator { return this.page.getByRole('button', { name: /Place Bet|Placing/i }); }
stakeInput(): Locator { return this.page.locator('input[type="number"]').first(); }

async expectAccessBadge(text: string | RegExp): Promise<void> {
await expect(this.accessBadge()).toContainText(text);
}
}
