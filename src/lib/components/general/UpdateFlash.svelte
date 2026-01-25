<script lang="ts">
	let {
		trigger,
		children
	}: {
		trigger: unknown;
		children?: () => any;
	} = $props();

	let flash = $state(false);

	$effect(() => {
		void trigger; // re-run when trigger changes
		flash = true;

		const timeout = setTimeout(() => {
			flash = false;
		}, 500);

		return () => clearTimeout(timeout);
	});
</script>

<div class:flash class="transition-colors duration-500">
	{@render children?.()}
</div>

<style>
	.flash {
		background-color: rgba(74, 222, 128, 0.1);
	}
</style>
