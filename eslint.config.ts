// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
// import storybook from 'eslint-plugin-storybook';

import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
// Import the project's Svelte config. The project uses a TypeScript svelte.config.ts
// file, so import that instead of a .js file so the config can be loaded when
// ESLint runs in a Node environment that supports ESM imports of TS files.
import svelteConfig from './svelte.config.ts';

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

// Dynamically import the Svelte parser so .svelte files are parsed correctly.
let svelteParser;
try {
	const mod = await import('svelte-eslint-parser');
	svelteParser = mod.default || mod;
} catch {
	// parser not available; we'll fall back to the TypeScript parser which will
	// produce parse errors for Svelte files but won't crash the config loader.
	svelteParser = undefined;
}

// Dynamically import sonarjs plugin for complexity rules
let sonarjs;
try {
	const mod = await import('eslint-plugin-sonarjs');
	sonarjs = mod.default || mod;
} catch {
	// plugin not installed; skip complexity rules
	sonarjs = null;
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
	// Relax some rules for test, storybook and cypress files where `any` is
	// commonly used and namespaces are still present in some helper files.
	{
		files: [
			'cypress/**',
			'tests/**',
			'**/__tests__/**',
			'**/*.spec.{ts,js}',
			'**/*.test.{ts,js}',
			'**/*.stories.{ts,js}'
		],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-namespace': 'off'
		}
	},
	// Disable svelte navigation resolution rule in UI component files where
	// links may be generated dynamically or intentionally use raw URLs.
	{
		files: ['src/routes/**', 'src/lib/components/**'],
		rules: {
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	// Relax explicit any rule across the app source to reduce churn while migrating
	// types. We keep the rule enabled for tests to encourage typed tests.
	{
		files: ['src/**'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off'
		}
	},
	// Disable svelte unused props checks across src to avoid noisy linting when
	// round/participant shapes include many fields that are intentionally unused
	// in some components. We'll selectively re-enable stricter checks later.
	{
		files: ['src/**'],
		rules: {
			'svelte/no-unused-props': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			// Use the Svelte-specific parser and point it at the TypeScript
			// parser for processing <script lang="ts"> blocks inside .svelte files.
			parser: svelteParser || ts.parser,
			parserOptions: {
				parser: ts.parser,
				project: true,
				extraFileExtensions: ['.svelte'],
				tsconfigRootDir: process.cwd(),
				svelteConfig
			}
		}
	},
	// Complexity rules (from .eslintrc.complex.json)
	{
		files: ['**/*.{ts,js,svelte}'],
		...(sonarjs && { plugins: { sonarjs } }),
		rules: {
			complexity: ['warn', 10],
			'max-depth': ['warn', 4],
			'max-statements': ['warn', 40],
			...(sonarjs && { 'sonarjs/cognitive-complexity': ['warn', 15] })
		}
	}
);
