"use client";

import { useBrandingStore } from "@/stores/brandingStore";
import styles from "./BannerOverlay.module.css";

interface BannerOverlayProps {
    text: string;
    style?: "standard" | "minimal" | "ticker";
    visible?: boolean;
}

export function BannerOverlay({ text, style = "standard", visible = true }: BannerOverlayProps) {
    const { primaryColor } = useBrandingStore();

    if (!visible) return null;

    if (style === "ticker") {
        return (
            <div className={styles.tickerContainer}>
                <div
                    className={styles.ticker}
                    style={{ backgroundColor: primaryColor }}
                >
                    <div className={styles.tickerContent}>
                        {text} &nbsp; • &nbsp; {text} &nbsp; • &nbsp; {text} &nbsp; • &nbsp; {text}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.banner} ${styles[style]}`}>
            <div
                className={styles.accent}
                style={{ backgroundColor: primaryColor }}
            />
            <div className={styles.content}>
                {text}
            </div>
        </div>
    );
}
