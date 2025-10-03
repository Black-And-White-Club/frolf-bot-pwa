import { writable } from 'svelte/store'

export interface User {
  id: string
  name: string
  avatar_url?: string | null
}

export interface Session {
  user: User
  token: string
}

export interface Guild {
  id: string
  name: string
  isAdmin: boolean
}

const sessionStore = writable<Session | null>(null)

// Simple abstraction that can be replaced by real auth service
export const AuthStore = {
  subscribe: sessionStore.subscribe,
  set(session: Session | null) { sessionStore.set(session) },
}

// Development-friendly default implementations that dynamically import the mock
export async function login(): Promise<Session | null> {
  type MockAuthModule = { login: () => Promise<Session | null> }
  const m = (await import('$lib/mocks/mockAuth')) as unknown as MockAuthModule
  const s = await m.login()
  sessionStore.set(s)
  return s
}

export async function logout(): Promise<void> {
  type MockAuthModule = { logout: () => Promise<void> }
  const m = (await import('$lib/mocks/mockAuth')) as unknown as MockAuthModule
  await m.logout()
  sessionStore.set(null)
}

export async function getSession(): Promise<Session | null> {
  // If session already present, return it
  let current: Session | null = null
  sessionStore.subscribe(s => { current = s })()
  if (current) return current
  type MockAuthModule = { getSession: () => Promise<Session | null> }
  const m = (await import('$lib/mocks/mockAuth')) as unknown as MockAuthModule
  const s = await m.getSession()
  if (s) sessionStore.set(s)
  return s
}

export default AuthStore
