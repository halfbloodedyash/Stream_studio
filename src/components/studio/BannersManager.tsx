"use client";

import { useState } from "react";
import { Type, Play, Trash2, Layout, Zap } from "lucide-react";
import { useBrandingStore } from "@/stores/brandingStore";
import styles from "./BannersManager.module.css";

interface Banner {
    id: string;
    text: string;
    style: "standard" | "minimal" | "ticker";
    isActive: boolean;
}

export function BannersManager() {
    const [banners, setBanners] = useState<Banner[]>([
        { id: "1", text: "Welcome to StreamStudio! 🚀", style: "standard", isActive: false },
        { id: "2", text: "Follow us on Twitter @StreamStudio", style: "ticker", isActive: false },
    ]);
    const [newText, setNewText] = useState("");
    const [newStyle, setNewStyle] = useState<"standard" | "minimal" | "ticker">("standard");

    const addBanner = () => {
        if (newText.trim()) {
            setBanners([...banners, {
                id: Date.now().toString(),
                text: newText,
                style: newStyle,
                isActive: false
            }]);
            setNewText("");
        }
    };

    const toggleBanner = (id: string) => {
        setBanners(banners.map(b => {
            if (b.id === id) return { ...b, isActive: !b.isActive };
            // Auto-deactivate others if it's the same category? StreamYard allows multiple types.
            // For simplicity, we'll allow multiple but usually only one ticker or one banner makes sense.
            return b;
        }));
    };

    const deleteBanner = (id: string) => {
        setBanners(banners.filter(b => b.id !== id));
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h4 className={styles.title}>
                    <Type size={16} />
                    Banners & Tickers
                </h4>
            </div>

            <div className={styles.createForm}>
                <textarea
                    className={styles.textarea}
                    placeholder="Enter banner text..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                />
                <div className={styles.formRow}>
                    <select
                        className={styles.select}
                        value={newStyle}
                        onChange={(e) => setNewStyle(e.target.value as any)}
                    >
                        <option value="standard">Standard Banner</option>
                        <option value="minimal">Minimal Style</option>
                        <option value="ticker">Scrolling Ticker</option>
                    </select>
                    <button className={styles.addBtn} onClick={addBanner}>Add</button>
                </div>
            </div>

            <div className={styles.bannerList}>
                {banners.map(banner => (
                    <div key={banner.id} className={`${styles.bannerCard} ${banner.isActive ? styles.active : ""}`}>
                        <div className={styles.bannerInfo}>
                            <div className={styles.styleBadge}>
                                {banner.style === "ticker" ? <Zap size={10} /> : <Layout size={10} />}
                                {banner.style}
                            </div>
                            <p className={styles.bannerText}>{banner.text}</p>
                        </div>
                        <div className={styles.bannerActions}>
                            <button
                                className={`${styles.actionBtn} ${banner.isActive ? styles.show : ""}`}
                                onClick={() => toggleBanner(banner.id)}
                            >
                                {banner.isActive ? "Hide" : "Show"}
                            </button>
                            <button className={styles.deleteBtn} onClick={() => deleteBanner(banner.id)}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
