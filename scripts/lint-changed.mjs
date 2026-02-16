#!/usr/bin/env node

import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

function runGit(cmd) {
	return execSync(`git ${cmd}`, { encoding: 'utf8' }).trim();
}

function safeGit(cmd) {
	try {
		return runGit(cmd);
	} catch {
		return '';
	}
}

function splitLines(input) {
	return input
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
}

function isAllZeroSha(value) {
	return /^0+$/.test(value);
}

function diffFiles(base, head) {
	const raw = safeGit(`diff --name-only --diff-filter=ACMR ${base} ${head}`);
	return splitLines(raw);
}

function localChangedFiles() {
	const tracked = splitLines(safeGit('diff --name-only --diff-filter=ACMR HEAD'));
	const untracked = splitLines(safeGit('ls-files --others --exclude-standard'));
	return [...new Set([...tracked, ...untracked])];
}

function lintFiles(command, files) {
	if (files.length === 0) return;
	const result = spawnSync(command[0], [...command.slice(1), ...files], { stdio: 'inherit' });
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

const prettierExt = new Set([
	'.js',
	'.cjs',
	'.mjs',
	'.ts',
	'.cts',
	'.mts',
	'.jsx',
	'.tsx',
	'.svelte',
	'.json',
	'.css',
	'.scss',
	'.html',
	'.md',
	'.yaml',
	'.yml'
]);

const eslintExt = new Set([
	'.js',
	'.cjs',
	'.mjs',
	'.ts',
	'.cts',
	'.mts',
	'.jsx',
	'.tsx',
	'.svelte'
]);

const explicitBase = process.env.LINT_BASE?.trim() ?? '';
const explicitHead = process.env.LINT_HEAD?.trim() ?? '';
const head = explicitHead || 'HEAD';

let changedFiles = [];

if (explicitBase && !isAllZeroSha(explicitBase)) {
	changedFiles = diffFiles(explicitBase, head);
} else if (process.env.CI) {
	const fallbackBase = safeGit('rev-parse HEAD~1');
	if (fallbackBase) {
		changedFiles = diffFiles(fallbackBase, head);
	} else {
		changedFiles = splitLines(safeGit('ls-files'));
	}
} else {
	const localFiles = localChangedFiles();
	if (localFiles.length > 0) {
		changedFiles = localFiles;
	} else {
		const baseRef = safeGit('merge-base HEAD origin/main') || safeGit('rev-parse HEAD~1');
		if (baseRef) {
			changedFiles = diffFiles(baseRef, 'HEAD');
		}
	}
}

const existingFiles = changedFiles.filter((file) => existsSync(file));
if (existingFiles.length === 0) {
	console.log('[lint-changed] No changed files to lint.');
	process.exit(0);
}

const prettierFiles = existingFiles.filter((file) => prettierExt.has(path.extname(file)));
const eslintFiles = existingFiles.filter((file) => eslintExt.has(path.extname(file)));

console.log(
	`[lint-changed] Checking ${prettierFiles.length} prettier file(s), ${eslintFiles.length} eslint file(s).`
);

lintFiles(['bunx', 'prettier', '--check'], prettierFiles);
lintFiles(['bunx', 'eslint'], eslintFiles);
