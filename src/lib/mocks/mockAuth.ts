// Simple mock auth provider for local dev and Storybook
import type { Guild, Session } from '$lib/stores/auth'

let _session: Session | null = null
let _guilds: Guild[] = [
  { id: 'g1', name: 'Frolf Park', isAdmin: true },
  { id: 'g2', name: 'Casual League', isAdmin: false }
]

export async function loginMock() {
  _session = { user: { id: 'u1', name: 'Dev User', avatar_url: null }, token: 'fake-token' }
  return _session
}

export async function logoutMock() {
  _session = null
}

export async function getSessionMock() {
  return _session
}

export async function listGuildsMock() {
  // simulate network latency
  return new Promise<Guild[]>(res => setTimeout(() => res(_guilds.slice()), 50))
}

export async function linkGuildMock(guildId: string) {
  // simple validation: guild exists and user is admin
  const g = _guilds.find(x => x.id === guildId)
  if (!g) return { success: false, error: 'not_found' }
  if (!g.isAdmin) return { success: false, error: 'not_admin' }
  // simulate link
  return { success: true }
}

export function setMockGuilds(guilds: Guild[]) { _guilds = guilds }

export default {
  login: loginMock,
  logout: logoutMock,
  getSession: getSessionMock,
  listGuilds: listGuildsMock,
  linkGuild: linkGuildMock,
  setMockGuilds,
}
