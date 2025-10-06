<script lang="ts">
	export let rank: number = 1;
	export let size: number = 20; // px
	const gold = ['#B89B5E', '#A68A4A', '#7C6B3C']; // matte gold gradient
	const silver = ['#C9C9C9', '#AFAFAF', '#8F8F8F'];
	const bronze = ['#B3744A', '#9A643E', '#7C4E2E'];
	const bg = rank === 1 ? gold : rank === 2 ? silver : bronze;
	const id = `medal-grad-${Math.random().toString(36).slice(2, 9)}`;
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	aria-hidden="true"
	role="img"
	xmlns="http://www.w3.org/2000/svg"
>
	<defs>
		<linearGradient {id} x1="0" x2="1">
			<stop offset="0%" stop-color={bg[0]} />
			<stop offset="50%" stop-color={bg[1]} />
			<stop offset="100%" stop-color={bg[2]} />
		</linearGradient>
	</defs>
	<!-- medal circle -->
	<g transform="translate(0,0)" fill="none" fill-rule="evenodd">
		<circle cx="12" cy="8" r="5.2" fill={`url(#${id})`} stroke="#1a1a1a" stroke-opacity="0.08" />
		<!-- subtle inner shine for matte feel -->
		<ellipse cx="10.5" cy="6.5" rx="2.2" ry="1" fill="#FFF" opacity="0.08" />
		<!-- ribbon -->
		<path d="M7 13 L9.2 9.6 L12 11 L14.8 9.6 L17 13 L12 20 Z" fill="#2b2b2b" opacity="0.06" />
		<path d="M7.6 13.4 L10 12 L12 13 L14 12 L16.4 13.4 L12 19.2 Z" fill="#2b2b2b" opacity="0.12" />
	</g>
</svg>
