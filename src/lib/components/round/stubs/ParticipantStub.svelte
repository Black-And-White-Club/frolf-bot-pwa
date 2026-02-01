<script>
	export let round;
	export let compact;
</script>

<div data-testid="participant-stub">P{round ? `:${round.round_id}` : ''}{compact ? ':C' : ''}</div>
