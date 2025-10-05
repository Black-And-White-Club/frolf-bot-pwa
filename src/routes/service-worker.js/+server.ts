import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const filePath = resolve(process.cwd(), 'public', 'service-worker.js');
	try {
		const body = await readFile(filePath, 'utf-8');
		return new Response(body, {
			headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
		});
	} catch {
		return new Response('Not found', { status: 404 });
	}
};
