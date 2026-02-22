import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { renderContractCatalogTsModule, toCanonicalJson } from '../core.mjs';

/**
 * @typedef {object} SyncContractsConfig
 * @property {string} sourcePath
 * @property {string} outJsonPath
 * @property {string} outTsPath
 * @property {boolean} [checkMode]
 * @property {string} [sourceName]
 * @property {string} [repoRoot]
 */

/**
 * @param {SyncContractsConfig} config
 */
export function runSyncContracts(config) {
	const repoRoot = path.resolve(config.repoRoot ?? process.cwd());
	const sourcePath = path.resolve(repoRoot, config.sourcePath);
	const outJsonPath = path.resolve(repoRoot, config.outJsonPath);
	const outTsPath = path.resolve(repoRoot, config.outTsPath);
	const checkMode = config.checkMode ?? false;

	if (!fs.existsSync(sourcePath)) {
		console.error(`Contract source not found: ${sourcePath}`);
		process.exit(1);
	}

	const catalog = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
	const canonicalJson = toCanonicalJson(catalog);
	const generatedTs = renderContractCatalogTsModule(catalog, {
		sourceName: config.sourceName ?? 'ws-contract-testkit'
	});

	if (checkMode) {
		assertFileMatches(outJsonPath, canonicalJson, config.outJsonPath);
		assertFileMatches(outTsPath, generatedTs, config.outTsPath);
		console.log('Event contracts are up to date.');
		return;
	}

	fs.mkdirSync(path.dirname(outJsonPath), { recursive: true });
	fs.mkdirSync(path.dirname(outTsPath), { recursive: true });
	fs.writeFileSync(outJsonPath, canonicalJson);
	fs.writeFileSync(outTsPath, generatedTs);
	console.log('Synced event contracts from shared package.');
}

/**
 * @param {{
 * argv?: string[],
 * baseConfig: Omit<SyncContractsConfig, 'checkMode'>,
 * repoRoot?: string,
 * sourceName?: string
 * }} options
 */
export function runSyncContractsCli(options) {
	const argv = options.argv ?? process.argv.slice(2);
	const args = new Set(argv);

	runSyncContracts({
		...options.baseConfig,
		repoRoot: options.repoRoot,
		sourceName: options.sourceName,
		checkMode: args.has('--check')
	});
}

/**
 * @param {string} targetPath
 * @param {string} expected
 * @param {string} label
 */
function assertFileMatches(targetPath, expected, label) {
	if (!fs.existsSync(targetPath)) {
		console.error(`Missing generated file: ${label}`);
		process.exit(1);
	}

	const actual = fs.readFileSync(targetPath, 'utf8');
	if (actual !== expected) {
		console.error(`Stale generated file: ${label}`);
		console.error('Run: node ./scripts/sync-event-contracts.mjs');
		process.exit(1);
	}
}
