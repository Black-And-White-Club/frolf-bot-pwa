/**
 * Theme system for configurable guild colors
 * Allows each guild to have their own color scheme
 */

import { writable, get } from 'svelte/store';
import { hexToRgbString, setRgbAliases } from './theme.helpers';

// re-export helpers so older imports that referenced these from `theme` continue to work
export { hexToRgbString, setRgbAliases };
export { validateTheme } from './theme.validation';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

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
		xs: string;
		sm: string;
		md: string;
		lg: string;
		xl: string;
		xxl: string;
	};

	// Typography scale
	typography: {
		fontSize: {
			xs: string;
			sm: string;
			base: string;
			lg: string;
			xl: string;
			xxl: string;
			xxxl: string;
		};
		fontWeight: {
			normal: string;
			medium: string;
			semibold: string;
			bold: string;
		};
		lineHeight: {
			tight: string;
			normal: string;
			relaxed: string;
		};
	};

	// Border radius scale
	borderRadius: {
		sm: string;
		md: string;
		lg: string;
		xl: string;
		full: string;
	};

	// Shadows
	shadow: {
		sm: string;
		md: string;
		lg: string;
		xl: string;
	};
}

interface ColorTheme {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
	surface: string;
	text: string;
	textSecondary: string;
	border: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
	THEME: 'frolf:theme',
	PREFERS_DARK: 'frolf:prefers_dark',
	GUILD_ID: 'frolf:guild_id'
} as const;

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// Shared design tokens across all themes
const SHARED_DESIGN_TOKENS = {
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
} as const;

// Color-only theme definitions
const COLOR_THEMES: Record<string, ColorTheme> = {
	default: {
		primary: '#007474', // Skobeloff
		secondary: '#8B7BB8', // Amethyst
		accent: '#CBA135', // Satin Sheen Gold
		background: '#F5FFFA', // Mint Cream
		surface: '#ffffff',
		text: '#1A1A1A',
		textSecondary: '#64748b',
		border: '#e2e8f0'
	},
	forest: {
		primary: '#16a34a',
		secondary: '#059669',
		accent: '#0d9488',
		background: '#f0fdf4',
		surface: '#ffffff',
		text: '#14532d',
		textSecondary: '#166534',
		border: '#bbf7d0'
	},
	ocean: {
		primary: '#0369a1',
		secondary: '#0284c7',
		accent: '#0891b2',
		background: '#f0f9ff',
		surface: '#ffffff',
		text: '#0c4a6e',
		textSecondary: '#075985',
		border: '#bae6fd'
	},
	sunset: {
		primary: '#dc2626',
		secondary: '#ea580c',
		accent: '#c2410c',
		background: '#fef2f2',
		surface: '#ffffff',
		text: '#991b1b',
		textSecondary: '#c2410c',
		border: '#fecaca'
	},
	purple: {
		primary: '#7c3aed',
		secondary: '#8b5cf6',
		accent: '#a855f7',
		background: '#faf5ff',
		surface: '#ffffff',
		text: '#581c87',
		textSecondary: '#6d28d9',
		border: '#ddd6fe'
	}
};

// ============================================================================
// THEME CONSTRUCTION
// ============================================================================

function createTheme(colors: ColorTheme): GuildTheme {
	return { ...colors, ...SHARED_DESIGN_TOKENS };
}

export const defaultTheme: GuildTheme = createTheme(COLOR_THEMES.default);

export const guildThemes: Record<string, GuildTheme> = Object.fromEntries(
	Object.entries(COLOR_THEMES).map(([key, colors]) => [key, createTheme(colors)])
);

// Export a small map of status colors for use by components (shared brand tokens)
export const STATUS_COLORS: Record<string, string> = {
	active: COLOR_THEMES.default.primary,
	completed: COLOR_THEMES.default.accent,
	scheduled: COLOR_THEMES.default.secondary,
	cancelled: '#1A1A1A',
	default: '#A1A1AA'
};

// ============================================================================
// STORES
// ============================================================================

export const currentTheme = writable<GuildTheme>(defaultTheme);
export const prefersDark = writable<boolean>(false);

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

const storage = {
	get: (key: string): string | null => {
		if (!isBrowser) return null;
		try {
			return window.localStorage.getItem(key);
		} catch {
			return null;
		}
	},

	set: (key: string, value: string): void => {
		if (!isBrowser) return;
		try {
			window.localStorage.setItem(key, value);
		} catch {
			void 0;
		}
	},

	getJSON: <T>(key: string): T | null => {
		const val = storage.get(key);
		if (!val) return null;
		try {
			return JSON.parse(val) as T;
		} catch {
			return null;
		}
	},

	remove: (key: string): void => {
		if (!isBrowser) return;
		try {
			window.localStorage.removeItem(key);
		} catch {
			void 0;
		}
	}
};

// ============================================================================
// THEME APPLICATION
// ============================================================================

function setNestedProperties(root: HTMLElement, prefix: string, obj: Record<string, unknown>) {
	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'object' && value !== null) {
			setNestedProperties(root, `${prefix}${key}-`, value as Record<string, unknown>);
		} else {
			root.style.setProperty(`${prefix}${key}`, value as string);
		}
	}
}

function removeStrayDarkClasses() {
	if (!isBrowser) return;
	try {
		const root = document.documentElement;
		document.querySelectorAll('.dark').forEach((el) => {
			if (el !== root) el.classList.remove('dark');
		});
	} catch {
		void 0;
	}
}

function applyDarkModeVariables(root: HTMLElement) {
	const mintRgb = root.style.getPropertyValue('--guild-mint-rgb') || '245,255,250';
	const primaryRgb = root.style.getPropertyValue('--guild-primary-rgb') || '0,116,116';

	const darkVars = {
		'--guild-background': '#0F0F0F',
		'--guild-surface': '#1A1A1A',
		'--guild-surface-elevated': '#242424',
		// Use the same mint/cream used for the light-mode background for dark-mode text
		// This ensures the pale mint tone matches the light-mode background color
		'--guild-text': defaultTheme.background,
		'--guild-text-secondary': `rgba(${mintRgb}, 0.66)`,
		'--guild-text-disabled': `rgba(${mintRgb}, 0.40)`,
		'--guild-border': `rgba(${mintRgb}, 0.10)`,
		'--guild-primary-20': `rgba(${primaryRgb}, 0.2)`
	};

	Object.entries(darkVars).forEach(([prop, val]) => {
		root.style.setProperty(prop, val);
	});
}

function applyLightModeVariables(root: HTMLElement, theme: GuildTheme) {
	const textRgb = root.style.getPropertyValue('--guild-text-rgb') || hexToRgbString(theme.text);
	const primaryRgb =
		root.style.getPropertyValue('--guild-primary-rgb') || hexToRgbString(theme.primary);

	const lightVars = {
		'--guild-background': theme.background,
		'--guild-surface': theme.surface,
		'--guild-text': theme.text,
		'--guild-text-secondary': theme.textSecondary,
		'--guild-border': theme.border,
		'--guild-surface-elevated': theme.surface,
		'--guild-text-disabled': `rgba(${textRgb}, 0.4)`,
		'--guild-primary-20': `rgba(${primaryRgb}, 0.2)`
	};

	Object.entries(lightVars).forEach(([prop, val]) => {
		root.style.setProperty(prop, val);
	});
}

export function applyTheme(theme: GuildTheme, dark = false) {
	if (!isBrowser) return;

	const root = document.documentElement;

	// Apply base color tokens
	const colorKeys: (keyof ColorTheme)[] = [
		'primary',
		'secondary',
		'accent',
		'background',
		'surface',
		'text',
		'textSecondary',
		'border'
	];
	colorKeys.forEach((key) => {
		root.style.setProperty(`--guild-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, theme[key]);
	});

	// Apply design tokens
	setNestedProperties(root, '--space-', theme.spacing);
	setNestedProperties(root, '--font-size-', theme.typography.fontSize);
	setNestedProperties(root, '--font-weight-', theme.typography.fontWeight);
	setNestedProperties(root, '--line-height-', theme.typography.lineHeight);
	setNestedProperties(root, '--radius-', theme.borderRadius);
	setNestedProperties(root, '--shadow-', theme.shadow);

	// Handle dark mode class
	root.classList.toggle('dark', dark);
	removeStrayDarkClasses();

	// Accessibility attribute
	root.setAttribute('data-guild-theme', theme.primary || 'default');

	// RGB aliases for rgba() usage
	setRgbAliases(theme, dark);

	// Apply mode-specific variables
	if (dark) {
		applyDarkModeVariables(root);
	} else {
		applyLightModeVariables(root, theme);
	}
}

// ============================================================================
// PERSISTENCE
// ============================================================================

function persistTheme(theme: GuildTheme) {
	if (!isBrowser) return;

	const colorKeys: (keyof ColorTheme)[] = [
		'primary',
		'secondary',
		'accent',
		'background',
		'surface',
		'text',
		'textSecondary',
		'border'
	];
	const payload = Object.fromEntries(colorKeys.map((key) => [key, theme[key]]));

	storage.set(STORAGE_KEYS.THEME, JSON.stringify(payload));
}

function persistPrefersDark(val: boolean) {
	storage.set(STORAGE_KEYS.PREFERS_DARK, val ? '1' : '0');
}

function loadPrefersDark(): boolean {
	// Check persistent preference
	const stored = storage.get(STORAGE_KEYS.PREFERS_DARK);
	if (stored !== null) {
		return stored === '1';
	}

	// Fall back to system preference
	if (isBrowser) {
		const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
		return mq?.matches ?? false;
	}

	return false;
}

function loadThemeFromStorage() {
	const stored = storage.getJSON<Partial<GuildTheme>>(STORAGE_KEYS.THEME);
	if (stored) {
		currentTheme.update((cur) => ({ ...cur, ...stored }));
	}
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function getCurrentValues() {
	return {
		theme: get(currentTheme),
		dark: get(prefersDark)
	};
}

function setupThemeReactivity() {
	currentTheme.subscribe((theme) => {
		const { dark } = getCurrentValues();
		applyTheme(theme, dark);
		persistTheme(theme);
	});

	prefersDark.subscribe((dark) => {
		persistPrefersDark(dark);

		if (isBrowser) {
			document.documentElement.classList.toggle('dark', dark);
		}

		const { theme } = getCurrentValues();
		applyTheme(theme, dark);
	});
}

function setupSystemPreferenceListener() {
	if (!isBrowser) return;

	try {
		const mql = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = (e: MediaQueryListEvent) => {
			// Only change if user hasn't explicitly set a preference
			if (storage.get(STORAGE_KEYS.PREFERS_DARK) === null) {
				prefersDark.set(e.matches);
			}
		};
		if (mql.addEventListener) {
			mql.addEventListener('change', handler);
		}
	} catch {
		void 0;
	}
}

let _themeInitialized = false;

export function initTheme() {
	if (!isBrowser || _themeInitialized) return;
	_themeInitialized = true;

	// Load persisted state
	loadThemeFromStorage();
	const isDark = loadPrefersDark();
	prefersDark.set(isDark);

	// Apply initial theme
	const { theme, dark } = getCurrentValues();
	applyTheme(theme, dark);

	// Setup reactive updates
	setupThemeReactivity();
	setupSystemPreferenceListener();
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function setGuildTheme(guildId: string) {
	// For mock guilds, use default theme
	if (guildId.startsWith('mock_')) {
		currentTheme.set(defaultTheme);
		return;
	}

	// Hash guild ID to select a theme
	const themeKeys = Object.keys(guildThemes).filter((k) => k !== 'default');
	const hash = guildId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
	const themeIndex = hash % themeKeys.length;
	const selectedTheme = guildThemes[themeKeys[themeIndex]] || defaultTheme;

	currentTheme.set(selectedTheme);
	storage.set(STORAGE_KEYS.GUILD_ID, guildId);
}

export function setCustomTheme(theme: Partial<GuildTheme>) {
	currentTheme.update((current) => ({ ...current, ...theme }));
}

export function resetTheme() {
	currentTheme.set(defaultTheme);
}
