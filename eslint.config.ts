// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
// import storybook from 'eslint-plugin-storybook';

import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

// Dynamically import eslint-plugin-svelte if it's available. When running
// the complexity scan in environments where the plugin isn't installed
// (CI or tools container), ESLint will error trying to statically import
// it. Using top-level await lets us gracefully fall back to an empty
// placeholder so the config can still be loaded.
let svelte;
try {
	const mod = await import('eslint-plugin-svelte');
	svelte = mod.default || mod;
} catch {
	// plugin not installed; provide a minimal shape so later spreads are safe
	svelte = { configs: { recommended: [], prettier: [] } };
}

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parser: ts.parser, // ✅ move here
			parserOptions: {
				project: true, // let it pick up tsconfig.json
				extraFileExtensions: ['.svelte'],
				tsconfigRootDir: process.cwd(),
				svelteConfig
			}
		}
	}
);
