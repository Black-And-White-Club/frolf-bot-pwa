import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { VitePWA } from 'vite-plugin-pwa';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';

export default defineConfig({
	resolve: {
		conditions: ['browser'],
		alias: {
			$lib: path.resolve('./src/lib'),
			$tests: path.resolve('./tests'),
			'$tests/*': path.resolve('./tests/*')
		}
	},

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
			? [
					visualizer({
						filename: 'dist/stats.html',
						template: 'treemap',
						gzipSize: true,
						brotliSize: true
					})
				]
			: [])
	],

	test: {
		expect: { requireAssertions: false },
		setupFiles: ['./vitest-setup-client.ts'],

		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'jsdom',
					include: [
						'src/lib/components/**/__tests__/**/*.{test,spec}.{js,ts}',
						'tests/**/*.{test,spec}.{js,ts}'
					],
					exclude: ['src/lib/server/**'],
					server: {
						deps: {
							inline: [
								'svelte',
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
						'src/**/*.svelte.{test,spec}.{js,ts}',
						'src/lib/stores/_deprecated/**'
					]
				}
			}
		],

		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['src/lib/**'],
			exclude: [
				// ignore any __tests__ folders under src/lib (test helpers / fixtures)
				'src/lib/**/__tests__/**',
				// keep your existing detailed excludes
				'src/lib/paraglide/**',
				'src/.svelte-kit/**',
				'src/routes/**',
				'src/stories/**',
				'src/lib/**/stubs/**',
				'src/lib/components/**/stubs/**',
				'src/lib/**/__tests__/stubs/**',
				'src/lib/**/*.stories.*',
				'src/lib/data/**',
				'src/lib/mocks/**',
				'src/lib/server/**',
				'src/lib/services/**',
				'src/lib/types/**',
				'**/*.test.*',
				'**/*.spec.*',
				'**/*.stories.*',
				'**/*.d.ts',
				'src/lib/index.ts',
				'tests/**',
				'lib/**',
				'static/**'
			],
			thresholds: {
				global: {
					statements: 80,
					branches: 60,
					functions: 80,
					lines: 80
				}
			}
		}
	}
});
