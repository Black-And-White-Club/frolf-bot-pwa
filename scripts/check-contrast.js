#!/usr/bin/env node
// Small contrast checker for GuildThemes in src/lib/stores/theme.ts
// Usage: node scripts/check-contrast.js
import fs from 'fs';
import path from 'path';

function hexToRgb(hex) {
	const bigint = parseInt(hex.slice(1), 16);
	return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function luminance(hex) {
	const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
	const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
	const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
	const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
	return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrast(a, b) {
	const la = luminance(a);
	const lb = luminance(b);
	const brightest = Math.max(la, lb);
	const darkest = Math.min(la, lb);
	return (brightest + 0.05) / (darkest + 0.05);
}

const themeFile = path.join(__dirname, '..', 'src', 'lib', 'stores', 'theme.ts');
const out = [];

const content = fs.readFileSync(themeFile, 'utf8');
// crude parse: extract defaultTheme object
const match = content.match(/export const defaultTheme: GuildTheme = \{([\s\S]*?)\};/m);
if (!match) {
	console.error('Could not find defaultTheme in theme.ts');
	process.exit(1);
}
const body = match[1];
function findHex(key) {
	const re = new RegExp(key + "\\s*:\\s*'(#\\w{6})'", 'm');
	const m = body.match(re);
	return m ? m[1] : null;
}
const primary = findHex('primary');
const surface = findHex('surface');
const text = findHex('text');
const textSecondary = findHex('textSecondary');
const background = findHex('background');

out.push(`# Contrast report - defaultTheme\n\n`);
out.push(
	`primary: ${primary} on surface: ${surface} -> contrast ${contrast(primary, surface).toFixed(2)}\n`
);
out.push(
	`text: ${text} on background: ${background} -> contrast ${contrast(text, background).toFixed(2)}\n`
);
out.push(
	`textSecondary: ${textSecondary} on background: ${background} -> contrast ${contrast(textSecondary, background).toFixed(2)}\n`
);

const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(path.join(reportsDir, 'contrast-report.md'), out.join('\n'));
console.log('Wrote reports/contrast-report.md');
