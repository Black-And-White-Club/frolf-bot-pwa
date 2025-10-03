export async function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const container = (navigator as Navigator).serviceWorker
    if (!container) return null
    const reg = await container.register('/service-worker.js')
    if (reg && typeof reg === 'object') {
      // periodically call update if the method exists
      const updateMaybe = (reg as unknown as { update?: unknown }).update
      if (typeof updateMaybe === 'function') setInterval(() => (updateMaybe as () => void)(), 1000 * 60 * 30)

      // notify app when a new SW is waiting so UI can prompt the user
      const notifyWaiting = (r: ServiceWorkerRegistration) => {
        if (r.waiting) {
          window.dispatchEvent(new CustomEvent('sw:waiting', { detail: r }))
        }
      }

      notifyWaiting(reg)
      if ('addEventListener' in reg) {
        try {
          reg.addEventListener('updatefound', () => {
            // new worker installing
            notifyWaiting(reg)
          })
        } catch {
          // best-effort
        }
      }
    }
    return reg
  } catch {
    // swallow and return null so callers can still proceed
    return null
  }
}
