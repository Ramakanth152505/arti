/**
 * ARTI AI — AI Core mount.
 *
 * Responsibilities kept out of the scene itself:
 *   - lazy-loads the Three.js bundle so it never blocks first paint or the
 *     shell's critical path (the scene is a separate chunk);
 *   - probes WebGL once and renders an honest static fallback when it is
 *     unavailable, instead of an empty canvas;
 *   - pauses rendering while the tab is hidden so a backgrounded ARTI does not
 *     keep a GPU busy.
 */
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { hasWebGL } from './webgl';
import type { CoreState } from './AiCoreScene';

const AiCoreScene = lazy(() => import('./AiCoreScene'));

export type { CoreState };

export interface AiCoreProps {
  state: CoreState;
  className?: string;
  /** Accessible description of what the core is currently showing. */
  label?: string;
  /**
   * Render as a non-interactive ambient backdrop. The canvas is already
   * `pointer-events: none`; this additionally removes it from the accessibility
   * tree and from the tab order, which is what a background layer needs.
   */
  background?: boolean;
}

const STATE_LABEL: Record<CoreState, string> = {
  idle: 'Idle',
  listening: 'Listening',
  processing: 'Processing request',
  streaming: 'Response ready',
  tool: 'Executing tool',
  error: 'Request failed',
};

/** Static emblem shown when WebGL is unavailable — no fake animation. */
const StaticCore: React.FC<{ state: CoreState }> = ({ state }) => (
  <div className="ai-core-fallback" data-core-state={state} role="img" aria-label="ARTI AI core (static)">
    <span className="ai-core-fallback-ring ring-outer" />
    <span className="ai-core-fallback-ring ring-inner" />
    <span className="ai-core-fallback-core" />
  </div>
);

export const AiCore: React.FC<AiCoreProps> = ({ state, className, label, background = false }) => {
  const [supported] = useState(() => hasWebGL());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const described = label ?? STATE_LABEL[state];
  const a11y = background
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': `ARTI AI intelligence core — ${described}` };

  return (
    <div className={`ai-core-mount ${className || ''}`} data-core-state={state} {...a11y}>
      {!supported || !visible ? (
        <StaticCore state={state} />
      ) : (
        <Suspense fallback={<StaticCore state={state} />}>
          <AiCoreScene state={state} />
        </Suspense>
      )}
      {!background && (
        <span className="ai-core-state-tag" aria-hidden="true">
          {described}
        </span>
      )}
    </div>
  );
};

export default AiCore;
