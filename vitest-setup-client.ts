/* eslint-disable @typescript-eslint/no-explicit-any */
// Minimal test setup for client-like tests in jsdom
// Polyfill/define common browser APIs that jsdom doesn't provide and that components may use.

// matchMedia
if (typeof (globalThis as any).matchMedia === 'undefined') {
	(globalThis as any).matchMedia = (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	});
}

// ResizeObserver
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
	(globalThis as any).ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}

// requestAnimationFrame / cancelAnimationFrame
if (typeof (globalThis as any).requestAnimationFrame === 'undefined') {
	(globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
		setTimeout(() => cb(Date.now()), 0) as any;
}
if (typeof (globalThis as any).cancelAnimationFrame === 'undefined') {
	(globalThis as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
}

// window.scrollTo no-op
if (typeof (globalThis as any).scrollTo === 'undefined') {
	(globalThis as any).scrollTo = () => {};
}

// navigation / location.reload stub: jsdom throws on full navigation; provide a safe no-op reload
// which tests can spy on if they need to assert a reload was requested.
(() => {
	try {
		const g = globalThis as unknown as { location?: Location };
		const origLocation = g.location;
		if (origLocation) {
			// Create a shallow copy that preserves existing location fields but overrides reload.
			const safeLocation = Object.create(Object.getPrototypeOf(origLocation));
			// copy own properties (best-effort)
			for (const k of Object.getOwnPropertyNames(origLocation)) {
				try {
					(safeLocation as any)[k] = (origLocation as any)[k];
				} catch {
					console.warn('copy location prop failed');
				}
			}
			(safeLocation as any).reload = () => {};
			// make the global location configurable so tests may replace it
			try {
				Object.defineProperty(globalThis, 'location', { value: safeLocation, configurable: true });
			} catch {
				// last resort: attach reload directly if defineProperty fails
				try {
					(globalThis as any).location.reload = () => {};
				} catch {
					console.warn('attach reload failed');
				}
			}
		} else {
			// no location present (very unusual), create a minimal one
			try {
				Object.defineProperty(globalThis, 'location', {
					value: { reload: () => {}, assign: () => {}, replace: () => {} },
					configurable: true
				});
			} catch {
				console.warn('define fallback location failed');
			}
		}
	} catch {
		// swallow any setup-time errors; tests will still run but might need to stub navigation themselves
		console.warn('vitest-setup-client: navigation stub setup failed');
	}
})();

if (typeof (globalThis as any).HTMLCanvasElement !== 'undefined') {
	const proto = (globalThis as any).HTMLCanvasElement.prototype;
	// Always override, because jsdom ships a stub that throws
	proto.getContext = function () {
		return {
			fillRect: () => {},
			getImageData: (_x: number, _y: number, w: number, h: number) => ({
				data: new Uint8ClampedArray(w * h * 4)
			}),
			putImageData: () => {},
			createImageData: () => [],
			setTransform: () => {},
			drawImage: () => {},
			save: () => {},
			restore: () => {},
			beginPath: () => {},
			closePath: () => {},
			fill: () => {},
			stroke: () => {},
			moveTo: () => {},
			lineTo: () => {},
			arc: () => {},
			rect: () => {},
			clip: () => {},
			measureText: () => ({ width: 0 }),
			translate: () => {},
			scale: () => {},
			rotate: () => {},
			clearRect: () => {},
			createLinearGradient: () => ({ addColorStop: () => {} }),
			createPattern: () => null
		} as unknown as CanvasRenderingContext2D;
	};
}

// Anchor click/navigation stubs intentionally moved to per-test helpers.
// Use `installAnchorClickStub()` in tests that need to prevent jsdom navigation.

// Provide a basic fetch if missing (use node's fetch if available):
if (typeof (globalThis as any).fetch === 'undefined') {
	// Provide a minimal stub so tests that forget to mock fetch will get a helpful error.
	(globalThis as any).fetch = () =>
		Promise.reject(
			new Error(
				'global.fetch is not implemented in vitest-setup-client. Please mock fetch in your test.'
			)
		);
}

// Ensure this module is an ES module with no runtime side-effects beyond polyfills
// testing-library cleanup between tests to avoid leaking DOM nodes and duplicate queries
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// register cleanup after each test
afterEach(() => cleanup());

export default undefined;
