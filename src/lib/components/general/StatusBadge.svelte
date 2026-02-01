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

	const ICON_MAP: Record<string, any> = {
		active: DefaultIcon,
		completed: CompletedIcon,
		scheduled: ScheduledIcon
	};

	const IconComponent = $derived(ICON_MAP[status] ?? DefaultIcon);

	const displayText = $derived(
		showCount && count !== undefined
			? `${count} ${status}`
			: status.charAt(0).toUpperCase() + status.slice(1)
	);

	const baseColor = $derived(customColor ?? STATUS_COLORS[status] ?? STATUS_COLORS.default);

	// Pill background: always translucent
	const bgColor = $derived(`rgba(${hexToRgbString(baseColor)}, 0.13)`);

	// Text color: dark by default (or custom)
	const finalTextColor = $derived(textColor ?? 'var(--guild-text, #111)');

	// Icon color: always solid base color (filled)
	const iconColor = $derived(baseColor);
</script>

<span
	data-testid={testid}
	data-status={status}
	class="status-badge"
	role="status"
	aria-label={displayText}
	style="background: {bgColor}; border: 1px solid {baseColor}; color: {finalTextColor};"
>
	<span class="icon" aria-hidden="true" style="color: {iconColor};">
		<!-- disable the surrounding StatIcon background box so all icons match size -->
		<IconComponent size={14} withBg={false} boxSize="1rem" />
	</span>

	<span class="label">{displayText}</span>
</span>

<style>
	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.05rem;
		padding: 0.25rem 0.45rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 700;
		white-space: nowrap;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
		transition: all 200ms;
	}

	.status-badge:hover {
		transform: scale(1.02);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.icon :global(svg) {
		width: 14px;
		height: 14px;
	}

	/* Ensure icon renders as a filled glyph inside the pill (solid color) */
	.icon :global(svg *) {
		fill: currentColor !important;
		stroke: none !important;
	}

	.label {
		line-height: 1;
	}

	@media (prefers-color-scheme: light) {
		.status-badge {
			box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06) inset;
		}
	}

	/* Mobile-only visual-only offset: translate the badge on mobile so it
			 appears further right without affecting layout (prevents cutting off
			 nearby text). Tweak --status-badge-mobile-translate as needed. */
	@media (max-width: 640px) {
		.status-badge {
			--status-badge-mobile-translate: 2rem;
			transform: translateX(var(--status-badge-mobile-translate));
		}

		.status-badge:hover {
			transform: translateX(var(--status-badge-mobile-translate)) scale(1.02);
		}
	}

	@media (max-width: 420px) {
		.status-badge {
			/* slightly larger nudge for very small viewports */
			--status-badge-mobile-translate: 1.25rem;
			transform: translateX(var(--status-badge-mobile-translate));
		}

		.status-badge:hover {
			transform: translateX(var(--status-badge-mobile-translate)) scale(1.02);
		}
	}
</style>
