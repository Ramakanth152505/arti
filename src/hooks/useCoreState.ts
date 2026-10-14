/**
 * ARTI AI — the AI core state resolver.
 *
 * Derives the visual state of the 3D signature element from *real* application
 * state, in one place, so every surface that hosts the core agrees on what it
 * is showing. There is no timer and no simulated thinking: the core reports
 * "processing" only while a request is genuinely in flight, "streaming" only
 * after a reply actually arrived, and "error" only after a real failure.
 */
import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../services/chatStore';
import { activityStore, useActivityStore } from '../services/activityStore';
import { isAiConfigured } from '../services/aiService';
import type { CoreState } from '../components/three/AiCoreScene';

/** Interval for the slow composer-text poll (ms). */
const COMPOSER_POLL_MS = 700;

export interface CoreSignals {
  /** A conversation request is genuinely in flight right now. */
  pending: boolean;
  /** A tool or test workflow is genuinely executing right now. */
  toolRunning: boolean;
  /** The composer holds unsent text (the user is composing). */
  composing: boolean;
  /** The latest assistant turn in the active conversation actually failed. */
  failed: boolean;
  /** True briefly after a reply actually arrived. */
  justReplied: boolean;
}

/** How long a success flash stays on the core before returning to idle. */
const FLASH_MS = 2400;

/**
 * Map raw signals to the core's visual state.
 *
 * Precedence is deliberate: real work outranks a transient success flash, and
 * a real failure outranks ambient states, so the core never hides an error
 * behind an idle animation.
 */
export function resolveCoreState(signals: CoreSignals): CoreState {
  if (signals.pending) return 'processing';
  if (signals.toolRunning) return 'tool';
  if (signals.failed) return 'error';
  if (signals.justReplied) return 'streaming';
  if (signals.composing) return 'listening';
  return 'idle';
}

/** True when a composer anywhere on screen currently holds unsent text. */
export function composerHasText(): boolean {
  const el = document.querySelector<HTMLTextAreaElement>('.chat-composer-textarea');
  return Boolean(el && el.value.trim().length > 0);
}

/**
 * Observe real request lifecycles and expose the core's state.
 *
 * The success flash is set from the transition of the pending flag, so it can
 * only appear after a request that really was in flight has settled.
 */
export function useCoreState(composing: boolean): CoreState {
  const chat = useChatStore();
  const activity = useActivityStore();
  const [justReplied, setJustReplied] = useState(false);
  const wasPending = useRef(false);

  const pending = chat.pendingIds.length > 0;
  const toolRunning = activity.records.some((r) => r.outcome === 'running');

  const active = chat.conversations.find((c) => c.id === chat.activeId);
  const last = active?.messages[active.messages.length - 1];
  const failed = !pending && last?.status === 'failed';

  // The success flash must reflect a reply that genuinely arrived. A request
  // the operator stopped (or one that failed) also clears `pending`, so the
  // newest chat outcome decides whether the flash is honest. The outcome is
  // read from the store inside the effect (after commit) rather than captured
  // during render, so no ref is written while rendering.
  useEffect(() => {
    const was = wasPending.current;
    wasPending.current = pending;
    if (!was || pending) return;
    const latest = activityStore.getState().records.find((r) => r.kind === 'chat');
    if (latest?.outcome === 'complete') {
      // A genuine reply landed: flash the success state briefly. The activity
      // store is an external system, so the effect is the correct place to
      // synchronise this derived state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJustReplied(true);
    }
  }, [pending]);

  useEffect(() => {
    if (!justReplied) return;
    const t = window.setTimeout(() => setJustReplied(false), FLASH_MS);
    return () => window.clearTimeout(t);
  }, [justReplied]);

  return resolveCoreState({ pending, toolRunning, composing, failed, justReplied });
}

/** True when a language-model provider is configured (real capability check). */
export function useAiConnected(): boolean {
  const [connected, setConnected] = useState(() => isAiConfigured());
  useEffect(() => {
    // Settings writes the key to localStorage; re-check when the window regains
    // focus so a freshly saved key is reflected without a reload.
    const recheck = () => setConnected(isAiConfigured());
    window.addEventListener('focus', recheck);
    window.addEventListener('storage', recheck);
    return () => {
      window.removeEventListener('focus', recheck);
      window.removeEventListener('storage', recheck);
    };
  }, []);
  return connected;
}

/**
 * Whether the operator is currently composing a message.
 *
 * There is exactly one shared composer component (`.chat-composer-textarea`), so
 * a document-level `input` listener is enough to track it without threading
 * state through every workspace. A slow poll covers programmatic changes (a
 * style or clarification step inserting text), and the state only updates when
 * it actually flips.
 */
export function useComposerComposing(): boolean {
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    let raf = 0;
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setComposing(composerHasText()));
    };
    const poll = window.setInterval(sync, COMPOSER_POLL_MS);
    document.addEventListener('input', sync, true);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener('input', sync, true);
      cancelAnimationFrame(raf);
    };
  }, []);

  return composing;
}
