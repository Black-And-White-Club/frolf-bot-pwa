declare module '*ws-contract-testkit/src/core.mjs' {
	export type EventContract = {
		subject: string;
		subject_pattern: string;
		supports_scoped_suffix: boolean;
		payload_type: string;
		payload_schema: Record<string, unknown>;
	};

	export type ContractIndex = {
		exactContracts: Map<string, EventContract>;
		scopedContracts: EventContract[];
	};

	export function createContractIndex(catalog: unknown): ContractIndex;
	export function findEventContract(index: ContractIndex, subject: string): EventContract | null;
	export function findExactEventContract(
		index: ContractIndex,
		subject: string
	): EventContract | null;
	export function subjectMatchesContract(contract: EventContract, subject: string): boolean;
	export function buildPayloadFromContract(
		contract: EventContract,
		payloadOverrides?: unknown
	): unknown;
	export function validatePayloadAgainstContract(
		index: ContractIndex,
		subject: string,
		payload: unknown
	): void;
}

declare module '*ws-contract-testkit/src/cypress-adapter.mjs' {
	export type CypressAdapterMaterializedStep = {
		index: number;
		subject: string;
		payload: unknown;
		validate?: boolean;
		action?: 'emit' | 'stub';
		contract: {
			subject: string;
			payload_type: string;
			payload_schema: Record<string, unknown>;
		};
	};

	export type CypressMaterializedScenarioResult =
		| {
				ok: true;
				subject_id: string | null;
				steps: CypressAdapterMaterializedStep[];
		  }
		| {
				ok: false;
				errors: string[];
		  };

	export function createCypressContractAdapter(options: {
		catalog: unknown;
		placeholders?: readonly string[];
	}): {
		materializeScenarioDocument: (
			doc: unknown,
			options?: { subjectId?: string; fileLabel?: string }
		) => CypressMaterializedScenarioResult;
	};
}
