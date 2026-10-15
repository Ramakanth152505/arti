import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import type { SidebarProps } from './types';
import { SidebarItem } from './SidebarItem';
import { SPRING } from '../../motion/tokens';
import {
  PRIMARY_NAV_ITEMS,
  UTILITY_NAV_ITEMS,
} from '../../types/navigation';

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeItemId,
  onSelectItem,
  isMobileNav,
  isMobileOpen,
  onMobileClose,
}) => {
  // Escape dismisses the drawer; body scroll is locked while it is open.
  useEffect(() => {
    if (!isMobileNav || !isMobileOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileNav, isMobileOpen, onMobileClose]);

  // On small screens the drawer always shows the full hierarchy, so it must
  // never inherit the desktop "collapsed" icon-rail presentation.
  const renderCollapsed = isCollapsed && !isMobileNav;

  const handleSelect = (id: Parameters<typeof onSelectItem>[0]) => {
    onSelectItem(id);
    if (isMobileNav) onMobileClose();
  };

  return (
    <>
      {isMobileNav && (
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              className="sidebar-mobile-overlay open"
              onClick={onMobileClose}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>
      )}

    <aside
      id="app-sidebar"
      className={`sidebar ${renderCollapsed ? 'collapsed' : 'expanded'} ${
        isMobileNav && isMobileOpen ? 'mobile-open' : ''
      }`}
      aria-label="Universal Navigation"
      aria-hidden={isMobileNav && !isMobileOpen ? true : undefined}
    >
      {/* Sidebar Header with Phoenix Logo, ARTI AI Branding & Toggle */}
      <div className="sidebar-header">
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="sidebar-brand-wrapper"
          title="ARTI AI Home"
        >
          <img
            src="/assets/arti_phoenix_logo.png"
            alt="ARTI AI Phoenix Emblem"
            className="sidebar-logo-img"
          />
          <AnimatePresence initial={false}>
            {!renderCollapsed && (
              <motion.div
                className="sidebar-brand-text"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={SPRING.snappy}
              >
                <span className="sidebar-brand-title">ARTI AI</span>
                <span className="sidebar-brand-tagline">Infinite Possibilities</span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Sidebar Collapse/Expand Toggle Button: '>' (desktop only) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="sidebar-collapse-btn"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar (>)' : 'Collapse sidebar (<)'}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Mobile drawer close control */}
        <button
          type="button"
          onClick={onMobileClose}
          className="sidebar-mobile-close-btn"
          aria-label="Close navigation menu"
        >
          <X size={17} />
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
              isCollapsed={renderCollapsed}
              onClick={() => handleSelect(item.id)}
            />
          ))}
        </div>

        {/* Visual Divider */}
        <div className="sidebar-divider" />

        {/* Utility Items — preferences only. Websites, Knowledge Base, Marketplace
            and the former System Operations entries are intentionally not in the
            visible primary sidebar; their routes and implementations remain
            registered in AppShell and reachable (e.g. via Ctrl+K search), so
            nothing was deleted. */}
        <div className="sidebar-section-group" role="group" aria-label="System Utilities">
          {!renderCollapsed && <span className="sidebar-group-heading">Preferences</span>}
          {UTILITY_NAV_ITEMS.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={activeItemId === item.id}
              isCollapsed={renderCollapsed}
              onClick={() => handleSelect(item.id)}
            />
          ))}
        </div>
      </nav>

      {/* Sidebar Bottom Micro-Branding */}
      <AnimatePresence initial={false}>
        {!renderCollapsed && (
          <motion.div
            className="sidebar-footer"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={SPRING.snappy}
          >
            <span className="sidebar-footer-brand">ARTI AI</span>
            <span className="sidebar-footer-tagline">Autonomous Workspace</span>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
    </>
  );
};
