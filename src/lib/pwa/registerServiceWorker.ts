export async function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const container = (navigator as Navigator).serviceWorker
    if (!container) return null
    const reg = await container.register('/service-worker.js')
    if (reg && typeof reg === 'object' && 'update' in reg) {
  const updateMaybe = (reg as unknown as { update?: unknown }).update
      if (typeof updateMaybe === 'function') setInterval(() => (updateMaybe as () => void)(), 1000 * 60 * 30)
    }
    return reg
  } catch {
    // swallow and return null so callers can still proceed
    return null
  }
}
