import React from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const UserProfile: React.FC = () => {
  const { isProfileMenuOpen, setIsProfileMenuOpen, isPrivateMode } = useWorkspace();

  return (
    <button
      type="button"
      className={`user-profile-btn ${isProfileMenuOpen ? 'active' : ''}`}
      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
      aria-label="User Profile Menu: Ramakanth, Private Mode"
      aria-expanded={isProfileMenuOpen}
      title="User profile and session mode"
    >
      <ShieldCheck size={16} color="#c9a84e" />
      <div className="user-profile-details">
        <span className="user-profile-name">Ramakanth</span>
        <span className="user-profile-status">
          <span className="private-indicator-dot" />
          {isPrivateMode ? 'Private Mode' : 'Standard'}
        </span>
      </div>
      <ChevronDown className="profile-dropdown-icon" size={12} />
    </button>
  );
};
