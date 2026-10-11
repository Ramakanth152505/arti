import { useCallback, useEffect, useRef, useState } from 'react';

export interface Identifiable {
  id: string;
}

export interface WorkspaceDataResult<T extends Identifiable> {
  /** Items currently displayed. */
  items: T[];
  /** True when `items` is unverified demonstration content, not real user data. */
  isDemo: boolean;
  /** Create a new real record. This clears any demonstration content. */
  addItem: (item: T) => void;
  /** Remove a record by id (works for both real and demonstration items). */
  removeItem: (id: string) => void;
  /** Patch a record by id. */
  updateItem: (id: string, updater: (item: T) => T) => void;
  /** Replace the entire collection with real records. */
  setItems: (items: T[]) => void;
  /** Drop demonstration content and start from an empty real collection. */
  clear: () => void;
}

function readStored<T>(storageKey: string): T[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

/**
 * Client-side, refresh-safe collection store for a workspace.
 *
 * Real records are persisted to localStorage, which is the repository's only
 * available persistence layer. Demonstration content supplied by
 * `demoProvider` is shown ONLY while no real records exist, is never persisted,
 * and is surfaced as demo via `isDemo` so the UI can label it honestly.
 */
export function useWorkspaceData<T extends Identifiable>(
  key: string,
  demoProvider: () => T[]
): WorkspaceDataResult<T> {
  const storageKey = `arti_ws_${key}`;

  const [initial] = useState(() => {
    const stored = readStored<T>(storageKey);
    if (stored && stored.length > 0) {
      return { items: stored, isDemo: false };
    }
    const demo = demoProvider();
    return { items: demo, isDemo: demo.length > 0 };
  });

  const [items, setItemsState] = useState<T[]>(initial.items);
  const [isDemo, setIsDemo] = useState<boolean>(initial.isDemo);
  const isDemoRef = useRef(initial.isDemo);

  // Persist real data only; demonstration content is never written to storage.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isDemo) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Storage may be unavailable (private mode / quota); fail silently.
    }
  }, [items, isDemo, storageKey]);

  const addItem = useCallback((item: T) => {
    setItemsState((prev) => (isDemoRef.current ? [item, ...prev.filter((p) => p.id !== item.id)] : [item, ...prev]));
    isDemoRef.current = false;
    setIsDemo(false);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItemsState((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateItem = useCallback((id: string, updater: (item: T) => T) => {
    setItemsState((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  }, []);

  const setItems = useCallback((next: T[]) => {
    setItemsState(next);
    setIsDemo(false);
  }, []);

  const clear = useCallback(() => {
    setItemsState([]);
    setIsDemo(false);
  }, []);

  return { items, isDemo, addItem, removeItem, updateItem, setItems, clear };
}
