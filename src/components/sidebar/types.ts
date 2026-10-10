import React from 'react';

export interface NavItemDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeItemId: string;
  onSelectItem: (id: string) => void;
}
