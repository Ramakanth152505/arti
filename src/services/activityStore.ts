/**
 * ARTI AI — live activity store.
 *
 * One observable record of the operations that are *actually* running right
 * now, so the visual language (the AI core, the execution timeline, the status
 * indicators) can be driven by real work instead of a decorative timer.
 *
 * Only genuine lifecycles are published here:
 *   - `chat`   a language-model request is in flight (chatStore)
 *   - `image`  a real image generation request is in flight
 *   - `video`  a real video generation request is in flight
 *   - `tool`   a tool / test workflow is executing
 *
 * Nothing is simulated: an entry appears when a request starts and is removed
 * when it settles, so a stalled or failed operation can never look like it is
 * still progressing. Consumers must render an honest outcome from
 * {@link ActivityRecord.outcome}.
 */
import { useSyncExternalStore } from 'react';

export type ActivityKind = 'chat' | 'image' | 'video' | 'tool';

export type ActivityOutcome = 'running' | 'complete' | 'failed' | 'blocked' | 'cancelled';

export interface ActivityRecord {
  id: string;
  kind: ActivityKind;
  /** Short human label shown in the execution timeline. */
  label: string;
  outcome: ActivityOutcome;
  startedAt: number;
  /** When the operation actually settled (undefined while it is running). */
  settledAt?: number;
  /** Real error text when `outcome` is `failed` or `blocked`. */
  detail?: string;
  /**
   * Real progress in 0–1, or `null` when the operation cannot report progress.
   * A `null` value must render as indeterminate — never as a fabricated bar.
   */
  progress: number | null;
}

interface ActivityState {
  /** Newest first. Only operations from this session are listed. */
  records: ActivityRecord[];
}

const MAX_RECORDS = 40;

class ActivityStore {
  private state: ActivityState = { records: [] };
  private listeners = new Set<() => void>();
  private counter = 0;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getState = (): ActivityState => this.state;

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private update(id: string, patch: Partial<ActivityRecord>) {
    this.state = {
      records: this.state.records.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    };
    this.emit();
  }

  /** Register a real operation starting. Returns its id for later settlement. */
  begin(kind: ActivityKind, label: string, progress: number | null = null): string {
    const id = `act_${++this.counter}_${Date.now()}`;
    const record: ActivityRecord = {
      id,
      kind,
      label,
      outcome: 'running',
      startedAt: Date.now(),
      progress,
    };
    this.state = { records: [record, ...this.state.records].slice(0, MAX_RECORDS) };
    this.emit();
    return id;
  }

  /** Report real progress for a running operation. */
  progress(id: string, value: number) {
    const clamped = Math.max(0, Math.min(1, value));
    this.update(id, { progress: clamped });
  }

  /** Settle an operation with its real outcome. */
  settle(id: string, outcome: ActivityOutcome, detail?: string) {
    const existing = this.state.records.find((r) => r.id === id);
    if (!existing) return;
    this.update(id, {
      outcome,
      detail,
      progress: outcome === 'running' ? existing.progress : null,
      settledAt: outcome === 'running' ? undefined : Date.now(),
    });
  }

  /** Remove a settled record (the user dismissed it). */
  dismiss(id: string) {
    this.state = { records: this.state.records.filter((r) => r.id !== id) };
    this.emit();
  }

  clearSettled() {
    this.state = { records: this.state.records.filter((r) => r.outcome === 'running') };
    this.emit();
  }
}

export const activityStore = new ActivityStore();

export function useActivityStore(): ActivityState {
  return useSyncExternalStore(activityStore.subscribe, activityStore.getState, activityStore.getState);
}

/** Convenience predicate used by the core-state hook and status indicators. */
export function hasRunning(state: ActivityState, kind?: ActivityKind): boolean {
  return state.records.some((r) => r.outcome === 'running' && (!kind || r.kind === kind));
}
