// Export a plain config object. Playwright's CLI accepts this directly and
// keeping a plain object avoids type/lint errors in environments without Playwright.
const cfg = {
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: {} },
    { name: 'firefox', use: {} },
    { name: 'webkit', use: {} }
  ]
}

export default cfg
