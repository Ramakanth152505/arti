import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Sparkles, X } from 'lucide-react';
import { SPRING } from '../../motion/tokens';

/**
 * Toast stack.
 *
 * Each card enters from the right with a spring and leaves the same way, so
 * dismissal is legible rather than an abrupt pop. Toasts remain `role="status"`
 * inside a polite live region, so the animation never delays the announcement.
 */
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toast-container" aria-live="polite" role="region" aria-label="Notifications">
      <AnimatePresence initial={false}>
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
            <motion.div
              key={toast.id}
              className={`toast-card toast-${toast.type || 'gold'}`}
              role="status"
              layout="position"
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={SPRING.gentle}
            >
              <div className="toast-icon-wrap">{getIcon()}</div>
              <div className="toast-content">
                {toast.title && <div className="toast-title">{toast.title}</div>}
                <div className="toast-message">{toast.message}</div>
              </div>
              <motion.button
                type="button"
                className="toast-close-btn"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss toast"
                whileTap={{ scale: 0.88 }}
              >
                <X size={13} />
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
