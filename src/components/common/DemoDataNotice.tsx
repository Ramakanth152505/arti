import React from 'react';
import { Eye, X } from 'lucide-react';

interface DemoDataNoticeProps {
  /** Short description of what the demonstration content represents. */
  message: string;
  /** Optional action to discard demonstration content and start empty. */
  onClear?: () => void;
}

/**
 * Inline banner that explicitly labels unverified demonstration content so it is
 * never mistaken for real user data or real generated output.
 */
export const DemoDataNotice: React.FC<DemoDataNoticeProps> = ({ message, onClear }) => {
  return (
    <div className="demo-data-notice" role="note" aria-label="Demonstration content notice">
      <Eye size={13} className="demo-notice-icon" />
      <span className="demo-notice-text">
        <strong>Demonstration content. </strong>
        {message}
      </span>
      {onClear && (
        <button
          type="button"
          className="demo-notice-clear"
          onClick={onClear}
          title="Remove demonstration content"
        >
          <X size={12} />
          <span>Dismiss</span>
        </button>
      )}
    </div>
  );
};
