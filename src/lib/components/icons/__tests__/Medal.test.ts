// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Medal from '../Medal.svelte';

describe('Medal icon', () => {
	it('renders an svg with aria-hidden and role img', () => {
		const { container } = render(Medal, { props: { rank: 1, size: 24 } });
		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();
		if (svg) {
			expect(svg.getAttribute('aria-hidden')).toBe('true');
			expect(svg.getAttribute('role')).toBe('img');
			// should have defs > linearGradient with a generated id and use it in circle fill
			const defs = svg.querySelector('defs');
			expect(defs).toBeTruthy();
			const stop = svg.querySelector('stop');
			expect(stop).toBeTruthy();
		}
	});

	it('changes gradient based on rank prop', () => {
		const { container: c1 } = render(Medal, { props: { rank: 1 } });
		const { container: c2 } = render(Medal, { props: { rank: 2 } });
		const id1 = c1.querySelector('linearGradient')?.getAttribute('id');
		const id2 = c2.querySelector('linearGradient')?.getAttribute('id');
		expect(id1).toBeTruthy();
		expect(id2).toBeTruthy();
		expect(id1).not.toEqual(id2);
	});
});
