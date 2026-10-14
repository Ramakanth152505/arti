/**
 * ARTI AI — MOTION DESIGN SYSTEM (single source of truth).
 *
 * Every duration, easing curve, spring and stagger timing used anywhere in the
 * interface is declared here. Components reference these tokens (or the shared
 * primitives in `./primitives`) instead of inventing local timings, so the
 * whole product moves at one rhythm and the motion language stays coherent.
 *
 * Reduced motion is honoured in three complementary layers:
 *   1. `<MotionConfig reducedMotion="user">` in `main.tsx` — Motion then drops
 *      transform/layout animation for users who asked for less movement.
 *   2. `useReducedMotion()` inside the 3D scene — camera drift and idle
 *      rotation are stopped, not merely shortened.
 *   3. The `@media (prefers-reduced-motion: reduce)` blocks in
 *      `styles/motion.css`, which neutralise the CSS keyframes.
 *
 * Durations are intentionally short. The product must stay fast to use: motion
 * supports hierarchy and feedback, it never delays the operator.
 */
import type { Transition, Variants } from 'motion/react';

/** Cubic-bezier tuple, accepted directly by Motion as an `ease`. */
type Bezier = [number, number, number, number];

/** Named durations (seconds). */
export const DUR = {
  /** State flips that must feel instant (toggle, active dot). */
  instant: 0.1,
  /** Micro-interactions: hover, press, small fades. */
  fast: 0.18,
  /** Standard component transition: panels, menus, list items. */
  base: 0.3,
  /** Larger surfaces: page content, dialogs, drawers. */
  slow: 0.5,
  /** Ambient / cinematic sequences only. */
  cinematic: 0.8,
} as const;

/** Named easing curves. */
export const EASE = {
  /** Symmetric in/out — the default for interface transitions. */
  standard: [0.4, 0, 0.2, 1] as Bezier,
  /** Fast start, long settle — entrances. */
  enter: [0.16, 1, 0.3, 1] as Bezier,
  /** Slow start, quick finish — exits. */
  exit: [0.4, 0, 1, 1] as Bezier,
  /** Long, luxurious settle — hero / cinematic reveals. */
  cinematic: [0.22, 1, 0.36, 1] as Bezier,
} as const;

/** Spring presets. Prefer springs over curves for anything the pointer drives. */
export const SPRING = {
  /** Pointer feedback: hover, press, toggle. */
  snappy: { type: 'spring', stiffness: 340, damping: 28, mass: 0.7 } as Transition,
  /** Component arrival: cards, messages, panels. */
  gentle: { type: 'spring', stiffness: 170, damping: 22, mass: 0.9 } as Transition,
  /** Large surfaces: drawers, dialogs, sheets. */
  soft: { type: 'spring', stiffness: 110, damping: 20, mass: 1 } as Transition,
} as const;

/** Stagger steps (seconds) between siblings in a list or grid. */
export const STAGGER = {
  tight: 0.035,
  base: 0.06,
  loose: 0.1,
} as const;

/* --------------------------------------------------------------------------
   Reusable variants
   -------------------------------------------------------------------------- */

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE.standard } },
};

/** The default content arrival: a short rise with a fade. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE.enter } },
};

/** Cards and tiles: rise plus a touch of scale, settled on a spring. */
export const riseScale: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING.gentle,
  },
};

/** Sideways arrival, used for side panels and inspectors. */
export const slideIn: Variants = {
  hidden: { opacity: 0, x: 18 },
  show: { opacity: 1, x: 0, transition: { duration: DUR.slow, ease: EASE.enter } },
};

/** Staggered container. `hidden` is empty so children own their own variants. */
export function staggerContainer(stagger: number = STAGGER.base, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren } },
  };
}

/* ---- Overlays ------------------------------------------------------------ */

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.fast, ease: EASE.standard } },
  exit: { opacity: 0, transition: { duration: DUR.fast, ease: EASE.exit } },
};

export const dialogVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRING.gentle },
  exit: { opacity: 0, y: 10, scale: 0.98, transition: { duration: DUR.fast, ease: EASE.exit } },
};

export const drawerVariants: Variants = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: SPRING.soft },
  exit: { opacity: 0, x: 32, transition: { duration: DUR.fast, ease: EASE.exit } },
};

export const sheetUpVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: SPRING.soft },
  exit: { opacity: 0, y: 20, transition: { duration: DUR.fast, ease: EASE.exit } },
};

/** Dropdown / popover / context menu. */
export const menuVariants: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.fast, ease: EASE.enter } },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: DUR.instant, ease: EASE.exit } },
};

/** Toast / notification card. */
export const toastVariants: Variants = {
  hidden: { opacity: 0, x: 28, scale: 0.97 },
  show: { opacity: 1, x: 0, scale: 1, transition: SPRING.gentle },
  exit: { opacity: 0, x: 24, scale: 0.98, transition: { duration: DUR.fast, ease: EASE.exit } },
};

/** Single message turn arriving in the conversation feed. */
export const messageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.enter } },
};
