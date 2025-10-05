<script lang="ts">
	type ClickHandler = (event: MouseEvent) => void;

	export let variant: 'primary' | 'secondary' | 'premium' | 'danger' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let onClick: ClickHandler | undefined = undefined;
	export let testid: string | undefined = undefined;

	function handleClick(event: MouseEvent) {
		if (disabled) {
			event.preventDefault();
			return;
		}

		if (onClick) {
			onClick(event);
		}
	}

	$: classes = [
		'inline-flex items-center justify-center px-[var(--space-md)] py-[var(--space-sm)] border border-transparent font-medium rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
		{
			primary:
				'text-guild-surface bg-gradient-to-r from-[var(--guild-primary)] to-[var(--guild-secondary)] hover:from-[var(--guild-primary)]/90 hover:to-[var(--guild-secondary)]/90 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] focus:ring-[var(--guild-primary)] transform hover:scale-105 transition-all duration-200',
			secondary:
				'text-[var(--guild-primary)] bg-transparent border-[var(--guild-primary)] hover:bg-[var(--guild-primary)]/10 focus:ring-[var(--guild-primary)]',
			premium:
				'text-guild-surface bg-guild-gold-gradient hover:brightness-110 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] focus:ring-[var(--guild-accent)] transform hover:scale-105 transition-all duration-200',
			danger:
				'text-guild-surface bg-[var(--guild-text-secondary)] hover:bg-[var(--guild-text-secondary)]/90 focus:ring-[var(--guild-text-secondary)]'
		}[variant],
		{
			sm: 'text-[var(--font-size-sm)] px-[var(--space-sm)] py-[var(--space-xs)]',
			md: 'text-[var(--font-size-base)] px-[var(--space-md)] py-[var(--space-sm)]',
			lg: 'text-[var(--font-size-lg)] px-[var(--space-lg)] py-[var(--space-md)]'
		}[size],
		disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
	]
		.filter(Boolean)
		.join(' ');
</script>

<button
	{type}
	{disabled}
	class={classes}
	on:click={handleClick}
	data-testid={testid}
	aria-disabled={disabled}
	{...$$restProps}
>
	<slot />
</button>
