// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCalendarEvent } from '../calendar';
import type { Round } from '$lib/types/backend';

beforeEach(() => {
	// reset DOM
	document.body.innerHTML = '';
});

describe('calendar utils', () => {
	it('createCalendarEvent returns expected shape', () => {
		const now = new Date().toISOString();
		const r: Partial<Round> = {
			round_id: 'rc1',
			title: 'Test',
			created_at: now,
			status: 'scheduled'
		};
		const ev = createCalendarEvent(r as Round);
		expect(ev.name).toContain('Disc Golf Round');
		expect(ev.startDate).toMatch(/\d{4}-\d{2}-\d{2}/);
		expect(ev.startTime).toMatch(/\d{2}:\d{2}/);
	});

	it('addToCalendar uses navigator.share when available', async () => {
		const round: Partial<Round> = {
			round_id: 'r-share',
			title: 'Share Round',
			created_at: new Date().toISOString(),
			status: 'scheduled'
		};

		const { addToCalendar } = await import('../calendar');
	const shareMock = vi.fn().mockResolvedValue(undefined);
	(globalThis as unknown as { navigator?: unknown }).navigator = { share: shareMock } as unknown;

		await addToCalendar(round as Round);

		expect(shareMock).toHaveBeenCalled();
		const arg = shareMock.mock.calls[0][0];
		expect(arg).toHaveProperty('title');
		expect(arg).toHaveProperty('url');
		expect(arg.url).toContain('calendar.google.com');
	});

	it('addToCalendar falls back to download when navigator.share missing', async () => {
		const round: Partial<Round> = {
			round_id: 'r-dl',
			title: 'DL Round',
			created_at: new Date().toISOString(),
			status: 'scheduled'
		};

		const { addToCalendar } = await import('../calendar');

		// Ensure navigator.share is not present (previous tests may set it)
		(globalThis as unknown as { navigator?: unknown }).navigator = {} as unknown;

		let createdOrig: ((arg: unknown) => string) | undefined;
	if (typeof (URL as unknown as { createObjectURL?: unknown }).createObjectURL !== 'function') {
		// store original (likely undefined) and define a temporary stub
		createdOrig = (URL as unknown as { createObjectURL?: (a: unknown) => string }).createObjectURL;
		(URL as unknown as { createObjectURL?: (a: unknown) => string }).createObjectURL = () => 'blob:fake';
	}
	const createObjSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
	const appendSpy = vi.spyOn(document.body, 'appendChild');
	const removeSpy = vi.spyOn(document.body, 'removeChild');

		await addToCalendar(round as Round);

		expect(createObjSpy).toHaveBeenCalled();
		expect(appendSpy).toHaveBeenCalled();
		expect(removeSpy).toHaveBeenCalled();

		createObjSpy.mockRestore();
		appendSpy.mockRestore();
		removeSpy.mockRestore();
		if (createdOrig !== undefined) {
			// restore original if replaced
			(URL as unknown as { createObjectURL?: (a: unknown) => string }).createObjectURL = createdOrig;
		}
	});
});
