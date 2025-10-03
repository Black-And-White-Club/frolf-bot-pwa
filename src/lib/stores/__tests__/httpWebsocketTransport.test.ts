import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HttpWebSocketTransport } from '../httpWebsocketTransport'
import type { SnapshotEnvelope, Envelope } from '../../types/snapshots'

class MockWebSocket {
  onopen: (() => void) | null = null
  onmessage: ((ev: { data: string }) => void) | null = null
  onerror: (() => void) | null = null
  onclose: (() => void) | null = null
  constructor(public url: string) {
    setTimeout(() => { if (this.onopen) this.onopen() }, 0)
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  send(..._args: unknown[]) { /* noop */ }
  close() { if (this.onclose) this.onclose() }
}

describe('HttpWebSocketTransport', () => {
  let OriginalWebSocket: unknown
  beforeEach(() => {
    OriginalWebSocket = (globalThis as unknown as { WebSocket?: unknown }).WebSocket
    ;(globalThis as unknown as { WebSocket?: unknown }).WebSocket = MockWebSocket
  })
  afterEach(() => {
    ;(globalThis as unknown as { WebSocket?: unknown }).WebSocket = OriginalWebSocket
    vi.restoreAllMocks()
  })

  it('fetches snapshot and receives ws messages', async () => {
    const fakeSnap: SnapshotEnvelope = {
      type: 'snapshot', schema: 'leaderboard.v1', version: 1, ts: new Date().toISOString(), payload: {
        id: 'leaderboard:default', version: 1, lastUpdated: new Date().toISOString(), topTags: [], topPlayers: []
      }
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => fakeSnap }))

    const transport = new HttpWebSocketTransport({ snapshotUrl: 'http://localhost', wsUrl: 'ws://localhost' })
    let received: Envelope | null = null
    transport.onMessage(env => { received = env })

    await transport.connect()
    const snap = await transport.requestSnapshot('leaderboard:default')
    expect(snap).toBeTruthy()

    // simulate server message
    const ws = (transport as unknown as { ws?: MockWebSocket }).ws
    if (ws && ws.onmessage) {
      ws.onmessage({ data: JSON.stringify({ type: 'patch', schema: 'leaderboard.patch.v1', version: 2, op: 'upsert_player', payload: { userId: 'u1' } }) })
    }
    await new Promise(r => setTimeout(r, 0))
    expect(received).toBeTruthy()

    await transport.disconnect()
  })
})
