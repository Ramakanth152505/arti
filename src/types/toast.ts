export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'gold';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}
