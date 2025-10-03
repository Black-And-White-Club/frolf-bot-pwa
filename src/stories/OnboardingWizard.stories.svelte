<script>
  import OnboardingWizard from '$lib/components/OnboardingWizard.svelte'
  import mockAuth from '$lib/mocks/mockAuth'

  const loggedOut = { session: null, listGuilds: mockAuth.listGuilds, linkGuild: mockAuth.linkGuild }
  const loggedInAdmin = { session: { user: { id: 'u1', name: 'Admin User' }, token: 't' }, listGuilds: mockAuth.listGuilds, linkGuild: mockAuth.linkGuild }
  const loggedInNoAdmin = { session: { user: { id: 'u2', name: 'Member' }, token: 't' }, listGuilds: async () => [{ id: 'g1', name: 'No Admin Guild', isAdmin: false }], linkGuild: mockAuth.linkGuild }
</script>

<h3>Logged out</h3>
<OnboardingWizard {...loggedOut} />

<hr />

<h3>Logged in (admin)</h3>
<OnboardingWizard {...loggedInAdmin} />

<hr />

<h3>Logged in (no admin)</h3>
<OnboardingWizard {...loggedInNoAdmin} />
 
 <h3>Legacy Onboarding Wizard Fallback</h3>
 <OnboardingWizard fallback {...loggedOut} />
