import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { RouteId } from '../types/navigation';
import { router, type RouteState } from '../services/router';

export type AppTheme = 'midnight-navy' | 'deep-obsidian' | 'cyber-steel';

interface WorkspaceContextValue {
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
  initialChatPrompt: string;
  setInitialChatPrompt: (prompt: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [routeState, setRouteState] = useState<RouteState>(() => router.getCurrentState());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('arti_sidebar_collapsed');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      return (localStorage.getItem('arti_theme') as AppTheme) || 'midnight-navy';
    } catch {
      return 'midnight-navy';
    }
  });

  const [isPrivateMode, setIsPrivateMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('arti_private_mode');
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const [initialChatPrompt, setInitialChatPrompt] = useState<string>('');

  useEffect(() => {
    const unsubscribe = router.subscribe((newRouteState) => {
      setRouteState(newRouteState);
    });
    return unsubscribe;
  }, []);

  const navigate = useCallback((route: RouteId, params?: Record<string, string>) => {
    router.navigate(route, params);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('arti_sidebar_collapsed', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    try {
      localStorage.setItem('arti_sidebar_collapsed', JSON.stringify(collapsed));
    } catch {
      // ignore
    }
  }, []);

  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('arti_theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    } catch {
      // ignore
    }
  }, []);

  const cycleTheme = useCallback(() => {
    const themes: AppTheme[] = ['midnight-navy', 'deep-obsidian', 'cyber-steel'];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  const togglePrivateMode = useCallback(() => {
    setIsPrivateMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('arti_private_mode', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Global Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsProfileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        currentRoute: routeState.route,
        routeParams: routeState.params,
        navigate,
        isSidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
        isSearchOpen,
        setIsSearchOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isProfileMenuOpen,
        setIsProfileMenuOpen,
        theme,
        setTheme,
        cycleTheme,
        isPrivateMode,
        togglePrivateMode,
        initialChatPrompt,
        setInitialChatPrompt,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextValue => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
