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
  const m = await import('$lib/mocks/mockAuth')
  const fn = getFnFromModule<() => Promise<Session | null>>(m, ['login', 'loginMock'])
  const s = fn ? await fn() : null
  sessionStore.set(s)
  return s
}

export async function logout(): Promise<void> {
  const m = await import('$lib/mocks/mockAuth')
  const fn = getFnFromModule<() => Promise<void>>(m, ['logout', 'logoutMock'])
  if (fn) await fn()
  sessionStore.set(null)
}

export async function getSession(): Promise<Session | null> {
  // If session already present, return it
  let current: Session | null = null
  sessionStore.subscribe(s => { current = s })()
  if (current) return current
  const m = await import('$lib/mocks/mockAuth')
  const fn = getFnFromModule<() => Promise<Session | null>>(m, ['getSession', 'getSessionMock'])
  const s = fn ? await fn() : null
  if (s) sessionStore.set(s)
  return s
}

export default AuthStore

// small helper: safely resolve a function from a dynamically imported module
function getFnFromModule<T extends (...args: unknown[]) => unknown>(mod: unknown, names: string[]): T | undefined {
  if (!mod || typeof mod !== 'object') return undefined
  const asRecord = mod as Record<string, unknown>
  for (const n of names) {
    const v = asRecord[n]
    if (typeof v === 'function') return v as T
  }
  const def = (asRecord as Record<string, unknown>)['default']
  if (def && typeof def === 'object') {
    const asDef = def as Record<string, unknown>
    for (const n of names) {
      const v = asDef[n]
      if (typeof v === 'function') return v as T
    }
  }
  return undefined
}
