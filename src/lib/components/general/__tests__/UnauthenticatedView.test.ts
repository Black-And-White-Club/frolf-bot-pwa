// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import UnauthenticatedView from '$lib/components/general/UnauthenticatedView.svelte';

describe('UnauthenticatedView', () => {
	it('renders', () => {
		const { getByText } = render(UnauthenticatedView);
		expect(getByText('Sign in required')).toBeTruthy();
	});
});
