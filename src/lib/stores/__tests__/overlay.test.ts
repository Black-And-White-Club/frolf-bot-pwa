// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import overlay, { modalOpen, setModalOpen } from '$lib/stores/overlay';

describe('overlay store', () => {
	it('defaults to false', () => {
		let val: boolean | undefined;
		const unsub = modalOpen.subscribe((v) => (val = v));
		expect(val).toBe(false);
		unsub();
	});

	it('setModalOpen(true) updates store', () => {
		setModalOpen(true);
		let val: boolean | undefined;
		const unsub = overlay.subscribe((v) => (val = v));
		expect(val).toBe(true);
		unsub();
	});

	it('setModalOpen(false) updates store', () => {
		setModalOpen(false);
		let val: boolean | undefined;
		const unsub = modalOpen.subscribe((v) => (val = v));
		expect(val).toBe(false);
		unsub();
	});
});
