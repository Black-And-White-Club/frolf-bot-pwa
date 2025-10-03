<script lang="ts">
	// Reusable status badge component
	export let status: string;
	export let count: number | undefined;
	export let showCount: boolean = true;
	export let testid: string | undefined = undefined;

	function getStatusColor(status: string) {
		switch (status) {
			case 'active':
				return 'var(--guild-primary)';
			case 'completed':
				return 'var(--guild-accent)';
			case 'scheduled':
				return 'var(--guild-secondary)';
			case 'cancelled':
				return 'var(--guild-text-secondary)';
			default:
				return 'var(--guild-text-secondary)';
		}
	}

	function getStatusBgColor(status: string) {
		switch (status) {
			case 'active': // Skobeloff
				return 'rgba(var(--guild-primary-rgb, 0, 116, 116), 0.1)';
			case 'completed': // Gold
				return 'rgba(var(--guild-accent-rgb, 203, 161, 53), 0.1)';
			case 'scheduled': // Amethyst
				return 'rgba(var(--guild-secondary-rgb, 139, 123, 184), 0.1)';
			case 'cancelled': // Charcoal (use a neutral gray for cancelled)
				return 'rgba(var(--guild-text-rgb, 26, 26, 26), 0.1)';
			default:
				return 'rgba(26, 26, 26, 0.1)';
		}
	}

	$: displayText = showCount && count !== undefined
		? `${count} ${status}`
		: status.charAt(0).toUpperCase() + status.slice(1);
</script>

<span class="px-2 py-1 text-xs font-medium rounded-full text-guild-surface" style="background-color: {getStatusBgColor(status)}; border: 1px solid {getStatusColor(status)};" data-testid={testid}>
	{displayText}
</span>
