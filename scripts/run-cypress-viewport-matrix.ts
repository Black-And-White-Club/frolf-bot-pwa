#!/usr/bin/env bun

import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	VIEWPORT_MATRIX,
	viewportConfig,
	type ViewportProfile
} from '../cypress/support/viewports';

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), '..');
const e2eRoot = path.join(repoRoot, 'cypress', 'e2e');
const smokePathSegment = `${path.sep}smoke${path.sep}`;
const cypressBinary = path.join(
	repoRoot,
	'node_modules',
	'.bin',
	process.platform === 'win32' ? 'cypress.cmd' : 'cypress'
);
const passthroughArgs = process.argv.slice(2);
const baseUrl = process.env.CYPRESS_BASE_URL ?? 'http://localhost:5173';
const serverStartupTimeoutMs = Number(process.env.CYPRESS_SERVER_STARTUP_TIMEOUT_MS ?? 120000);
const autoStartServer = process.env.CYPRESS_AUTO_START_SERVER !== 'false';
const serverCommand = process.env.CYPRESS_SERVER_COMMAND;
const baseUrlTarget = new URL(baseUrl);
const devServerHost = process.env.CYPRESS_DEV_SERVER_HOST ?? '127.0.0.1';
const devServerPort = process.env.CYPRESS_DEV_SERVER_PORT ?? (baseUrlTarget.port || '5173');

type ServerHandle = {
	process: ChildProcess;
	hasExited: () => boolean;
};

function sleep(milliseconds: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});
}

async function isServerReachable(url: string): Promise<boolean> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 1500);
	try {
		const response = await fetch(url, {
			method: 'GET',
			redirect: 'manual',
			signal: controller.signal
		});
		return response.status < 500;
	} catch {
		return false;
	} finally {
		clearTimeout(timeout);
	}
}

async function waitForServer(
	url: string,
	timeoutMs: number,
	serverHandle?: ServerHandle
): Promise<boolean> {
	const startedAt = Date.now();
	while (Date.now() - startedAt < timeoutMs) {
		if (serverHandle?.hasExited()) {
			return false;
		}
		if (await isServerReachable(url)) {
			return true;
		}
		await sleep(1000);
	}
	return false;
}

function startServerProcess(): ServerHandle {
	let exited = false;
	const markExited = () => {
		exited = true;
	};

	const childProcess = serverCommand
		? spawn(serverCommand, {
				cwd: repoRoot,
				stdio: 'inherit',
				shell: true
			})
		: spawn('bun', ['run', 'dev', '--host', devServerHost, '--port', devServerPort], {
				cwd: repoRoot,
				stdio: 'inherit'
			});

	childProcess.once('exit', markExited);
	childProcess.once('close', markExited);
	childProcess.once('error', markExited);

	return {
		process: childProcess,
		hasExited: () => exited
	};
}

async function stopServerProcess(serverHandle: ServerHandle | null): Promise<void> {
	const childProcess = serverHandle?.process;
	if (!childProcess || childProcess.pid === undefined || childProcess.killed) {
		return;
	}

	childProcess.kill('SIGTERM');

	await Promise.race([
		new Promise<void>((resolve) => {
			childProcess.once('close', () => resolve());
			childProcess.once('exit', () => resolve());
			childProcess.once('error', () => resolve());
		}),
		sleep(3000)
	]);
}

function collectSpecFiles(directoryPath: string): string[] {
	const files: string[] = [];
	const entries = readdirSync(directoryPath, { withFileTypes: true });

	for (const entry of entries) {
		const entryPath = path.join(directoryPath, entry.name);
		if (entry.isDirectory()) {
			files.push(...collectSpecFiles(entryPath));
			continue;
		}
		files.push(entryPath);
	}

	return files;
}

function integrationSpecs(): string[] {
	return collectSpecFiles(e2eRoot)
		.filter((filePath) => filePath.endsWith('.cy.ts'))
		.filter((filePath) => !filePath.includes(smokePathSegment))
		.map((filePath) => path.relative(repoRoot, filePath).split(path.sep).join('/'))
		.sort();
}

function runCypressForViewport(viewport: ViewportProfile, specArgument: string): number {
	const configArg = `${viewportConfig(viewport)},baseUrl=${baseUrl}`;
	const args = ['run', '--spec', specArgument, '--config', configArg, ...passthroughArgs];
	const result = spawnSync(cypressBinary, args, {
		cwd: repoRoot,
		stdio: 'inherit',
		env: {
			...process.env,
			CYPRESS_USE_MOCK: process.env.CYPRESS_USE_MOCK ?? 'false'
		}
	});

	return result.status ?? 1;
}

async function ensureBaseUrlIsReady(): Promise<ServerHandle | null> {
	if (await isServerReachable(baseUrl)) {
		console.log(`[e2e:matrix] Reusing running server at ${baseUrl}`);
		return null;
	}

	if (!autoStartServer) {
		console.error(
			`[e2e:matrix] ${baseUrl} is not reachable and auto-start is disabled. Start the server manually or unset CYPRESS_AUTO_START_SERVER=false.`
		);
		process.exit(1);
	}

	const startDescription = serverCommand
		? `command "${serverCommand}"`
		: `bun run dev --host ${devServerHost} --port ${devServerPort}`;
	console.log(`[e2e:matrix] Starting app server using ${startDescription}`);
	const serverHandle = startServerProcess();
	const ready = await waitForServer(baseUrl, serverStartupTimeoutMs, serverHandle);

	if (!ready) {
		await stopServerProcess(serverHandle);
		console.error(
			`[e2e:matrix] Timed out waiting for ${baseUrl} after ${serverStartupTimeoutMs}ms.`
		);
		process.exit(1);
	}

	console.log(`[e2e:matrix] App server is ready at ${baseUrl}`);
	return serverHandle;
}

async function main(): Promise<void> {
	const specs = integrationSpecs();

	if (specs.length === 0) {
		console.error('[e2e:matrix] No integration specs found.');
		process.exit(1);
	}

	const specArgument = specs.join(',');
	const serverHandle = await ensureBaseUrlIsReady();

	let exitCode = 0;
	const handleSigInt = () => {
		void stopServerProcess(serverHandle).then(() => process.exit(130));
	};
	const handleSigTerm = () => {
		void stopServerProcess(serverHandle).then(() => process.exit(143));
	};
	process.once('SIGINT', handleSigInt);
	process.once('SIGTERM', handleSigTerm);

	try {
		for (const viewport of VIEWPORT_MATRIX) {
			console.log(`[e2e:matrix] ${viewport.name} ${viewport.width}x${viewport.height}`);
			exitCode = runCypressForViewport(viewport, specArgument);
			if (exitCode !== 0) {
				break;
			}
		}
	} finally {
		process.off('SIGINT', handleSigInt);
		process.off('SIGTERM', handleSigTerm);
		await stopServerProcess(serverHandle);
	}

	if (exitCode !== 0) {
		process.exit(exitCode);
		return;
	}

	console.log('[e2e:matrix] All viewport runs passed.');
}

await main();
