/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { showUpdate } from '$lib/pwa/updateSnackbarHelper';

describe('updateSnackbarHelper negative branches', () => {
	it('returns false when window is undefined', () => {
		// temporarily remove window
		const oldWindow = (globalThis as unknown as { window?: Window }).window;
		delete (globalThis as unknown as { window?: Window }).window;
		const res = showUpdate({} as unknown as ServiceWorkerRegistration);
		expect(res).toBe(false);
		// restore
		(globalThis as unknown as { window?: Window }).window = oldWindow;
	});

	it('returns false when dispatchEvent is not a function', () => {
		const original = (globalThis as unknown as { window?: Window }).window;
		(globalThis as unknown as { window?: Window }).window = {
			dispatchEvent: 'not-a-fn'
		} as unknown as Window & typeof globalThis;
		const res = showUpdate({} as unknown as ServiceWorkerRegistration);
		expect(res).toBe(false);
		// restore
		(globalThis as unknown as { window?: Window }).window = original;
	});

	it('dispatches a CustomEvent when dispatchEvent exists', () => {
		const original = (globalThis as unknown as { window?: Window }).window;
		const dispatched: Event[] = [];
		const fakeWindow = {
			dispatchEvent: (e: Event) => {
				dispatched.push(e);
				return true;
			}
		} as unknown as Window & typeof globalThis;
		(globalThis as unknown as { window?: Window }).window = fakeWindow;
		const fakeReg = {} as unknown as ServiceWorkerRegistration;
		const res = showUpdate(fakeReg);
		expect(res).toBe(true);
		expect(dispatched.length).toBe(1);
		const ev = dispatched[0] as CustomEvent;
		expect(ev.type).toBe('sw:show');
		expect((ev as CustomEvent).detail).toBe(fakeReg);
		// restore
		(globalThis as unknown as { window?: Window }).window = original;
	});
});
