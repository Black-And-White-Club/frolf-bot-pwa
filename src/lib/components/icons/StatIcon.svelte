<script lang="ts">
	/**
	 * Generic stat icon wrapper used by stat-card icons.
	 * It provides the optional background box and passes useful values to the slot
	 * so child SVGs can be minimal and DRY.
	 */

	export let className: string = '';
	export let size: number | string = '60%';
	export let withBg: boolean = true;
	export let bgColor: string = 'transparent';
	export let fgColor: string = 'currentColor';
	export let boxSize: number | string = '3rem';
	export let testid: string | undefined = undefined;
	export let decorative: boolean = false;
	export let title: string | undefined = undefined;
</script>

{#if withBg}
	<div
		class="tp-wrapper {className}"
		style="background-color: {bgColor}; width: {boxSize}; height: {boxSize}; border-radius: 0.5rem;"
	>
		<!-- pass useful values to the slot so children don't need to repeat defaults -->
		<slot {size} {fgColor} {testid} {decorative} {title} />
	</div>
{:else}
	<slot {size} {fgColor} {testid} {decorative} {title} />
{/if}

<style>
	.tp-wrapper {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
		flex-shrink: 0;
	}

	/* ensure svg scales nicely inside the wrapper when numeric sizes are used */
	.tp-wrapper :global(svg) {
		display: block;
	}
</style>
