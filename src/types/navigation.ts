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
  CheckSquare,
  Activity,
  Terminal,
  Settings,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export type RouteId =
  | 'home'
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
  { id: 'websites', label: 'Websites', icon: Globe, category: 'primary', description: 'Next-gen website creation and responsive studio' },
  { id: 'apps', label: 'Apps', icon: LayoutGrid, category: 'primary', description: 'Full-stack application synthesis and architecture' },
  { id: 'games', label: 'Games', icon: Gamepad2, category: 'primary', description: 'Interactive game development and asset studio' },
  { id: 'images', label: 'Images', icon: Image, category: 'primary', description: 'High-fidelity cinematic image creation studio' },
  { id: 'videos', label: 'Videos', icon: Video, category: 'primary', description: 'Cinematic video production and shot planning' },
  { id: 'music', label: 'Music', icon: Music, category: 'primary', description: 'Algorithmic soundtrack & audio synthesis' },
  { id: 'documents', label: 'Documents', icon: FileText, category: 'primary', description: 'Technical whitepapers and executive writing' },
  { id: 'research', label: 'Research', icon: Compass, category: 'primary', description: 'Deep academic synthesis and evidence provenance' },
  { id: 'learning', label: 'Learning', icon: GraduationCap, category: 'primary', description: 'Interactive curriculum and cognitive study paths' },
  { id: 'agents', label: 'Agents', icon: Bot, category: 'primary', description: 'Autonomous specialist agent fleet directory' },
  { id: 'tools', label: 'Tools', icon: Wrench, category: 'primary', description: 'Modular tool catalog & execution integrations' },
  { id: 'knowledge-base', label: 'Knowledge Base', icon: Database, category: 'primary', description: 'Private vector knowledge and encrypted memory' },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, category: 'primary', description: 'Capabilities, extension packs and connectors' },
];

export const SECONDARY_NAV_ITEMS: NavItemDef[] = [
  { id: 'task-control-center', label: 'Task Control Center', icon: CheckSquare, category: 'secondary', description: 'Real-time task scheduler and execution tracker' },
  { id: 'system-status', label: 'System Status', icon: Activity, category: 'secondary', description: 'Diagnostic telemetry and service connectivity' },
  { id: 'ai-command-center', label: 'AI Command Center', icon: Terminal, category: 'secondary', description: 'Mission-control orchestration and agent telemetry' },
];

export const UTILITY_NAV_ITEMS: NavItemDef[] = [
  { id: 'settings', label: 'Settings', icon: Settings, category: 'utility', description: 'Appearance, layout, API keys and security controls' },
  { id: 'help-support', label: 'Help & Support', icon: HelpCircle, category: 'utility', description: 'Interactive guide, roadmap and troubleshooting' },
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
  SIGNATURE_NAV_ITEM,
];

export function getNavItemById(id: string): NavItemDef | undefined {
  return ALL_NAV_ITEMS.find((item) => item.id === id);
}
