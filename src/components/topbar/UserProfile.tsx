import React from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';

export const UserProfile: React.FC = () => {
  return (
    <button
      type="button"
      className="user-profile-btn"
      aria-label="User Profile Menu: Ramakanth, Private Mode"
      title="User profile and session mode"
    >
      <ShieldCheck size={16} color="#c9a84e" />
      <div className="user-profile-details">
        <span className="user-profile-name">Ramakanth</span>
        <span className="user-profile-status">
          <span className="private-indicator-dot" />
          Private Mode
        </span>
      </div>
      <ChevronDown className="profile-dropdown-icon" size={12} />
    </button>
  );
};
