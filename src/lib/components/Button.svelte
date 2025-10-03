<script lang="ts">
	type ClickHandler = (event: MouseEvent) => void;

	export let variant: 'primary' | 'secondary' | 'danger' = 'primary';
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
		'inline-flex items-center justify-center px-[var(--guild-spacing-md)] py-[var(--guild-spacing-sm)] border border-transparent font-medium rounded-[var(--guild-border-radius-md)] focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
		{
			primary: 'text-guild-surface bg-gradient-to-r from-[var(--guild-primary)] to-[var(--guild-secondary)] hover:from-[var(--guild-primary)]/90 hover:to-[var(--guild-secondary)]/90 shadow-[var(--guild-shadow-md)] hover:shadow-[var(--guild-shadow-lg)] focus:ring-[var(--guild-primary)] transform hover:scale-105 transition-all duration-200',
			secondary: 'text-[var(--guild-text)] bg-guild-surface border-[var(--guild-border)] hover:bg-guild-surface/80 focus:ring-[var(--guild-primary)]',
			danger: 'text-guild-surface bg-[var(--guild-text-secondary)] hover:bg-[var(--guild-text-secondary)]/90 focus:ring-[var(--guild-text-secondary)]'
		}[variant],
		{
			sm: 'text-[var(--guild-font-size-sm)] px-[var(--guild-spacing-sm)] py-[var(--guild-spacing-xs)]',
			md: 'text-[var(--guild-font-size-base)] px-[var(--guild-spacing-md)] py-[var(--guild-spacing-sm)]',
			lg: 'text-[var(--guild-font-size-lg)] px-[var(--guild-spacing-lg)] py-[var(--guild-spacing-md)]'
		}[size],
		disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
	].filter(Boolean).join(' ');
</script>

<button {type} {disabled} class={classes} on:click={handleClick} data-testid={testid} aria-disabled={disabled} {...$$restProps}>
	<slot />
</button>
