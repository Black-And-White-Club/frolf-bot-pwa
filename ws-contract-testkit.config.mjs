/**
 * Project-level configuration for @frolf/ws-contract-testkit.
 * Paths are resolved relative to repo root (process.cwd()).
 */
export default {
	sync: {
		sourcePath:
			process.env.EVENT_CONTRACTS_SOURCE ??
			'../frolf-bot-shared/artifacts/contracts/events.v1.json',
		outJsonPath: 'contracts/events.v1.json',
		outTsPath: 'cypress/support/event-contracts.generated.ts',
		sourceName: 'scripts/sync-event-contracts.mjs'
	},
	fixtures: {
		contractsPath: 'contracts/events.v1.json',
		fixturesRoot: 'cypress/fixtures/contracts',
		allowlistPath: 'contracts/contract-fixture-exceptions.json',
		placeholders: ['{scope_id}', '{scope}']
	}
};
