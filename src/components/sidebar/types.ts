import type { NavItemDef, RouteId } from '../../types/navigation';

export type { NavItemDef, RouteId };

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeItemId: RouteId;
  onSelectItem: (id: RouteId) => void;
  /** True when the sidebar is presented as an overlay drawer (small screens). */
  isMobileNav: boolean;
  /** Whether the mobile drawer is currently open. */
  isMobileOpen: boolean;
  /** Dismisses the mobile drawer. */
  onMobileClose: () => void;
}
