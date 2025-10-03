import { paraglideVitePlugin } from '@inlang/paraglide-js';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	// Prefer browser exports so Svelte's client runtime is used (mount / onMount available)
	resolve: { conditions: ['browser'] },
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide' })
	],
	test: {
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
						'src/lib/utils/**/*.test.{js,ts}',
						'src/demo.spec.{js,ts}'
					],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts'],
					server: {
						deps: {
							inline: [
								'svelte',
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
					exclude: ['src/lib/components/**', "src/**/*.svelte.{test,spec}.{js,ts}"]
				}
			}
		],

		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			// Focus coverage on application library code and ignore build/config/generated files
			include: ['src/lib/**'],
			exclude: [
				'src/lib/paraglide/**',
				'src/.svelte-kit/**',
				'src/routes/**',
				'src/stories/**',
				// Story files and demo/mock data skew coverage; exclude them
				'src/lib/**/*.stories.*',
				'src/lib/data/**',
				'src/lib/mocks/**',
				'src/lib/server/**',
				'src/lib/services/**',
				'src/lib/types/**',
				'public/**',
				'tests/**'
			],
			// Soft thresholds for the library code. CI can enforce stricter limits.
				// Coverage focuses on src/lib/**; enforce thresholds in CI if needed.
		}
	}
});

