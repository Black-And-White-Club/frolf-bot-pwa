# Contract Scenario Fixtures

These fixtures are validated against `contracts/events.contracts.json` (generated from `frolf-bot-shared`) to prevent topic/payload drift.

Keep fixture subjects and payload keys aligned with the generated contract catalog, even when the shape looks odd at first glance.
Current examples:

- `leaderboard.tag.list.requested.v1` is still the only published contract subject for tag-list requests. Do not bump it to `v2` locally until the shared catalog changes.
- `BaseRoundPayload` is an upstream wire key in the generated round contracts. Preserve that exact key in fixtures until the shared contract source renames it.
- `round.participant.joined.v2` accepts an optional integer `score`, but not `score: null`. Omit `score` when no value is available so fixtures keep validating against the current schema.

## Format

```json
{
	"subject_id": "guild-123",
	"steps": [
		{
			"action": "emit",
			"subject": "round.created.v2.{scope_id}",
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
			"contract_subject": "leaderboard.tag.updated.v2",
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
