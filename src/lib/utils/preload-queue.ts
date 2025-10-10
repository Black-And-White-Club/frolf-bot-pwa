type Task<T> = () => Promise<T>;

const MAX_CONCURRENT = 2;
let active = 0;
const queue: Array<{
	task: Task<unknown>;
	resolve: (v: unknown) => void;
	reject: (e: unknown) => void;
}> = [];

function runNext() {
	if (active >= MAX_CONCURRENT) return;
	const item = queue.shift();
	if (!item) return;
	active++;
	const runTask = () => {
		item
			.task()
			.then((res) => {
				active--;
				item.resolve(res);
				runNext();
			})
			.catch((err) => {
				active--;
				item.reject(err);
				runNext();
			});
	};

	const ric = (cb: () => void) => {
		// Prefer requestIdleCallback when available, fall back to requestAnimationFrame,
		// and finally to setTimeout to ensure tasks run in environments without rIC/rAF
		const g = globalThis as unknown as {
			requestIdleCallback?: (cb: () => void) => void;
			requestAnimationFrame?: (cb: () => void) => number;
		};
		if (typeof g.requestIdleCallback === 'function') {
			g.requestIdleCallback(cb as unknown as () => void);
		} else if (typeof g.requestAnimationFrame === 'function') {
			g.requestAnimationFrame(() => cb());
		} else {
			setTimeout(cb, 0);
		}
	};

	ric(() => runTask());
}

export function enqueuePreload<T>(task: Task<T>): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		queue.push({ task: task as Task<unknown>, resolve: resolve as (v: unknown) => void, reject });
		// try to run immediately if under limit
		runNext();
	});
}
