type Unobserve = () => void;

const observerMap = new Map<Element, (entry: IntersectionObserverEntry) => void>();
let sharedObserver: IntersectionObserver | null = null;

function ensureObserver(rootMargin = '100px') {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const cb = observerMap.get(entry.target);
      if (cb && entry.isIntersecting) {
        try {
          cb(entry);
        } catch (e) {
          // swallow callback errors
          console.error('viewport observe callback error', e);
        }
        // once fired, stop observing
        observerMap.delete(entry.target);
        sharedObserver?.unobserve(entry.target);
      }
    }
  }, { rootMargin });
  return sharedObserver;
}

export function observeOnce(el: Element, cb: (entry: IntersectionObserverEntry) => void, rootMargin = '200px'): Unobserve {
  if (typeof IntersectionObserver === 'undefined') {
    // immediate synchronous callback in environments without IO
    // but wrap in microtask to avoid sync reflows
    Promise.resolve().then(() => cb({} as IntersectionObserverEntry));
    return () => {};
  }

  const obs = ensureObserver(rootMargin);
  observerMap.set(el, cb);
  obs.observe(el);

  return () => {
    observerMap.delete(el);
    obs.unobserve(el);
  };
}
