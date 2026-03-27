import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { selectors } from '../support/selectors';

export class RoundPage {
constructor(private page: Page) {}

cards(): Locator { return this.page.locator(selectors.roundCard); }

cardById(roundId: string): Locator {
return this.page.locator(`${selectors.roundCard}[data-round-id="${roundId}"]`);
}

async expectCardVisible(roundId: string): Promise<void> {
await expect(this.cardById(roundId)).toBeVisible();
}

async expectCardContains(roundId: string, value: string): Promise<void> {
await expect(this.cardById(roundId)).toContainText(value);
}

async expectCardState(roundId: string, state: string): Promise<void> {
await expect(this.cardById(roundId)).toHaveAttribute('data-state', state);
}

async expectParticipantLabel(roundId: string, participantCount: number): Promise<void> {
await expect(this.cardById(roundId)).toContainText(new RegExp(`${participantCount} player`, 'i'));
}

async expectCardMissing(roundId: string): Promise<void> {
await expect(this.cardById(roundId)).toHaveCount(0);
}
}
