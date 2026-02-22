# Contract Scenario Fixtures

These fixtures are validated against `contracts/events.v1.json` (generated from `frolf-bot-shared`) to prevent topic/payload drift.

## Format

```json
{
	"subject_id": "guild-123",
	"steps": [
		{
			"action": "emit",
			"subject": "round.created.v1.{scope_id}",
			"payload": {}
		}
	]
}
```

Contract-driven step (preferred for drift protection):

```json
{
	"subject_id": "guild-123",
	"steps": [
		{
			"action": "emit",
			"contract_subject": "leaderboard.tag.updated.v1",
			"payload_overrides": {
				"guild_id": "guild-123",
				"reason": "test",
				"user_id": "user-2",
				"old_tag": 5,
				"new_tag": 1
			}
		}
	]
}
```

## Fields

- `subject_id` (optional): value used to replace `{scope_id}` / `{scope}` in step subjects
- `steps` (required): ordered list of scenario steps
- `steps[].action` (optional): `"emit"` (default) or `"stub"`
- `steps[].subject` + `steps[].payload`: explicit step format
- `steps[].contract_subject` + optional `steps[].payload_overrides`: contract-driven format
- `steps[].validate` (optional): set to `false` to skip payload-schema validation for that step (must be allowlisted)

## Commands

- `bun run contracts:sync`
- `bun run contracts:fixtures:check`
- `bun run contracts:check`

## Cypress usage

```ts
cy.wsRunScenario('contracts/scenarios/round/created.simple.json', { subjectId: 'guild-123' });
```

For `contract_subject` steps, `wsRunScenario` generates a payload from the contract schema and merges `payload_overrides`.

## Exception Allowlist

Any fixture step using `\"validate\": false` must have a matching entry in:

`contracts/contract-fixture-exceptions.json`

Validation fails when:

- a `validate:false` step is missing from the allowlist
- an allowlist entry has no matching fixture step (stale debt)
