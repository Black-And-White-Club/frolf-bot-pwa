#!/usr/bin/env node
// scripts/run-lighthouse.js
// Node-compatible runner kept in sync with the Bun version for manual/debug usage.

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(cmd, args, opts = {}) {
	console.log(`> ${cmd} ${args.join(' ')}`);
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts });
		child.on('error', (err) => reject(err));
		child.on('close', (code) =>
			code === 0 ? resolve(0) : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`))
		);
	});
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
	throw new Error(`Timeout waiting for ${url}`);
}

// eslint-disable-next-line complexity, sonarjs/cognitive-complexity
async function main() {
	console.log('1) Building (this may take a moment)...');
	await run(
		process.execPath,
		[path.resolve(__dirname, '..', 'node_modules', 'vite', 'bin', 'vite.js'), 'build'],
		{
			env: {
				...process.env,
				PRIVATE_API_URL: process.env.PRIVATE_API_URL || 'http://localhost:8080',
				PUBLIC_ALLOW_MOCK_PROD: 'true'
			}
		}
	);

	console.log('2) Starting preview server');
	const preview = spawn(VITE_BIN, ['preview', '--host', PREVIEW_HOST, '--port', PREVIEW_PORT], {
		stdio: 'inherit',
		shell: false,
		env: {
			...process.env,
			PRIVATE_API_URL: process.env.PRIVATE_API_URL || 'http://localhost:8080',
			PUBLIC_ALLOW_MOCK_PROD: 'true'
		}
	});

	const cleanup = async () => {
		try {
			if (!preview.killed) preview.kill();
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
		const distDir = path.resolve(__dirname, '..', 'dist');
		fs.mkdirSync(distDir, { recursive: true });

		const reportBasePath = path.resolve(distDir, 'lighthouse');
		const htmlReportPath = path.resolve(distDir, 'lighthouse.report.html');
		const finalHtmlPath = path.resolve(distDir, 'lighthouse.html');
		const jsonPath = path.resolve(distDir, 'lighthouse.report.json');
		const targetUrl = `${HOST}/?mock=true`;
		const runners = [
			['bunx', ['lighthouse']],
			[process.platform === 'win32' ? 'npx.cmd' : 'npx', ['lighthouse']]
		];

		let lastError = null;
		for (const [runner, baseArgs] of runners) {
			try {
				await run(runner, [
					...baseArgs,
					targetUrl,
					'--output',
					'html',
					'--output',
					'json',
					'--output-path',
					reportBasePath,
					'--chrome-flags=--headless'
				]);
				lastError = null;
				break;
			} catch (err) {
				lastError = err;
				console.warn(`${runner} failed: ${err && err.message ? err.message : err}`);
			}
		}

		if (lastError) {
			throw new Error(
				'Could not run lighthouse with bunx or npx. Please install lighthouse or run it manually.'
			);
		}

		fs.copyFileSync(htmlReportPath, finalHtmlPath);

		console.log('Lighthouse finished. Reports:');
		console.log(' -', finalHtmlPath);
		console.log(' -', jsonPath);
	} finally {
		await cleanup();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
