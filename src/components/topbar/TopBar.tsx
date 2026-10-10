import React from 'react';
import { Bell, Moon, Sun, Monitor, ChevronRight } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { MagicModeButton } from './MagicModeButton';
import { UserProfile } from './UserProfile';
import { UserProfileMenu } from '../common/UserProfileMenu';
import { useWorkspace } from '../../context/WorkspaceContext';
import { getNavItemById } from '../../types/navigation';

interface TopBarProps {
  isSidebarCollapsed: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ isSidebarCollapsed }) => {
  const {
    currentRoute,
    navigate,
    theme,
    cycleTheme,
    setIsNotificationsOpen,
  } = useWorkspace();

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
      {/* Left section: breadcrumb indicator when sidebar is collapsed or on dedicated route */}
      <div className="topbar-left">
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

      {/* Center section: Large Search field */}
      <div className="topbar-center">
        <SearchBar />
      </div>

      {/* Right section: theme/control icon, notifications, Magic Mode, profile */}
      <div className="topbar-right">
        {/* Theme control */}
        <button
          type="button"
          onClick={cycleTheme}
          className="topbar-icon-btn"
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

        {/* Profile Area with Dropdown Menu */}
        <div style={{ position: 'relative' }}>
          <UserProfile />
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
};
