import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Sparkles, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 size={16} className="toast-icon toast-icon-success" />;
            case 'warning':
              return <AlertTriangle size={16} className="toast-icon toast-icon-warning" />;
            case 'error':
              return <AlertCircle size={16} className="toast-icon toast-icon-error" />;
            case 'info':
              return <Info size={16} className="toast-icon toast-icon-info" />;
            case 'gold':
            default:
              return <Sparkles size={16} className="toast-icon toast-icon-gold" />;
          }
        };

        return (
          <div key={toast.id} className={`toast-card toast-${toast.type || 'gold'}`} role="status">
            <div className="toast-icon-wrap">{getIcon()}</div>
            <div className="toast-content">
              {toast.title && <div className="toast-title">{toast.title}</div>}
              <div className="toast-message">{toast.message}</div>
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss toast"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
