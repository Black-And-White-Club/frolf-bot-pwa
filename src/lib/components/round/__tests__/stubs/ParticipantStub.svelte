<script lang="ts">
	export let participant: any;
	export let testid: string | undefined;
</script>

<div data-testid={testid ?? 'participant-stub'} class="participant-stub">
	{participant?.displayName ?? 'Participant'}
</div>
