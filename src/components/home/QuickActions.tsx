import React from 'react';
import {
  FolderPlus,
  Search,
  Sparkles,
  Compass,
  MoreHorizontal,
} from 'lucide-react';

interface QuickActionItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  { id: 'create-project', label: 'Create Project', icon: FolderPlus },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'generate', label: 'Generate', icon: Sparkles },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];

export const QuickActions: React.FC = () => {
  return (
    <div className="quick-actions-container" role="toolbar" aria-label="Quick Actions">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            className="quick-action-pill"
            aria-label={action.label}
          >
            <Icon className="quick-action-icon" size={13} />
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};
