/**
 * ARTI AI — shared distraction-free conversation mode.
 *
 * One reusable interaction model for every conversation surface (Games, Apps /
 * project workspaces, Chats, the dedicated conversation workspace). After the
 * first prompt is submitted the workspace enters a calm focus state that
 * de-emphasises non-essential chrome (navigation rail, project panels) while the
 * message feed and composer stay put.
 *
 * Reveal is never mouse-only:
 *   - mouse movement inside the workspace,
 *   - keyboard focus entering the workspace (focusin),
 *   - any key press (Tab navigation),
 *   - and an explicit `toggleChrome` control for touch users.
 *
 * Chrome is never hidden while the user is typing, while a modal dialog is open,
 * or while the pointer is still inside the workspace, so reading, typing and
 * active controls are never interrupted. It is a temporary focus state — no
 * conversation, message, or project data is ever removed.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';

/** How long chrome stays revealed after the last interaction before hiding. */
const HOLD_MS = 3200;

function activeElementIsTyping(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

function dialogOpen(): boolean {
  return Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));
}

export interface ConversationFocus {
  /** True while the workspace is in distraction-free focus mode. */
  focusMode: boolean;
  /** True while the temporarily-hidden chrome has been revealed again. */
  chromeRevealed: boolean;
  /** Explicit show/hide control (required for touch — no hover). */
  toggleChrome: () => void;
  /** Attach to the workspace root element that owns the hidden chrome. */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * @param active true once the workspace holds conversation content and focus
 *   mode should engage (e.g. a message exists or one is in flight).
 */
export function useConversationFocus(active: boolean): ConversationFocus {
  const { setFocusMode, setFocusChromeRevealed } = useWorkspace();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // Reveal state is keyed by the focus lifecycle, so flipping the lifecycle
  // resets it to "hidden" without an effect and without reading refs in render.
  const [revealState, setReveal] = useState<{ key: boolean; revealed: boolean }>({
    key: active,
    revealed: false,
  });
  if (revealState.key !== active) {
    setReveal({ key: active, revealed: false });
  }
  const chromeRevealed = !active || (revealState.key === active && revealState.revealed);

  // Publish the focus state to the shell (an external system) whenever either
  // the lifecycle or the reveal changes. On unmount the shell is always
  // released so navigation can never stay collapsed.
  useEffect(() => {
    setFocusMode(active);
    setFocusChromeRevealed(chromeRevealed);
    return () => {
      setFocusMode(false);
      setFocusChromeRevealed(false);
    };
  }, [active, chromeRevealed, setFocusMode, setFocusChromeRevealed]);

  // `scheduleHideRef` breaks the self-reference so the reschedule inside the
  // timer never reads the callback while it is still being initialised.
  const scheduleHideRef = useRef<() => void>(() => {});

  const scheduleHide = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const container = containerRef.current;
      const pointerInside = container ? container.matches(':hover') : false;
      // Never hide while the user is typing, a dialog is open, or the pointer
      // is still over the workspace.
      if (activeElementIsTyping() || dialogOpen() || pointerInside) {
        scheduleHideRef.current();
        return;
      }
      setReveal((prev) => (prev.revealed ? { ...prev, revealed: false } : prev));
    }, HOLD_MS);
  }, []);

  useEffect(() => {
    scheduleHideRef.current = scheduleHide;
  }, [scheduleHide]);

  const reveal = useCallback(() => {
    if (!active) return;
    setReveal((prev) => (prev.key === active && prev.revealed ? prev : { key: active, revealed: true }));
    scheduleHide();
  }, [active, scheduleHide]);

  useEffect(() => {
    if (!active) return;

    const onPointerActivity = (e: MouseEvent) => {
      const container = containerRef.current;
      if (container && e.target instanceof Node && container.contains(e.target)) {
        reveal();
      }
    };
    const onFocusIn = () => reveal();
    const onKeyDown = () => reveal();

    window.addEventListener('mousemove', onPointerActivity);
    window.addEventListener('pointerdown', onPointerActivity);
    document.addEventListener('focusin', onFocusIn);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousemove', onPointerActivity);
      window.removeEventListener('pointerdown', onPointerActivity);
      document.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('keydown', onKeyDown);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [active, reveal]);

  const toggleChrome = useCallback(() => {
    if (!active) return;
    setReveal((prev) => {
      const currentlyRevealed = prev.key === active && prev.revealed;
      if (!currentlyRevealed) scheduleHide();
      return { key: active, revealed: !currentlyRevealed };
    });
  }, [active, scheduleHide]);

  return { focusMode: active, chromeRevealed, toggleChrome, containerRef };
}
