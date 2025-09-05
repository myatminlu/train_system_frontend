import { useState, useCallback } from 'react';
import { ToastMessage, ToastType } from '../components/common/Toast';

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = generateId();
    const newToast: ToastMessage = {
      id,
      type,
      message,
      duration: duration || (type === 'error' ? 8000 : 5000)
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    addToast('success', message, duration);
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    addToast('error', message, duration);
  }, [addToast]);

  const warning = useCallback((message: string, duration?: number) => {
    addToast('warning', message, duration);
  }, [addToast]);

  return {
    toasts,
    removeToast,
    success,
    error,
    warning
  };
};