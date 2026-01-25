<script lang="ts">
	import { nats } from '$lib/stores/nats.svelte';

	let statusConfig = $derived(() => {
		switch (nats.status) {
			case 'connected':
				return { color: 'bg-green-500', label: 'Connected' };
			case 'connecting':
				return { color: 'bg-amber-500 animate-pulse', label: 'Connecting...' };
			case 'error':
				return { color: 'bg-red-500', label: 'Disconnected' };
			default:
				return { color: 'bg-slate-500', label: 'Offline' };
		}
	});
</script>

<div class="flex items-center gap-2 text-xs text-slate-400">
	<span class={`h-2 w-2 rounded-full ${statusConfig().color}`}></span>
	<span>{statusConfig().label}</span>
</div>
