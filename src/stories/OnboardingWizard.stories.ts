/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Meta, StoryObj } from '@storybook/svelte';
import OnboardingWizard from '$lib/components/OnboardingWizard.svelte';
import mockAuth from '$lib/mocks/mockAuth';

const loggedOut = { session: null, listGuilds: mockAuth.listGuilds, linkGuild: mockAuth.linkGuild };
const loggedInAdmin = { session: { user: { id: 'u1', name: 'Admin User' }, token: 't' }, listGuilds: mockAuth.listGuilds, linkGuild: mockAuth.linkGuild };
const loggedInNoAdmin = { session: { user: { id: 'u2', name: 'Member' }, token: 't' }, listGuilds: async () => [{ id: 'g1', name: 'No Admin Guild', isAdmin: false }], linkGuild: mockAuth.linkGuild };

const meta: Meta<any> = {
  title: 'Example/OnboardingWizard',
  component: OnboardingWizard as any,
};

export default meta;
type Story = StoryObj<any>;

export const LoggedOut: Story = { args: loggedOut as any };
export const LoggedInAdmin: Story = { args: loggedInAdmin as any };
export const LoggedInNoAdmin: Story = { args: loggedInNoAdmin as any };
