parse-stats-improved.js

Usage:
node scripts/parse-stats-improved.js dist/stats.json > dist/stats-ranked.json

This script reads the rollup-visualizer `dist/stats.json` file (or similar) and
outputs a JSON object containing "chunks" (with resourceBytes and modules list)
and a flat "modules" list sorted by reported size. Use this to prioritize
file-by-file code-splitting and lazy-loading.
