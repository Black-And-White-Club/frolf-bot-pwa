/**
 * Theme validation utilities
 * Validates color contrast ratios and hex format
 */

import type { GuildTheme } from './theme';

// ============================================================================
// COLOR UTILITIES
// ============================================================================

function getLuminance(hex: string): number {
	const rgb = parseInt(hex.slice(1), 16);
	const r = (rgb >> 16) & 0xff;
	const g = (rgb >> 8) & 0xff;
	const b = (rgb >> 0) & 0xff;

	const rsRGB = r / 255;
	const gsRGB = g / 255;
	const bsRGB = b / 255;

	const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
	const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
	const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

	return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

function getContrastRatio(color1: string, color2: string): number {
	const lum1 = getLuminance(color1);
	const lum2 = getLuminance(color2);
	const brightest = Math.max(lum1, lum2);
	const darkest = Math.min(lum1, lum2);
	return (brightest + 0.05) / (darkest + 0.05);
}

// ============================================================================
// VALIDATION
// ============================================================================

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const COLOR_FIELDS = [
	'primary',
	'secondary',
	'accent',
	'background',
	'surface',
	'text',
	'textSecondary',
	'border'
] as const;

interface ContrastCheck {
	color1: keyof GuildTheme;
	color2: keyof GuildTheme;
	minRatio: number;
	description: string;
}

const CONTRAST_CHECKS: ContrastCheck[] = [
	{
		color1: 'primary',
		color2: 'surface',
		minRatio: 3,
		description: 'Primary color on surface'
	},
	{
		color1: 'text',
		color2: 'background',
		minRatio: 4.5,
		description: 'Text color on background'
	},
	{
		color1: 'textSecondary',
		color2: 'background',
		minRatio: 4.5,
		description: 'Secondary text color on background'
	}
];

export function validateTheme(theme: GuildTheme): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	// Validate hex color format
	for (const field of COLOR_FIELDS) {
		if (!HEX_COLOR_REGEX.test(theme[field])) {
			errors.push(`${field} color "${theme[field]}" is not a valid hex color`);
		}
	}

	// Validate contrast ratios (only if colors are valid hex)
	for (const check of CONTRAST_CHECKS) {
		const color1 = theme[check.color1] as string;
		const color2 = theme[check.color2] as string;

		if (HEX_COLOR_REGEX.test(color1) && HEX_COLOR_REGEX.test(color2)) {
			const ratio = getContrastRatio(color1, color2);
			if (ratio < check.minRatio) {
				errors.push(
					`${check.description}: ${color1} has insufficient contrast (${ratio.toFixed(2)}) on ${color2}. Minimum: ${check.minRatio}:1`
				);
			}
		}
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}
