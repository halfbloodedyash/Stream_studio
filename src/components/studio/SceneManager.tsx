"use client";

import { useState } from "react";
import { Layers, Plus, Trash2, Grid, Layout, Monitor, Users, Mic } from "lucide-react";
import { LAYOUTS, LayoutType } from "@/lib/canvas/VideoCompositor";

interface Scene {
    id: string;
    name: string;
    layout: LayoutType;
    sources: SceneSource[];
    isActive: boolean;
}

interface SceneSource {
    id: string;
    type: "camera" | "screen" | "image" | "video";
    name: string;
}

interface SceneManagerProps {
    scenes: Scene[];
    activeSceneId: string;
    onSelectScene: (sceneId: string) => void;
    onAddScene: () => void;
    onRemoveScene: (sceneId: string) => void;
    onRenameScene: (sceneId: string, name: string) => void;
    onChangeLayout: (sceneId: string, layout: LayoutType) => void;
}

export function SceneManager({
    scenes,
    activeSceneId,
    onSelectScene,
    onAddScene,
    onRemoveScene,
    onRenameScene,
    onChangeLayout,
}: SceneManagerProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [showLayoutPicker, setShowLayoutPicker] = useState<string | null>(null);

    const handleStartEdit = (scene: Scene) => {
        setEditingId(scene.id);
        setEditName(scene.name);
    };

    const handleFinishEdit = (sceneId: string) => {
        if (editName.trim()) {
            onRenameScene(sceneId, editName.trim());
        }
        setEditingId(null);
        setEditName("");
    };

    const getLayoutIcon = (layout: LayoutType) => {
        switch (layout) {
            case "solo":
                return <Users size={14} />;
            case "duo":
            case "quad":
            case "grid":
                return <Grid size={14} />;
            case "pip":
            case "presentation":
                return <Monitor size={14} />;
            default:
                return <Layout size={14} />;
        }
    };

    return (
        <div className="scene-manager">
            <style jsx>{`
        .scene-manager {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .scene-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .scene-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          padding: var(--space-3);
          background: var(--color-bg-tertiary);
          border: 2px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .scene-card:hover {
          background: var(--color-bg-hover);
        }

        .scene-card.active {
          border-color: var(--color-accent-secondary);
          background: hsla(217, 91%, 60%, 0.1);
        }

        .scene-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .scene-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: var(--color-bg-primary);
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
        }

        .scene-name {
          flex: 1;
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-primary);
        }

        .scene-name-input {
          flex: 1;
          padding: var(--space-1) var(--space-2);
          background: var(--color-bg-primary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-sm);
          color: var(--color-text-primary);
          font-size: var(--text-sm);
        }

        .scene-name-input:focus {
          outline: none;
          border-color: var(--color-accent-secondary);
        }

        .scene-actions {
          display: flex;
          gap: var(--space-1);
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .scene-card:hover .scene-actions {
          opacity: 1;
        }

        .scene-action-btn {
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

        .scene-action-btn:hover {
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
        }

        .scene-action-btn.danger:hover {
          color: var(--color-error);
        }

        .scene-thumbnail {
          aspect-ratio: 16 / 9;
          background: var(--color-bg-primary);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          position: relative;
          overflow: hidden;
        }

        .thumbnail-grid {
          position: absolute;
          inset: 4px;
          display: grid;
          gap: 2px;
        }

        .thumbnail-cell {
          background: var(--color-bg-tertiary);
          border-radius: 2px;
        }

        .scene-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .layout-badge {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          padding: 2px 6px;
          background: var(--color-bg-primary);
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .layout-badge:hover {
          background: var(--color-bg-hover);
          color: var(--color-text-secondary);
        }

        .sources-count {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        .add-scene-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-3);
          background: none;
          border: 1px dashed var(--color-border-default);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .add-scene-btn:hover {
          border-color: var(--color-accent-secondary);
          color: var(--color-accent-secondary);
        }

        .layout-picker {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: var(--space-2);
          padding: var(--space-2);
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 10;
        }

        .layout-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-2);
        }

        .layout-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-2);
          background: var(--color-bg-tertiary);
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .layout-option:hover {
          background: var(--color-bg-hover);
        }

        .layout-option.selected {
          border-color: var(--color-accent-secondary);
          background: hsla(217, 91%, 60%, 0.1);
        }

        .layout-option span {
          font-size: 10px;
          color: var(--color-text-muted);
        }
      `}</style>

            <div className="scene-list">
                {scenes.map((scene) => (
                    <div
                        key={scene.id}
                        className={`scene-card ${scene.id === activeSceneId ? "active" : ""}`}
                        onClick={() => onSelectScene(scene.id)}
                    >
                        <div className="scene-header">
                            <div className="scene-icon">
                                <Layers size={14} />
                            </div>
                            {editingId === scene.id ? (
                                <input
                                    type="text"
                                    className="scene-name-input"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onBlur={() => handleFinishEdit(scene.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleFinishEdit(scene.id);
                                        if (e.key === "Escape") setEditingId(null);
                                    }}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span
                                    className="scene-name"
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        handleStartEdit(scene);
                                    }}
                                >
                                    {scene.name}
                                </span>
                            )}
                            <div className="scene-actions">
                                <button
                                    className="scene-action-btn danger"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveScene(scene.id);
                                    }}
                                    title="Delete"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>

                        <div className="scene-thumbnail">
                            <div
                                className="thumbnail-grid"
                                style={{
                                    gridTemplateColumns: `repeat(${scene.layout === "solo"
                                            ? 1
                                            : scene.layout === "duo"
                                                ? 2
                                                : scene.layout === "quad" || scene.layout === "grid"
                                                    ? 2
                                                    : 2
                                        }, 1fr)`,
                                    gridTemplateRows: `repeat(${scene.layout === "solo" || scene.layout === "duo"
                                            ? 1
                                            : 2
                                        }, 1fr)`,
                                }}
                            >
                                {Array.from({
                                    length:
                                        scene.layout === "solo"
                                            ? 1
                                            : scene.layout === "duo"
                                                ? 2
                                                : scene.layout === "quad"
                                                    ? 4
                                                    : scene.layout === "grid"
                                                        ? 6
                                                        : 2,
                                }).map((_, i) => (
                                    <div key={i} className="thumbnail-cell" />
                                ))}
                            </div>
                        </div>

                        <div className="scene-footer">
                            <div
                                className="layout-badge"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowLayoutPicker(
                                        showLayoutPicker === scene.id ? null : scene.id
                                    );
                                }}
                            >
                                {getLayoutIcon(scene.layout)}
                                {LAYOUTS[scene.layout].name}
                            </div>
                            <span className="sources-count">
                                {scene.sources.length} source{scene.sources.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {showLayoutPicker === scene.id && (
                            <div
                                className="layout-picker"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="layout-grid">
                                    {(Object.entries(LAYOUTS) as [LayoutType, typeof LAYOUTS.solo][]).map(
                                        ([key, config]) => (
                                            <button
                                                key={key}
                                                className={`layout-option ${scene.layout === key ? "selected" : ""
                                                    }`}
                                                onClick={() => {
                                                    onChangeLayout(scene.id, key);
                                                    setShowLayoutPicker(null);
                                                }}
                                            >
                                                {getLayoutIcon(key)}
                                                <span>{config.name}</span>
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button className="add-scene-btn" onClick={onAddScene}>
                <Plus size={16} />
                Add Scene
            </button>
        </div>
    );
}
