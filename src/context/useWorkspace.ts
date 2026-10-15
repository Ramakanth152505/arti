import { createContext, useContext } from 'react';
import type { RouteId } from '../types/navigation';

/**
 * ARTI AI ships exactly one approved palette — Navy / Warm Beige / Soft Gold.
 * The value is kept as a named token (rather than a free-form string) so any
 * future surface that reads it stays inside the three-colour contract.
 */
export type AppTheme = 'arti-approved';

export interface WorkspaceContextValue {
  currentRoute: RouteId;
  routeParams: Record<string, string>;
  navigate: (route: RouteId, params?: Record<string, string>) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isProfileMenuOpen: boolean;
  setIsProfileMenuOpen: (open: boolean) => void;
  theme: AppTheme;
  isPrivateMode: boolean;
  togglePrivateMode: () => void;
  /**
   * Global distraction-free conversation mode. Set by the shared
   * `useConversationFocus` hook while a conversation workspace with content is
   * active; `AppShell` uses it to temporarily de-emphasise the navigation rail.
   * It is a temporary focus state, never destructive navigation.
   */
  isFocusMode: boolean;
  setFocusMode: (value: boolean) => void;
  /**
   * Whether the temporarily-hidden chrome has been revealed again (mouse
   * movement, keyboard focus, or an explicit toggle). Only meaningful while
   * `isFocusMode` is true.
   */
  isFocusChromeRevealed: boolean;
  setFocusChromeRevealed: (value: boolean) => void;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const useWorkspace = (): WorkspaceContextValue => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
