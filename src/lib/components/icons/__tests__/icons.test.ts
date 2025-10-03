// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';

import Accessibility from '../Accessibility.svelte';
import ActiveRounds from '../ActiveRounds.svelte';
import Completed from '../Completed.svelte';
import Discord from '../Discord.svelte';
import Github from '../Github.svelte';
import Scheduled from '../Scheduled.svelte';
import TotalPlayers from '../TotalPlayers.svelte';
import Tutorials from '../Tutorials.svelte';
import Youtube from '../Youtube.svelte';

// component constructors — let TypeScript infer the precise constructor types
const components = [
  Accessibility,
  ActiveRounds,
  Completed,
  Discord,
  Github,
  Scheduled,
  TotalPlayers,
  Tutorials,
  Youtube,
];

describe('icon components render an svg', () => {
	for (const C of components) {
		it(C.name || 'icon', () => {
			const { container } = render(C)
			const svg = container.querySelector('svg')
			expect(svg).toBeTruthy()
		})
	}
});
