import React from 'react';
import { Bell, Moon } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { MagicModeButton } from './MagicModeButton';
import { UserProfile } from './UserProfile';

interface TopBarProps {
  isSidebarCollapsed: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ isSidebarCollapsed }) => {
  return (
    <header className="topbar" role="banner">
      {/* Left section: breadcrumb indicator when sidebar is collapsed */}
      <div className="topbar-left">
        {isSidebarCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '13px',
                fontWeight: 600,
                color: '#faecc0',
                letterSpacing: '0.08em',
              }}
            >
              ARTI AI
            </span>
          </div>
        )}
      </div>

      {/* Center section: Large Search field */}
      <div className="topbar-center">
        <SearchBar />
      </div>

      {/* Right section: theme/control icon, notifications, Magic Mode, profile */}
      <div className="topbar-right">
        <button
          type="button"
          className="topbar-icon-btn"
          title="Display Theme"
          aria-label="Theme mode"
        >
          <Moon size={15} />
        </button>

        <button
          type="button"
          className="topbar-icon-btn"
          title="Notifications"
          aria-label="Notifications"
          style={{ position: 'relative' }}
        >
          <Bell size={15} />
          <span
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: '#c9a84e',
            }}
          />
        </button>

        {/* Magic Mode Button */}
        <MagicModeButton />

        {/* Profile Area */}
        <UserProfile />
      </div>
    </header>
  );
};
