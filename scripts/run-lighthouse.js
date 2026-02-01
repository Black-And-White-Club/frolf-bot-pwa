#!/usr/bin/env node
// scripts/run-lighthouse.js
// Build, start preview, wait for server, run Lighthouse, then stop preview.

import { spawn } from 'child_process';
import http from 'http';
import process from 'process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST = process.env.LH_HOST || 'http://localhost:5173';
const TIMEOUT = Number(process.env.LH_TIMEOUT || 45000);

function run(cmd, args, opts = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts });
		child.on('error', (err) => reject(err));
		child.on('close', (code) =>
			code === 0 ? resolve(0) : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`))
		);
	});
}

function waitForUrl(url, timeout = TIMEOUT, interval = 500) {
	const deadline = Date.now() + timeout;
	return new Promise((resolve, reject) => {
		const tick = () => {
			const req = http.request(url, { method: 'GET', timeout: 2000 }, (res) => {
				res.resume();
				resolve();
			});
			req.on('error', () => {
				if (Date.now() > deadline) reject(new Error('Timeout waiting for ' + url));
				else setTimeout(tick, interval);
			});
			req.on('timeout', () => req.destroy());
			req.end();
		};
		tick();
	});
}

// eslint-disable-next-line complexity, sonarjs/cognitive-complexity
async function main() {
	const usingBun = !!process.env.BUN_VERSION;
	const buildCmd = usingBun ? 'bun' : process.platform === 'win32' ? 'npm.cmd' : 'npm';
	const buildArgs = usingBun ? ['run', 'build'] : ['run', 'build'];

	console.log('1) Building (this may take a moment)...');
	await run(buildCmd, buildArgs);

	console.log('2) Starting preview server');
	// spawn preview in background
	const previewCmd = usingBun ? 'bun' : process.platform === 'win32' ? 'npm.cmd' : 'npm';
	const previewArgs = usingBun
		? ['run', 'preview', '--', '--port', '5173']
		: ['run', 'preview', '--', '--port', '5173'];
	const preview = spawn(previewCmd, previewArgs, { stdio: 'inherit', shell: false });

	// ensure preview is killed on exit
	const cleanup = () => {
		try {
			if (preview && !preview.killed) preview.kill();
		} catch {
			// ignore
		}
	};
	process.on('exit', cleanup);
	process.on('SIGINT', () => process.exit(1));
	process.on('SIGTERM', () => process.exit(1));

	try {
		console.log(`3) Waiting for ${HOST} ...`);
		await waitForUrl(HOST);

		console.log('4) Running Lighthouse (HTML + JSON)');
		// Ensure dist exists
		const distDir = path.resolve(__dirname, '..', 'dist');
		try {
			fs.mkdirSync(distDir, { recursive: true });
		} catch {
			// ignore
		}

		// Prefer bunx then npx. We'll try each runner until one succeeds.
		const runners = usingBun ? ['bunx', 'npx'] : ['bunx', 'npx'];
		let ran = false;
		const htmlPath = path.resolve(distDir, 'lighthouse.html');
		const jsonPath = path.resolve(distDir, 'lighthouse.report.json');

		for (const runner of runners) {
			try {
				// Run HTML output
				console.log(`Running ${runner} lighthouse -> html`);
				await run(runner, [
					'lighthouse',
					HOST,
					'--output',
					'html',
					'--output-path',
					htmlPath,
					'--chrome-flags=--headless'
				]);

				// Run JSON output
				console.log(`Running ${runner} lighthouse -> json`);
				await run(runner, [
					'lighthouse',
					HOST,
					'--output',
					'json',
					'--output-path',
					jsonPath,
					'--chrome-flags=--headless'
				]);

				ran = true;
				break;
			} catch (err) {
				console.warn(`${runner} failed: ${err && err.message ? err.message : err}`);
				// try next runner
			}
		}

		if (!ran)
			throw new Error(
				'Could not run lighthouse with bunx or npx. Please install lighthouse or run it manually.'
			);

		console.log('Lighthouse finished. Reports:');
		console.log(' -', path.resolve(__dirname, '..', 'dist', 'lighthouse.html'));
		console.log(' -', path.resolve(__dirname, '..', 'dist', 'lighthouse.report.json'));
	} finally {
		cleanup();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
