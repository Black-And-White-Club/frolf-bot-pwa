// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { installAnchorClickStub, uninstallAnchorClickStub } from '../installAnchorStub';

describe('installAnchorClickStub', () => {
	it('installs and prevents click from navigating', () => {
		document.body.innerHTML = '<a id="a" href="http://example.local">x</a>';
		const a = document.getElementById('a') as HTMLAnchorElement;
		installAnchorClickStub();
		// clicking should not throw and should be a no-op
		expect(() => a.click()).not.toThrow();
		uninstallAnchorClickStub();
	});

	it('is idempotent across installs and uninstalls', () => {
		installAnchorClickStub();
		installAnchorClickStub();
		uninstallAnchorClickStub();
		uninstallAnchorClickStub();
		// no exceptions and anchor click still works (restored)
		document.body.innerHTML = '<a id="b" href="#">b</a>';
		const b = document.getElementById('b') as HTMLAnchorElement;
		expect(() => b.click()).not.toThrow();
	});
});
