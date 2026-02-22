import {
	buildPayloadFromContract as buildPayloadFromCore,
	createContractIndex,
	findEventContract as findEventContractFromIndex,
	findExactEventContract as findExactEventContractFromIndex,
	subjectMatchesContract as subjectMatchesContractFromCore,
	validatePayloadAgainstContract as validatePayloadAgainstContractFromCore
} from '../../packages/ws-contract-testkit/src/core.mjs';
import { EVENT_CONTRACT_CATALOG, type EventContract } from './event-contracts.generated';

const CONTRACT_INDEX = createContractIndex(EVENT_CONTRACT_CATALOG);

export function findEventContract(subject: string): EventContract | null {
	return findEventContractFromIndex(CONTRACT_INDEX, subject) as EventContract | null;
}

export function findExactEventContract(subject: string): EventContract | null {
	return findExactEventContractFromIndex(CONTRACT_INDEX, subject) as EventContract | null;
}

export function subjectMatchesContract(contract: EventContract, subject: string): boolean {
	return subjectMatchesContractFromCore(contract, subject);
}

export function buildPayloadFromContract(contract: EventContract, overrides?: unknown): unknown {
	return buildPayloadFromCore(contract, overrides);
}

export function validatePayloadAgainstContract(subject: string, payload: unknown): void {
	validatePayloadAgainstContractFromCore(CONTRACT_INDEX, subject, payload);
}
