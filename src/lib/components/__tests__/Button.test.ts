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
		const handle: (e: MouseEvent) => void = vi.fn() as unknown as (e: MouseEvent) => void;
		const { getByTestId } = render(Button, { props: { onClick: handle, testid: 'btn-2' } });
		const el = getByTestId('btn-2');
		await fireEvent.click(el);
		expect(handle).toHaveBeenCalled();
	});

	it('prevents click when disabled', async () => {
		const handle: (e: MouseEvent) => void = vi.fn() as unknown as (e: MouseEvent) => void;
		const { getByTestId } = render(Button, { props: { onClick: handle, disabled: true, testid: 'btn-3' } });
		const el = getByTestId('btn-3');
		await fireEvent.click(el);
		expect(handle).not.toHaveBeenCalled();
	});
});
