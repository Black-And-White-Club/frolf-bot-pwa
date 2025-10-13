// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Button from '../Button.svelte';

describe('Button component', () => {
	it('renders button element with testid', () => {
		const { getByTestId } = render(Button, { props: { testid: 'btn-1' } });
		const el = getByTestId('btn-1');
		expect(el).toBeTruthy();
	});

	it('calls onClick handler when clicked', async () => {
		const spy = vi.fn();
		const handler = (e: MouseEvent) => {
			spy(e);
		};
		const { getByTestId } = render(Button, { props: { onclick: handler, testid: 'btn-2' } });
		const el = getByTestId('btn-2');
		await fireEvent.click(el);
		expect(spy).toHaveBeenCalled();
	});

	it('prevents click when disabled', async () => {
		const spy = vi.fn();
		const handler = (e: MouseEvent) => {
			spy(e);
		};
		const { getByTestId } = render(Button, {
			props: { onclick: handler, disabled: true, testid: 'btn-3' }
		});
		const el = getByTestId('btn-3');
		await fireEvent.click(el);
		expect(spy).not.toHaveBeenCalled();
	});
});
