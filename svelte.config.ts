import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltePreprocess } from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [sveltePreprocess({}), vitePreprocess(), mdsvex()],
	kit: {
		adapter: adapter(),
		// Keep TS path aliases in the kit config so SvelteKit/Vite handle
		// module resolution instead of duplicating them in tsconfig.
		// See: https://svelte.dev/docs/kit/configuration#alias
		alias: {
			$lib: 'src/lib',
			'$lib/*': 'src/lib/*',
			$tests: 'tests',
			'$tests/*': 'tests/*'
		}
	},
	extensions: ['.svelte', '.svx']
};

export default config;
