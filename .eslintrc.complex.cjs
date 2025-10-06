/* eslint-disable */
// Convert legacy-style .eslintrc JSON into a flat-config-friendly object.
// This file is intentionally defensive: it reads the JSON, removes keys
// unsupported by flat configs (like `root`), and maps `parser`/
// `parserOptions` into `languageOptions` so ESLint can consume it.

const raw = require('./.eslintrc.complex.json');
const path = require('path');

// Start with an empty flat-config object
const flat = {};

// Move rules directly
if (raw && raw.rules) {
	flat.rules = raw.rules;
}

// Map parser -> languageOptions.parser (require the parser module)
if (raw && raw.parser) {
	flat.languageOptions = flat.languageOptions || {};
	try {
		// require the parser package (e.g. @typescript-eslint/parser)
		// If it fails, silently skip — ESLint will emit a helpful error later.
		flat.languageOptions.parser = require(raw.parser);
	} catch (e) {
		// no-op: leave parser undefined
	}
}

// Move parserOptions into languageOptions.parserOptions
if (raw && raw.parserOptions) {
	flat.languageOptions = flat.languageOptions || {};
	// Ensure tsconfigRootDir is an absolute path; some configs set it to '.' which
	// causes the TypeError from ESLint's parser when resolving project paths.
	const fs = require('fs');
	const parserOptions = { ...raw.parserOptions };
	if (parserOptions.tsconfigRootDir && !path.isAbsolute(parserOptions.tsconfigRootDir)) {
		parserOptions.tsconfigRootDir = path.resolve(process.cwd(), parserOptions.tsconfigRootDir);
	}

	// If a project-specific tsconfig for ESLint exists (tsconfig.eslint.json), prefer that
	// so test files and extra globs are included. This avoids "file not found in project" parse errors.
	try {
		const eslintTs = path.resolve(process.cwd(), 'tsconfig.eslint.json');
		if (fs.existsSync(eslintTs)) {
			// Make project an absolute path so the parser can resolve it reliably
			parserOptions.project = eslintTs;
		} else if (parserOptions.project && !path.isAbsolute(parserOptions.project)) {
			parserOptions.project = path.resolve(
				parserOptions.tsconfigRootDir || process.cwd(),
				parserOptions.project
			);
		}
	} catch (e) {
		// ignore filesystem issues — fall back to whatever parserOptions were provided
	}

	flat.languageOptions.parserOptions = parserOptions;
}

// Build a flat-config entry. If plugins are declared in the legacy JSON
// (e.g. "sonarjs") try to require them and expose under `plugins` so
// rule names like "sonarjs/cognitive-complexity" can be resolved.
const entry = { ...flat };

// If the legacy JSON didn't specify which files the config applies to,
// provide a sensible default so ESLint knows this config applies to TS/JS/Svelte files.
if (!entry.files) {
	entry.files = ['**/*.{ts,js,svelte}'];
}

if (raw && Array.isArray(raw.plugins) && raw.plugins.length > 0) {
	entry.plugins = entry.plugins || {};
	for (const p of raw.plugins) {
		try {
			// plugin package names are usually `eslint-plugin-<name>`
			// but some configs list the full package; try both.
			let pkgName = `eslint-plugin-${p}`;
			try {
				// try the namespaced package first
				require(pkgName);
			} catch (e) {
				// fallback to using the plugin name directly
				pkgName = p;
			}
			const plugin = require(pkgName);
			entry.plugins[p] = plugin && (plugin.default || plugin);
		} catch (err) {
			// leave plugin out if it cannot be required; ESLint will report a
			// missing plugin error which should tell the user to install it.
		}
	}
}

// Ensure commonly used plugins/parsers are attached when available.
// This helps avoid "Definition for rule '... was not found'" errors during ad-hoc runs.
try {
	// prefer the installed TypeScript parser if the legacy config named it
	if (raw && raw.parser && raw.parser.includes('@typescript-eslint')) {
		try {
			entry.languageOptions = entry.languageOptions || {};
			entry.languageOptions.parser = require('@typescript-eslint/parser');
		} catch (e) {
			// ignore — will fall back to raw value above
		}
	}
} catch (e) {
	/* ignore */
}

// Attach well-known plugin exports if installed to resolve rule names.
try {
	if (!entry.plugins) entry.plugins = {};
	try {
		const tsPlugin = require('@typescript-eslint/eslint-plugin');
		if (tsPlugin) entry.plugins['@typescript-eslint'] = tsPlugin.default || tsPlugin;
	} catch (e) {
		// not installed — fine
	}
	try {
		const sonar = require('eslint-plugin-sonarjs');
		if (sonar) entry.plugins['sonarjs'] = sonar.default || sonar;
	} catch (e) {
		// not installed — fine
	}
} catch (e) {
	// ignore any issues attaching plugins
}

module.exports = [entry];
