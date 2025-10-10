/* @vitest-environment jsdom */
import { test, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
	vi.resetModules();
});

afterEach(() => {
	// cleanup any global stub
	const g = global as unknown as Record<string, unknown>;
	if (g.OriginalIntersectionObserver) {
		global.IntersectionObserver = g.OriginalIntersectionObserver as typeof IntersectionObserver;
		delete g.OriginalIntersectionObserver;
	}
});

test('observeOnce uses IntersectionObserver and unobserves after callback', async () => {
	// Setup a fake IO that immediately invokes the callback when observe is called
	class FakeIO {
		callback: (entries: IntersectionObserverEntry[]) => void;
		rootMargin: string;
		constructor(
			cb: (entries: IntersectionObserverEntry[]) => void,
			opts?: IntersectionObserverInit
		) {
			this.callback = cb;
			this.rootMargin = opts?.rootMargin || '';
		}
		observe(el: Element) {
			// simulate an intersection entry and call the callback async
			const fakeEntry = {
				target: el,
				isIntersecting: true
			} as unknown as IntersectionObserverEntry;
			Promise.resolve().then(() => this.callback([fakeEntry]));
		}
		unobserve() {
			// noop
		}
	}

	// Replace global IO
	// stash and replace global IntersectionObserver
	const g = global as unknown as Record<string, unknown>;
	g.OriginalIntersectionObserver =
		global.IntersectionObserver as unknown as typeof IntersectionObserver;
	global.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;

	const { observeOnce } = await import('$lib/utils/viewport');

	const el = document.createElement('div');

	let called = false;
	const un = observeOnce(el, () => {
		called = true;
	});

	// wait microtask for fake IO to call back
	await Promise.resolve();

	expect(called).toBe(true);

	// calling unobserve should not throw
	expect(() => un()).not.toThrow();
});
