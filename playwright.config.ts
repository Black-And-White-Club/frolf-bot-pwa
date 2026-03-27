import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
testDir: './tests/e2e/specs',
fullyParallel: false,
forbidOnly: !!process.env.CI,
retries: process.env.CI ? 1 : 0,
workers: process.env.CI ? 2 : undefined,
reporter: 'html',
use: {
baseURL: 'http://localhost:5173',
trace: 'on-first-retry',
screenshot: 'only-on-failure',
viewport: { width: 1280, height: 1024 }
},
projects: [
{
name: 'chromium',
use: { ...devices['Desktop Chrome'] }
}
],
webServer: {
command: 'bun run dev',
url: 'http://localhost:5173',
reuseExistingServer: !process.env.CI,
timeout: 120 * 1000
},
globalSetup: './tests/e2e/global-setup.ts'
});
