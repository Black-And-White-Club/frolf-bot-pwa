import { defineConfig } from 'cypress';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DESKTOP_VIEWPORT } from './cypress/support/viewports';

const configFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.dirname(configFilePath);
const componentStateMockPath = path.resolve(repoRoot, 'cypress/support/mocks/app-state.ts');

function runContractGuards(): void {
	const mode = process.env.CYPRESS_CONTRACT_SYNC_MODE ?? 'sync';
	const syncArgs =
		mode === 'check'
			? ['./scripts/sync-event-contracts.mjs', '--check']
			: ['./scripts/sync-event-contracts.mjs'];

	execFileSync('node', syncArgs, {
		cwd: repoRoot,
		stdio: 'inherit'
	});

	execFileSync('node', ['./scripts/validate-contract-fixtures.mjs'], {
		cwd: repoRoot,
		stdio: 'inherit'
	});
}

export default defineConfig({
	defaultBrowser: 'chrome',
	allowCypressEnv: false,
	e2e: {
		baseUrl: 'http://localhost:5173',
		supportFile: 'cypress/support/e2e.ts',
		specPattern: 'cypress/e2e/**/*.cy.ts',
		video: false,
		screenshotOnRunFailure: true,
		viewportWidth: DESKTOP_VIEWPORT.width,
		viewportHeight: DESKTOP_VIEWPORT.height,
		setupNodeEvents(_on, config) {
			if (process.env.CYPRESS_CONTRACT_GUARD !== 'false') {
				runContractGuards();
			}
			return config;
		}
	},
	component: {
		specPattern: 'cypress/component/**/*.cy.ts',
		supportFile: 'cypress/support/component.ts',
		devServer: {
			framework: 'svelte',
			bundler: 'vite',
			viteConfig: {
				resolve: {
					alias: {
						'$app/state': componentStateMockPath
					}
				}
			}
		}
	}
});
