import { test } from '../../fixtures';
import { expectDashboardLoaded } from '../../support/helpers';

test.describe('Real Backend Smoke', () => {
test.beforeEach(async () => {
if (!process.env.SMOKE_REAL_BACKEND || process.env.SMOKE_REAL_BACKEND === 'false') {
test.skip();
}
});

test('loads the dashboard shell with an auth token', async ({ page, arrangeAuth }) => {
const path = process.env.SMOKE_PATH ?? '/';
const token = process.env.SMOKE_TOKEN ?? 'mock-jwt-token';
await arrangeAuth({ path, token });

await expectDashboardLoaded(page);
});
});
