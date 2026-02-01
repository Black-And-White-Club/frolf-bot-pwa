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
			preserveAspectRatio="xMidYMid meet"
			role={decorative ? undefined : 'img'}
			aria-hidden={decorative ? 'true' : undefined}
			aria-label={decorative ? undefined : title}
			data-testid={testid}
		>
			{#if title}
				<title>{title}</title>
			{/if}
			<path
				d="M13 10V3L4 14h7v7l9-11h-7z"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-opacity="1"
			/>
		</svg>
	</svelte:fragment>
</StatIcon>
