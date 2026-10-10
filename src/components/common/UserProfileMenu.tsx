import React, { useRef, useEffect } from 'react';
import { ShieldCheck, Settings, Lock, Check, Sparkles } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

export const UserProfileMenu: React.FC = () => {
  const {
    isProfileMenuOpen,
    setIsProfileMenuOpen,
    isPrivateMode,
    togglePrivateMode,
    navigate,
  } = useWorkspace();
  const { showToast } = useToast();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen, setIsProfileMenuOpen]);

  if (!isProfileMenuOpen) return null;

  const handleLockWorkspace = () => {
    setIsProfileMenuOpen(false);
    showToast('Workspace session locked. Client memory protected.', { type: 'gold' });
  };

  const handleOpenSettings = () => {
    setIsProfileMenuOpen(false);
    navigate('settings');
  };

  return (
    <div className="user-profile-menu-popover" ref={menuRef} role="menu" aria-label="User Profile Menu">
      {/* User Header */}
      <div className="profile-menu-header">
        <div className="profile-menu-name-row">
          <span className="profile-menu-name">Ramakanth</span>
          <span className="profile-menu-role">Workspace Owner</span>
        </div>
        <div className="profile-menu-status-badge">
          <span className="private-indicator-dot" />
          <span>{isPrivateMode ? 'Private Mode Active' : 'Standard Session'}</span>
        </div>
      </div>

      <div className="profile-menu-divider" />

      {/* Menu Options */}
      <div className="profile-menu-section">
        <button
          type="button"
          className="profile-menu-item"
          onClick={() => {
            togglePrivateMode();
            showToast(`Private Mode ${!isPrivateMode ? 'Activated' : 'Paused'}`, {
              type: 'info',
            });
          }}
          role="menuitem"
        >
          <div className="profile-menu-item-icon">
            <ShieldCheck size={15} color="#c9a84e" />
          </div>
          <div className="profile-menu-item-text">
            <span className="profile-menu-item-title">Zero-Cloud Privacy</span>
            <span className="profile-menu-item-desc">
              {isPrivateMode ? 'Encrypted local session' : 'Standard local mode'}
            </span>
          </div>
          {isPrivateMode && <Check size={14} className="profile-menu-check" />}
        </button>

        <button
          type="button"
          className="profile-menu-item"
          onClick={() => {
            setIsProfileMenuOpen(false);
            navigate('magic-mode');
          }}
          role="menuitem"
        >
          <div className="profile-menu-item-icon">
            <Sparkles size={15} color="#dfbe68" />
          </div>
          <div className="profile-menu-item-text">
            <span className="profile-menu-item-title">Magic Mode Canvas</span>
            <span className="profile-menu-item-desc">Autonomous multi-agent workspace</span>
          </div>
        </button>

        <button
          type="button"
          className="profile-menu-item"
          onClick={handleOpenSettings}
          role="menuitem"
        >
          <div className="profile-menu-item-icon">
            <Settings size={15} />
          </div>
          <div className="profile-menu-item-text">
            <span className="profile-menu-item-title">Workspace Settings</span>
            <span className="profile-menu-item-desc">Themes, keys, &amp; data management</span>
          </div>
        </button>
      </div>

      <div className="profile-menu-divider" />

      {/* Footer / Lock button */}
      <div className="profile-menu-footer">
        <button
          type="button"
          className="profile-lock-btn"
          onClick={handleLockWorkspace}
          role="menuitem"
        >
          <Lock size={13} />
          <span>Lock Workspace</span>
        </button>
      </div>
    </div>
  );
};
