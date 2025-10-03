import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltePreprocess } from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [sveltePreprocess(), vitePreprocess(), mdsvex()],
	kit: {
		adapter: adapter()
	},
	extensions: ['.svelte', '.svx']
};

export default config;
