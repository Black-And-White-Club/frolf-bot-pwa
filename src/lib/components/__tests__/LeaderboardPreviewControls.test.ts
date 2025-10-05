// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Controls from '../LeaderboardPreviewControls.svelte';
import { MockTransport } from '$lib/stores/mockTransport';

describe('LeaderboardPreviewControls', () => {
	it('renders buttons and dispatches sent event when snapshot sent', async () => {
		const transport = new MockTransport();
		const { getByText } = render(Controls, { props: { transport } });

		const btn = getByText('Send Snapshot');
		const sendSpy = vi.spyOn(transport, 'send');

		await fireEvent.click(btn);
		// MockTransport.send is async (setTimeout), wait a tick
		await new Promise((r) => setTimeout(r, 20));

		expect(sendSpy).toHaveBeenCalled();
		sendSpy.mockRestore();
	});
});
