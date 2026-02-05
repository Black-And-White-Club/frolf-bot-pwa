// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import ErrorState from '../ErrorState.svelte';

describe('ErrorState', () => {
	it('renders with default title', () => {
		const { getByText } = render(ErrorState);
		expect(getByText('Something went wrong')).toBeTruthy();
	});

	it('renders with custom title and message', () => {
		const { getByText } = render(ErrorState, {
			props: {
				title: 'Connection Error',
				message: 'Could not connect to server'
			}
		});
		expect(getByText('Connection Error')).toBeTruthy();
		expect(getByText('Could not connect to server')).toBeTruthy();
	});

	it('renders retry button and handles click', async () => {
		const onRetry = vi.fn();
		const { getByText } = render(ErrorState, {
			props: {
				onRetry
			}
		});

		const button = getByText('Try again');
		expect(button).toBeTruthy();

		await fireEvent.click(button);
		expect(onRetry).toHaveBeenCalled();
	});

	it('does not render retry button if onRetry not provided', () => {
		const { queryByText } = render(ErrorState);
		expect(queryByText('Try again')).toBeNull();
	});
});
