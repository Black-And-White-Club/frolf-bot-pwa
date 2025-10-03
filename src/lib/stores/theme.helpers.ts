/* Helper utilities for theme store (pure functions or small DOM helpers) */
import type { GuildTheme } from './theme';

// helper: convert #RRGGBB to "r, g, b" for rgba(var(--x-rgb), a)
export function hexToRgbString(hex: string): string {
  // accept #RRGGBB
  if (!hex || hex[0] !== '#' || hex.length !== 7) return '0, 0, 0';
  const num = parseInt(hex.slice(1), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `${r}, ${g}, ${b}`;
}

export function setRgbAliases(theme: GuildTheme) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--guild-primary-rgb', hexToRgbString(theme.primary));
  root.style.setProperty('--guild-secondary-rgb', hexToRgbString(theme.secondary));
  root.style.setProperty('--guild-accent-rgb', hexToRgbString(theme.accent));
  root.style.setProperty('--guild-text-rgb', hexToRgbString(theme.text));
  root.style.setProperty('--guild-text-secondary-rgb', hexToRgbString(theme.textSecondary));
  root.style.setProperty('--guild-surface-rgb', hexToRgbString(theme.surface));
  // mint cream alias (background in light mode, accents/text in dark mode)
  root.style.setProperty('--guild-mint-rgb', hexToRgbString(theme.background));
}

export default {};
