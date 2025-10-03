import type { Meta, StoryObj } from '@storybook/svelte';
import Header from './Header.svelte';

const meta: Meta = {
  title: 'Example/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onLogin: () => {},
    onLogout: () => {},
    onCreateAccount: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const LoggedIn: Story = { args: { user: { name: 'Jane Doe' } } };
export const LoggedOut: Story = {};
