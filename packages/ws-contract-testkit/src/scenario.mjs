import {
	buildPayloadFromContract,
	findExactEventContract,
	findEventContract,
	resolveSubject,
	subjectMatchesContract,
	validatePayloadWithSchema
} from './core.mjs';

/**
 * @typedef {object} NormalizedScenarioStep
 * @property {number} index
 * @property {string | undefined} subject
 * @property {string | undefined} contract_subject
 * @property {unknown} payload
 * @property {unknown} payload_overrides
 * @property {boolean | undefined} validate
 * @property {'emit' | 'stub' | undefined} action
 */

/**
 * @param {unknown} doc
 * @param {{fileLabel?: string}} options
 * @returns {{ok: true, subject_id: string | null, steps: NormalizedScenarioStep[]} | {ok: false, errors: string[]}}
 */
export function normalizeScenarioDocument(doc, options = {}) {
	const fileLabel = options.fileLabel ?? 'scenario';
	const errors = [];

	if (Array.isArray(doc)) {
		const steps = normalizeSteps(doc, errors);
		return errors.length > 0 ? { ok: false, errors } : { ok: true, subject_id: null, steps };
	}

	if (!isObject(doc)) {
		errors.push(`${fileLabel}: expected object or array scenario`);
		return { ok: false, errors };
	}

	if (Array.isArray(doc.steps)) {
		const subjectId = typeof doc.subject_id === 'string' ? doc.subject_id : null;
		const steps = normalizeSteps(doc.steps, errors);
		return errors.length > 0 ? { ok: false, errors } : { ok: true, subject_id: subjectId, steps };
	}

	if (
		(typeof doc.subject === 'string' && 'payload' in doc) ||
		typeof doc.contract_subject === 'string'
	) {
		const subjectId = typeof doc.subject_id === 'string' ? doc.subject_id : null;
		const steps = normalizeSteps([doc], errors);
		return errors.length > 0 ? { ok: false, errors } : { ok: true, subject_id: subjectId, steps };
	}

	errors.push(
		`${fileLabel}: expected {steps:[...]} or {subject,payload} or {contract_subject,...}`
	);
	return { ok: false, errors };
}

/**
 * @param {{
 * step: NormalizedScenarioStep,
 * contractIndex: import('./core.mjs').ContractIndex,
 * subjectId: string | null | undefined,
 * placeholders?: readonly string[]
 * }} params
 * @returns {{ok: true, subject: string, payload: unknown, validate: boolean | undefined, action: 'emit' | 'stub' | undefined, contract: import('./core.mjs').EventContract} | {ok: false, error: string}}
 */
export function materializeScenarioStep({
	step,
	contractIndex,
	subjectId,
	placeholders = ['{scope_id}', '{scope}']
}) {
	if (isNonEmptyString(step.contract_subject)) {
		const contract = findExactEventContract(contractIndex, step.contract_subject);
		if (!contract) {
			return {
				ok: false,
				error: `no contract found for contract_subject "${step.contract_subject}"`
			};
		}

		const rawSubject = isNonEmptyString(step.subject)
			? step.subject
			: contract.subject_pattern || contract.subject;

		const resolvedSubject = resolveSubject(rawSubject, subjectId, placeholders);
		if (!resolvedSubject.ok) {
			return resolvedSubject;
		}

		if (!subjectMatchesContract(contract, resolvedSubject.value)) {
			return {
				ok: false,
				error: `subject "${resolvedSubject.value}" does not match contract "${step.contract_subject}"`
			};
		}

		return {
			ok: true,
			subject: resolvedSubject.value,
			payload: buildPayloadFromContract(contract, step.payload_overrides),
			validate: step.validate,
			action: step.action,
			contract
		};
	}

	const resolvedSubject = resolveSubject(step.subject, subjectId, placeholders);
	if (!resolvedSubject.ok) {
		return resolvedSubject;
	}

	const contract = findEventContract(contractIndex, resolvedSubject.value);
	if (!contract) {
		return {
			ok: false,
			error: `no contract found for subject "${resolvedSubject.value}"`
		};
	}

	return {
		ok: true,
		subject: resolvedSubject.value,
		payload: step.payload,
		validate: step.validate,
		action: step.action,
		contract
	};
}

/**
 * @param {{
 * doc: unknown,
 * contractIndex: import('./core.mjs').ContractIndex,
 * fileLabel?: string,
 * subjectIdOverride?: string,
 * placeholders?: readonly string[]
 * }} params
 * @returns {{ok: true, steps: Array<{index: number, subject: string, payload: unknown, validate: boolean | undefined, action: 'emit' | 'stub' | undefined, contract: import('./core.mjs').EventContract}>, subject_id: string | null} | {ok: false, errors: string[]}}
 */
export function materializeScenarioDocument({
	doc,
	contractIndex,
	fileLabel,
	subjectIdOverride,
	placeholders = ['{scope_id}', '{scope}']
}) {
	const parsed = normalizeScenarioDocument(doc, { fileLabel });
	if (!parsed.ok) {
		return parsed;
	}

	const effectiveSubjectId = subjectIdOverride ?? parsed.subject_id;
	const errors = [];
	const materializedSteps = [];

	for (const step of parsed.steps) {
		const resolved = materializeScenarioStep({
			step,
			contractIndex,
			subjectId: effectiveSubjectId,
			placeholders
		});

		if (!resolved.ok) {
			errors.push(`${fileLabel ?? 'scenario'}#step${step.index}: ${resolved.error}`);
			continue;
		}

		materializedSteps.push({
			index: step.index,
			subject: resolved.subject,
			payload: resolved.payload,
			validate: resolved.validate,
			action: resolved.action,
			contract: resolved.contract
		});
	}

	if (errors.length > 0) {
		return { ok: false, errors };
	}

	return {
		ok: true,
		subject_id: effectiveSubjectId,
		steps: materializedSteps
	};
}

/**
 * @param {Array<{
 * index: number,
 * subject: string,
 * payload: unknown,
 * validate: boolean | undefined,
 * contract: import('./core.mjs').EventContract
 * }>} materializedSteps
 * @returns {string[]}
 */
export function validateMaterializedScenarioSteps(materializedSteps) {
	const errors = [];

	for (const step of materializedSteps) {
		if (step.validate === false) {
			continue;
		}

		const schemaErrors = validatePayloadWithSchema(step.contract.payload_schema, step.payload);
		if (schemaErrors.length > 0) {
			errors.push(`payload invalid for "${step.subject}" (${step.contract.payload_type})`);
			for (const schemaError of schemaErrors.slice(0, 8)) {
				errors.push(`  - ${schemaError}`);
			}
		}
	}

	return errors;
}

/**
 * @param {unknown[]} rawSteps
 * @param {string[]} errors
 * @returns {NormalizedScenarioStep[]}
 */
function normalizeSteps(rawSteps, errors) {
	return rawSteps.map((rawStep, idx) => {
		const stepIndex = idx + 1;

		if (!isObject(rawStep)) {
			errors.push(`step${stepIndex}: expected object`);
			return {
				index: stepIndex,
				subject: undefined,
				contract_subject: undefined,
				payload: null,
				payload_overrides: undefined,
				validate: undefined,
				action: undefined
			};
		}

		const hasContractSubject = isNonEmptyString(rawStep.contract_subject);
		const hasSubject = isNonEmptyString(rawStep.subject);
		const hasPayload = 'payload' in rawStep;

		if (!hasContractSubject && !hasSubject) {
			errors.push(`step${stepIndex}: missing "subject" or "contract_subject"`);
		}

		if (!hasContractSubject && !hasPayload) {
			errors.push(`step${stepIndex}: missing "payload" for explicit subject step`);
		}

		if (hasContractSubject && hasPayload) {
			errors.push(
				`step${stepIndex}: use "payload_overrides" (not "payload") with "contract_subject"`
			);
		}

		return {
			index: stepIndex,
			subject: hasSubject ? rawStep.subject : undefined,
			contract_subject: hasContractSubject ? rawStep.contract_subject : undefined,
			payload: rawStep.payload,
			payload_overrides: rawStep.payload_overrides,
			validate: typeof rawStep.validate === 'boolean' ? rawStep.validate : undefined,
			action: rawStep.action === 'emit' || rawStep.action === 'stub' ? rawStep.action : undefined
		};
	});
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isNonEmptyString(value) {
	return typeof value === 'string' && value.trim().length > 0;
}
