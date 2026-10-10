import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ToastItem, ToastType } from '../types/toast';

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (message: string, options?: { title?: string; type?: ToastType; duration?: number }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

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

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
