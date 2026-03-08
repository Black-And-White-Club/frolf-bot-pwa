#!/usr/bin/env bun
// scripts/run-lighthouse.bun.js
// Bun-native: build, start preview, wait for server, run Lighthouse via bunx, then stop preview.

import fs from 'fs';
import path from 'path';

const __dirname = new URL('.', import.meta.url).pathname;
const HOST = process.env.LH_HOST || 'http://127.0.0.1:4173';
const TIMEOUT = Number(process.env.LH_TIMEOUT || 45000);
const PREVIEW_URL = new URL(HOST);
const PREVIEW_HOST = PREVIEW_URL.hostname;
const PREVIEW_PORT = PREVIEW_URL.port || (PREVIEW_URL.protocol === 'https:' ? '443' : '80');
const VITE_BIN = path.resolve(
	__dirname,
	'..',
	'node_modules',
	'.bin',
	process.platform === 'win32' ? 'vite.cmd' : 'vite'
);

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

async function waitForUrl(url, timeout = TIMEOUT, interval = 500) {
	const deadline = Date.now() + timeout;
	while (Date.now() < deadline) {
		try {
			const res = await fetch(url, { method: 'GET' });
			if (res.ok) return;
		} catch {
			// ignore
		}
		await sleep(interval);
	}
	throw new Error('Timeout waiting for ' + url);
}

// eslint-disable-next-line complexity, sonarjs/cognitive-complexity
async function run(cmd, args, opts = {}) {
	console.log(`> ${cmd} ${args.join(' ')}`);
	const p = Bun.spawn({
		cmd: [cmd, ...args],
		stdout: 'inherit',
		stderr: 'inherit',
		stdin: 'inherit',
		...opts
	});
	const res = await p.exited;
	// Bun may return different shapes depending on version: prefer explicit fields
	let success = false;
	let code = null;
	if (res !== null && res !== undefined) {
		if (typeof res === 'number') {
			success = res === 0;
			code = res;
		} else if (typeof res === 'object') {
			if (typeof res.success === 'boolean') success = res.success;
			else if (typeof res.code === 'number') success = res.code === 0;
			else if (typeof res.exitCode === 'number') success = res.exitCode === 0;
			code = res?.exitCode ?? res?.code ?? res?.status ?? null;
		} else {
			// fallback: stringify
			try {
				code = JSON.stringify(res);
			} catch {
				code = String(res);
			}
		}
	}
	if (!success) {
		console.error('Command failed result object:', res);
		try {
			console.error('Command failed result JSON:', JSON.stringify(res, null, 2));
		} catch {
			// ignore
		}
		throw new Error(`${cmd} ${args.join(' ')} exited ${String(code)}`);
	}
}

// eslint-disable-next-line complexity
async function main() {
	console.log('1) Building (this may take a moment)...');
	try {
		await run('bun', ['run', 'build'], {
			env: {
				...process.env,
				PRIVATE_API_URL: process.env.PRIVATE_API_URL || 'http://localhost:8080',
				PUBLIC_ALLOW_MOCK_PROD: 'true'
			}
		});
	} catch (err) {
		console.warn('bun run build failed, trying bun build directly for diagnostics');
		console.warn(err && err.message ? err.message : err);
		try {
			await run('bun', ['build']);
		} catch (err2) {
			console.error('bun build fallback failed:', err2 && err2.message ? err2.message : err2);
			throw err2;
		}
	}

	console.log('2) Starting preview server');
	const preview = Bun.spawn({
		cmd: [VITE_BIN, 'preview', '--host', PREVIEW_HOST, '--port', PREVIEW_PORT],
		env: {
			...process.env,
			PRIVATE_API_URL: process.env.PRIVATE_API_URL || 'http://localhost:8080',
			PUBLIC_ALLOW_MOCK_PROD: 'true'
		},
		stdout: 'inherit',
		stderr: 'inherit',
		stdin: 'pipe'
	});

	// ensure preview is killed on exit
	const cleanup = async () => {
		try {
			if (preview && !preview.exited) preview.kill();
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

		const reportBasePath = path.resolve(distDir, 'lighthouse');
		const htmlReportPath = path.resolve(distDir, 'lighthouse.report.html');
		const finalHtmlPath = path.resolve(distDir, 'lighthouse.html');
		const jsonPath = path.resolve(distDir, 'lighthouse.report.json');

		// Run via bunx
		// Use mock mode to bypass backend auth checks and test the full authenticated UI state
		const targetUrl = `${HOST}/?mock=true`;

		await run('bunx', [
			'lighthouse',
			targetUrl,
			'--output',
			'html',
			'--output',
			'json',
			'--output-path',
			reportBasePath,
			'--chrome-flags=--headless'
		]);

		fs.copyFileSync(htmlReportPath, finalHtmlPath);

		console.log('Lighthouse finished. Reports:');
		console.log(' -', finalHtmlPath);
		console.log(' -', jsonPath);
	} finally {
		try {
			// kill and await exit, but swallow non-zero exit codes
			try {
				preview.kill();
			} catch {
				// ignore
			}
			try {
				await preview.exited;
			} catch {
				// ignore exit errors from preview (e.g. 143)
			}
		} catch {
			// ignore
		}
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
