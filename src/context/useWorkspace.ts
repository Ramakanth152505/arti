import { createContext, useContext } from 'react';
import type { RouteId } from '../types/navigation';

export type AppTheme = 'midnight-navy' | 'deep-obsidian' | 'cyber-steel';

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
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
  isPrivateMode: boolean;
  togglePrivateMode: () => void;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const useWorkspace = (): WorkspaceContextValue => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
