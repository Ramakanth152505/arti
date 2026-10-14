/**
 * ARTI AI — Music Studio in-component generation indicator.
 *
 * The visual language of the removed boot sequence (drifting grid, scan sweep,
 * orbiting motes) lives here now — but only *inside* the music workspace, and
 * only while a real generation request is running. It is not a background, not
 * full-screen, and it never blocks the composer or any control.
 *
 * It is driven by genuine state: the caller renders it only while a request is
 * in flight, and it is removed on complete, fail or cancel. Stages are shown
 * only when the backend can report or reliably infer them; a provider that
 * cannot report progress gets an honest indeterminate state, never a fabricated
 * percentage.
 */
import React from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { ProcessingIndicator } from '../../motion/primitives';
import { STAGE_LABELS, type GenerationStage } from '../../services/musicGeneration';

export interface GenerationIndicatorProps {
  stage: GenerationStage;
  /** Honest, provider-derived detail line (e.g. "waiting for the bridge"). */
  detail?: string;
  onCancel?: () => void;
  /** Show the cancel control (only when cancellation is genuinely supported). */
  cancellable?: boolean;
}

/**
 * Stages where the indicator is meaningful. `ready`/`failed`/`cancelled` are
 * terminal — the indicator is not rendered for them (the results UI takes over).
 */
const RUNNING_STAGES: GenerationStage[] = ['preparing', 'writing-lyrics', 'generating', 'processing'];

export const GenerationIndicator: React.FC<GenerationIndicatorProps> = ({
  stage,
  detail,
  onCancel,
  cancellable = true,
}) => {
  const reduced = usePrefersReducedMotion();
  if (!RUNNING_STAGES.includes(stage)) return null;

  return (
    <motion.div
      className="music-gen-indicator"
      role="status"
      aria-live="polite"
      data-stage={stage}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: reduced ? 0.001 : 0.28 }}
    >
      <div className="music-gen-ambient" aria-hidden="true">
        <span className="music-gen-grid" />
        <span className="music-gen-scan" />
      </div>

      <div className="music-gen-body">
        <ProcessingIndicator compact label={STAGE_LABELS[stage]} />
        <div className="music-gen-text">
          <span className="music-gen-stage">{STAGE_LABELS[stage]}…</span>
          <span className="music-gen-detail">
            {detail ||
              'Waiting for the connected provider. Progress is indeterminate — the provider does not report a percentage.'}
          </span>
        </div>

        {cancellable && onCancel && (
          <button type="button" className="music-gen-cancel" onClick={onCancel} title="Cancel this generation">
            Cancel
          </button>
        )}
      </div>

      {/* Honest indeterminate bar — no fabricated percentage. */}
      <div className="music-gen-bar" aria-hidden="true">
        <motion.span
          className="music-gen-bar-sweep"
          animate={reduced ? {} : { x: ['-40%', '140%'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  );
};

export default GenerationIndicator;
