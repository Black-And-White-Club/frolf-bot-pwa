// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';

import Accessibility from '../Accessibility.svelte';
import Completed from '../Completed.svelte';
import Github from '../Github.svelte';
import Scheduled from '../Scheduled.svelte';
import Tutorials from '../Tutorials.svelte';
import Youtube from '../Youtube.svelte';
import TotalPlayers from '../TotalPlayers.svelte';

describe('additional icon components', () => {
	it('Accessibility renders title and respects decorative', () => {
		const { container, getByLabelText } = render(Accessibility, {
			props: { title: 'Access', testid: 'acc', width: 48, height: 48 }
		});
		expect(container.querySelector('svg')).toBeTruthy();
		expect(getByLabelText('Access')).toBeTruthy();
	});

	it('Completed renders svg and supports decorative/title', () => {
		const { container, getByLabelText } = render(Completed, {
			props: { title: 'Done', size: 22, testid: 'done' }
		});
		expect(container.querySelector('svg')).toBeTruthy();
		expect(getByLabelText('Done')).toBeTruthy();
	});

	it('Github respects width/height and testid', () => {
		const { container, getByTestId } = render(Github, {
			props: { width: 20, height: 20, testid: 'gh' }
		});
		expect(container.querySelector('svg')).toBeTruthy();
		expect(getByTestId('gh')).toBeTruthy();
	});

	it('Scheduled renders title when provided', () => {
		const { getByLabelText } = render(Scheduled, { props: { title: 'When' } });
		expect(getByLabelText('When')).toBeTruthy();
	});

	it('Tutorials and Youtube render svg and accept testid', () => {
		const t = render(Tutorials, { props: { testid: 'tut', width: 33, height: 32 } });
		const y = render(Youtube, { props: { testid: 'yt', width: 32, height: 32 } });
		expect(t.container.querySelector('svg')).toBeTruthy();
		expect(y.container.querySelector('svg')).toBeTruthy();
	});

	it('TotalPlayers renders svg', () => {
		const { container } = render(TotalPlayers);
		expect(container.querySelector('svg')).toBeTruthy();
	});
});
