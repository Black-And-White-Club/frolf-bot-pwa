#!/usr/bin/env bun
// scripts/analyze-lighthouse.bun.js
// Read dist/lighthouse.report.json and print a concise human summary.

import fs from 'fs/promises';
import path from 'path';

const REPORT = path.resolve(process.cwd(), 'dist', 'lighthouse.report.json');

function fmtBytes(n) {
	if (n == null) return '-';
	if (n < 1024) return `${n} B`;
	return `${(n / 1024).toFixed(1)} KB`;
}

function fmtMs(n) {
	if (n == null) return '-';
	return `${Math.round(n)} ms`;
}

function pickAudit(audits, id) {
	return audits && audits[id] ? audits[id] : null;
}

async function main() {
	try {
		const raw = await fs.readFile(REPORT, 'utf-8');
		const json = JSON.parse(raw);

		const categories = json.categories || {};
		console.log('\nLighthouse summary:');
		for (const [key, cat] of Object.entries(categories)) {
			const score = typeof cat.score === 'number' ? Math.round(cat.score * 100) : 'n/a';
			console.log(` - ${cat.title || key}: ${score}`);
		}

		const audits = json.audits || {};

		// Opportunities: details.type === 'opportunity' or scoreDisplayMode === 'numeric'
		const opportunities = Object.values(audits).filter((a) => {
			if (!a) return false;
			if (a.details && a.details.type === 'opportunity') return true;
			return (
				a.scoreDisplayMode === 'numeric' &&
				a.details &&
				(a.details.overallSavingsMs || a.details.overallSavingsBytes || a.details.items)
			);
		});

		// Map to savings number (bytes or ms). Prefer bytes for image/script savings, ms for time savings.
		const withSavings = opportunities.map((a) => {
			const ms = a.details?.overallSavingsMs ?? a.numericValue ?? null;
			const bytes = a.details?.overallSavingsBytes ?? a.details?.overallSavings ?? null;
			const primary = bytes ?? ms ?? 0;
			return { id: a.id, title: a.title, description: a.description, primary, ms, bytes, raw: a };
		});

		withSavings.sort((x, y) => (y.primary || 0) - (x.primary || 0));

		console.log('\nTop opportunities (estimated savings):');
		for (const op of withSavings.slice(0, 10)) {
			const by = op.bytes ? fmtBytes(op.bytes) : op.ms ? fmtMs(op.ms) : '-';
			console.log(` - ${op.title} → ${by}`);
			if (op.description) console.log(`   ${op.description}`);
		}

		// Diagnostics: print a few key diagnostics if present
		const diagIds = [
			'dom-size',
			'critical-request-chains',
			'render-blocking-resources',
			'uses-responsive-images',
			'offscreen-images',
			'bootup-time',
			'mainthread-work-breakdown',
			'script-treemap-data',
			'total-blocking-time',
			'diagnostics'
		];
		console.log('\nKey diagnostics:');
		for (const id of diagIds) {
			const a = pickAudit(audits, id);
			if (!a) continue;
			console.log(`\n[${a.id}] ${a.title} (${a.scoreDisplayMode})`);
			if (a.description) console.log(a.description);
			// print up to 5 detail items
			const items = a.details?.items ?? [];
			if (items.length) {
				console.log('  Example items:');
				for (const it of items.slice(0, 5)) {
					if (typeof it === 'string') console.log('   -', it);
					else if (it.url) console.log('   -', it.url, it.value ? `(${it.value})` : '');
					else console.log('   -', JSON.stringify(it).slice(0, 200));
				}
			} else if (a.details && a.details.summary) {
				console.log('  ', a.details.summary || JSON.stringify(a.details).slice(0, 200));
			}
		}

		console.log('\nReports written to: dist/lighthouse.html and dist/lighthouse.report.json');
	} catch (err) {
		console.error(
			'Failed to read or parse Lighthouse report:',
			err && err.message ? err.message : err
		);
		process.exitCode = 2;
	}
}

main();
