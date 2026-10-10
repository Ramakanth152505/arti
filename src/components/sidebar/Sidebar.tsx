import React from 'react';
import {
  Home,
  MessageSquare,
  Folder,
  Globe,
  LayoutGrid,
  Gamepad2,
  Image,
  Video,
  Music,
  FileText,
  Compass,
  GraduationCap,
  Bot,
  Wrench,
  Database,
  ShoppingBag,
  Cpu,
  History,
  Zap,
  CheckSquare,
  Activity,
  Terminal,
  Settings,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { NavItemDef, SidebarProps } from './types';
import { SidebarItem } from './SidebarItem';

const PRIMARY_NAV_ITEMS: NavItemDef[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'projects', label: 'Projects', icon: Folder },
  { id: 'websites', label: 'Websites', icon: Globe },
  { id: 'apps', label: 'Apps', icon: LayoutGrid },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'research', label: 'Research', icon: Compass },
  { id: 'learning', label: 'Learning', icon: GraduationCap },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'knowledge-base', label: 'Knowledge Base', icon: Database },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
];

const SECONDARY_NAV_ITEMS: NavItemDef[] = [
  { id: 'active-agents', label: 'Active Agents', icon: Cpu },
  { id: 'recent-projects', label: 'Recent Projects', icon: History },
  { id: 'quick-actions', label: 'Quick Actions', icon: Zap },
  { id: 'task-control-center', label: 'Task Control Center', icon: CheckSquare },
  { id: 'system-status', label: 'System Status', icon: Activity },
  { id: 'ai-command-center', label: 'AI Command Center', icon: Terminal },
];

const UTILITY_NAV_ITEMS: NavItemDef[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help-support', label: 'Help & Support', icon: HelpCircle },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeItemId,
  onSelectItem,
}) => {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`} aria-label="Main Navigation">
      {/* Sidebar Header with Phoenix Logo, ARTI AI Branding & Toggle */}
      <div className="sidebar-header">
        <div className="sidebar-brand-wrapper">
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
        </div>

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
      <div className="sidebar-nav-container">
        {/* Primary Items 1 to 16 */}
        {PRIMARY_NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            isActive={activeItemId === item.id}
            isCollapsed={isCollapsed}
            onClick={() => onSelectItem(item.id)}
          />
        ))}

        {/* Visual Divider */}
        <div className="sidebar-divider" />

        {/* Secondary Items 17 to 22 */}
        {SECONDARY_NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            isActive={activeItemId === item.id}
            isCollapsed={isCollapsed}
            onClick={() => onSelectItem(item.id)}
          />
        ))}

        {/* Visual Divider */}
        <div className="sidebar-divider" />

        {/* Utility Items 23 to 24 */}
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

      {/* Sidebar Bottom Micro-Branding */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <span className="sidebar-footer-brand">ARTI AI</span>
          <span className="sidebar-footer-tagline">Infinite Possibilities</span>
        </div>
      )}
    </aside>
  );
};
