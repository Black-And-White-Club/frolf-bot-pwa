/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { observeOnce } from '$lib/utils/viewport';

describe('observeOnce', () => {
	let originalIO: typeof IntersectionObserver | undefined;

	beforeEach(() => {
		originalIO = (globalThis as unknown as { IntersectionObserver?: typeof IntersectionObserver })
			.IntersectionObserver;
	});

	afterEach(() => {
		(
			globalThis as unknown as { IntersectionObserver?: typeof IntersectionObserver }
		).IntersectionObserver = originalIO;
		vi.restoreAllMocks();
	});

	it('uses IntersectionObserver and calls callback on intersect', async () => {
		const observeCalls: Element[] = [];

		class MockIO {
			cb: (entries: IntersectionObserverEntry[]) => void;
			constructor(cb: (entries: IntersectionObserverEntry[]) => void) {
				this.cb = cb;
			}
			observe(el: Element) {
				observeCalls.push(el);
			}
			unobserve() {}
			disconnect() {}
			// helper to trigger entries
			trigger(entry: IntersectionObserverEntry) {
				this.cb([entry]);
			}
		}

		const mockIOCtor = vi.fn((cb) => new MockIO(cb));
		(globalThis as unknown as { IntersectionObserver?: unknown }).IntersectionObserver =
			mockIOCtor as unknown as typeof IntersectionObserver;

		const el = document.createElement('div');
		const cb = vi.fn();
		const unobserve = observeOnce(el, cb, '0px');

		// ensure observe was called
		expect(observeCalls.length).toBe(1);

		// trigger intersection
		const inst = (mockIOCtor as unknown as { mock: { results: { value: MockIO }[] } }).mock
			.results[0].value;
		inst.trigger({
			target: el,
			isIntersecting: true,
			time: Date.now(),
			rootBounds: null,
			boundingClientRect: el.getBoundingClientRect(),
			intersectionRect: el.getBoundingClientRect(),
			intersectionRatio: 1
		} as IntersectionObserverEntry);

		expect(cb).toHaveBeenCalled();

		// calling the returned unobserve should not throw
		expect(() => unobserve()).not.toThrow();
	});

	it('fallback when IntersectionObserver missing', async () => {
		(
			globalThis as unknown as { IntersectionObserver?: typeof IntersectionObserver }
		).IntersectionObserver = undefined;
		const el = document.createElement('div');
		const cb = vi.fn();
		const unobserve = observeOnce(el, cb);
		// allow microtask
		await Promise.resolve();
		expect(cb).toHaveBeenCalled();
		expect(typeof unobserve).toBe('function');
	});
});
