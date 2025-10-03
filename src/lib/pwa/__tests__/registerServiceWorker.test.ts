// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerServiceWorker } from '../registerServiceWorker';

describe('registerServiceWorker', () => {
  let origNavigator: unknown;

  beforeEach(() => {
    origNavigator = globalThis.navigator;
  });

  afterEach(() => {
    try {
      Object.defineProperty(globalThis, 'navigator', { value: origNavigator, configurable: true })
    } catch {
      // ignore
    }
    vi.restoreAllMocks();
  });

  it('registers when serviceWorker present and returns registration', async () => {
    const update = vi.fn();
    const register = vi.fn().mockResolvedValue({ update });
    Object.defineProperty(globalThis, 'navigator', { value: { serviceWorker: { register } }, configurable: true })

    const res = await registerServiceWorker()
    expect(register).toHaveBeenCalledWith('/service-worker.js');
    expect(res).toBeTruthy();
  });

  it('returns null when register throws', async () => {
    const register = vi.fn().mockRejectedValue(new Error('boom'))
    Object.defineProperty(globalThis, 'navigator', { value: { serviceWorker: { register } }, configurable: true })

    const res = await registerServiceWorker()
    expect(res).toBeNull();
  });

  it('dispatches sw:waiting when registration.waiting exists', async () => {
    const waiting = {} as ServiceWorker;
    const register = vi.fn().mockResolvedValue({ waiting, addEventListener: vi.fn() });
    Object.defineProperty(globalThis, 'navigator', { value: { serviceWorker: { register } }, configurable: true })

    const handler = vi.fn();
    window.addEventListener('sw:waiting', handler as EventListener);

    const res = await registerServiceWorker()
    expect(res).toBeTruthy();
    // handler should be called synchronously by notifyWaiting(reg)
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('sw:waiting', handler as EventListener);
  });

  it('handles when addEventListener throws', async () => {
    const register = vi.fn().mockResolvedValue({ waiting: null, addEventListener: () => { throw new Error('fail') } });
    Object.defineProperty(globalThis, 'navigator', { value: { serviceWorker: { register } }, configurable: true })

    const res = await registerServiceWorker()
    expect(res).toBeTruthy();
  });
});
