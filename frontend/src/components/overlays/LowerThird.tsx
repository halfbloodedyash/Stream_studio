"use client";

import { useState } from "react";
import styles from "./LowerThird.module.css";

interface LowerThirdProps {
    name: string;
    title: string;
    visible?: boolean;
    onClose?: () => void;
}

export function LowerThird({ name, title, visible = true, onClose }: LowerThirdProps) {
    if (!visible) return null;

    return (
        <div className={styles.lowerThird}>
            <div className={styles.content}>
                <div className={styles.name}>{name}</div>
                <div className={styles.title}>{title}</div>
            </div>
            {onClose && (
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                    ×
                </button>
            )}
        </div>
    );
}
