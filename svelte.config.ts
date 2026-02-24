import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltePreprocess } from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [sveltePreprocess({}), vitePreprocess(), mdsvex()],
	kit: {
		adapter: adapter({
			// Output directory for the Node.js server
			out: 'build',
			// Precompress static assets for better performance
			precompress: true,
			// Use environment variables for host/port (K8s friendly)
			envPrefix: ''
		}),
		// Keep TS path aliases in the kit config so SvelteKit/Vite handle
		// module resolution instead of duplicating them in tsconfig.
		// See: https://svelte.dev/docs/kit/configuration#alias
		alias: {
			$lib: 'src/lib',
			'$lib/*': 'src/lib/*',
			$tests: 'tests',
			'$tests/*': 'tests/*'
		},
		csp: {
			mode: 'nonce',
			directives: {
				'default-src': ["'self'"],
				'script-src': ["'self'"],
				'style-src': ["'self'"],
				'style-src-attr': ["'unsafe-inline'"],
				'img-src': [
					"'self'",
					'data:',
					'https://images.unsplash.com',
					'https://*.githubusercontent.com',
					'https://cdn.discordapp.com'
				],
				'font-src': ["'self'", 'data:'],
				'manifest-src': ["'self'"],
				'object-src': ["'none'"],
				'base-uri': ["'self'"],
				'frame-ancestors': ["'none'"]
			}
		}
	},
	extensions: ['.svelte', '.svx']
};

export default config;
