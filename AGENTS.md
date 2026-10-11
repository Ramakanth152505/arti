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

## Responsive architecture

- Stylesheet entry is `src/index.css`; import order is fixed and must stay:
  `typography.css` → `base.css` → `workspaces.css` → `responsive.css`.
  `base.css` holds the original base component rules; `responsive.css` is the
  responsive layer. Base rules must never be re-inlined after the `@import`s or
  they win the equal-specificity cascade and silently break responsive overrides.
- Responsive tokens (`--page-pad-x`, `--content-max-w`, `--mobile-drawer-w`,
  `--touch-target`, fluid `--fs-*` clamps, …) live at the top of
  `responsive.css`. Prefer them over new hardcoded breakpoints.
- Breakpoints: `<=767.98px` phone, `<=1023.98px` overlay-drawer navigation,
  `>=1600px` / `>=1920px` wide-screen content caps.
- JS-only responsive behaviour (drawer, chat sidebar) uses
  `src/hooks/useMediaQuery.ts` (`useIsMobileNav`), which is backed by
  `useSyncExternalStore`. Layout must not depend on resize listeners.
- Every interactive control needs a comfortable target on small screens; the
  `max-width: 767.98px` block guarantees `--touch-target` (44px) regardless of
  the reported pointer type.
- Verify with an emulated cross-device overflow scan (headless Chromium via CDP)
  across the viewport set 320/360/375/390/430/768/820/1024/1280/1366/1440/1920/2560
  for every route; the acceptance bar is zero horizontal overflow.

