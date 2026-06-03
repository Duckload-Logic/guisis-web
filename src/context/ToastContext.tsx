import React, { createContext, useState, useCallback } from "react";

export interface ToastItem {
  id: string;
  message: string;
}

interface ToastContextType {
  toasts: ToastItem[];
  triggerToast: (message: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined,
);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const triggerToast = useCallback((message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = { id, message };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, triggerToast }}>
      {children}
    </ToastContext.Provider>
  );
};
