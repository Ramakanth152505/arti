/**
 * ARTI AI — the intelligence core backdrop.
 *
 * Places the real Three.js signature scene behind every workspace surface and
 * publishes the live AI status (a small, honest readout) into the top bar, so
 * the operator can always see what the core is doing and why.
 *
 * The state comes from {@link useCoreState}, which derives it from genuine
 * request lifecycles. The core is a background layer: it is `pointer-events:
 * none`, `aria-hidden`, and it never overlaps the composer or any control.
 */
import React from 'react';
import { AiCore } from '../three/AiCore';
import { useComposerComposing, useCoreState } from '../../hooks/useCoreState';

/** Shared status readout. Rendered by the top bar. */
export const AiCoreStatus: React.FC = () => {
  const composing = useComposerComposing();
  const state = useCoreState(composing);
  return (
    <span className="ai-core-status" data-core-state={state} title="Live AI core state">
      <span className="ai-core-status-dot" aria-hidden="true" />
      <span className="ai-core-status-label">{state}</span>
    </span>
  );
};

/** The backdrop itself. One instance per shell, never per workspace. */
export const AiCoreBackdrop: React.FC = () => {
  const composing = useComposerComposing();
  const state = useCoreState(composing);
  return <AiCore state={state} className="ai-core-backdrop" background />;
};

export default AiCoreBackdrop;
