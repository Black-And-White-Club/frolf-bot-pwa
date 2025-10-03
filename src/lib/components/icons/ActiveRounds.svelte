<script lang="ts">
  export let className: string = '';
  export let size: number | string = 20;
  export let testid: string | undefined = undefined;
  export let title: string | undefined = undefined;
  export let decorative: boolean = false;
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  class={className}
  role={decorative ? undefined : 'img'}
  aria-hidden={decorative ? 'true' : undefined}
  aria-label={decorative ? undefined : title}
  data-testid={testid}
>
  {#if title}
    <title>{title}</title>
  {/if}
  <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="1" />
</svg>
