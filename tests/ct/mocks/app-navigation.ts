/* eslint-disable @typescript-eslint/no-unused-vars */
// Stub module — all parameters are intentionally unused in this mock.
export const goto = (_url: string | URL, _opts?: object): Promise<void> => Promise.resolve();
export const invalidate = (_url: string): Promise<void> => Promise.resolve();
export const invalidateAll = (): Promise<void> => Promise.resolve();
export const preloadData = (
	_url: string
): Promise<{ type: 'loaded'; status: 200; data: unknown }> =>
	Promise.resolve({ type: 'loaded' as const, status: 200 as const, data: {} });
export const preloadCode = (..._urls: string[]): Promise<void> => Promise.resolve();
export const beforeNavigate = (_cb: (navigation: unknown) => void): void => {};
export const afterNavigate = (_cb: (navigation: unknown) => void): void => {};
export const onNavigate = (_cb: (navigation: unknown) => void): void => {};
export const pushState = (_url: string | URL, _state: unknown): void => {};
export const replaceState = (_url: string | URL, _state: unknown): void => {};
