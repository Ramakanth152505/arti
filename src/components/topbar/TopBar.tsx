import React, { useEffect, useRef, useState } from 'react';
import { Bell, Moon, ChevronRight, Search, Menu, MoreVertical } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { MagicModeButton } from './MagicModeButton';
import { UserProfile } from './UserProfile';
import { UserProfileMenu } from '../common/UserProfileMenu';
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

  const getThemeLabel = () => 'Approved palette — Navy · Warm Beige · Soft Gold';

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

        {/* Palette indicator — the three-colour system is fixed, so this is
            informational only and deliberately not a control. */}
        <span
          className="topbar-icon-btn topbar-theme-btn topbar-palette-badge"
          title={getThemeLabel()}
          aria-label={getThemeLabel()}
        >
          <Moon size={15} />
        </span>

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
              <div className="topbar-overflow-item topbar-overflow-info" role="note">
                <span>{getThemeLabel()}</span>
                <span className="overflow-item-meta">Fixed</span>
              </div>
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
