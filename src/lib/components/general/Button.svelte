<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		variant?: 'primary' | 'secondary' | 'premium' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		testid?: string;
		onclick?: (e: MouseEvent) => void; // ✅ Fixed to lowercase
		class?: string;
		[key: string]: any;
	};

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		type = 'button',
		testid,
		onclick,
		class: incomingClass,
		children,
		...restProps
	}: Props = $props();

	const base =
		'inline-flex items-center justify-center border rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

	const variantClasses: Record<string, string> = {
		primary:
			'text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-transparent',
		secondary:
			'text-[var(--guild-primary)] bg-transparent border-[var(--guild-primary)] hover:bg-[var(--guild-primary)]/10',
		premium: 'text-white bg-yellow-500 hover:bg-yellow-600 border-transparent',
		danger: 'text-white bg-red-600 hover:bg-red-700 border-transparent'
	};

	const sizeClasses: Record<string, string> = {
		sm: 'text-sm px-3 py-1.5',
		md: 'text-base px-4 py-2',
		lg: 'text-lg px-6 py-3'
	};

	const classes = $derived(
		cn(
			base,
			disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
			variantClasses[variant] ?? variantClasses.primary,
			sizeClasses[size] ?? sizeClasses.md,
			incomingClass
		)
	);

	function handleClick(event: MouseEvent) {
		if (disabled) {
			event.preventDefault();
			return;
		}
		onclick?.(event);
	}
</script>

<button
	{type}
	class={classes}
	aria-disabled={disabled}
	data-testid={testid}
	{disabled}
	onclick={handleClick}
	{...restProps}
>
	{@render children?.()}
</button>
