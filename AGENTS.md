# ARTI AI — Project Instructions

## Typography (permanent)

**RONALDSON GOTHIC IS THE PERMANENT DEFAULT TYPEFACE FOR ALL ARTI AI UI.**
Every new or modified page and component must use the established global
typography tokens. No alternative ordinary UI font may be introduced without
the owner's explicit approval.

- Single source of truth: `--font-primary` in `src/styles/typography.css`.
  Use `var(--font-primary)`, or the legacy aliases `var(--font-sans)` /
  `var(--font-serif)` which resolve to it. Prefer the semantic utility classes
  (`.t-hero`, `.t-page-title`, `.t-h2`…`.t-h5`, `.t-body`, `.t-label`,
  `.t-caption`).
- Never hardcode a `font-family` with a named unrelated family, and never add a
  `<link>`/`@import` to an external font provider.
- Verified weights are only 300 (Light) and 400 (Regular). Use the
  `--fw-*` tokens; do not request other weights.
- `var(--font-mono)` is allowed only for genuine code editors / code blocks,
  never for ordinary interface text.
- Ronaldson Gothic covers Latin + Latin Extended. Telugu/Devanagari are not
  covered and fall back to the system font; that fallback must never become
  the default for ordinary UI text.
- Enforce with `npm run check:typography` (also runs as part of `npm run lint`).

## Build / verify

- `npm run build` — `tsc -b && vite build` must pass.
- `npm run lint` — `oxlint` + typography policy check must pass.

## Honesty rules

- Never present fabricated data as real. Demo/sample content must be labelled
  (see `DemoDataNotice`) or persisted locally via `useWorkspaceData`
  (localStorage, local-first).
