export function showUpdate(reg: ServiceWorkerRegistration) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('sw:show', { detail: reg }))
    return true
  }
  return false
}
