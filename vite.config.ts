import { paraglideVitePlugin } from '@inlang/paraglide-js';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';


export default defineConfig({
	// Prefer browser exports so Svelte's client runtime is used (mount / onMount available)
	resolve: {
		conditions: ['browser']
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		})
	],
	test: {
	// Allow testing-library queries (getByText/getByTestId) to be used without explicit expect()
	// Many existing tests rely on getBy* throwing instead of calling expect(), so disable this strict rule.
	expect: { requireAssertions: false },
		projects: [
				{
					extends: './vite.config.ts',
					test: {
						name: 'client',
						environment: 'jsdom',
						include: [
							'src/lib/components/**/*.test.{js,ts}',
							'src/lib/components/**/*.spec.{js,ts}',
							'src/demo.spec.{js,ts}'
						],
						exclude: ['src/lib/server/**'],
						setupFiles: ['./vitest-setup-client.ts'],
						// Inline svelte and testing packages so Vite transforms them for the jsdom client runtime.
						// Use server.deps.inline (recommended) so vite-node/vitest will pre-bundle these deps for tests.
						server: {
							deps: {
								inline: [
									'svelte',
									// Explicit client entries to ensure client runtime is used in tests
									'svelte/src/index-client.js',
									'svelte/src/internal/index.js',
									'svelte/src/internal/client/index.js',
									'svelte/src/store/index-client.js',
									'svelte/internal',
									'svelte/store',
									'@testing-library/svelte',
									'@testing-library/dom'
								]
							}
						}
					}
				},
				{
					extends: './vite.config.ts',
					test: {
						name: 'server',
						environment: 'node',
						include: ['src/**/*.{test,spec}.{js,ts}'],
						exclude: [
							'src/lib/components/**',
							'src/**/*.svelte.{test,spec}.{js,ts}'
						]
					}
				}
		]
		,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			exclude: [
				'src/lib/paraglide/**',
				'src/routes/**',
				'src/stories/**',
				'public/**',
				'tests/**'
			],
			// Coverage thresholds are enforced via separate CI checks or vitest CLI.
		}
	}
});
