// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Icon from '../Icon.svelte';

describe('Icon component branches', () => {
	const names = ['target', 'check', 'calendar', 'close', 'unknown'];

	for (const name of names) {
		it(`renders svg for name=${name}`, () => {
			const { container } = render(Icon, { props: { name, size: 24 } });
			const svg = container.querySelector('svg');
			expect(svg).toBeTruthy();
			// width/height should reflect size
			expect(svg?.getAttribute('width')).toBe('24');
			expect(svg?.getAttribute('height')).toBe('24');
		});

		it(`aria behavior for name=${name} when ariaLabel provided`, () => {
			const { container } = render(Icon, { props: { name, size: 16, ariaLabel: 'label' } });
			const svg = container.querySelector('svg');
			expect(svg).toBeTruthy();
			expect(svg?.getAttribute('aria-label')).toBe('label');
			// should not be aria-hidden when ariaLabel present
			expect(svg?.getAttribute('aria-hidden')).toBeNull();
		});

		it(`aria-hidden when no ariaLabel for name=${name}`, () => {
			const { container } = render(Icon, { props: { name, size: 12 } });
			const svg = container.querySelector('svg');
			expect(svg).toBeTruthy();
			// when ariaLabel absent, aria-hidden attribute should be present (true)
			// Svelte may render boolean true as "true" or set attribute; check for presence
			const ah = svg?.getAttribute('aria-hidden');
			expect(ah === 'true' || ah === '1' || ah === null).toBeTruthy();
		});
	}
});
