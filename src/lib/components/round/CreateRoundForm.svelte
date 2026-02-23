<script lang="ts">
	import { createRoundService } from '$lib/stores/createRound.svelte';

	type FieldErrors = {
		title?: string;
		description?: string;
		startTime?: string;
		timezone?: string;
		location?: string;
	};

	type FormValues = {
		title: string;
		description: string;
		startTime: string;
		timezone: string;
		location: string;
	};

	type Props = {
		onSuccess?: () => void | Promise<void>;
		cancelHref?: string;
	};

	let { onSuccess, cancelHref = '/rounds' }: Props = $props();

	const START_TIME_PLACEHOLDER = 'YYYY-MM-DD HH:MM';
	const FALLBACK_TIMEZONE = 'America/Chicago';

	function initialTimezone(): string {
		if (typeof Intl === 'undefined') {
			return FALLBACK_TIMEZONE;
		}

		const resolvedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone?.trim();
		return resolvedTimezone || FALLBACK_TIMEZONE;
	}

	let title = $state('');
	let description = $state('');
	let startTime = $state('');
	let timezone = $state(initialTimezone());
	let location = $state('');
	let errors = $state<FieldErrors>({});
	let errorSummary = $state<string | null>(null);

	let titleInput = $state<HTMLInputElement | null>(null);
	let descriptionInput = $state<HTMLTextAreaElement | null>(null);
	let startTimeInput = $state<HTMLInputElement | null>(null);
	let timezoneInput = $state<HTMLInputElement | null>(null);
	let locationInput = $state<HTMLInputElement | null>(null);

	function validate(values: FormValues): FieldErrors {
		const nextErrors: FieldErrors = {};

		if (!values.title) {
			nextErrors.title = 'Title is required.';
		} else if (values.title.length > 100) {
			nextErrors.title = 'Title must be 100 characters or fewer.';
		}

		if (!values.startTime) {
			nextErrors.startTime = 'Start time is required.';
		}

		if (values.timezone.length > 80) {
			nextErrors.timezone = 'Timezone must be 80 characters or fewer.';
		}

		if (!values.location) {
			nextErrors.location = 'Location is required.';
		} else if (values.location.length > 100) {
			nextErrors.location = 'Location must be 100 characters or fewer.';
		}

		if (values.description.length > 500) {
			nextErrors.description = 'Description must be 500 characters or fewer.';
		}

		return nextErrors;
	}

	function firstInvalidField(nextErrors: FieldErrors): keyof FieldErrors | null {
		const order: Array<keyof FieldErrors> = [
			'title',
			'description',
			'startTime',
			'timezone',
			'location'
		];
		for (const key of order) {
			if (nextErrors[key]) {
				return key;
			}
		}
		return null;
	}

	function focusField(field: keyof FieldErrors): void {
		const fieldMap: Record<keyof FieldErrors, HTMLInputElement | HTMLTextAreaElement | null> = {
			title: titleInput,
			description: descriptionInput,
			startTime: startTimeInput,
			timezone: timezoneInput,
			location: locationInput
		};
		fieldMap[field]?.focus();
	}

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		const values: FormValues = {
			title: title.trim(),
			description: description.trim(),
			startTime: startTime.trim(),
			timezone: timezone.trim(),
			location: location.trim()
		};

		const nextErrors = validate(values);
		errors = nextErrors;

		const firstInvalid = firstInvalidField(nextErrors);
		if (firstInvalid) {
			errorSummary = 'Fix the highlighted fields and try again.';
			focusField(firstInvalid);
			return;
		}

		errorSummary = null;

		const submitted = await createRoundService.submit(values);
		if (submitted && onSuccess) {
			await onSuccess();
		}
	}
</script>

<form class="create-round-form" data-testid="create-round-form" onsubmit={handleSubmit} novalidate>
	{#if errorSummary}
		<div class="form-alert error" role="alert">
			{errorSummary}
		</div>
	{/if}

	{#if createRoundService.errorMessage}
		<div class="form-alert error" role="alert">
			{createRoundService.errorMessage}
		</div>
	{/if}

	<div class="form-field">
		<label for="create-round-title">Title</label>
		<input
			id="create-round-title"
			data-testid="input-create-round-title"
			bind:value={title}
			bind:this={titleInput}
			type="text"
			maxlength={100}
			required
			autocomplete="off"
			aria-invalid={errors.title ? 'true' : undefined}
			aria-describedby={errors.title ? 'create-round-title-error' : undefined}
		/>
		{#if errors.title}
			<p class="field-error" id="create-round-title-error">{errors.title}</p>
		{/if}
	</div>

	<div class="form-field">
		<label for="create-round-description">Description (optional)</label>
		<textarea
			id="create-round-description"
			data-testid="input-create-round-description"
			bind:value={description}
			bind:this={descriptionInput}
			rows={4}
			maxlength={500}
			aria-invalid={errors.description ? 'true' : undefined}
			aria-describedby={errors.description ? 'create-round-description-error' : undefined}
		></textarea>
		{#if errors.description}
			<p class="field-error" id="create-round-description-error">{errors.description}</p>
		{/if}
	</div>

	<div class="form-field">
		<label for="create-round-start-time">Start Time</label>
		<input
			id="create-round-start-time"
			data-testid="input-create-round-start-time"
			bind:value={startTime}
			bind:this={startTimeInput}
			type="text"
			inputmode="text"
			required
			placeholder={START_TIME_PLACEHOLDER}
			aria-invalid={errors.startTime ? 'true' : undefined}
			aria-describedby={errors.startTime ? 'create-round-start-time-error' : undefined}
		/>
		{#if errors.startTime}
			<p class="field-error" id="create-round-start-time-error">{errors.startTime}</p>
		{/if}
	</div>

	<div class="form-field">
		<label for="create-round-timezone">Timezone</label>
		<input
			id="create-round-timezone"
			data-testid="input-create-round-timezone"
			bind:value={timezone}
			bind:this={timezoneInput}
			type="text"
			maxlength={80}
			placeholder={FALLBACK_TIMEZONE}
			aria-invalid={errors.timezone ? 'true' : undefined}
			aria-describedby={errors.timezone ? 'create-round-timezone-error' : undefined}
		/>
		{#if errors.timezone}
			<p class="field-error" id="create-round-timezone-error">{errors.timezone}</p>
		{/if}
	</div>

	<div class="form-field">
		<label for="create-round-location">Location</label>
		<input
			id="create-round-location"
			data-testid="input-create-round-location"
			bind:value={location}
			bind:this={locationInput}
			type="text"
			maxlength={100}
			required
			autocomplete="off"
			aria-invalid={errors.location ? 'true' : undefined}
			aria-describedby={errors.location ? 'create-round-location-error' : undefined}
		/>
		{#if errors.location}
			<p class="field-error" id="create-round-location-error">{errors.location}</p>
		{/if}
	</div>

	<div class="actions">
		<a class="secondary" data-testid="link-create-round-cancel" href={cancelHref}>Cancel</a>
		<button
			class="primary"
			data-testid="btn-create-round-submit"
			type="submit"
			disabled={createRoundService.submitting}
		>
			{createRoundService.submitting ? 'Creating…' : 'Create Round'}
		</button>
	</div>
</form>

<style>
	.create-round-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-bottom: 6rem;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-family: var(--font-secondary);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--guild-text-secondary);
	}

	input,
	textarea {
		width: 100%;
		border-radius: 0.65rem;
		border: 1px solid var(--guild-border);
		background: var(--guild-surface-elevated);
		color: var(--guild-text);
		padding: 0.75rem 0.85rem;
		font-family: var(--font-secondary);
		font-size: 0.95rem;
	}

	input:focus-visible,
	textarea:focus-visible {
		outline: 2px solid var(--guild-primary);
		outline-offset: 2px;
	}

	.field-error {
		margin: 0;
		font-family: var(--font-secondary);
		font-size: 0.8rem;
		color: #f87171;
	}

	.form-alert {
		border-radius: 0.6rem;
		padding: 0.65rem 0.8rem;
		font-family: var(--font-secondary);
		font-size: 0.9rem;
	}

	.form-alert.error {
		border: 1px solid rgba(248, 113, 113, 0.45);
		background: rgba(248, 113, 113, 0.12);
		color: #fca5a5;
	}

	.actions {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		gap: 0.75rem;
		padding: 0.85rem 1rem calc(0.85rem + env(safe-area-inset-bottom));
		background: color-mix(in srgb, var(--guild-background) 90%, transparent);
		border-top: 1px solid var(--guild-border);
		backdrop-filter: blur(8px);
	}

	.actions .secondary,
	.actions .primary {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.65rem;
		padding: 0.75rem 1rem;
		font-family: var(--font-secondary);
		font-weight: 600;
		font-size: 0.95rem;
		text-decoration: none;
	}

	.actions .secondary {
		border: 1px solid var(--guild-border);
		color: var(--guild-text);
		background: var(--guild-surface);
	}

	.actions .primary {
		border: none;
		color: var(--guild-surface);
		background: var(--guild-primary);
		cursor: pointer;
	}

	.actions .primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (min-width: 768px) {
		.create-round-form {
			padding-bottom: 0;
		}

		.actions {
			position: static;
			padding: 0;
			background: transparent;
			border: none;
			backdrop-filter: none;
			justify-content: flex-end;
		}

		.actions .secondary,
		.actions .primary {
			flex: unset;
			min-width: 8.5rem;
		}
	}
</style>
