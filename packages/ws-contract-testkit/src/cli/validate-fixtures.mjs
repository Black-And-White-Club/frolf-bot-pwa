import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createContractIndex, validatePayloadWithSchema } from '../core.mjs';
import { materializeScenarioDocument } from '../scenario.mjs';

/**
 * @typedef {object} FixtureExceptionEntry
 * @property {string} fixture
 * @property {number} step
 * @property {string} reason
 * @property {string} owner
 * @property {string} created_at
 * @property {string} [subject]
 * @property {string} [contract_subject]
 */

/**
 * @typedef {object} ValidateFixturesConfig
 * @property {string} contractsPath
 * @property {string} fixturesRoot
 * @property {string} allowlistPath
 * @property {readonly string[]} [placeholders]
 * @property {string} [repoRoot]
 */

/**
 * @param {ValidateFixturesConfig} config
 */
export function runValidateFixtures(config) {
	const repoRoot = path.resolve(config.repoRoot ?? process.cwd());
	const contractsPath = path.resolve(repoRoot, config.contractsPath);
	const fixturesRoot = path.resolve(repoRoot, config.fixturesRoot);
	const allowlistPath = path.resolve(repoRoot, config.allowlistPath);
	const placeholders = config.placeholders ?? ['{scope_id}', '{scope}'];

	if (!fs.existsSync(contractsPath)) {
		console.error(`Missing contracts catalog at ${contractsPath}`);
		console.error('Run: node ./scripts/sync-event-contracts.mjs');
		process.exit(1);
	}

	if (!fs.existsSync(fixturesRoot)) {
		console.log(`No contract fixtures directory found at ${fixturesRoot}; skipping.`);
		return;
	}

	if (!fs.existsSync(allowlistPath)) {
		console.error(`Missing fixture exception allowlist at ${allowlistPath}`);
		console.error('Create the allowlist file before running contract fixture validation.');
		process.exit(1);
	}

	const catalog = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
	const contractIndex = createContractIndex(catalog);
	const eventsCount = Array.isArray(catalog?.events) ? catalog.events.length : 0;

	const allowlist = loadAllowlist(allowlistPath);
	const fixtureFiles = walkFiles(fixturesRoot)
		.filter((filePath) => filePath.endsWith('.json'))
		.sort();

	let checkedFiles = 0;
	let checkedSteps = 0;
	const allErrors = [];
	const usedAllowlistKeys = new Set();

	for (const filePath of fixtureFiles) {
		checkedFiles += 1;
		const relativeFilePath = path.relative(repoRoot, filePath);

		let doc;
		try {
			doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
		} catch (error) {
			allErrors.push(`${relativeFilePath}: invalid JSON (${error.message})`);
			continue;
		}

		const materialized = materializeScenarioDocument({
			doc,
			contractIndex,
			fileLabel: relativeFilePath,
			placeholders
		});
		if (!materialized.ok) {
			allErrors.push(...materialized.errors);
			continue;
		}

		for (const step of materialized.steps) {
			checkedSteps += 1;
			const stepKey = `${relativeFilePath}#step${step.index}`;

			if (step.validate === false) {
				const allowEntry = allowlist.get(stepKey);
				if (!allowEntry) {
					allErrors.push(`${stepKey}: validate:false requires an allowlist entry`);
					continue;
				}

				if (allowEntry.subject && allowEntry.subject !== step.subject) {
					allErrors.push(
						`${stepKey}: allowlist subject mismatch (expected "${allowEntry.subject}", got "${step.subject}")`
					);
				}

				if (allowEntry.contract_subject && allowEntry.contract_subject !== step.contract.subject) {
					allErrors.push(
						`${stepKey}: allowlist contract_subject mismatch (expected "${allowEntry.contract_subject}", got "${step.contract.subject}")`
					);
				}

				usedAllowlistKeys.add(stepKey);
				continue;
			}

			const schemaErrors = validatePayloadWithSchema(step.contract.payload_schema, step.payload);
			if (schemaErrors.length > 0) {
				allErrors.push(
					`${stepKey}: payload invalid for "${step.subject}" (${step.contract.payload_type})`
				);
				for (const schemaError of schemaErrors.slice(0, 8)) {
					allErrors.push(`  - ${schemaError}`);
				}
			}
		}
	}

	for (const [allowKey] of allowlist) {
		if (!usedAllowlistKeys.has(allowKey)) {
			allErrors.push(`${allowKey}: stale allowlist entry (no matching validate:false step)`);
		}
	}

	if (allErrors.length > 0) {
		console.error('Contract fixture validation failed:');
		for (const error of allErrors) {
			console.error(error);
		}
		process.exit(1);
	}

	console.log(
		`Validated contract fixtures: files=${checkedFiles}, steps=${checkedSteps}, contracts=${eventsCount}, exceptions=${usedAllowlistKeys.size}`
	);
}

/**
 * @param {{
 * baseConfig: Omit<ValidateFixturesConfig, 'repoRoot'>,
 * argv?: string[],
 * repoRoot?: string
 * }} options
 */
export function runValidateFixturesCli(options) {
	void options.argv;
	runValidateFixtures({
		...options.baseConfig,
		repoRoot: options.repoRoot
	});
}

/**
 * @param {string} allowlistPath
 * @returns {Map<string, FixtureExceptionEntry>}
 */
function loadAllowlist(allowlistPath) {
	const raw = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
	if (!isObject(raw) || !Array.isArray(raw.entries)) {
		console.error(`Invalid allowlist format at ${allowlistPath}: expected { "entries": [...] }`);
		process.exit(1);
	}

	const map = new Map();

	for (const [index, entry] of raw.entries.entries()) {
		if (!isObject(entry)) {
			console.error(`Invalid allowlist entry at index ${index}: expected object`);
			process.exit(1);
		}

		if (!isNonEmptyString(entry.fixture)) {
			console.error(`Invalid allowlist entry at index ${index}: missing non-empty "fixture"`);
			process.exit(1);
		}

		if (!Number.isInteger(entry.step) || entry.step < 1) {
			console.error(`Invalid allowlist entry at index ${index}: invalid "step"`);
			process.exit(1);
		}

		if (!isNonEmptyString(entry.reason)) {
			console.error(`Invalid allowlist entry at index ${index}: missing non-empty "reason"`);
			process.exit(1);
		}

		if (!isNonEmptyString(entry.owner)) {
			console.error(`Invalid allowlist entry at index ${index}: missing non-empty "owner"`);
			process.exit(1);
		}

		if (!isNonEmptyString(entry.created_at)) {
			console.error(`Invalid allowlist entry at index ${index}: missing non-empty "created_at"`);
			process.exit(1);
		}

		const key = `${entry.fixture}#step${entry.step}`;
		if (map.has(key)) {
			console.error(`Duplicate allowlist entry: ${key}`);
			process.exit(1);
		}

		map.set(key, {
			fixture: entry.fixture,
			step: entry.step,
			reason: entry.reason,
			owner: entry.owner,
			created_at: entry.created_at,
			subject: typeof entry.subject === 'string' ? entry.subject : undefined,
			contract_subject:
				typeof entry.contract_subject === 'string' ? entry.contract_subject : undefined
		});
	}

	return map;
}

/**
 * @param {string} rootDir
 * @returns {string[]}
 */
function walkFiles(rootDir) {
	const files = [];
	const entries = fs.readdirSync(rootDir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(rootDir, entry.name);
		if (entry.isDirectory()) {
			files.push(...walkFiles(fullPath));
			continue;
		}
		if (entry.isFile()) {
			files.push(fullPath);
		}
	}

	return files;
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isNonEmptyString(value) {
	return typeof value === 'string' && value.trim().length > 0;
}
