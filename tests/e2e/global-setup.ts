import { execFileSync } from 'node:child_process';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '../..');

export default function globalSetup(): void {
if (process.env.PLAYWRIGHT_CONTRACT_GUARD === 'false') {
return;
}
const mode = process.env.PLAYWRIGHT_CONTRACT_SYNC_MODE ?? 'sync';
const syncArgs =
mode === 'check'
? ['./scripts/sync-event-contracts.mjs', '--check']
: ['./scripts/sync-event-contracts.mjs'];
execFileSync('node', syncArgs, { cwd: repoRoot, stdio: 'inherit' });
execFileSync('node', ['./scripts/validate-contract-fixtures.mjs'], {
cwd: repoRoot,
stdio: 'inherit'
});
}
