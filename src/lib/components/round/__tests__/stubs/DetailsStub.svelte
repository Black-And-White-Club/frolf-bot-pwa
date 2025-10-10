<script lang="ts">
	export let round: any;
	export let testid: string | undefined;
</script>

<div data-testid={testid ?? 'details-stub'} class="details-stub">{round?.title ?? 'Details'}</div>
