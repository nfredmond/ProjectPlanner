import { useState, useEffect } from 'react';

export type ToastVariant = 'default' | 'destructive';

export type ToastProps = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

export type Toast = ToastProps & {
  id: string;
  open: boolean;
};

// Create a singleton pattern for toast state
let toasts: Toast[] = [];
let listeners: Function[] = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener([...toasts]));
};

export function useToast() {
  const [localToasts, setLocalToasts] = useState<Toast[]>([]);

  // Subscribe to toast changes
  useEffect(() => {
    const updateToasts = (newToasts: Toast[]) => {
      setLocalToasts(newToasts);
    };
    
    listeners.push(updateToasts);
    updateToasts([...toasts]);
    
    return () => {
      listeners = listeners.filter(listener => listener !== updateToasts);
    };
  }, []);

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      open: true,
      duration: 5000,
      ...props,
    };
    
    toasts = [...toasts, newToast];
    notifyListeners();
    
    if (newToast.duration !== Infinity) {
      setTimeout(() => {
        dismiss(id);
      }, newToast.duration);
    }
    
    return id;
  };

  const dismiss = (id: string) => {
    toasts = toasts.map(toast => 
      toast.id === id ? { ...toast, open: false } : toast
    );
    notifyListeners();
    
    setTimeout(() => {
      toasts = toasts.filter(toast => toast.id !== id);
      notifyListeners();
    }, 300);
  };

  return {
    toasts: localToasts,
    toast,
    dismiss
  };
} 