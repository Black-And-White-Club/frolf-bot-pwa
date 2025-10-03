// Test utility to install/uninstall a safe anchor click stub to avoid jsdom navigation errors.
// Use in tests that create anchors and call `.click()` to trigger downloads.

let installed = false;
let originalClick: ((this: HTMLElement) => void) | undefined;

export function installAnchorClickStub() {
  if (installed) return;
  installed = true;

  try {
    if ('HTMLAnchorElement' in globalThis) {
      // guarded access: tests run in different runtimes, use a local any only after checking presence
  const maybeAnchor = (globalThis as unknown as { HTMLAnchorElement?: unknown }).HTMLAnchorElement
  const AnchorCtor = maybeAnchor as { prototype?: { click?: (this: HTMLElement) => void } } | undefined
      if (AnchorCtor && AnchorCtor.prototype) {
        const proto = AnchorCtor.prototype
        originalClick = proto.click
        proto.click = function click(this: HTMLElement) {
          // no-op to avoid jsdom navigation
          return undefined
        }
      }
    }
  } catch {
    // best-effort
  }

  try {
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('__test_stub_prevent_nav', () => {}, true);
    }
  } catch {
    // ignore
  }
}

export function uninstallAnchorClickStub() {
  if (!installed) return;
  installed = false;
  try {
    if ('HTMLAnchorElement' in globalThis) {
  const maybeAnchor = (globalThis as unknown as { HTMLAnchorElement?: unknown }).HTMLAnchorElement
  const AnchorCtor = maybeAnchor as { prototype?: { click?: (this: HTMLElement) => void } } | undefined
      if (AnchorCtor && AnchorCtor.prototype && originalClick) {
        AnchorCtor.prototype.click = originalClick
        originalClick = undefined
      }
    }
  } catch {
    // ignore
  }
}
