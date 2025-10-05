/**
 * Theme system for configurable guild colors
 * Allows each guild to have their own color scheme
 */

import { writable, get } from 'svelte/store';
import { hexToRgbString, setRgbAliases } from './theme.helpers';

// re-export helpers so older imports that referenced these from `theme` continue to work
export { hexToRgbString, setRgbAliases };

// Expanded theme interface with full design tokens
export interface GuildTheme {
	// Colors
	primary: string;
	secondary: string;
	accent: string;
	background: string;
	surface: string;
	text: string;
	textSecondary: string;
	border: string;

	// Spacing scale (in rem)
	spacing: {
		xs: string; // 0.5rem
		sm: string; // 0.75rem
		md: string; // 1rem
		lg: string; // 1.5rem
		xl: string; // 2rem
		xxl: string; // 3rem
	};

	// Typography scale
	typography: {
		fontSize: {
			xs: string; // 0.75rem
			sm: string; // 0.875rem
			base: string; // 1rem
			lg: string; // 1.125rem
			xl: string; // 1.25rem
			xxl: string; // 1.5rem
			xxxl: string; // 2rem
		};
		fontWeight: {
			normal: string; // 400
			medium: string; // 500
			semibold: string; // 600
			bold: string; // 700
		};
		lineHeight: {
			tight: string; // 1.25
			normal: string; // 1.5
			relaxed: string; // 1.75
		};
	};

	// Border radius scale
	borderRadius: {
		sm: string; // 0.25rem
		md: string; // 0.375rem
		lg: string; // 0.5rem
		xl: string; // 0.75rem
		full: string; // 9999px
	};

	// Shadows
	shadow: {
		sm: string; // small shadow
		md: string; // medium shadow
		lg: string; // large shadow
		xl: string; // extra large shadow
	};
}

// Default theme (Frolf-Bot brand - Amethyst & Skobeloff)
export const defaultTheme: GuildTheme = {
	primary: '#007474', // Skobeloff (UI Hero - primary actions)
	secondary: '#8B7BB8', // Amethyst (Brand Hero - identity)
	accent: '#CBA135', // Satin Sheen Gold (celebratory accent)
	background: '#F5FFFA', // Mint Cream (neutral balance)
	surface: '#ffffff', // pure white
	text: '#1A1A1A', // Deep Charcoal (foundation)
	textSecondary: '#64748b', // medium gray
	border: '#e2e8f0', // light gray

	// Design tokens
	spacing: {
		xs: '0.5rem',
		sm: '0.75rem',
		md: '1rem',
		lg: '1.5rem',
		xl: '2rem',
		xxl: '3rem'
	},
	typography: {
		fontSize: {
			xs: '0.75rem',
			sm: '0.875rem',
			base: '1rem',
			lg: '1.125rem',
			xl: '1.25rem',
			xxl: '1.5rem',
			xxxl: '2rem'
		},
		fontWeight: {
			normal: '400',
			medium: '500',
			semibold: '600',
			bold: '700'
		},
		lineHeight: {
			tight: '1.25',
			normal: '1.5',
			relaxed: '1.75'
		}
	},
	borderRadius: {
		sm: '0.25rem',
		md: '0.375rem',
		lg: '0.5rem',
		xl: '0.75rem',
		full: '9999px'
	},
	shadow: {
		sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
		md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
		lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
		xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
	}
};

// Alternative themes for different guilds
export const guildThemes: Record<string, GuildTheme> = {
	// Forest/Golf theme
	forest: {
		primary: '#16a34a', // green-600
		secondary: '#059669', // emerald-600
		accent: '#0d9488', // teal-600
		background: '#f0fdf4', // green-50
		surface: '#ffffff',
		text: '#14532d', // green-900
		textSecondary: '#166534', // green-800
		border: '#bbf7d0', // green-200

		// Shared design tokens
		spacing: {
			xs: '0.5rem',
			sm: '0.75rem',
			md: '1rem',
			lg: '1.5rem',
			xl: '2rem',
			xxl: '3rem'
		},
		typography: {
			fontSize: {
				xs: '0.75rem',
				sm: '0.875rem',
				base: '1rem',
				lg: '1.125rem',
				xl: '1.25rem',
				xxl: '1.5rem',
				xxxl: '2rem'
			},
			fontWeight: {
				normal: '400',
				medium: '500',
				semibold: '600',
				bold: '700'
			},
			lineHeight: {
				tight: '1.25',
				normal: '1.5',
				relaxed: '1.75'
			}
		},
		borderRadius: {
			sm: '0.25rem',
			md: '0.375rem',
			lg: '0.5rem',
			xl: '0.75rem',
			full: '9999px'
		},
		shadow: {
			sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
			md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
			lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
			xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
		}
	},

	// Ocean theme
	ocean: {
		primary: '#0369a1', // sky-700
		secondary: '#0284c7', // sky-600
		accent: '#0891b2', // cyan-600
		background: '#f0f9ff', // sky-50
		surface: '#ffffff',
		text: '#0c4a6e', // sky-900
		textSecondary: '#075985', // sky-800
		border: '#bae6fd', // sky-200

		// Shared design tokens
		spacing: {
			xs: '0.5rem',
			sm: '0.75rem',
			md: '1rem',
			lg: '1.5rem',
			xl: '2rem',
			xxl: '3rem'
		},
		typography: {
			fontSize: {
				xs: '0.75rem',
				sm: '0.875rem',
				base: '1rem',
				lg: '1.125rem',
				xl: '1.25rem',
				xxl: '1.5rem',
				xxxl: '2rem'
			},
			fontWeight: {
				normal: '400',
				medium: '500',
				semibold: '600',
				bold: '700'
			},
			lineHeight: {
				tight: '1.25',
				normal: '1.5',
				relaxed: '1.75'
			}
		},
		borderRadius: {
			sm: '0.25rem',
			md: '0.375rem',
			lg: '0.5rem',
			xl: '0.75rem',
			full: '9999px'
		},
		shadow: {
			sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
			md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
			lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
			xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
		}
	},

	// Sunset theme
	sunset: {
		primary: '#dc2626', // red-600
		secondary: '#ea580c', // orange-600
		accent: '#c2410c', // orange-700
		background: '#fef2f2', // red-50
		surface: '#ffffff',
		text: '#991b1b', // red-800
		textSecondary: '#c2410c', // orange-700
		border: '#fecaca', // red-200

		// Shared design tokens
		spacing: {
			xs: '0.5rem',
			sm: '0.75rem',
			md: '1rem',
			lg: '1.5rem',
			xl: '2rem',
			xxl: '3rem'
		},
		typography: {
			fontSize: {
				xs: '0.75rem',
				sm: '0.875rem',
				base: '1rem',
				lg: '1.125rem',
				xl: '1.25rem',
				xxl: '1.5rem',
				xxxl: '2rem'
			},
			fontWeight: {
				normal: '400',
				medium: '500',
				semibold: '600',
				bold: '700'
			},
			lineHeight: {
				tight: '1.25',
				normal: '1.5',
				relaxed: '1.75'
			}
		},
		borderRadius: {
			sm: '0.25rem',
			md: '0.375rem',
			lg: '0.5rem',
			xl: '0.75rem',
			full: '9999px'
		},
		shadow: {
			sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
			md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
			lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
			xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
		}
	},

	// Purple theme
	purple: {
		primary: '#7c3aed', // violet-600
		secondary: '#8b5cf6', // violet-500
		accent: '#a855f7', // purple-500
		background: '#faf5ff', // violet-50
		surface: '#ffffff',
		text: '#581c87', // violet-900
		textSecondary: '#6d28d9', // violet-700
		border: '#ddd6fe', // violet-200

		// Shared design tokens
		spacing: {
			xs: '0.5rem',
			sm: '0.75rem',
			md: '1rem',
			lg: '1.5rem',
			xl: '2rem',
			xxl: '3rem'
		},
		typography: {
			fontSize: {
				xs: '0.75rem',
				sm: '0.875rem',
				base: '1rem',
				lg: '1.125rem',
				xl: '1.25rem',
				xxl: '1.5rem',
				xxxl: '2rem'
			},
			fontWeight: {
				normal: '400',
				medium: '500',
				semibold: '600',
				bold: '700'
			},
			lineHeight: {
				tight: '1.25',
				normal: '1.5',
				relaxed: '1.75'
			}
		},
		borderRadius: {
			sm: '0.25rem',
			md: '0.375rem',
			lg: '0.5rem',
			xl: '0.75rem',
			full: '9999px'
		},
		shadow: {
			sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
			md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
			lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
			xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
		}
	}
};

// Current theme store
export const currentTheme = writable<GuildTheme>(defaultTheme);

// Central dark mode preference store used across components
export const prefersDark = writable<boolean>(false);

// Storage keys for persistence
const THEME_STORAGE_KEY = 'frolf:theme';
const PREFERS_DARK_KEY = 'frolf:prefers_dark';
const GUILD_ID_KEY = 'frolf:guild_id';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// Apply a GuildTheme to the document as CSS variables (and optionally toggle dark class)
export function applyTheme(theme: GuildTheme, dark = false) {
	if (!isBrowser) return;

	const root = document.documentElement;

	// Colors
	root.style.setProperty('--guild-primary', theme.primary);
	root.style.setProperty('--guild-secondary', theme.secondary);
	root.style.setProperty('--guild-accent', theme.accent);
	root.style.setProperty('--guild-background', theme.background);
	root.style.setProperty('--guild-surface', theme.surface);
	root.style.setProperty('--guild-text', theme.text);
	root.style.setProperty('--guild-text-secondary', theme.textSecondary);
	root.style.setProperty('--guild-border', theme.border);

	// Spacing
	for (const [k, v] of Object.entries(theme.spacing)) {
		root.style.setProperty(`--space-${k}`, v as string);
	}

	// Font sizes
	for (const [k, v] of Object.entries(theme.typography.fontSize)) {
		root.style.setProperty(`--font-size-${k}`, v as string);
	}

	// Font weights
	for (const [k, v] of Object.entries(theme.typography.fontWeight)) {
		root.style.setProperty(`--font-weight-${k}`, v as string);
	}

	// Line heights
	for (const [k, v] of Object.entries(theme.typography.lineHeight)) {
		root.style.setProperty(`--line-height-${k}`, v as string);
	}

	// Border radius
	for (const [k, v] of Object.entries(theme.borderRadius)) {
		root.style.setProperty(`--radius-${k}`, v as string);
	}

	// Shadows
	for (const [k, v] of Object.entries(theme.shadow)) {
		root.style.setProperty(`--shadow-${k}`, v as string);
	}

	if (dark) {
		root.classList.add('dark');
		// remove accidental dark classes on other elements
		try {
			document.querySelectorAll('.dark').forEach((el) => {
				if (el !== root) el.classList.remove('dark');
			});
		} catch {
			void 0;
		}
	} else {
		root.classList.remove('dark');
		// ensure no stray dark classes remain
		try {
			document.querySelectorAll('.dark').forEach((el) => {
				if (el !== root) el.classList.remove('dark');
			});
		} catch {
			void 0;
		}
	}

	// small accessibility hook for consumers
	root.setAttribute('data-guild-theme', theme.primary || 'default');

	// RGB aliases for rgba() usage
	setRgbAliases(theme, dark);

	// Fallback: explicitly set core variables for dark mode so visuals update even if class-based rules fail
	if (dark) {
		// Brand-guided dark tokens
		root.style.setProperty('--guild-background', '#0F0F0F'); // base background
		root.style.setProperty('--guild-surface', '#1A1A1A'); // card surface
		root.style.setProperty('--guild-surface-elevated', '#242424'); // elevated surface
		// Text: Mint Cream as text in dark mode with opacities (90%, 65%, 40%) via rgba
		root.style.setProperty(
			'--guild-text',
			`rgba(${root.style.getPropertyValue('--guild-mint-rgb') || '245,255,250'}, 0.9)`
		);
		root.style.setProperty(
			'--guild-text-secondary',
			`rgba(${root.style.getPropertyValue('--guild-mint-rgb') || '245,255,250'}, 0.65)`
		);
		root.style.setProperty(
			'--guild-text-disabled',
			`rgba(${root.style.getPropertyValue('--guild-mint-rgb') || '245,255,250'}, 0.4)`
		);
		// Borders/dividers: mint at 10% by default; skobeloff 20% available as an alias
		root.style.setProperty(
			'--guild-border',
			`rgba(${root.style.getPropertyValue('--guild-mint-rgb') || '245,255,250'}, 0.10)`
		);
		root.style.setProperty(
			'--guild-primary-20',
			`rgba(${root.style.getPropertyValue('--guild-primary-rgb') || '0,116,116'}, 0.2)`
		);
	} else {
		root.style.setProperty('--guild-background', theme.background);
		root.style.setProperty('--guild-surface', theme.surface);
		root.style.setProperty('--guild-text', theme.text);
		root.style.setProperty('--guild-text-secondary', theme.textSecondary);
		root.style.setProperty('--guild-border', theme.border);

		// Ensure any dark-mode-only aliases are reset so components that
		// rely on e.g. --guild-surface-elevated or --guild-text-disabled
		// don't remain stuck after toggling back to light mode.
		// Use sensible fallbacks based on the current theme tokens / rgb aliases.
		root.style.setProperty('--guild-surface-elevated', theme.surface);
		// text-disabled: use text rgb alias if available
		root.style.setProperty(
			'--guild-text-disabled',
			`rgba(${root.style.getPropertyValue('--guild-text-rgb') || hexToRgbString(theme.text)}, 0.4)`
		);
		// primary-20 alias (used for subtle backgrounds)
		root.style.setProperty(
			'--guild-primary-20',
			`rgba(${root.style.getPropertyValue('--guild-primary-rgb') || hexToRgbString(theme.primary)}, 0.2)`
		);
	}

	// (debug logging removed in production)
}

// setRgbAliases and hexToRgbString are implemented in theme.helpers for testability

// Persist minimal theme (colors + metadata) to localStorage
function persistTheme(theme: GuildTheme) {
	if (!isBrowser) return;
	try {
		const payload = {
			primary: theme.primary,
			secondary: theme.secondary,
			accent: theme.accent,
			background: theme.background,
			surface: theme.surface,
			text: theme.text,
			textSecondary: theme.textSecondary,
			border: theme.border
		};
		window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(payload));
	} catch {
		void 0;
	}
}

// Persist dark preference
function persistPrefersDark(val: boolean) {
	if (!isBrowser) return;
	try {
		window.localStorage.setItem(PREFERS_DARK_KEY, val ? '1' : '0');
	} catch {
		void 0;
	}
}

// Load persisted theme (best-effort) and apply it
function loadPersisted() {
	if (!isBrowser) return;

	// loadPersisted called

	// prefers-color-scheme fallback
	const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');

	// Migrate legacy key 'darkMode' -> 'frolf:prefers_dark' for existing users
	try {
		const legacy = window.localStorage.getItem('darkMode');
		if (legacy !== null) {
			const isDark = legacy === 'true' || legacy === '1';
			prefersDark.set(isDark);
			// persist to new key
			window.localStorage.setItem(PREFERS_DARK_KEY, isDark ? '1' : '0');
			// remove legacy key
			try {
				window.localStorage.removeItem('darkMode');
			} catch {
				void 0;
			}
		} else {
			const persistedDark = window.localStorage.getItem(PREFERS_DARK_KEY);
			if (persistedDark !== null) {
				prefersDark.set(persistedDark === '1');
			} else if (mq && typeof mq.matches === 'boolean') {
				prefersDark.set(!!mq.matches);
			}
		}
	} catch {
		// ignore storage errors and fallback to system pref
		if (mq && typeof mq.matches === 'boolean') prefersDark.set(!!mq.matches);
	}

	// Theme
	const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
	if (raw) {
		try {
			const parsed = JSON.parse(raw);
			// merge into default token set to ensure all tokens exist
			currentTheme.update((cur) => ({ ...cur, ...parsed }));
		} catch {
			void 0;
		}
	}

	// guild id (optional)
	const gid = window.localStorage.getItem(GUILD_ID_KEY);
	if (gid) {
		// if you want to auto-apply a guild mapping on load, uncomment:
		// setGuildTheme(gid);
	}

	// Apply currently-set theme
	let latest: GuildTheme;
	const unsub = currentTheme.subscribe((t) => (latest = t));
	unsub();
	let dark = false;
	const unsub2 = prefersDark.subscribe((d) => (dark = d));
	unsub2();
	applyTheme(latest!, dark);
}

// initialize from storage when in browser
// Idempotent initializer for runtime (call from client entry or ThemeProvider)
let _themeInitialized = false;
export function initTheme() {
	if (!isBrowser) return;
	if (_themeInitialized) return;
	_themeInitialized = true;

	loadPersisted();

	// react to store changes: apply to document & persist
	currentTheme.subscribe((theme) => {
		// apply immediately using current dark flag
		let dark = false;
		const unsub = prefersDark.subscribe((d) => (dark = d));
		unsub();
		applyTheme(theme, dark);
		persistTheme(theme);
	});

	prefersDark.subscribe((v) => {
		persistPrefersDark(!!v);
		// keep DOM class in sync
		if (v) document.documentElement.classList.add('dark');
		else document.documentElement.classList.remove('dark');

		// apply theme with the new dark flag so CSS variables and rgb aliases update
		try {
			const current = get(currentTheme);
			applyTheme(current, !!v);
		} catch {
			void 0;
		}

		// no debug logging
	});

	// Listen to system preference changes and update if user hasn't explicitly set a pref
	try {
		const mql = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = (e: MediaQueryListEvent) => {
			// only change when there's no explicit localStorage pref
			if (window.localStorage.getItem(PREFERS_DARK_KEY) === null) {
				prefersDark.set(e.matches);
			}
		};
		if (mql.addEventListener) {
			mql.addEventListener('change', handler);
		} else {
			// older browsers implement addListener on MediaQueryList
			const mqlCompat = mql as MediaQueryList & {
				addListener?: (cb: (e: MediaQueryListEvent) => void) => void;
			};
			if (typeof mqlCompat.addListener === 'function') {
				mqlCompat.addListener(handler);
			}
		}
	} catch {
		void 0;
	}
}

// Function to set theme by guild ID
export function setGuildTheme(guildId: string) {
	// For mock guilds, use default theme
	if (guildId.startsWith('mock_')) {
		currentTheme.set(defaultTheme);
		return;
	}

	// You could map guild IDs to specific themes here
	// For now, we'll use a simple hash to pick a theme
	const themeKeys = Object.keys(guildThemes);
	const themeIndex =
		guildId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % themeKeys.length;
	const selectedTheme = guildThemes[themeKeys[themeIndex]] || defaultTheme;

	currentTheme.set(selectedTheme);

	// persist guild id mapping
	if (isBrowser) {
		try {
			window.localStorage.setItem(GUILD_ID_KEY, guildId);
		} catch {
			void 0;
		}
	}
}

// Function to set custom theme
export function setCustomTheme(theme: Partial<GuildTheme>) {
	currentTheme.update((current) => ({
		...current,
		...theme
	}));
}

// Reset to default theme
export function resetTheme() {
	currentTheme.set(defaultTheme);
}

// Theme validation function
export function validateTheme(theme: GuildTheme): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	// Check color contrast ratios (WCAG AA standard: 4.5:1 for normal text)
	const getLuminance = (hex: string): number => {
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
	};

	const getContrastRatio = (color1: string, color2: string): number => {
		const lum1 = getLuminance(color1);
		const lum2 = getLuminance(color2);
		const brightest = Math.max(lum1, lum2);
		const darkest = Math.min(lum1, lum2);
		return (brightest + 0.05) / (darkest + 0.05);
	};

	// Validate primary button contrast on surface
	const primaryContrast = getContrastRatio(theme.primary, theme.surface);
	if (primaryContrast < 3) {
		errors.push(
			`Primary color (${theme.primary}) has insufficient contrast (${primaryContrast.toFixed(2)}) on surface (${theme.surface}). Minimum: 3:1`
		);
	}

	// Validate text contrast on background
	const textContrast = getContrastRatio(theme.text, theme.background);
	if (textContrast < 4.5) {
		errors.push(
			`Text color (${theme.text}) has insufficient contrast (${textContrast.toFixed(2)}) on background (${theme.background}). Minimum: 4.5:1`
		);
	}

	// Validate secondary text contrast
	const secondaryTextContrast = getContrastRatio(theme.textSecondary, theme.background);
	if (secondaryTextContrast < 4.5) {
		errors.push(
			`Secondary text color (${theme.textSecondary}) has insufficient contrast (${secondaryTextContrast.toFixed(2)}) on background (${theme.background}). Minimum: 4.5:1`
		);
	}

	// Check for valid hex colors
	const hexRegex = /^#[0-9A-Fa-f]{6}$/;
	const colorFields = [
		'primary',
		'secondary',
		'accent',
		'background',
		'surface',
		'text',
		'textSecondary',
		'border'
	] as const;

	for (const field of colorFields) {
		if (!hexRegex.test(theme[field])) {
			errors.push(`${field} color "${theme[field]}" is not a valid hex color`);
		}
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}
