# Frolf-Bot Brand Guide (v1)

This file captures the essential pieces of the Frolf-Bot brand as extracted from the design guide in the repo.

## Vision & Identity

Frolf-Bot is your intelligent disc golf companion — smart, approachable, rewarding, and modern-classic.

## Personality Keywords

- Intelligent
- Approachable
- Rewarding
- Modern Classic

## Core Colors (Design Tokens)

- Primary (Skobeloff): `#007474` — UI Hero (primary actions, navigation)
- Secondary (Amethyst): `#8B7BB8` — Brand Hero (highlights, marketing)
- Accent (Satin Sheen Gold): `#CBA135` — Rewarding accents (5-10% usage)
- Background (Mint Cream): `#F5FFFA` — light backgrounds
- Text (Charcoal): `#1A1A1A` — primary typography

## Usage Priorities

1. Skobeloff (#007474) — primary UI actions and navigation
2. Amethyst (#8B7BB8) — secondary actions, highlights
3. Mint (#F5FFFA) — backgrounds (light mode)
4. Charcoal (#1A1A1A) — text, dark-mode base
5. Gold (#CBA135) — celebratory accents (rare)

## Icon & Stroke Guidance (2025 best practice)

- Use `currentColor` in inline SVGs for single-color icons so icons inherit `text-*` classes.
- Standard stroke weight (UI icons): `1.8px - 2px` for 24px icons. Use `stroke-opacity: 1` for clear outlines.
- Multi-part icons may use theme variables (e.g., `var(--guild-primary)`) for specific fills.

## Dark & Light mode

- Use the same token roles. Backgrounds switch to Charcoal in dark mode while maintaining Skobeloff and Amethyst for actionable accents.

## Accessibility & Contrast

- Ensure text has a contrast ratio >= 4.5:1 on the background.
- Primary contrast on actionable elements (buttons) should be at least 3:1 on surface.

## Component Notes

- Buttons: use Skobeloff for primary, Amethyst for secondary/marketing supported buttons.
- Badges: brand accents (Gold) for achievements; statuses use Skobeloff/Amethyst as appropriate.

## Files of record

- `src/lib/stores/theme.ts` — design tokens and available guild themes.

---

Generated from user-provided brand guide and repo tokens.
