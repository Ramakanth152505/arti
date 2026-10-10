import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { SidebarProps } from './types';
import { SidebarItem } from './SidebarItem';
import {
  PRIMARY_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  UTILITY_NAV_ITEMS,
} from '../../types/navigation';

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeItemId,
  onSelectItem,
}) => {
  return (
    <aside
      className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}
      aria-label="Universal Navigation"
    >
      {/* Sidebar Header with Phoenix Logo, ARTI AI Branding & Toggle */}
      <div className="sidebar-header">
        <button
          type="button"
          onClick={() => onSelectItem('home')}
          className="sidebar-brand-wrapper"
          title="ARTI AI Home"
        >
          <img
            src="/assets/arti_phoenix_logo.jpg"
            alt="ARTI AI Phoenix Emblem"
            className="sidebar-logo-img"
          />
          {!isCollapsed && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">ARTI AI</span>
              <span className="sidebar-brand-tagline">Infinite Possibilities</span>
            </div>
          )}
        </button>

        {/* Sidebar Collapse/Expand Toggle Button: '>' */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="sidebar-collapse-btn"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar (>)' : 'Collapse sidebar (<)'}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation Scroll Container */}
      <nav className="sidebar-nav-container" aria-label="Main Navigation Items">
        {/* Primary Items 1 to 16 */}
        <div className="sidebar-section-group" role="group" aria-label="Primary Workspaces">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={activeItemId === item.id}
              isCollapsed={isCollapsed}
              onClick={() => onSelectItem(item.id)}
            />
          ))}
        </div>

        {/* Visual Divider */}
        <div className="sidebar-divider" />

        {/* Secondary System Navigation Items 17 to 19 */}
        <div className="sidebar-section-group" role="group" aria-label="System Operations">
          {!isCollapsed && <span className="sidebar-group-heading">System Operations</span>}
          {SECONDARY_NAV_ITEMS.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={activeItemId === item.id}
              isCollapsed={isCollapsed}
              onClick={() => onSelectItem(item.id)}
            />
          ))}
        </div>

        {/* Visual Divider */}
        <div className="sidebar-divider" />

        {/* Utility Items 20 to 21 */}
        <div className="sidebar-section-group" role="group" aria-label="System Utilities">
          {!isCollapsed && <span className="sidebar-group-heading">Preferences</span>}
          {UTILITY_NAV_ITEMS.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={activeItemId === item.id}
              isCollapsed={isCollapsed}
              onClick={() => onSelectItem(item.id)}
            />
          ))}
        </div>
      </nav>

      {/* Sidebar Bottom Micro-Branding */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <span className="sidebar-footer-brand">ARTI AI</span>
          <span className="sidebar-footer-tagline">Autonomous Workspace</span>
        </div>
      )}
    </aside>
  );
};
