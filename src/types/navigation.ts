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
  Code2,
  CheckSquare,
  Activity,
  Terminal,
  Settings,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export type RouteId =
  | 'home'
  | 'conversation'
  | 'chats'
  | 'projects'
  | 'websites'
  | 'apps'
  | 'games'
  | 'images'
  | 'videos'
  | 'music'
  | 'documents'
  | 'research'
  | 'learning'
  | 'agents'
  | 'tools'
  | 'create-software'
  | 'knowledge-base'
  | 'marketplace'
  | 'task-control-center'
  | 'system-status'
  | 'ai-command-center'
  | 'settings'
  | 'help-support'
  | 'magic-mode';

export interface NavItemDef {
  id: RouteId;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  category: 'primary' | 'secondary' | 'utility' | 'signature';
  badge?: string;
  description: string;
}

export const PRIMARY_NAV_ITEMS: NavItemDef[] = [
  { id: 'home', label: 'Home', icon: Home, category: 'primary', description: 'Central command canvas & quick composer' },
  { id: 'chats', label: 'Chats', icon: MessageSquare, category: 'primary', description: 'Intelligent multi-model conversation workspace' },
  { id: 'projects', label: 'Projects', icon: Folder, category: 'primary', description: 'Universal project management and artifact hub' },
  { id: 'apps', label: 'Apps', icon: LayoutGrid, category: 'primary', description: 'Software-creation and software-project management workspace' },
  { id: 'games', label: 'Games', icon: Gamepad2, category: 'primary', description: 'Game concept and level planning studio' },
  { id: 'images', label: 'Images', icon: Image, category: 'primary', description: 'Image prompt studio (no provider connected)' },
  { id: 'videos', label: 'Videos', icon: Video, category: 'primary', description: 'Storyboard and shot planning (no renderer connected)' },
  { id: 'music', label: 'Music', icon: Music, category: 'primary', description: 'Track composition studio (no audio provider connected)' },
  { id: 'documents', label: 'Documents', icon: FileText, category: 'primary', description: 'Technical whitepapers and executive writing' },
  { id: 'research', label: 'Research', icon: Compass, category: 'primary', description: 'Deep academic synthesis and evidence provenance' },
  { id: 'learning', label: 'Learning', icon: GraduationCap, category: 'primary', description: 'Interactive curriculum and cognitive study paths' },
  { id: 'agents', label: 'Agents', icon: Bot, category: 'primary', description: 'Agent directory and capability overview' },
  { id: 'tools', label: 'Tools', icon: Wrench, category: 'primary', description: 'Modular tool catalog & execution integrations' },
  { id: 'create-software', label: 'Create Software', icon: Code2, category: 'primary', description: 'Software creation workspace — brief a new build and open its project' },
];

export const SECONDARY_NAV_ITEMS: NavItemDef[] = [
  { id: 'task-control-center', label: 'Task Control Center', icon: CheckSquare, category: 'secondary', description: 'Task planning, status, and checkpoint workspace' },
  { id: 'system-status', label: 'System Status', icon: Activity, category: 'secondary', description: 'Runtime health and configured service status' },
  { id: 'ai-command-center', label: 'AI Command Center', icon: Terminal, category: 'secondary', description: 'Orchestration planning canvas (workflow engine not connected)' },
];

export const UTILITY_NAV_ITEMS: NavItemDef[] = [
  { id: 'settings', label: 'Settings', icon: Settings, category: 'utility', description: 'Appearance, layout, API keys and security controls' },
  { id: 'help-support', label: 'Help & Support', icon: HelpCircle, category: 'utility', description: 'Interactive guide, roadmap and troubleshooting' },
];

/**
 * Routes that remain fully implemented and reachable (e.g. via Ctrl+K search)
 * but are intentionally not rendered in the visible primary sidebar.
 * `websites` was removed from the primary sidebar by the current milestone; its
 * route, workspace, stored data and features are untouched.
 */
export const HIDDEN_NAV_ITEMS: NavItemDef[] = [
  { id: 'websites', label: 'Websites', icon: Globe, category: 'secondary', description: 'Website brief and responsive preview foundation' },
];

export const SIGNATURE_NAV_ITEM: NavItemDef = {
  id: 'magic-mode',
  label: 'Magic Mode',
  icon: Sparkles,
  category: 'signature',
  description: 'Autonomous multi-agent graphical orchestration canvas',
};

export const ALL_NAV_ITEMS: NavItemDef[] = [
  ...PRIMARY_NAV_ITEMS,
  ...SECONDARY_NAV_ITEMS,
  ...UTILITY_NAV_ITEMS,
  ...HIDDEN_NAV_ITEMS,
  SIGNATURE_NAV_ITEM,
];

export function getNavItemById(id: string): NavItemDef | undefined {
  return ALL_NAV_ITEMS.find((item) => item.id === id);
}
