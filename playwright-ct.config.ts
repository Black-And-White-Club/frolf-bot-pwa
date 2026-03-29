import { defineConfig, devices } from '@playwright/experimental-ct-svelte';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
	testDir: './tests/ct',
	use: {
		ctPort: 3100,
		ctViteConfig: {
			plugins: [svelte(), tailwindcss()],
			resolve: {
				alias: {
					$lib: path.resolve('./src/lib'),
					'$env/dynamic/public': path.resolve('./tests/ct/mocks/env-dynamic-public.ts'),
					'$app/state': path.resolve('./tests/ct/mocks/app-state.ts'),
					'$app/navigation': path.resolve('./tests/ct/mocks/app-navigation.ts'),
					'$app/paths': path.resolve('./tests/ct/mocks/app-paths.ts'),
					'$app/environment': path.resolve('./tests/ct/mocks/app-environment.ts')
				}
			}
		}
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});
