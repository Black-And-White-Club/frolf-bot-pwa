/* eslint-disable @typescript-eslint/no-explicit-any */
// Storybook play functions use loosely-typed args; relax strict rules here.
import type { Meta, StoryObj } from '@storybook/svelte';
import Page from './Page.svelte';
import { within, waitFor } from '@storybook/testing-library';
import userEvent from '@testing-library/user-event';
import { expect } from '@storybook/jest';

const meta: Meta<any> = {
	title: 'Example/Page',
	component: Page,
	parameters: {
		layout: 'fullscreen'
	}
};

export default meta;
type Story = StoryObj<any>;

export const LoggedIn: Story = {
	play: async ({ canvasElement }: any) => {
		const canvas = within(canvasElement);
		const loginButton = canvas.getByRole('button', { name: /Log in/i });
		await (expect as any)(loginButton).toBeInTheDocument();
		await userEvent.click(loginButton);
		await waitFor(() => (expect as any)(loginButton).not.toBeInTheDocument());

		const logoutButton = canvas.getByRole('button', { name: /Log out/i });
		await (expect as any)(logoutButton).toBeInTheDocument();
	}
};

export const LoggedOut: Story = {};
