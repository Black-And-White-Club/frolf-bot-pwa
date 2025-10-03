// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import OnboardingWizard from '../OnboardingWizard.svelte';
import { makeSession } from '$lib/test-utils/fixtures';

describe('OnboardingWizard', () => {
  it('shows login prompt when no session', () => {
    const { getByText } = render(OnboardingWizard, { props: { session: null, listGuilds: async () => [], linkGuild: async () => {} } });
    expect(getByText('Please log in to continue.')).toBeTruthy();
  });

  it('renders connect guild when session is present and invite button triggers alert', async () => {
  const session = makeSession({ user: { id: 'u1', name: 'Sam' } });
    const listGuilds = vi.fn().mockResolvedValue([]);
    const linkGuild = vi.fn().mockResolvedValue({});
    const { getByText } = render(OnboardingWizard, { props: { session, listGuilds, linkGuild } });

    expect(getByText('Welcome, Sam')).toBeTruthy();
    const invite = getByText('Invite bot to server');
    // clicking invite triggers alert; stub window.alert to avoid test noise
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    await fireEvent.click(invite);
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
