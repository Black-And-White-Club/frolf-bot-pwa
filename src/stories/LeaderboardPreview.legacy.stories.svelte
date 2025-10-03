```svelte
<script>
  import LeaderboardPreview from '$lib/components/LeaderboardPreview.svelte'
  import { MockTransport } from '$lib/stores/mockTransport'
  import Controls from '$lib/components/LeaderboardPreviewControls.svelte'

  const transport = new MockTransport()
</script>

<div style="display:flex;gap:1rem;align-items:flex-start">
  <div style="width:320px;">
    <LeaderboardPreview {transport} />
  </div>
  <div>
    <Controls {transport} />
  </div>
</div>

```
