import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { VitePWA } from 'vite-plugin-pwa';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	// Prefer browser exports so Svelte's client runtime is used (mount / onMount available)
	resolve: { conditions: ['browser'] },
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide' }),
		VitePWA({
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'service-worker.js',
			injectManifest: {
				swSrc: 'src/service-worker.ts'
			},
			includeAssets: [
				'favicon.svg',
				'offline.html',
				'fonts/inter-v20-latin-regular.woff2',
				'fonts/inter-v20-latin-500.woff2',
				'fonts/inter-v20-latin-600.woff2',
				'fonts/inter-v20-latin-700.woff2',
				'fonts/space-grotesk-v22-latin-regular.woff2',
				'fonts/space-grotesk-v22-latin-500.woff2',
				'fonts/space-grotesk-v22-latin-600.woff2',
				'fonts/space-grotesk-v22-latin-700.woff2'
			],
			workbox: {
				maximumFileSizeToCacheInBytes: 5_000_000,
				runtimeCaching: [
					{
						urlPattern: /\/fonts\/.*\.woff2$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'pwa-fonts',
							expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
							cacheableResponse: { statuses: [0, 200] }
						}
					},
					{
						urlPattern: /\/api\//,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'api-cache',
							expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }
						}
					}
				]
			}
		}),
		...(process.env.ANALYZE
			? [visualizer({ filename: 'dist/stats.html', template: 'treemap' })]
			: [])
	],
	test: {
		expect: { requireAssertions: false },
		// Shared setup for any test that uses jsdom (annotated or client project).
		// This ensures polyfills and DOM safety stubs are available regardless of project.
		setupFiles: ['./vitest-setup-client.ts'],
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
						'src/demo.spec.{js,ts}',
						'src/lib/a11y/**/*.test.{js,ts}'
					],
					exclude: ['src/lib/server/**'],
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
					exclude: ['src/lib/components/**', 'src/**/*.svelte.{test,spec}.{js,ts}']
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
				// Exclude small test-only Svelte stubs so they don't skew coverage
				'src/lib/**/stubs/**',
				// Also explicitly ignore any stubs under components or __tests__
				'src/lib/components/**/stubs/**',
				'src/lib/**/__tests__/stubs/**',
				// Story files and demo/mock data skew coverage; exclude them
				'src/lib/**/*.stories.*',
				'src/lib/data/**',
				'src/lib/mocks/**',
				'src/lib/server/**',
				'src/lib/services/**',
				'src/lib/types/**',
				// Exclude test files, specs, and type declarations from coverage
				'**/*.test.*',
				'**/*.spec.*',
				'**/*.stories.*',
				'src/stories/**',
				'**/*.d.ts',
				'src/lib/index.ts',
				'src/lib/**/__tests__/**',
				'src/lib/**/tests/**',
				// Also exclude compiled/output folders that appear in v8 reports
				'lib/**',
				'lib/**/*.stories.*',
				'lib/data/**',
				'lib/mocks/**',
				'lib/server/**',
				'lib/services/**',
				'lib/types/**',
				'public/**',
				'tests/**'
			],
			// Soft thresholds for the library code. CI can enforce stricter limits.
			thresholds: {
				global: {
					statements: 80,
					branches: 60,
					functions: 80,
					lines: 80
				}
			}
			// Coverage focuses on src/lib/**; enforce stricter thresholds in CI if needed.
		}
	}
});
