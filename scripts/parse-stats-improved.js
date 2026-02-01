#!/usr/bin/env node
// Lightweight parser for rollup-visualizer `dist/stats.json` to produce a ranked list of
// chunks and source modules by encoded/transfer size.
// Usage: node scripts/parse-stats-improved.js dist/stats.json > dist/stats-ranked.json

import fs from 'fs';
import path from 'path';

function readJSON(file) {
	return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function main() {
	const args = process.argv.slice(2);
	if (args.length < 1) {
		console.error('Usage: node scripts/parse-stats-improved.js <dist/stats.json>');
		process.exitCode = 2;
		return;
	}

	const statsFile = args[0];
	if (!fs.existsSync(statsFile)) {
		console.error('File not found:', statsFile);
		process.exitCode = 2;
		return;
	}

	const data = readJSON(statsFile);
	// The visualizer output is an array of nodes with {id, size, raw}
	// We want to map node UIDs (raw.metaUid) to chunks and then accumulate sizes.

	// Build UID -> node mapping
	const uidMap = new Map();
	data.forEach((node) => {
		const uid = node.raw?.metaUid || null;
		if (uid) uidMap.set(uid, node);
	});

	// Build chunk map: find entries that look like chunks (id contains _app/immutable/chunks or entry)
	const chunkNodes = data.filter((n) => n.id && n.id.includes('_app/immutable/chunks'));

	// Some nodes have moduleParts map: { 'chunkfile.js': 'uid' }
	// We'll invert and accumulate module -> chunk contributions.

	const moduleToChunks = new Map(); // key: module id (source path), value: {chunks: Map(chunkId->1), size: node.size}

	data.forEach((node) => {
		const raw = node.raw || {};
		const moduleId = raw.id || node.id;
		const moduleParts = raw.moduleParts || {};
		const size = node.size || 0;
		// moduleParts maps chunkFile -> uid (visualizer UID)
		// We'll determine the chunk filenames from the keys of moduleParts
		const chunkFiles = Object.keys(moduleParts || {});
		if (chunkFiles.length === 0) return;
		moduleToChunks.set(moduleId, {
			moduleId,
			size,
			chunkFiles
		});
	});

	// Accumulate per-chunk totals (using heuristics: chunk filesize from parallel entries in data)
	const chunkTotals = new Map();
	chunkNodes.forEach((cnode) => {
		const id = cnode.id;
		// prefer raw.renderedLength or raw.resourceBytes if present
		const raw = cnode.raw || {};
		const resourceBytes =
			raw.resourceBytes || raw.encodedBytes || raw.renderedLength || cnode.size || 0;
		chunkTotals.set(id, { id, resourceBytes, modules: [] });
	});

	// Populate modules into chunks using moduleParts recorded earlier
	moduleToChunks.forEach((m) => {
		m.chunkFiles.forEach((chunkFile) => {
			// find matching chunk node id that contains the chunkFile name
			const match = Array.from(chunkTotals.keys()).find(
				(k) => k.includes(path.basename(chunkFile)) || k.includes(chunkFile)
			);
			const chunkId = match || chunkFile;
			const chunk = chunkTotals.get(chunkId) || { id: chunkId, resourceBytes: 0, modules: [] };
			chunk.modules.push({ id: m.moduleId, size: m.size });
			chunkTotals.set(chunkId, chunk);
		});
	});

	// Convert chunkTotals to array and sort by resourceBytes desc
	const chunks = Array.from(chunkTotals.values()).map((c) => ({
		id: c.id,
		resourceBytes: c.resourceBytes,
		modules: c.modules.sort((a, b) => (b.size || 0) - (a.size || 0)),
		moduleCount: c.modules.length
	}));

	chunks.sort((a, b) => (b.resourceBytes || 0) - (a.resourceBytes || 0));

	// Also produce a flat list of modules sorted by size
	const modules = Array.from(moduleToChunks.values())
		.map((m) => ({ id: m.moduleId, size: m.size, chunks: m.chunkFiles }))
		.sort((a, b) => (b.size || 0) - (a.size || 0));

	const out = { chunks, modules };
	console.log(JSON.stringify(out, null, 2));
}

main();
