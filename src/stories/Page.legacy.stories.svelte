<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, waitFor, within } from 'storybook/test';
	import Page from './Page.svelte';
	import { fn } from 'storybook/test';

	const { Story } = defineMeta({
		title: 'Example/Page',
		component: Page,
		parameters: {
			layout: 'fullscreen'
		}
	});
</script>

```svelte
<Story
	name="Logged In"
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const loginButton = canvas.getByRole('button', { name: /Log in/i });
		await expect(loginButton).toBeInTheDocument();
		await userEvent.click(loginButton);
		await waitFor(() => expect(loginButton).not.toBeInTheDocument());

		const logoutButton = canvas.getByRole('button', { name: /Log out/i });
		await expect(logoutButton).toBeInTheDocument();
	}}
/>

<Story name="Logged Out" />

```
