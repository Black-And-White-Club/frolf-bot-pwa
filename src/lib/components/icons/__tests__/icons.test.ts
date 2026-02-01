// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';

import ActiveRounds from '../ActiveRounds.svelte';
import Discord from '../Discord.svelte';

describe('ActiveRounds icon', () => {
	it('renders svg and supports title and decorative props', () => {
		const { container, getByLabelText } = render(ActiveRounds, {
			props: { title: 'AR', size: 24, testid: 'ar' }
		});
		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();
		expect(getByLabelText('AR')).toBeTruthy();
	});

	it('decorative hides aria and role', () => {
		const { container } = render(ActiveRounds, { props: { decorative: true, title: 'Hidden' } });
		const svg = container.querySelector('svg');
		expect(svg?.getAttribute('aria-hidden')).toBe('true');
		expect(svg?.getAttribute('role')).toBeNull();
	});
});

describe('Discord icon', () => {
	it('renders svg and respects width/height/testid', () => {
		const { container, getByTestId } = render(Discord, {
			props: { width: 40, height: 40, testid: 'disc' }
		});
		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();
		expect(getByTestId('disc')).toBeTruthy();
		expect(svg?.getAttribute('width')).toBe('40');
		expect(svg?.getAttribute('height')).toBe('40');
	});
});
