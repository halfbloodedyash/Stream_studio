"use client";

import { useRef } from "react";
import { Palette, Upload, Image as ImageIcon, Type, Layout, Video, Play, Trash2 } from "lucide-react";
import { useBrandingStore, Clip } from "@/stores/brandingStore";
import styles from "./BrandSettings.module.css";

export function BrandSettings() {
    const {
        primaryColor,
        logo,
        background,
        clips,
        activeClipId,
        setPrimaryColor,
        setFontFamily,
        setLogo,
        setBackground,
        addClip,
        removeClip,
        setActiveClip,
    } = useBrandingStore();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);
    const clipInputRef = useRef<HTMLInputElement>(null);

    const colors = [
        "#2dd4bf", // Teal
        "#3b82f6", // Blue
        "#8b5cf6", // Purple
        "#ec4899", // Pink
        "#ef4444", // Red
        "#f59e0b", // Amber
        "#10b981", // Emerald
        "#6366f1", // Indigo
    ];

    const handleFileUpload = (type: "logo" | "background" | "clip", e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);

        if (type === "logo") {
            setLogo({ url });
        } else if (type === "background") {
            setBackground({ url });
        } else if (type === "clip") {
            const newClip: Clip = {
                id: `clip-${Date.now()}`,
                name: file.name,
                url: url,
                type: "clip",
            };
            addClip(newClip);
        }
    };

    return (
        <div className={styles.container}>
            <section className={styles.section}>
                <h4 className={styles.sectionTitle}>
                    <Palette size={16} />
                    Brand Color
                </h4>
                <div className={styles.colorGrid}>
                    {colors.map((color) => (
                        <button
                            key={color}
                            className={`${styles.colorCircle} ${primaryColor === color ? styles.active : ""}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setPrimaryColor(color)}
                        />
                    ))}
                    <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className={styles.colorPicker}
                    />
                </div>
            </section>

            <section className={styles.section}>
                <h4 className={styles.sectionTitle}>
                    <Upload size={16} />
                    Logo
                </h4>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload("logo", e)}
                    accept="image/*"
                    style={{ display: "none" }}
                />
                <div className={styles.uploadBox} onClick={() => fileInputRef.current?.click()}>
                    {logo.url ? (
                        <div className={styles.preview}>
                            <img src={logo.url} alt="Logo" />
                            <button
                                onClick={(e) => { e.stopPropagation(); setLogo({ url: "" }); }}
                                className={styles.removeBtn}
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div className={styles.uploadPlaceholder}>
                            <ImageIcon size={24} />
                            <span>Upload Logo</span>
                        </div>
                    )}
                </div>
            </section>

            <section className={styles.section}>
                <h4 className={styles.sectionTitle}>
                    <Layout size={16} />
                    Background
                </h4>
                <input
                    type="file"
                    ref={bgInputRef}
                    onChange={(e) => handleFileUpload("background", e)}
                    accept="image/*"
                    style={{ display: "none" }}
                />
                <div className={styles.uploadBox} onClick={() => bgInputRef.current?.click()}>
                    {background.url ? (
                        <div className={styles.preview}>
                            <img src={background.url} alt="Background" />
                            <button
                                onClick={(e) => { e.stopPropagation(); setBackground({ url: "" }); }}
                                className={styles.removeBtn}
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div className={styles.uploadPlaceholder}>
                            <ImageIcon size={24} />
                            <span>Upload Background</span>
                        </div>
                    )}
                </div>
            </section>

            <section className={styles.section}>
                <h4 className={styles.sectionTitle}>
                    <Video size={16} />
                    Video Clips (Intros/Outros)
                </h4>
                <input
                    type="file"
                    ref={clipInputRef}
                    onChange={(e) => handleFileUpload("clip", e)}
                    accept="video/*"
                    style={{ display: "none" }}
                />
                <button
                    className={styles.uploadBtn}
                    onClick={() => clipInputRef.current?.click()}
                >
                    <Plus size={14} />
                    Add Clip
                </button>

                <div className={styles.clipList}>
                    {clips.map(clip => (
                        <div key={clip.id} className={styles.clipItem}>
                            <span className={styles.clipName}>{clip.name}</span>
                            <div className={styles.clipActions}>
                                <button
                                    className={`${styles.playBtn} ${activeClipId === clip.id ? styles.active : ""}`}
                                    onClick={() => setActiveClip(activeClipId === clip.id ? null : clip.id)}
                                >
                                    <Play size={14} />
                                </button>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => removeClip(clip.id)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className={styles.section}>
                <h4 className={styles.sectionTitle}>
                    <Type size={16} />
                    Font Style
                </h4>
                <select
                    className={styles.select}
                    onChange={(e) => setFontFamily(e.target.value)}
                >
                    <option>Inter</option>
                    <option>Roboto</option>
                    <option>Montserrat</option>
                    <option>Playfair Display</option>
                </select>
            </section>
        </div>
    );
}

const Plus = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);
