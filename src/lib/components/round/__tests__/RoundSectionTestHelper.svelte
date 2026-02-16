<script lang="ts">
	import RoundSection from '../RoundSection.svelte';

	type Props = {
		title: string;
		badges?: any[];
	};

	let { title, badges = [] }: Props = $props();
</script>

<RoundSection {title} {badges}>
	<div data-testid="round-card-r1">Test Round Content</div>
</RoundSection>
