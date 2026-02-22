# Frolf-Bot Brand Design Guide (v0.4 - 2026 Refresh)

## Vision and Identity

Frolf-Bot is a high-performance, event-driven companion for the modern disc golfer. It bridges Classic Sporting Heritage and High-Frequency Tech. The v0.4 refresh shifts away from standard dark mode into an atmospheric, tactile experience.

## Brand Personality Keywords

- Atmospheric: immersive, deep, and grounded in nature.
- Tactile: interfaces feel like liquid glass or polished stone.
- Kinetic: subtle motion that responds to live data.
- Modern Classic: confident serif typography paired with fast, technical UI behavior.

## Core Color System (2026 Obsidian Forest Edition)

### Foundation (Backgrounds)

- Obsidian Forest `#081212`
- Role: default dark base across the app.
- Usage: global app background; replaces `#1A1A1A` as dark foundation.

### Hero (Primary Action)

- Liquid Skobeloff `#007474`
- Role: primary action anchor.
- Usage rule: never flat-fill primary action blocks.
- Gradient recipe: `#008B8B -> #007474` top-down linear gradient for subtle glass depth.

### Energy (Secondary and Live Highlights)

- Amethyst Aura `#8B7BB8`
- Role: live-state indicators and energy pulses.
- Usage: active NATS stream indicators and PWA syncing states.
- Effect: pair with approximately 15px blur glow for active emphasis.

### Prestige (Accents)

- Matte Heritage Gold `#B89B5E`
- Role: celebration moments and premium accents.
- Gradient recipe: `#B89B5E 45% -> #7C6B3C 100%`.
- Usage: brushed metal, never glossy metallic.

## Typography (Classic Bridge)

### Display and Headlines

- Font: Fraunces (variable serif).
- Weight target: soft 700.
- Usage: major headings, round summaries, key totals.

### Functional UI and Data

- Font: Space Grotesk.
- Usage: controls, labels, data-heavy views, event logs.

## Interaction Design (EDA Style)

### Reactive States

- When JetStream events land, apply subtle kinetic typography (small scale pulse) to indicate fresh data.

### Liquid Surfaces

- Cards and elevated surfaces should use a 1px Skobeloff border at 20% opacity.
- Surfaces should read as floating layers against Obsidian Forest.

## Implementation Notes

- Prefer tokenized CSS variables over hard-coded color values.
- Preserve contrast and readability for all foreground/background pairings.
- Keep motion meaningful and state-driven, not ornamental.
