/**
 * ARTI AI — live execution timeline.
 *
 * A real, animated record of the operations currently running (and those that
 * just settled). Every entry comes from {@link activityStore}, which is written
 * by genuine request lifecycles — so a row can only exist because work really
 * happened, and its outcome is the outcome that really occurred.
 *
 * States rendered: running (indeterminate or real progress), complete, failed,
 * blocked and cancelled. A row with no real progress value renders an
 * indeterminate sweep rather than a fabricated percentage.
 */
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Activity, CheckCircle2, AlertTriangle, Ban, X, ChevronDown } from 'lucide-react';
import {
  activityStore,
  useActivityStore,
  type ActivityOutcome,
  type ActivityRecord,
} from '../../services/activityStore';
import { StatusDot, type IndicatorState } from '../../motion/primitives';
import { DUR, EASE, SPRING } from '../../motion/tokens';

const OUTCOME_META: Record<ActivityOutcome, { label: string; indicator: IndicatorState; icon: React.ReactNode }> = {
  running: { label: 'Running', indicator: 'running', icon: <Activity size={13} /> },
  complete: { label: 'Complete', indicator: 'complete', icon: <CheckCircle2 size={13} /> },
  failed: { label: 'Failed', indicator: 'failed', icon: <AlertTriangle size={13} /> },
  blocked: { label: 'Blocked', indicator: 'blocked', icon: <Ban size={13} /> },
  cancelled: { label: 'Cancelled', indicator: 'cancelled', icon: <X size={13} /> },
};

const relative = (from: number) => {
  const s = Math.max(0, Math.round((Date.now() - from) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return `${m}m ago`;
};

/** Live "elapsed" readout for a genuinely running operation. */
const Elapsed: React.FC<{ from: number }> = ({ from }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const s = Math.max(0, Math.round((now - from) / 1000));
  return <span className="timeline-row-elapsed">{s}s</span>;
};

const TimelineRow: React.FC<{ record: ActivityRecord }> = ({ record }) => {
  const meta = OUTCOME_META[record.outcome];
  return (
    <motion.li
      layout="position"
      className={`timeline-row outcome-${record.outcome}`}
      initial={{ opacity: 0, x: 24, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={SPRING.gentle}
    >
      <span className="timeline-row-icon" data-state={record.outcome} aria-hidden="true">
        {meta.icon}
      </span>
      <div className="timeline-row-body">
        <div className="timeline-row-head">
          <span className="timeline-row-label">{record.label}</span>
          <span className="timeline-row-kind">{record.kind}</span>
        </div>
        <div className="timeline-row-meta">
          <StatusDot state={meta.indicator} />
          <span className="timeline-row-status">{meta.label}</span>
          {record.outcome === 'running' ? (
            <Elapsed from={record.startedAt} />
          ) : (
            <span className="timeline-row-time">{relative(record.startedAt)}</span>
          )}
        </div>
        {record.outcome === 'running' && (
          <div className={`timeline-progress ${record.progress === null ? 'indeterminate' : ''}`}>
            {record.progress === null ? (
              <motion.span
                className="timeline-progress-sweep"
                animate={{ x: ['-40%', '140%'] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
              />
            ) : (
              <motion.span
                className="timeline-progress-fill"
                animate={{ scaleX: record.progress }}
                transition={{ duration: DUR.base, ease: EASE.standard }}
                style={{ transformOrigin: 'left center' }}
              />
            )}
          </div>
        )}
        {record.detail && record.outcome !== 'running' && (
          <p className="timeline-row-detail">{record.detail}</p>
        )}
      </div>
      {record.outcome !== 'running' && (
        <button
          type="button"
          className="timeline-row-dismiss"
          onClick={() => activityStore.dismiss(record.id)}
          aria-label={`Dismiss ${record.label}`}
        >
          <X size={12} />
        </button>
      )}
    </motion.li>
  );
};

export const ExecutionTimeline: React.FC = () => {
  const { records } = useActivityStore();
  const [open, setOpen] = useState(false);

  const running = records.filter((r) => r.outcome === 'running').length;
  const settled = records.length - running;

  // Nothing has ever run: show the panel collapsed and empty rather than
  // inventing activity.
  if (records.length === 0) {
    return (
      <div className="execution-timeline empty" aria-live="polite">
        <div className="timeline-head">
          <span className="timeline-title">
            <Activity size={13} aria-hidden="true" /> Execution
          </span>
          <span className="timeline-summary">Idle — no operations running</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`execution-timeline ${open ? 'open' : 'collapsed'}`} aria-live="polite">
      <button
        type="button"
        className="timeline-head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="timeline-title">
          <Activity size={13} aria-hidden="true" /> Execution
        </span>
        <span className="timeline-summary">
          {running > 0 ? (
            <>
              <StatusDot state="running" /> {running} running
            </>
          ) : (
            `${settled} settled`
          )}
        </span>
        <motion.span className="timeline-chevron" animate={{ rotate: open ? 180 : 0 }} transition={SPRING.snappy}>
          <ChevronDown size={13} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="timeline-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DUR.base, ease: EASE.standard }}
          >
            <ul className="timeline-list">
              <AnimatePresence initial={false} mode="popLayout">
                {records.map((r) => (
                  <TimelineRow key={r.id} record={r} />
                ))}
              </AnimatePresence>
            </ul>
            {settled > 0 && (
              <button
                type="button"
                className="timeline-clear-btn"
                onClick={() => activityStore.clearSettled()}
              >
                Clear settled
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExecutionTimeline;
