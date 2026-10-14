/**
 * ARTI AI — initial boot sequence.
 *
 * A short, refined ignition sequence that plays once per page load: the phoenix
 * emblem, the wordmark and a real readiness readout, then a smooth hand-off to
 * the shell. It is a *loading* sequence, not an intro movie — it never gates
 * navigation, never re-plays on client-side route changes, and reduced motion
 * collapses it to a single fade so the operator is not forced to watch motion
 * they asked to avoid.
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { EASE } from '../../motion/tokens';

interface BootProps {
  onDone: () => void;
}

/** Steps are real readiness milestones of this client, not decoration. */
const STEPS = [
  { key: 'shell', label: 'Interface', detail: 'Inter / Orbitron / JetBrains Mono' },
  { key: 'render', label: 'Render core', detail: 'WebGL scene pipeline' },
  { key: 'store', label: 'Local stores', detail: 'Browser-local persistence' },
];

export const AppBootSequence: React.FC<BootProps> = ({ onDone }) => {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (reduced) {
      const t = window.setTimeout(() => {
        if (!done.current) {
          done.current = true;
          onDone();
        }
      }, 260);
      return () => window.clearTimeout(t);
    }
    const total = 1500;
    const per = total / (STEPS.length + 1);
    const timers = STEPS.map((_, i) => window.setTimeout(() => setStep(i + 1), per * (i + 1)));
    const finish = window.setTimeout(() => {
      if (!done.current) {
        done.current = true;
        onDone();
      }
    }, total);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(finish);
    };
  }, [reduced, onDone]);

  const progress = reduced ? 1 : Math.min(1, step / STEPS.length);

  return (
    <motion.div
      className="boot-sequence"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45, ease: EASE.exit } }}
      role="status"
      aria-live="polite"
      aria-label="ARTI AI is starting"
    >
      <div className="boot-grid" aria-hidden="true" />
      <div className="boot-scan" aria-hidden="true" />

      <div className="boot-center">
        <motion.img
          src="/assets/arti_phoenix_logo.jpg"
          alt=""
          className="boot-emblem"
          initial={{ opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE.cinematic }}
        />
        <motion.div
          className="boot-wordmark"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.5, ease: EASE.enter }}
        >
          ARTI AI
        </motion.div>
        <motion.div
          className="boot-tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Autonomous Intelligence
        </motion.div>

        <div className="boot-progress" aria-hidden="true">
          <motion.span
            className="boot-progress-bar"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            transition={{ duration: 0.4, ease: EASE.standard }}
          />
        </div>

        <ul className="boot-steps">
          {STEPS.map((s, i) => (
            <li key={s.key} className={`boot-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
              <span className="boot-step-dot" aria-hidden="true" />
              <span className="boot-step-label">{s.label}</span>
              <span className="boot-step-detail">{s.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export default AppBootSequence;
