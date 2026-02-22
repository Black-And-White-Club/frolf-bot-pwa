#!/usr/bin/env node

import process from 'node:process';
import config from '../ws-contract-testkit.config.mjs';
import { runValidateFixturesCli } from '../packages/ws-contract-testkit/src/cli/validate-fixtures.mjs';

runValidateFixturesCli({
	argv: process.argv.slice(2),
	repoRoot: process.cwd(),
	baseConfig: {
		contractsPath: config.fixtures.contractsPath,
		fixturesRoot: config.fixtures.fixturesRoot,
		allowlistPath: config.fixtures.allowlistPath,
		placeholders: config.fixtures.placeholders
	}
});
