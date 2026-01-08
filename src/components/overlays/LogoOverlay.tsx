"use client";

import { useState, useRef, useEffect } from "react";
import { Move, X, RotateCcw, Upload } from "lucide-react";

interface LogoOverlayProps {
    src: string;
    alt?: string;
    isVisible: boolean;
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "custom";
    customPosition?: { x: number; y: number };
    size?: number; // percentage of canvas width
    opacity?: number;
    isDraggable?: boolean;
    onPositionChange?: (position: { x: number; y: number }) => void;
    onRemove?: () => void;
}

export function LogoOverlay({
    src,
    alt = "Logo",
    isVisible,
    position = "top-right",
    customPosition,
    size = 10,
    opacity = 1,
    isDraggable = false,
    onPositionChange,
    onRemove,
}: LogoOverlayProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [localPosition, setLocalPosition] = useState(
        customPosition || { x: 0, y: 0 }
    );
    const containerRef = useRef<HTMLDivElement>(null);

    const getPositionStyles = (): React.CSSProperties => {
        if (position === "custom" && customPosition) {
            return {
                top: `${customPosition.y}%`,
                left: `${customPosition.x}%`,
                transform: "translate(-50%, -50%)",
            };
        }

        const margin = "24px";
        switch (position) {
            case "top-left":
                return { top: margin, left: margin };
            case "top-right":
                return { top: margin, right: margin };
            case "bottom-left":
                return { bottom: margin, left: margin };
            case "bottom-right":
                return { bottom: margin, right: margin };
            default:
                return { top: margin, right: margin };
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isDraggable) return;
        e.preventDefault();
        setIsDragging(true);
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const parent = containerRef.current?.parentElement;
            if (!parent) return;

            const parentRect = parent.getBoundingClientRect();
            const newX = ((e.clientX - parentRect.left - dragOffset.x) / parentRect.width) * 100;
            const newY = ((e.clientY - parentRect.top - dragOffset.y) / parentRect.height) * 100;

            const clampedX = Math.max(0, Math.min(100, newX));
            const clampedY = Math.max(0, Math.min(100, newY));

            setLocalPosition({ x: clampedX, y: clampedY });
            onPositionChange?.({ x: clampedX, y: clampedY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, dragOffset, onPositionChange]);

    if (!isVisible) return null;

    return (
        <div
            ref={containerRef}
            className={`logo-overlay ${isDragging ? "dragging" : ""} ${isDraggable ? "draggable" : ""}`}
            style={{
                position: "absolute",
                ...getPositionStyles(),
                ...(position === "custom" ? { top: `${localPosition.y}%`, left: `${localPosition.x}%` } : {}),
                zIndex: 15,
                opacity,
                transition: isDragging ? "none" : "all 0.2s ease",
                cursor: isDraggable ? (isDragging ? "grabbing" : "grab") : "default",
            }}
            onMouseDown={handleMouseDown}
        >
            <style jsx>{`
        .logo-overlay {
          position: relative;
        }

        .logo-overlay.draggable:hover .logo-controls {
          opacity: 1;
        }

        .logo-controls {
          position: absolute;
          top: -32px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .logo-control-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: rgba(0, 0, 0, 0.8);
          border: none;
          border-radius: 4px;
          color: #fff;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .logo-control-btn:hover {
          background: rgba(59, 130, 246, 0.8);
        }

        .logo-control-btn.danger:hover {
          background: rgba(239, 68, 68, 0.8);
        }

        img {
          width: ${size}%;
          min-width: 60px;
          max-width: 200px;
          height: auto;
          user-select: none;
          pointer-events: none;
        }
      `}</style>

            {isDraggable && (
                <div className="logo-controls">
                    <button className="logo-control-btn" title="Drag to move">
                        <Move size={12} />
                    </button>
                    <button className="logo-control-btn danger" onClick={onRemove} title="Remove">
                        <X size={12} />
                    </button>
                </div>
            )}

            <img src={src} alt={alt} draggable={false} />
        </div>
    );
}

// Logo Uploader Component
interface LogoUploaderProps {
    onUpload: (file: File, dataUrl: string) => void;
    currentLogo?: string;
}

export function LogoUploader({ onUpload, currentLogo }: LogoUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(currentLogo || null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            alert("Please upload an image file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setPreview(dataUrl);
            onUpload(file, dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className="logo-uploader">
            <style jsx>{`
        .logo-uploader {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .upload-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-6);
          background: var(--color-bg-tertiary);
          border: 2px dashed var(--color-border-default);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .upload-zone:hover,
        .upload-zone.dragover {
          border-color: var(--color-accent-secondary);
          background: hsla(217, 91%, 60%, 0.1);
        }

        .upload-zone svg {
          color: var(--color-text-muted);
        }

        .upload-text {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          text-align: center;
        }

        .upload-hint {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        .preview-container {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
        }

        .preview-image {
          width: 64px;
          height: 64px;
          object-fit: contain;
          border-radius: var(--radius-sm);
          background: var(--color-bg-primary);
        }

        .preview-actions {
          display: flex;
          gap: var(--space-2);
        }
      `}</style>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                style={{ display: "none" }}
            />

            {preview ? (
                <div className="preview-container">
                    <img src={preview} alt="Logo preview" className="preview-image" />
                    <div className="preview-actions">
                        <button
                            onClick={() => inputRef.current?.click()}
                            style={{
                                padding: "8px 12px",
                                background: "var(--color-bg-hover)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "var(--radius-sm)",
                                color: "var(--color-text-primary)",
                                fontSize: "var(--text-sm)",
                                cursor: "pointer",
                            }}
                        >
                            <RotateCcw size={14} style={{ marginRight: "4px" }} />
                            Replace
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className={`upload-zone ${isDragOver ? "dragover" : ""}`}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                >
                    <Upload size={32} />
                    <span className="upload-text">
                        Click to upload or drag and drop
                    </span>
                    <span className="upload-hint">PNG, JPG up to 2MB</span>
                </div>
            )}
        </div>
    );
}
