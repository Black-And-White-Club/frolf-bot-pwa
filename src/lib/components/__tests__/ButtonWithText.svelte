<script lang="ts">
  import Button from '../Button.svelte';
  export let testid: string | undefined = undefined;
  export let onClick: ((e: MouseEvent) => void) | undefined = undefined;
  export let disabled = false;
</script>

<Button onClick={onClick} disabled={disabled} {testid}>Click me</Button>
