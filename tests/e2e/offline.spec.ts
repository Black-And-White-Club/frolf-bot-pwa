// Placeholder offline E2E test
//
// This project keeps a Playwright E2E test here, but many dev setups do not have
// Playwright installed. To avoid forcing that dependency, we provide a skipped
// placeholder so local test runners (vitest) or typecheckers won't fail.
//
// If you want to run the real Playwright scenario later, uncomment the
// Playwright snippet below and run Playwright as usual.

import { test } from 'vitest';

test.skip('offline page E2E (Playwright)', () => {
	// Skipped: this is a Playwright scenario. To enable E2E with Playwright,
	// re-enable the original Playwright test in this file (or run tests/e2e
	// with Playwright directly).
});

/* Playwright snippet (for reference):
import { test, expect } from '@playwright/test';
const BASE = process.env.PWA_BASE_URL ?? 'http://localhost:5173';

test('offline page is shown when offline', async ({ page, context }) => {
  await page.goto(`${BASE}/`);
  await expect(page).toHaveURL(/\//);
  await context.setOffline(true);
  await page.goto(`${BASE}/`);
  const offlineEl = page.getByTestId('offline-page');
  await expect(offlineEl).toBeVisible();
});
*/
