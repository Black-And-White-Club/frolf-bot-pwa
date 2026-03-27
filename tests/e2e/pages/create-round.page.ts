import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { selectors } from '../support/selectors';

export class CreateRoundPage {
constructor(private page: Page) {}

createRouteButton(): Locator { return this.page.locator(selectors.createRoundRouteButton); }
createPage(): Locator { return this.page.locator(selectors.createRoundPage); }
form(): Locator { return this.page.locator(selectors.createRoundForm); }

async fillForm(values: {
title: string;
description?: string;
startTime: string;
timezone?: string;
location: string;
}): Promise<void> {
await this.page.locator('[data-testid="input-create-round-title"]').clear();
await this.page.locator('[data-testid="input-create-round-title"]').fill(values.title);
await this.page.locator('[data-testid="input-create-round-description"]').clear();
if (values.description) {
await this.page.locator('[data-testid="input-create-round-description"]').fill(values.description);
}
await this.page.locator('[data-testid="input-create-round-start-time"]').clear();
await this.page.locator('[data-testid="input-create-round-start-time"]').fill(values.startTime);
await this.page.locator('[data-testid="input-create-round-timezone"]').clear();
if (values.timezone) {
await this.page.locator('[data-testid="input-create-round-timezone"]').fill(values.timezone);
}
await this.page.locator('[data-testid="input-create-round-location"]').clear();
await this.page.locator('[data-testid="input-create-round-location"]').fill(values.location);
}

async submit(): Promise<void> {
await this.page.locator('[data-testid="btn-create-round-submit"]').click();
}

async expectRequestedBannerVisible(): Promise<void> {
await expect(this.page.locator(selectors.createRoundRequestedBanner)).toBeVisible();
}
}
