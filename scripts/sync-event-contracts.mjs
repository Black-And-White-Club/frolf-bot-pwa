#!/usr/bin/env node

import process from 'node:process';
import config from '../ws-contract-testkit.config.mjs';
import { runSyncContractsCli } from '../packages/ws-contract-testkit/src/cli/sync-contracts.mjs';

runSyncContractsCli({
	argv: process.argv.slice(2),
	repoRoot: process.cwd(),
	baseConfig: {
		sourcePath: config.sync.sourcePath,
		outJsonPath: config.sync.outJsonPath,
		outTsPath: config.sync.outTsPath
	},
	sourceName: config.sync.sourceName
});
