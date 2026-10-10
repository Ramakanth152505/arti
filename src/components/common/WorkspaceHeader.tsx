import React from 'react';
import { ChevronRight, Home, ShieldCheck } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

interface WorkspaceHeaderProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badge?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  title,
  description,
  icon: Icon,
  badge,
  actions,
  children,
}) => {
  const { navigate, isPrivateMode } = useWorkspace();

  return (
    <header className="workspace-header" role="banner">
      {/* Top Breadcrumb row */}
      <div className="workspace-breadcrumb-row">
        <button
          type="button"
          onClick={() => navigate('home')}
          className="breadcrumb-home-btn"
          title="Return to Home"
        >
          <Home size={12} />
          <span>ARTI AI</span>
        </button>
        <ChevronRight size={11} className="breadcrumb-chevron" />
        <span className="breadcrumb-current">{title}</span>

        {isPrivateMode && (
          <div className="workspace-privacy-tag" title="Client-side session encrypted">
            <ShieldCheck size={11} />
            <span>Private Session</span>
          </div>
        )}
      </div>

      {/* Main Title & Action Bar */}
      <div className="workspace-title-bar">
        <div className="workspace-title-group">
          <div className="workspace-icon-gem">
            <Icon size={20} className="workspace-gem-icon" />
          </div>
          <div>
            <div className="workspace-title-row">
              <h1 className="workspace-heading">{title}</h1>
              {badge && <span className="workspace-badge">{badge}</span>}
            </div>
            <p className="workspace-subheading">{description}</p>
          </div>
        </div>

        {actions && <div className="workspace-actions-group">{actions}</div>}
      </div>

      {children && <div className="workspace-header-custom">{children}</div>}
    </header>
  );
};
