<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		variant?: 'primary' | 'secondary' | 'premium' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		dataTestId?: string;
		onClick?: (e: MouseEvent) => void;
		class?: string;
		[key: string]: any;
	};

	// destructure props
	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		type = 'button',
		dataTestId,
		onClick,
		class: incomingClass,
		children,
		...restProps
	}: Props = $props();

	const base =
		'inline-flex items-center justify-center border rounded-md font-medium transition-colors focus:outline-none';

	const variantClasses: Record<string, string> = {
		primary:
			'text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
		secondary:
			'text-[var(--guild-primary)] bg-transparent border border-[var(--guild-primary)] hover:bg-[var(--guild-primary)]/10',
		premium: 'text-white bg-yellow-500 hover:bg-yellow-600',
		danger: 'text-white bg-red-600 hover:bg-red-700'
	};

	const sizeClasses: Record<string, string> = {
		sm: 'text-sm px-2 py-1',
		md: 'text-base px-4 py-2',
		lg: 'text-lg px-6 py-3'
	};

	const classes = $derived(() =>
		cn(
			base,
			disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
			variantClasses[variant] ?? variantClasses.primary,
			sizeClasses[size] ?? sizeClasses.md,
			incomingClass
		)
	);

	function handleClick(event: MouseEvent) {
		if (disabled) return;
		onClick?.(event);
	}
</script>

<button
	{type}
	class={classes}
	aria-disabled={disabled}
	data-testid={dataTestId}
	{disabled}
	onclick={handleClick}
	{...restProps}
>
	{@render children?.()}
</button>
