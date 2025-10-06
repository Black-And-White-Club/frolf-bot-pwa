// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';

import Tutorials from '../Tutorials.svelte';
import Youtube from '../Youtube.svelte';
import TotalPlayers from '../TotalPlayers.svelte';

describe('Tutorials and Youtube icon accessibility branches', () => {
	it('Tutorials shows title when provided and role present when not decorative', () => {
		const { container, getByLabelText } = render(Tutorials, {
			props: { title: 'Tuts', width: 33, height: 32 }
		});
		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();
		expect(getByLabelText('Tuts')).toBeTruthy();
		expect(svg?.getAttribute('role')).toBe('img');
	});

	it('Tutorials hides accessibility attributes when decorative', () => {
		const { container } = render(Tutorials, { props: { decorative: true, title: 'Hidden' } });
		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();
		expect(svg?.getAttribute('aria-hidden')).toBe('true');
		expect(svg?.getAttribute('aria-label')).toBeNull();
	});

	it('Youtube shows title when provided', () => {
		const { getByLabelText } = render(Youtube, { props: { title: 'YT', width: 32, height: 32 } });
		expect(getByLabelText('YT')).toBeTruthy();
	});

	it('Youtube hides accessibility attributes when decorative', () => {
		const { container } = render(Youtube, { props: { decorative: true } });
		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();
		expect(svg?.getAttribute('aria-hidden')).toBe('true');
	});

	it('TotalPlayers renders svg (sanity)', () => {
		const { container } = render(TotalPlayers, { props: { testid: 'tp' } });
		expect(container.querySelector('svg')).toBeTruthy();
	});
});
