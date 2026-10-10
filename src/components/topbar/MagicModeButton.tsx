import React from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';

export const MagicModeButton: React.FC = () => {
  return (
    <button
      type="button"
      className="magic-mode-btn"
      title="Magic Mode - Autonomous Intelligence Layer"
      aria-label="Magic Mode"
    >
      <Sparkles className="magic-spark-icon" size={14} />
      <span>Magic Mode</span>
      <ChevronDown size={12} color="#c9a84e" />
    </button>
  );
};
