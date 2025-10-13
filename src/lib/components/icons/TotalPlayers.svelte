<script lang="ts">
	import StatIcon from './StatIcon.svelte';
	type Props = {
		className?: string;
		size?: number | string; // svg size inside the box (can be percentage)
		testid?: string;
		title?: string;
		decorative?: boolean;
		withBg?: boolean;
		bgColor?: string;
		fgColor?: string;
		boxSize?: number | string;
	};

	let {
		className = '',
		size = '60%',
		testid,
		title,
		decorative = false,
		withBg = true,
		bgColor = 'transparent',
		fgColor = 'currentColor',
		boxSize = '3rem'
	}: Props = $props();
</script>

<StatIcon {className} {size} {withBg} {bgColor} {fgColor} {boxSize} {testid} {decorative} {title}>
	<svelte:fragment let:size let:fgColor let:testid let:decorative let:title>
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			style="color: {fgColor}; display:block; margin:auto;"
			role={decorative ? undefined : 'img'}
			aria-hidden={decorative ? 'true' : undefined}
			aria-label={decorative ? undefined : title}
			data-testid={testid}
		>
			{#if title}
				<title>{title}</title>
			{/if}
			<path
				d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-opacity="1"
			/>
		</svg>
	</svelte:fragment>
</StatIcon>
