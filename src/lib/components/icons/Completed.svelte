<script lang="ts">
	export let className: string = '';
	export let size: number | string = 20;
	export let testid: string | undefined = undefined;
	export let title: string | undefined = undefined;
	export let decorative: boolean = false;
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
		d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
		stroke="currentColor"
		stroke-width="1.8"
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-opacity="1"
	/>
</svg>
