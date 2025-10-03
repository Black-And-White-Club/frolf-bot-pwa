import { test, expect } from '@playwright/test';

// This test assumes you run a dev server locally (npm run dev) on port 5173.
// It demonstrates toggling the context offline and verifying the offline page
// or cached content is displayed. Adjust URLs/ids to match your app.

const BASE = process.env.PWA_BASE_URL ?? 'http://localhost:5173';

test('offline page is shown when offline', async ({ page, context }) => {
  // warm up the site so service worker has a chance to register and cache
  await page.goto(`${BASE}/`);
  await expect(page).toHaveURL(/\//);

  // set offline and navigate to a route
  await context.setOffline(true);
  await page.goto(`${BASE}/`);

  // assert offline indicator or offline page is visible
  // Replace with the data-testid you use for offline UI
  const offlineEl = page.getByTestId('offline-page');
  await expect(offlineEl).toBeVisible();
});
