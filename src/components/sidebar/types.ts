import type { NavItemDef, RouteId } from '../../types/navigation';

export type { NavItemDef, RouteId };

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeItemId: RouteId;
  onSelectItem: (id: RouteId) => void;
}
