import React, { useState, useCallback } from 'react';
import type { ToastItem, ToastType } from '../types/toast';
import { ToastContext } from './useToast';

export { useToast } from './useToast';
export type { ToastContextValue } from './useToast';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, options?: { title?: string; type?: ToastType; duration?: number }) => {
      const id = 'toast_' + Math.random().toString(36).slice(2, 9);
      const duration = options?.duration ?? 4200;
      const newToast: ToastItem = {
        id,
        message,
        title: options?.title,
        type: options?.type ?? 'gold',
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};
