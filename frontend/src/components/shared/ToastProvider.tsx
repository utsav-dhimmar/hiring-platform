/**
 * Global Toast provider for displaying non-intrusive notifications.
 * Uses sonner for toast notifications.
 */

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { toast as sonnerToast, Toaster } from "sonner";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const showToast = (message: string, type: ToastType = "info", title?: string) => {
    switch (type) {
      case "success":
        sonnerToast.success(message, { description: title });
        break;
      case "error":
        sonnerToast.error(message, { description: title });
        break;
      case "warning":
        sonnerToast.warning(message, { description: title });
        break;
      default:
        sonnerToast(message, { description: title });
    }
  };

  const success = (msg: string) => sonnerToast.success(msg);
  const error = (msg: string) => sonnerToast.error(msg);
  const warn = (msg: string) => sonnerToast.warning(msg);
  const info = (msg: string) => sonnerToast(msg);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warn, info }}>
      {children}
      <Toaster position="bottom-right" />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
