"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

// Toast Types
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

// Context
interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

// Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((toast: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(7);
        const newToast = { ...toast, id };
        setToasts((prev) => [...prev, newToast]);

        // Auto remove after duration
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const success = useCallback(
        (title: string, message?: string) => addToast({ type: "success", title, message }),
        [addToast]
    );

    const error = useCallback(
        (title: string, message?: string) => addToast({ type: "error", title, message }),
        [addToast]
    );

    const warning = useCallback(
        (title: string, message?: string) => addToast({ type: "warning", title, message }),
        [addToast]
    );

    const info = useCallback(
        (title: string, message?: string) => addToast({ type: "info", title, message }),
        [addToast]
    );

    return (
        <ToastContext.Provider
            value={{ toasts, addToast, removeToast, success, error, warning, info }}
        >
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

// Toast Container
function ToastContainer({
    toasts,
    onRemove,
}: {
    toasts: Toast[];
    onRemove: (id: string) => void;
}) {
    return (
        <div className="toast-container">
            <style jsx>{`
        .toast-container {
          position: fixed;
          bottom: var(--space-6);
          right: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          z-index: var(--z-toast);
          max-width: 400px;
        }

        @media (max-width: 640px) {
          .toast-container {
            left: var(--space-4);
            right: var(--space-4);
            bottom: var(--space-4);
            max-width: none;
          }
        }
      `}</style>
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

// Individual Toast
function ToastItem({
    toast,
    onRemove,
}: {
    toast: Toast;
    onRemove: (id: string) => void;
}) {
    const [isExiting, setIsExiting] = useState(false);

    const handleRemove = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 200);
    };

    const getIcon = () => {
        switch (toast.type) {
            case "success":
                return <CheckCircle size={18} />;
            case "error":
                return <AlertCircle size={18} />;
            case "warning":
                return <AlertTriangle size={18} />;
            case "info":
                return <Info size={18} />;
        }
    };

    const getStyles = () => {
        switch (toast.type) {
            case "success":
                return {
                    background: "hsla(142, 71%, 45%, 0.15)",
                    border: "hsla(142, 71%, 45%, 0.3)",
                    icon: "var(--color-success)",
                };
            case "error":
                return {
                    background: "hsla(0, 84%, 55%, 0.15)",
                    border: "hsla(0, 84%, 55%, 0.3)",
                    icon: "var(--color-error)",
                };
            case "warning":
                return {
                    background: "hsla(38, 92%, 50%, 0.15)",
                    border: "hsla(38, 92%, 50%, 0.3)",
                    icon: "var(--color-warning)",
                };
            case "info":
                return {
                    background: "hsla(217, 91%, 60%, 0.15)",
                    border: "hsla(217, 91%, 60%, 0.3)",
                    icon: "var(--color-accent-secondary)",
                };
        }
    };

    const styles = getStyles();

    return (
        <div
            className={`toast ${isExiting ? "exiting" : ""}`}
            style={{
                background: styles.background,
                borderColor: styles.border,
            }}
        >
            <style jsx>{`
        .toast {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border: 1px solid;
          border-radius: var(--radius-lg);
          backdrop-filter: blur(12px);
          animation: slideIn 0.3s ease;
        }

        .toast.exiting {
          animation: slideOut 0.2s ease forwards;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .toast-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .toast-content {
          flex: 1;
          min-width: 0;
        }

        .toast-title {
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
        }

        .toast-message {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          margin-top: 2px;
        }

        .toast-action {
          margin-top: var(--space-2);
        }

        .toast-action button {
          padding: var(--space-1) var(--space-2);
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          font-weight: var(--font-medium);
          color: var(--color-text-primary);
          cursor: pointer;
        }

        .toast-close {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .toast-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--color-text-primary);
        }
      `}</style>

            <div className="toast-icon" style={{ color: styles.icon }}>
                {getIcon()}
            </div>

            <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                {toast.message && <div className="toast-message">{toast.message}</div>}
                {toast.action && (
                    <div className="toast-action">
                        <button onClick={toast.action.onClick}>{toast.action.label}</button>
                    </div>
                )}
            </div>

            <button className="toast-close" onClick={handleRemove}>
                <X size={14} />
            </button>
        </div>
    );
}
