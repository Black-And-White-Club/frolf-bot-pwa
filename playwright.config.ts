import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e/specs',
	fullyParallel: false, // Tests share a single dev server on :5173; parallel file execution causes port conflicts
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
		},
		{
			// Viewport-sensitive specs only — tests the hamburger nav, compact layouts,
			// and responsive behaviour that never runs at the desktop 1280px breakpoint.
			name: 'mobile-chrome',
			use: { ...devices['Pixel 5'] },
			testMatch: ['**/navigation-shell.spec.ts', '**/dashboard.spec.ts', '**/pwa-shell.spec.ts']
		},
		{
			// Portrait TV (1080×1920) — tall narrow layout that triggers its own responsive
			// breakpoints distinct from both phone and desktop.
			name: 'tv-portrait',
			use: { ...devices['Desktop Chrome'], viewport: { width: 1080, height: 1920 } },
			testMatch: ['**/navigation-shell.spec.ts', '**/dashboard.spec.ts', '**/pwa-shell.spec.ts']
		}
	],
	testIgnore: process.env.PLAYWRIGHT_INCLUDE_SMOKE ? [] : ['**/smoke/**'],
	webServer: {
		command: 'bun run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
		env: {
			PLAYWRIGHT_E2E_MODE: 'true'
		}
	},
	globalSetup: './tests/e2e/global-setup.ts'
});
