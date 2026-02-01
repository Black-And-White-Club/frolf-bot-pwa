<script lang="ts">
	type Props = {
		name: string;
		size?: number;
		ariaLabel?: string | null;
	};

	let { name, size = 16, ariaLabel = null }: Props = $props();
</script>

{#if name === 'target'}
	<svg
		class="icon"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden={ariaLabel ? undefined : true}
		aria-label={ariaLabel}
	>
		<circle cx="12" cy="12" r="3" fill="currentColor" />
		<path
			d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{:else if name === 'check'}
	<svg
		class="icon"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden={ariaLabel ? undefined : true}
		aria-label={ariaLabel}
	>
		<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
		<path
			d="M9 12.5l2 2 4-5"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{:else if name === 'calendar'}
	<svg
		class="icon"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden={ariaLabel ? undefined : true}
		aria-label={ariaLabel}
	>
		<rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5" />
		<path
			d="M16 3v4M8 3v4M3 11h18"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{:else if name === 'close'}
	<svg
		class="icon"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden={ariaLabel ? undefined : true}
		aria-label={ariaLabel}
	>
		<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
		<path
			d="M15 9l-6 6M9 9l6 6"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{:else}
	<svg
		class="icon"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden={ariaLabel ? undefined : true}
		aria-label={ariaLabel}
	>
		<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
		<path
			d="M12 17h.01M12 7a3 3 0 0 1 0 6"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/if}
