<script lang="ts">
	type Props = {
		className?: string;
		size?: number | string;
		testid?: string;
		title?: string;
		decorative?: boolean;
	};

	let { className = '', size = 20, testid, title, decorative = false }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
	role={decorative ? undefined : 'img'}
	aria-hidden={decorative ? 'true' : undefined}
	aria-label={decorative ? undefined : title}
	data-testid={testid}
>
	{#if title}
		<title>{title}</title>
	{/if}
	<path
		d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
		stroke="currentColor"
		stroke-width="1.8"
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-opacity="1"
	/>
</svg>
