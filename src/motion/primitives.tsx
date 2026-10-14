/**
 * ARTI AI — motion primitives.
 *
 * The reusable building blocks every workspace composes instead of writing
 * bespoke animation code. Each one is deliberately small and unopinionated
 * about layout: it only adds motion (transform/opacity) on top of whatever the
 * component renders.
 *
 * Reduced motion is handled centrally by `<MotionConfig reducedMotion="user">`
 * (see `main.tsx`); the few primitives that drive their own animation loop
 * (processing indicator, animated number) additionally check
 * `usePrefersReducedMotion()` so they degrade to a static, honest state.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  type Variants,
} from 'motion/react';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import {
  DUR,
  EASE,
  SPRING,
  messageVariants,
  rise,
  riseScale,
  staggerContainer,
} from './tokens';

/* --------------------------------------------------------------------------
   Page transition
   -------------------------------------------------------------------------- */

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE.enter } },
  exit: { opacity: 0, y: -8, transition: { duration: DUR.fast, ease: EASE.exit } },
};

interface PageTransitionProps {
  /** Identity of the page; a change plays exit → enter. */
  routeKey: string;
  children: React.ReactNode;
}

/**
 * Route-level transition. `mode="wait"` guarantees the outgoing page is gone
 * before the incoming one mounts, so two heavy workspaces are never live at
 * once and the scroll container never keeps a stale height.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ routeKey, children }) => (
  <AnimatePresence mode="wait" initial>
    <motion.div
      key={routeKey}
      className="page-transition"
      variants={pageVariants}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

/* --------------------------------------------------------------------------
   Staggered groups
   -------------------------------------------------------------------------- */

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  /** Play immediately instead of waiting for the element to scroll into view. */
  immediate?: boolean;
  as?: 'div' | 'section' | 'ul' | 'aside' | 'main';
}

/**
 * Container that reveals its {@link StaggerItem} children in sequence.
 * Pass `immediate` for above-the-fold content so the reveal is never gated on
 * an intersection event.
 */
export const Stagger: React.FC<StaggerProps> = ({
  children,
  className,
  stagger,
  delay,
  immediate = false,
  as = 'div',
}) => {
  const Comp = motion[as];
  const viewProps = immediate
    ? { animate: 'show' as const }
    : { whileInView: 'show' as const, viewport: { once: true, amount: 0.15 } };
  return (
    <Comp
      className={className}
      variants={staggerContainer(stagger, delay)}
      initial="hidden"
      {...viewProps}
    >
      {children}
    </Comp>
  );
};

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  as?: 'div' | 'li' | 'section' | 'article';
}

/** A single child of {@link Stagger}. */
export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className,
  variants = riseScale,
  as = 'div',
}) => {
  const Comp = motion[as];
  return (
    <Comp className={className} variants={variants}>
      {children}
    </Comp>
  );
};

/** Scroll-triggered reveal for a single block of content. */
export const Reveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
}> = ({ children, className, delay = 0, immediate = false }) => (
  <motion.div
    className={className}
    initial="hidden"
    animate={immediate ? 'show' : undefined}
    whileInView={immediate ? undefined : 'show'}
    viewport={immediate ? undefined : { once: true, amount: 0.15 }}
    variants={rise}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

/* --------------------------------------------------------------------------
   Interactive controls
   -------------------------------------------------------------------------- */

/**
 * Button with spring press/hover feedback. It renders a real `<button>` (or a
 * supplied element) so semantics, focus order and keyboard behaviour are
 * unchanged — only the visual feedback is animated.
 */
export const MotionButton: React.FC<
  React.ComponentProps<typeof motion.button> & { disableHover?: boolean }
> = ({ children, disableHover = false, ...rest }) => (
  <motion.button
    type="button"
    whileHover={disableHover ? undefined : { y: -1 }}
    whileTap={{ scale: 0.97 }}
    transition={SPRING.snappy}
    {...rest}
  >
    {children}
  </motion.button>
);

/**
 * Subtle magnetic pointer attraction for primary actions on pointer devices.
 * The movement is capped at a few pixels — it reads as weight, never as the
 * control running away from the cursor. Disabled for reduced motion and for
 * touch/coarse pointers, where there is no hover to attract from.
 */
export const Magnetic: React.FC<{
  children: React.ReactNode;
  className?: string;
  strength?: number;
}> = ({ children, className, strength = 0.18 }) => {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING.snappy);
  const sy = useSpring(y, SPRING.snappy);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const apply = () => setEnabled(fine.matches);
    apply();
    fine.addEventListener('change', apply);
    return () => fine.removeEventListener('change', apply);
  }, [reduced]);

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const cap = 6;
      x.set(Math.max(-cap, Math.min(cap, dx * strength)));
      y.set(Math.max(-cap, Math.min(cap, dy * strength)));
    },
    [enabled, strength, x, y]
  );

  const reset = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: sx, y: sy, display: 'inline-flex' }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onBlur={reset}
    >
      {children}
    </motion.div>
  );
};

/* --------------------------------------------------------------------------
   Animated state indicators (all driven by real application state)
   -------------------------------------------------------------------------- */

export type IndicatorState =
  | 'idle'
  | 'queued'
  | 'running'
  | 'waiting'
  | 'complete'
  | 'failed'
  | 'cancelled'
  | 'blocked'
  | 'planned';

const INDICATOR_ACCENT: Record<IndicatorState, string> = {
  idle: 'var(--text-muted)',
  queued: 'var(--text-secondary)',
  running: '#5ec8e6',
  waiting: 'var(--gold-accent)',
  complete: '#5fd39a',
  failed: '#e2706a',
  cancelled: 'var(--text-muted)',
  blocked: '#e0a35c',
  planned: 'var(--text-secondary)',
};

/**
 * Animated status dot. `running` and `waiting` pulse; every other state is a
 * steady, honest colour so a stopped task never looks like it is progressing.
 */
export const StatusDot: React.FC<{ state: IndicatorState; className?: string }> = ({
  state,
  className,
}) => {
  const animated = state === 'running' || state === 'waiting';
  return (
    <span className={`status-dot-wrap ${className || ''}`} data-state={state}>
      <motion.span
        className="status-dot-core"
        style={{ background: INDICATOR_ACCENT[state] }}
        animate={
          animated ? { opacity: [1, 0.35, 1], scale: [1, 0.82, 1] } : { opacity: 1, scale: 1 }
        }
        transition={
          animated
            ? { duration: state === 'waiting' ? 1.6 : 1.1, repeat: Infinity, ease: 'easeInOut' }
            : { duration: DUR.fast }
        }
      />
      {animated && (
        <motion.span
          className="status-dot-halo"
          style={{ borderColor: INDICATOR_ACCENT[state] }}
          animate={{ scale: [1, 2.1], opacity: [0.5, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </span>
  );
};

/**
 * The AI is genuinely waiting on a request. Three orbiting motes around a
 * pulsing core — an honest "in flight" signal, not a decorative loop: the
 * caller only renders it while a real request is pending.
 */
export const ProcessingIndicator: React.FC<{
  label?: string;
  compact?: boolean;
  className?: string;
}> = ({ label = 'Working', compact = false, className }) => {
  const reduced = usePrefersReducedMotion();
  if (reduced) {
    return (
      <span className={`processing-indicator compact-static ${className || ''}`} role="status">
        <span className="processing-static-core" aria-hidden="true" />
        {!compact && <span className="processing-label">{label}…</span>}
      </span>
    );
  }
  return (
    <span className={`processing-indicator ${className || ''}`} role="status" aria-label={label}>
      <span className="processing-orbit" aria-hidden="true">
        <motion.span
          className="processing-mote"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.9, repeat: Infinity, ease: 'linear' }}
        />
        <motion.span
          className="processing-mote mote-2"
          animate={{ rotate: -360 }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
        />
        <motion.span
          className="processing-core"
          animate={{ scale: [0.82, 1.06, 0.82], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </span>
      {!compact && <span className="processing-label">{label}</span>}
    </span>
  );
};

/**
 * Animated numeric readout for **real** recorded values only. It counts to the
 * value it is given; callers must never feed it a fabricated figure.
 */
export const AnimatedNumber: React.FC<{
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}> = ({ value, decimals = 0, suffix = '', className }) => {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(0);
  const mv = useMotionValue(0);

  useEffect(() => {
    // Reduced motion: skip the count-up entirely (the render below already
    // shows the exact value, so no state update is needed).
    if (reduced) return;
    const from = mv.get();
    const start = performance.now();
    const duration = 620;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      mv.set(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const unsubscribe = mv.on('change', (v) => setShown(v));
    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
    };
  }, [value, reduced, mv]);

  if (reduced) {
    return (
      <span className={className}>
        {value.toFixed(decimals)}
        {suffix}
      </span>
    );
  }

  return (
    <span className={className}>
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
};

/* --------------------------------------------------------------------------
   Presence helpers
   -------------------------------------------------------------------------- */

/** Message turn arrival for the shared conversation feed. */
export const MessageTurn: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <motion.div
    className={className}
    variants={messageVariants}
    initial="hidden"
    animate="show"
    layout="position"
  >
    {children}
  </motion.div>
);

/**
 * Wraps a list so additions and removals animate. Used for conversation lists,
 * memory entries, notifications and any other real, store-backed collection.
 */
export const AnimatedList: React.FC<{
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'ul';
}> = ({ children, className, as = 'div' }) => {
  const Comp = motion[as];
  return (
    <Comp className={className} layout="position">
      <AnimatePresence initial={false} mode="popLayout">
        {children}
      </AnimatePresence>
    </Comp>
  );
};
