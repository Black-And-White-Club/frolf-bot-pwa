/**
 * Project-level configuration for @frolf/ws-contract-testkit.
 * Paths are resolved relative to repo root (process.cwd()).
 */
export default {
	sync: {
		sourcePath:
			process.env.EVENT_CONTRACTS_SOURCE ??
			'../frolf-bot-shared/artifacts/contracts/events.contracts.json',
		outJsonPath: 'contracts/events.contracts.json',
		outTsPath: 'tests/e2e/support/event-contracts.generated.ts',
		sourceName: 'scripts/sync-event-contracts.mjs'
	},
	fixtures: {
		contractsPath: 'contracts/events.contracts.json',
		fixturesRoot: 'tests/e2e/scenarios',
		allowlistPath: 'contracts/contract-fixture-exceptions.json',
		placeholders: ['{scope_id}', '{scope}']
	}
};
