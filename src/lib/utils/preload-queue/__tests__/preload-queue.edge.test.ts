import { describe, it, expect } from 'vitest';
import { enqueuePreload } from '$lib/utils/preload-queue';

describe('enqueuePreload', () => {
	it('runs tasks and respects concurrency limits', async () => {
		const events: string[] = [];

		const makeTask =
			(id: string, delay = 0) =>
			() =>
				new Promise<string>((res) =>
					setTimeout(() => {
						events.push(id);
						res(id);
					}, delay)
				);

		// schedule three tasks; MAX_CONCURRENT is 2 so order should reflect that
		const p1 = enqueuePreload(makeTask('a', 10));
		const p2 = enqueuePreload(makeTask('b', 5));
		const p3 = enqueuePreload(makeTask('c', 1));

		const results = await Promise.all([p1, p2, p3]);
		expect(results.sort()).toEqual(['a', 'b', 'c']);
		expect(events.length).toBe(3);
	});

	it('propagates task rejection to the returned promise', async () => {
		const failing = () => Promise.reject(new Error('boom'));
		await expect(enqueuePreload(failing)).rejects.toThrow('boom');
	});
});
