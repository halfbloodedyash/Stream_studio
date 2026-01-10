"use client";

import { useToastStore } from "@/stores/toastStore";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import styles from "./Toast.module.css";

export function ToastContainer() {
    const { toasts, removeToast } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div className={styles.container}>
            {toasts.map((toast) => (
                <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
                    <div className={styles.icon}>
                        {toast.type === "success" && <CheckCircle size={18} />}
                        {toast.type === "error" && <AlertCircle size={18} />}
                        {toast.type === "warning" && <AlertTriangle size={18} />}
                        {toast.type === "info" && <Info size={18} />}
                    </div>
                    <div className={styles.message}>{toast.message}</div>
                    <button className={styles.closeBtn} onClick={() => removeToast(toast.id)}>
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
