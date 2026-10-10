import React from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const MagicModeButton: React.FC = () => {
  const { currentRoute, navigate } = useWorkspace();
  const isActive = currentRoute === 'magic-mode';

  return (
    <button
      type="button"
      className={`magic-mode-btn ${isActive ? 'active' : ''}`}
      onClick={() => navigate('magic-mode')}
      title="Magic Mode - Autonomous Intelligence Layer (Ctrl + M)"
      aria-label="Magic Mode Orchestrator"
    >
      <Sparkles className="magic-spark-icon" size={14} />
      <span>Magic Mode</span>
      <ChevronDown size={12} color="#c9a84e" />
    </button>
  );
};
