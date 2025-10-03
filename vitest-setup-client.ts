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
	})
}

// ResizeObserver
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
	(globalThis as any).ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
}

// requestAnimationFrame / cancelAnimationFrame
if (typeof (globalThis as any).requestAnimationFrame === 'undefined') {
	(globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0) as any
}
if (typeof (globalThis as any).cancelAnimationFrame === 'undefined') {
	(globalThis as any).cancelAnimationFrame = (id: number) => clearTimeout(id)
}

// window.scrollTo no-op
if (typeof (globalThis as any).scrollTo === 'undefined') {
	(globalThis as any).scrollTo = () => {}
}

// Anchor click/navigation stubs intentionally moved to per-test helpers.
// Use `installAnchorClickStub()` in tests that need to prevent jsdom navigation.

// Provide a basic fetch if missing (use node's fetch if available):
if (typeof (globalThis as any).fetch === 'undefined') {
	// Provide a minimal stub so tests that forget to mock fetch will get a helpful error.
	(globalThis as any).fetch = () => Promise.reject(new Error('global.fetch is not implemented in vitest-setup-client. Please mock fetch in your test.'))
}

// Ensure this module is an ES module with no runtime side-effects beyond polyfills
// testing-library cleanup between tests to avoid leaking DOM nodes and duplicate queries
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/svelte'

// register cleanup after each test
afterEach(() => cleanup())

export default undefined
