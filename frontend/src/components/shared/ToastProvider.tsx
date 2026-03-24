/**
 * Global Toast provider for displaying non-intrusive notifications.
 * Provides a useToast hook to trigger alerts from anywhere.
 */

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { Toast, ToastContainer } from "react-bootstrap";

type ToastType = "success" | "danger" | "warning" | "info";

interface ToastMessage {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info", title?: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg: string) => showToast(msg, "success", "Success"), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, "danger", "Error"), [showToast]);
  const warn = useCallback((msg: string) => showToast(msg, "warning", "Warning"), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, "info", "Information"), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warn, info }}>
      {children}
      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 9999 }}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            onClose={() => removeToast(toast.id)}
            show={true}
            delay={5000}
            autohide
            bg={toast.type}
            className="text-white border-0 shadow-lg"
          >
            <Toast.Header closeButton={false} className="bg-transparent border-0 text-white">
              <strong className="me-auto">{toast.title || "Notification"}</strong>
            </Toast.Header>
            <Toast.Body>{toast.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
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
