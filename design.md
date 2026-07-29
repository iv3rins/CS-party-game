# CS Career Design Direction

## Intent

`cs-career` should feel like an editorial player dossier laid across a tactical operations desk: focused, premium, readable, and a little severe. It is not a SaaS dashboard and not a military simulation. The primary interaction is inspecting a career record, making a consequential choice, and advancing time.

The reference site establishes the rhythm: oversized editorial type, carefully paced sections, sparse panels, and image-led composition. Apply that rhythm without copying its art direction or layout.

## Visual system

- Base: near-black carbon (`#121410`), gunmetal (`#242821`), warm field paper (`#e8e4d8`), and bone (`#f5f1e8`).
- Signals: CS orange (`#e86f2c`) is the primary action and T-side accent; CT cyan (`#4eb5c6`) marks neutral data and stable progress; restrained acid green (`#b6d943`) marks clean/positive outcomes; muted red (`#c6483b`) marks risk.
- Use thin tactical gridlines, a light film-grain texture, map-coordinate labels, and concrete/noise surfaces. Never use floating gradient orbs, glassmorphism, or rounded-card stacks.
- Rectangles have square or 2px corners. Panels use borders and spacing rather than shadows. A hard offset shadow is acceptable for active decision cards only.

## Typography

- Display: `Barlow Condensed`, uppercase for numbers, section labels, and compact headings.
- Text: `Noto Sans SC` for Chinese reading copy.
- Hero title may be large and tightly set, but all operational data and decision copy must remain compact and scannable.
- Use normal letter spacing. Avoid decorative text treatments and prose that explains UI mechanics.

## Layout

- Desktop content is a single vertical dossier, with a fixed top command bar and an asymmetric main grid.
- The left rail contains the active identity and career timeline. The main column carries season status and the current decision. The right column shows four core tracks and current contract.
- Avoid nesting cards. Treat panels as bordered portions of a shared surface.
- On narrow screens, collapse the three columns into a vertical reading order: identity/status, decision, four tracks, season archive.

## Core screens and states

1. Entry: a full-bleed tactical dossier cover with game title, seed field, pace selector, origin cards, and role selector.
2. Active career: current season, player dossier, one highlighted decision, track meters, contract, and recent season archive.
3. Season report: after a decision, show compact results and a clear advance command. Do not auto-advance over important outcomes.
4. Retirement: immutable dossier of career statistics, title, honors, key choices, and a fresh-start command.
5. Empty/loading/error states: maintain the dossier structure and make recovery explicit.

## Interaction principles

- Decisions are buttons with visible short-term deltas; a choice is selected once and cannot be reversed.
- Color never carries meaning alone. Use labels, signs, and values.
- Use familiar icon-only controls for navigation, sound, and reset; show tooltips or accessible labels.
- Keep keyboard focus visible. Respect reduced-motion preferences.
