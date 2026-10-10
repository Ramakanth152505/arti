import React from 'react';
import type { NavItemDef } from './types';

interface SidebarItemProps {
  item: NavItemDef;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  isActive,
  isCollapsed,
  onClick,
}) => {
  const IconComponent = item.icon;

  return (
    <button
      type="button"
      className={`sidebar-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title={isCollapsed ? item.label : undefined}
      aria-label={item.label}
    >
      <span className="sidebar-item-icon">
        <IconComponent size={16} />
      </span>
      {!isCollapsed && (
        <span className="sidebar-item-label">{item.label}</span>
      )}
    </button>
  );
};
