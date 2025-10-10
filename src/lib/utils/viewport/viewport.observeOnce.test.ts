/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { observeOnce } from '$lib/utils/viewport';

describe('observeOnce', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		// clear any mocked IntersectionObserver set for tests
		delete (globalThis as unknown as Record<string, unknown>).IntersectionObserver;
	});

	it('calls callback asynchronously when IntersectionObserver is undefined', async () => {
		// ensure no IntersectionObserver in this environment
		delete (globalThis as unknown as Record<string, unknown>).IntersectionObserver;

		const cb = vi.fn();
		const el = document.createElement('div');

		const un = observeOnce(el, cb, '10px');
		expect(typeof un).toBe('function');

		// microtask scheduled - wait a tick
		await Promise.resolve();

		expect(cb).toHaveBeenCalled();
	});

	it('uses IntersectionObserver when available and fires the callback on intersect', () => {
		const calls: Array<{ observed: Element | null; unobserved: Element | null }> = [];

		// Mock IntersectionObserver to synchronously invoke callback when observe is called
		class MockIO {
			cb: (entries: IntersectionObserverEntry[]) => void;
			constructor(cb: (entries: IntersectionObserverEntry[]) => void) {
				this.cb = cb;
			}
			observe(el: Element) {
				// simulate an intersecting entry
				this.cb([{ target: el, isIntersecting: true } as unknown as IntersectionObserverEntry]);
			}
			unobserve() {
				// noop
			}
			disconnect() {
				// noop
			}
		}

		(globalThis as unknown as Record<string, unknown>).IntersectionObserver = MockIO;

		const el = document.createElement('div');
		const cb = vi.fn((entry) => {
			calls.push({ observed: entry.target as Element, unobserved: null });
		});

		const un = observeOnce(el, cb, '5px');
		// returned unobserve should be callable
		expect(typeof un).toBe('function');

		// Because MockIO calls synchronously, cb should have been called
		expect(cb).toHaveBeenCalled();
		expect(calls.length).toBe(1);
	});
});
