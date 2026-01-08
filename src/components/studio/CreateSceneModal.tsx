"use client";

import { useState } from "react";
import { X, Layers, Users, Monitor, Grid3X3, Check, LayoutGrid } from "lucide-react";
import styles from "./CreateSceneModal.module.css";

interface CreateSceneModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (scene: { name: string; layout: LayoutType }) => void;
}

type LayoutType = "solo" | "duo" | "trio" | "quad" | "grid" | "pip" | "sidebar";

interface LayoutOption {
    id: LayoutType;
    name: string;
    description: string;
    icon: React.ReactNode;
    preview: React.ReactNode;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
    {
        id: "solo",
        name: "Solo",
        description: "Single participant fills the screen",
        icon: <Users size={18} />,
        preview: (
            <div className={styles.previewGrid} data-layout="solo">
                <div className={styles.previewBox} />
            </div>
        ),
    },
    {
        id: "duo",
        name: "Side by Side",
        description: "Two participants split evenly",
        icon: <LayoutGrid size={18} />,
        preview: (
            <div className={styles.previewGrid} data-layout="duo">
                <div className={styles.previewBox} />
                <div className={styles.previewBox} />
            </div>
        ),
    },
    {
        id: "pip",
        name: "Picture-in-Picture",
        description: "Main view with small overlay",
        icon: <Monitor size={18} />,
        preview: (
            <div className={styles.previewGrid} data-layout="pip">
                <div className={styles.previewBox} />
                <div className={styles.previewBoxSmall} />
            </div>
        ),
    },
    {
        id: "grid",
        name: "Grid",
        description: "Equal grid for multiple participants",
        icon: <Grid3X3 size={18} />,
        preview: (
            <div className={styles.previewGrid} data-layout="grid">
                <div className={styles.previewBox} />
                <div className={styles.previewBox} />
                <div className={styles.previewBox} />
                <div className={styles.previewBox} />
            </div>
        ),
    },
    {
        id: "sidebar",
        name: "Sidebar",
        description: "Main view with sidebar panel",
        icon: <Layers size={18} />,
        preview: (
            <div className={styles.previewGrid} data-layout="sidebar">
                <div className={styles.previewBox} />
                <div className={styles.previewBoxSide} />
            </div>
        ),
    },
];

export function CreateSceneModal({ isOpen, onClose, onCreate }: CreateSceneModalProps) {
    const [sceneName, setSceneName] = useState("");
    const [selectedLayout, setSelectedLayout] = useState<LayoutType>("solo");

    const handleCreate = () => {
        if (!sceneName.trim()) {
            return;
        }
        onCreate({
            name: sceneName.trim(),
            layout: selectedLayout,
        });
        setSceneName("");
        setSelectedLayout("solo");
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && sceneName.trim()) {
            handleCreate();
        }
        if (e.key === "Escape") {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Create New Scene</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {/* Scene Name */}
                    <div className={styles.section}>
                        <label className={styles.label} htmlFor="sceneName">Scene Name</label>
                        <input
                            id="sceneName"
                            type="text"
                            className={styles.input}
                            placeholder="Enter scene name..."
                            value={sceneName}
                            onChange={(e) => setSceneName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>

                    {/* Layout Selection */}
                    <div className={styles.section}>
                        <label className={styles.label}>Layout</label>
                        <div className={styles.layoutGrid}>
                            {LAYOUT_OPTIONS.map((layout) => (
                                <button
                                    key={layout.id}
                                    className={`${styles.layoutCard} ${selectedLayout === layout.id ? styles.selected : ""}`}
                                    onClick={() => setSelectedLayout(layout.id)}
                                >
                                    <div className={styles.layoutPreview}>
                                        {layout.preview}
                                    </div>
                                    <div className={styles.layoutInfo}>
                                        <span className={styles.layoutName}>{layout.name}</span>
                                        <span className={styles.layoutDesc}>{layout.description}</span>
                                    </div>
                                    {selectedLayout === layout.id && (
                                        <div className={styles.checkmark}>
                                            <Check size={14} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button
                        className={styles.createBtn}
                        onClick={handleCreate}
                        disabled={!sceneName.trim()}
                    >
                        Create Scene
                    </button>
                </div>
            </div>
        </div>
    );
}
