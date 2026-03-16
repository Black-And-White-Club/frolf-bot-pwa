<script lang="ts">
	import '../../styles/tokens.css';
	import '../../styles/app.css';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Prevent the Discord iframe from intercepting keyboard events we need.
	onMount(() => {
		document.documentElement.style.setProperty('overflow', 'hidden');
	});
</script>

<div
	class="flex h-dvh w-full flex-col overflow-hidden bg-[--guild-background] font-[--font-primary] text-[--guild-text]"
>
	{@render children()}
</div>
