import { json, type RequestHandler } from '@sveltejs/kit';

export const authjs: RequestHandler = async () => {
	return json(
		{ error: 'Auth is handled by the backend service for the PWA.' },
		{ status: 501 }
	);
};
