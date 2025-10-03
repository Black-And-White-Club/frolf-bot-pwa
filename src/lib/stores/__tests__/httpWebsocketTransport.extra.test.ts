// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HttpWebSocketTransport } from '../httpWebsocketTransport'

class MockWS {
  public onopen: (() => void) | undefined
  public onmessage: ((ev: { data: unknown }) => void) | undefined
  public onclose: (() => void) | undefined
  constructor(public url: string) { setTimeout(() => this.onopen?.(), 0) }
  close() { this.onclose?.() }
}

describe('HttpWebSocketTransport extra', () => {
  let origWS: PropertyDescriptor | undefined
  beforeEach(() => {
    origWS = Object.getOwnPropertyDescriptor(globalThis, 'WebSocket')
  })
  afterEach(() => {
    if (origWS) Object.defineProperty(globalThis, 'WebSocket', origWS)
    else try { Object.defineProperty(globalThis, 'WebSocket', { value: undefined, configurable: true }) } catch { /* ignore */ }
    vi.restoreAllMocks()
  })

  it('connect rejects when no WebSocket constructor available', async () => {
    // ensure not present
    if (origWS) Object.defineProperty(globalThis, 'WebSocket', { value: undefined, configurable: true })
    else try { Object.defineProperty(globalThis, 'WebSocket', { value: undefined, configurable: true }) } catch { /* ignore */ }
    const transport = new HttpWebSocketTransport({ snapshotUrl: 'http://x', wsUrl: 'ws://x' })
    await expect(transport.connect()).rejects.toThrow()
  })

  it('ignores malformed JSON messages', async () => {
    Object.defineProperty(globalThis, 'WebSocket', { value: MockWS, configurable: true })
    const transport = new HttpWebSocketTransport({ snapshotUrl: 'http://x', wsUrl: 'ws://x' })
    let called = false
    transport.onMessage(() => { called = true })
    await transport.connect()
  const ws = transport.internalWs as MockWS | undefined
    expect(ws).toBeTruthy()
    // send malformed data
    if (ws && ws.onmessage) ws.onmessage({ data: 'not-json' })
    await new Promise(r => setTimeout(r, 0))
    expect(called).toBe(false)
    await transport.disconnect()
  })

  it('requestSnapshot returns null on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const transport = new HttpWebSocketTransport({ snapshotUrl: 'http://x', wsUrl: 'ws://x' })
    const res = await transport.requestSnapshot('id1')
    expect(res).toBeNull()
  })

  it('disconnect clears websocket', async () => {
    Object.defineProperty(globalThis, 'WebSocket', { value: MockWS, configurable: true })
    const transport = new HttpWebSocketTransport({ snapshotUrl: 'http://x', wsUrl: 'ws://x' })
    await transport.connect()
    await transport.disconnect()
  const ws = transport.internalWs
    expect(ws).toBeUndefined()
  })
})
