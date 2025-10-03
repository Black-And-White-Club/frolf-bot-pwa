```svelte
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Header from './Header.svelte';
  import { fn } from 'storybook/test';

  const { Story } = defineMeta({
    title: 'Example/Header',
    component: Header,
    tags: ['autodocs'],
    parameters: {
      layout: 'fullscreen',
    },
    args: {
      onLogin: fn(),
      onLogout: fn(),
      onCreateAccount: fn(),
    }
  });
</script>

<Story name="Logged In" args={{ user: { name: 'Jane Doe' } }} />

<Story name="Logged Out" />

```
