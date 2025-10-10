<script lang="ts">
	import CompletedIcon from '$lib/components/icons/Completed.svelte';
	import ScheduledIcon from '$lib/components/icons/Scheduled.svelte';
	import DefaultIcon from '$lib/components/icons/Icon.svelte';
	import { hexToRgbString } from '$lib/stores/theme.helpers';
	import { STATUS_COLORS } from '$lib/stores/theme';

	type Props = {
		status: 'active' | 'completed' | 'scheduled' | 'cancelled' | string;
		count?: number;
		showCount?: boolean;
		testid?: string;
		customColor?: string;
		textColor?: string;
	};

	let { status, count, showCount = true, testid, customColor, textColor }: Props = $props();

	// concrete icon mapping (static imports for better tree-shaking and SSR safety)
	const ICON_MAP: Record<string, any> = {
		active: DefaultIcon,
		completed: CompletedIcon,
		scheduled: ScheduledIcon
	};

	let iconName = $state('info');

	const IconComponent = $derived(ICON_MAP[status] ?? DefaultIcon);

	const displayText = $derived(() => {
		if (showCount && count !== undefined) {
			return `${count} ${status}`;
		}
		return status.charAt(0).toUpperCase() + status.slice(1);
	});

	$effect(() => {
		if (status === 'active') iconName = 'target';
		else if (status === 'completed') iconName = 'check';
		else if (status === 'scheduled') iconName = 'calendar';
		else if (status === 'cancelled') iconName = 'close';
		else iconName = 'info';
	});

	function getColor(status: string) {
		const lookup = (STATUS_COLORS as Record<string, string>)[status];
		return customColor ?? lookup ?? STATUS_COLORS.default;
	}

	function hexToRgba(hex: string, alpha = 0.13) {
		if (!hex) return '';
		const rgb = hexToRgbString(hex); // returns 'r, g, b'
		return `rgba(${rgb}, ${alpha})`;
	}
</script>

<span
	data-testid={testid}
	data-status={status}
	class="status-badge inline-flex items-center gap-1 truncate rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
	class:active={status === 'active'}
	role="status"
	aria-label={displayText()}
	style="--sb-bg: {hexToRgba(getColor(status))}; --sb-border: {getColor(
		status
	)}; --sb-text: {textColor ??
		'var(--guild-text, #111)'}; background-color: var(--sb-bg); border: 1px solid var(--sb-border); color: var(--sb-text);"
>
	<span class="icon flex-shrink-0" aria-hidden="true">
		<IconComponent size={14} aria-hidden="true" />
	</span>

	<span class="label truncate">{displayText()}</span>
	<span class="sr-only">Status: {displayText()}</span>
</span>

<style>
	.status-badge {
		background-color: var(--sb-bg);
		border: 1px solid var(--sb-border);
		color: var(--sb-text);
	}

	/* Icon always follows the badge border color so it remains visible in both light/dark */
	.status-badge .icon {
		color: var(--sb-border);
	}

	.status-badge .icon :global(svg) {
		width: 14px;
		height: 14px;
	}

	/* enforce inheritance for any child shape */
	.status-badge .icon :global(svg *) {
		fill: currentColor;
		stroke: currentColor;
	}

	.status-badge .label {
		color: inherit; /* label follows --sb-text */
	}

	@media (prefers-color-scheme: light) {
		.status-badge {
			box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06) inset;
			color: var(--guild-text);
		}
		/* nothing special for active in light mode — icon inherits border color */
	}
</style>
