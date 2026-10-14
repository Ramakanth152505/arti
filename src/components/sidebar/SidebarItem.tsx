import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { NavItemDef } from './types';
import { DUR, EASE, SPRING } from '../../motion/tokens';

interface SidebarItemProps {
  item: NavItemDef;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

/**
 * A single navigation item.
 *
 * The active state is marked by a shared-element indicator (`layoutId`), so
 * moving between workspaces slides one continuous accent between items instead
 * of blinking two static highlights. The label animates in and out as the rail
 * collapses, and the press feedback is a spring — but semantics, focus order and
 * the `title`/`aria-label` fallbacks are unchanged.
 */
export const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  isActive,
  isCollapsed,
  onClick,
}) => {
  const IconComponent = item.icon;

  return (
    <motion.button
      type="button"
      className={`sidebar-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title={isCollapsed ? item.label : undefined}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      whileTap={{ scale: 0.985 }}
      transition={SPRING.snappy}
    >
      {isActive && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="sidebar-active-indicator"
          transition={SPRING.gentle}
          aria-hidden="true"
        />
      )}
      <span className="sidebar-item-icon">
        <IconComponent size={16} />
      </span>
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.span
            className="sidebar-item-label"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: DUR.fast, ease: EASE.standard }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
