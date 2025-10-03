# Playwright E2E tests (PWA)

This project includes a simple Playwright configuration and a sample E2E test that demonstrates offline behavior checks. The tests are intentionally lightweight — run them locally when you want to validate PWA features.

Quick start

1. Install dev deps (if not already installed):

```bash
npm install
```

2. Install Playwright browsers (run once):

```bash
npx playwright install
```

3. Start the dev server in one terminal:

```bash
npm run dev
```

4. Run Playwright tests in another terminal:

```bash
npx playwright test --project=chromium
```

Notes
- Adjust the `BASE` URL in `tests/e2e/offline.spec.ts` if your dev server runs on a different host/port.
- The sample test expects an element with `data-testid="offline-page"` to exist in the offline UI; change the selector to match your app.


*** End of file
