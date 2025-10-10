# Test ID Conventions & Inventory

This file documents the `data-testid` naming conventions used across the app and an inventory of the test IDs added so far.

## Naming conventions

- Buttons: `btn-<area>-<action>`
  - `btn-signin`, `btn-signin-discord`, `btn-signout`, `btn-view-all`, `btn-view-profile`
- Cards: `card-<type>-<id>` or `round-card-<round_id>`
- Status / Badge: `status-<id>` (e.g., `status-<round_id>`)
- Titles / Headings: `round-title-<round_id>`
- Toggles: `theme-toggle-header`, `theme-toggle-guest` (already in `ThemeToggle` component)
- Buttons inside cards: `btn-add-calendar-<round_id>`

## Test IDs added (inventory)

Additional RoundCard child hooks (added by RoundCard forwarding):

Forms & primary action hooks:

Page-level hooks:

Dashboard component hooks:

- `leaderboard-main` (Leaderboard container on dashboard)
- `userprofile-current` (Current user's profile card)
  Primary action hooks on auth pages:
- `btn-try-signin` (Try Again anchor on auth error page)

### Story / Dev Test IDs added

- `btn-login` (story Header login button)
- `btn-signup` (story Header signup button)
- `btn-logout` (story Header logout button)
- `scorecard-1-underpar`, `scorecard-2-overpar`, `scorecard-3-evenpar`, `scorecard-4-birdie`, `scorecard-5-eagle`, `scorecard-6-bogey`, `scorecard-7-doublebogey`, `scorecard-8-holeinone` (ScoreCard story IDs)
- `round-card-round_123`, `round-card-round_123-compact`, `round-card-round_123-nostatus` (RoundCard story IDs)
- `btn-logout` (story header log out)

## Recommendations

- Add `testid` prop to any reusable component that renders a DOM element (Button already supports `testid`).
- For input-heavy screens (forms), add `input-<form>-<field>` ids for each field.
- Avoid dynamic testids that change on every run; prefer stable identifiers derived from entity IDs.

## Example selectors (Cypress / Playwright)

- cy.get('[data-testid="btn-signin-discord"]').click();
- cy.get('[data-testid="round-card-abc123"]').within(() => { cy.get('[data-testid="btn-add-calendar-abc123"]').click() })

## Icon test IDs

- Convention: `icon-<name>` where `<name>` is a short kebab-case identifier for the icon's role.
  - Examples added in this change:
    - `icon-github`
    - `icon-discord`
    - `icon-youtube`
    - `icon-tutorials`
    - `stat-icon-active-rounds`
    - `stat-icon-scheduled`
    - `stat-icon-completed`
    - `stat-icon-total-players`

- Guidance: prefer `icon-<role>` instead of `icon-<component>` for stable selectors. If the same icon appears in multiple contexts, include the context (e.g., `icon-github-header`).
