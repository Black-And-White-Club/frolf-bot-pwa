import { writable } from 'svelte/store'

// Simple announcer store for screen-reader friendly announcements
const _ann = writable<string | null>(null)

export const announcer = {
  subscribe: _ann.subscribe,
  announce(msg: string) {
    // write the message and clear it shortly after to allow repeated announces
    _ann.set(msg)
    // clear next tick so assistive tech can re-read repeated same messages
    setTimeout(() => _ann.set(null), 700)
  },
}

export const announce = (msg: string) => announcer.announce(msg)
