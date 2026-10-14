import React, { useEffect, useRef, useState } from 'react';
import { Bell, Moon, Sun, Monitor, ChevronRight, Search, Menu, MoreVertical } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { MagicModeButton } from './MagicModeButton';
import { UserProfile } from './UserProfile';
import { UserProfileMenu } from '../common/UserProfileMenu';
import { AiCoreStatus } from '../shell/AiCoreHost';
import { useWorkspace } from '../../context/WorkspaceContext';
import { getNavItemById } from '../../types/navigation';

interface TopBarProps {
  isSidebarCollapsed: boolean;
  onOpenMobileNav: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ isSidebarCollapsed, onOpenMobileNav }) => {
  const {
    currentRoute,
    navigate,
    theme,
    cycleTheme,
    setIsNotificationsOpen,
    setIsSearchOpen,
    setIsProfileMenuOpen,
  } = useWorkspace();

  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const [lastRoute, setLastRoute] = useState(currentRoute);

  // Close the overflow menu when the route changes (adjust during render).
  if (lastRoute !== currentRoute) {
    setLastRoute(currentRoute);
    setIsOverflowOpen(false);
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setIsOverflowOpen(false);
      }
    };
    if (isOverflowOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOverflowOpen]);

  const currentNav = getNavItemById(currentRoute);

  const getThemeIcon = () => {
    switch (theme) {
      case 'midnight-navy':
        return <Moon size={15} />;
      case 'deep-obsidian':
        return <Monitor size={15} />;
      case 'cyber-steel':
        return <Sun size={15} />;
      default:
        return <Moon size={15} />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'midnight-navy':
        return 'Theme: Midnight Navy';
      case 'deep-obsidian':
        return 'Theme: Deep Obsidian';
      case 'cyber-steel':
        return 'Theme: Cyber Steel';
      default:
        return 'Display Theme';
    }
  };

  return (
    <header className="topbar" role="banner">
      {/* Left section: mobile menu trigger, breadcrumb indicator, route tag */}
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-mobile-menu-btn"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          aria-controls="app-sidebar"
        >
          <Menu size={18} />
        </button>

        {isSidebarCollapsed && (
          <button
            type="button"
            onClick={() => navigate('home')}
            className="topbar-brand-link"
            title="Return to ARTI AI Home"
          >
            <span className="topbar-brand-text">ARTI AI</span>
          </button>
        )}

        {currentRoute !== 'home' && currentNav && (
          <div className="topbar-current-route-tag">
            {isSidebarCollapsed && <ChevronRight size={12} className="topbar-route-sep" />}
            <span className="topbar-route-name">{currentNav.label}</span>
          </div>
        )}
      </div>

      {/* Center section: Large Search field (desktop / tablet) */}
      <div className="topbar-center">
        <SearchBar />
      </div>

      {/* Right section: compact search, theme, notifications, Magic Mode, overflow, profile */}
      <div className="topbar-right">
        {/* Live AI core state (real request lifecycle, never simulated) */}
        {currentRoute !== 'home' && <AiCoreStatus />}

        {/* Compact search launcher (narrow screens) */}
        <button
          type="button"
          className="topbar-search-compact"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Open global search"
          title="Search anything... (Ctrl + K)"
        >
          <Search size={17} />
        </button>

        {/* Theme control */}
        <button
          type="button"
          onClick={cycleTheme}
          className="topbar-icon-btn topbar-theme-btn"
          title={`${getThemeLabel()} (Click to cycle)`}
          aria-label={getThemeLabel()}
        >
          {getThemeIcon()}
        </button>

        {/* Notifications button */}
        <button
          type="button"
          onClick={() => setIsNotificationsOpen(true)}
          className="topbar-icon-btn"
          title="Notifications & System Alerts"
          aria-label="Notifications"
          style={{ position: 'relative' }}
        >
          <Bell size={15} />
          <span className="topbar-notif-dot" />
        </button>

        {/* Magic Mode Button */}
        <MagicModeButton />

        {/* Overflow menu: secondary actions on narrow screens */}
        <div className="topbar-overflow-wrap" ref={overflowRef}>
          <button
            type="button"
            className={`topbar-overflow-btn ${isOverflowOpen ? 'active' : ''}`}
            onClick={() => setIsOverflowOpen((prev) => !prev)}
            aria-label="More top bar actions"
            aria-expanded={isOverflowOpen}
          >
            <MoreVertical size={17} />
          </button>

          {isOverflowOpen && (
            <div className="topbar-overflow-menu" role="menu" aria-label="Additional actions">
              <button
                type="button"
                className="topbar-overflow-item"
                role="menuitem"
                onClick={() => {
                  setIsOverflowOpen(false);
                  setIsProfileMenuOpen(true);
                }}
              >
                <span>Profile &amp; Session</span>
                <span className="overflow-item-meta">Ramakanth</span>
              </button>
              <button
                type="button"
                className="topbar-overflow-item"
                role="menuitem"
                onClick={() => {
                  setIsOverflowOpen(false);
                  navigate('settings');
                }}
              >
                <span>Workspace Settings</span>
              </button>
              <div className="topbar-overflow-divider" />
              <button
                type="button"
                className="topbar-overflow-item"
                role="menuitem"
                onClick={() => {
                  setIsOverflowOpen(false);
                  cycleTheme();
                }}
              >
                <span>{getThemeLabel()}</span>
                <span className="overflow-item-meta">Switch</span>
              </button>
            </div>
          )}
        </div>

        {/* Profile Area with Dropdown Menu */}
        <div className="topbar-profile-wrap" style={{ position: 'relative' }}>
          <UserProfile />
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
};
