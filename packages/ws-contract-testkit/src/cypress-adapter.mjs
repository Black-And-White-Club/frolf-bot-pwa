import {
	buildPayloadFromContract,
	createContractIndex,
	findEventContract,
	findExactEventContract,
	subjectMatchesContract,
	validatePayloadAgainstContract
} from './core.mjs';
import {
	materializeScenarioDocument,
	normalizeScenarioDocument,
	materializeScenarioStep
} from './scenario.mjs';

/**
 * @param {{catalog: unknown, placeholders?: readonly string[]}} options
 */
export function createCypressContractAdapter(options) {
	const contractIndex = createContractIndex(options.catalog);
	const placeholders = options.placeholders ?? ['{scope_id}', '{scope}'];

	return {
		contractIndex,
		findEventContract(subject) {
			return findEventContract(contractIndex, subject);
		},
		findExactEventContract(subject) {
			return findExactEventContract(contractIndex, subject);
		},
		subjectMatchesContract,
		buildPayloadFromContract,
		validatePayloadAgainstContract(subject, payload) {
			validatePayloadAgainstContract(contractIndex, subject, payload);
		},
		normalizeScenarioDocument(doc, fileLabel) {
			return normalizeScenarioDocument(doc, { fileLabel });
		},
		materializeScenarioStep(step, subjectId) {
			return materializeScenarioStep({
				step,
				contractIndex,
				subjectId,
				placeholders
			});
		},
		materializeScenarioDocument(doc, options = {}) {
			return materializeScenarioDocument({
				doc,
				contractIndex,
				fileLabel: options.fileLabel,
				subjectIdOverride: options.subjectId,
				placeholders
			});
		}
	};
}
