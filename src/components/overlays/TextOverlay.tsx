"use client";

import { useState } from "react";
import { Type, Plus, Trash2, Eye, EyeOff } from "lucide-react";

interface TextOverlayProps {
    text: string;
    isVisible: boolean;
    position?: { x: number; y: number };
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    backgroundColor?: string;
    padding?: number;
    borderRadius?: number;
    animation?: "none" | "fadeIn" | "typewriter" | "scroll";
}

export function TextOverlay({
    text,
    isVisible,
    position = { x: 50, y: 10 },
    fontSize = 24,
    fontWeight = 600,
    color = "#ffffff",
    backgroundColor = "transparent",
    padding = 0,
    borderRadius = 0,
    animation = "none",
}: TextOverlayProps) {
    if (!isVisible) return null;

    const getAnimationStyles = () => {
        switch (animation) {
            case "fadeIn":
                return {
                    animation: "fadeIn 0.5s ease-out",
                };
            case "typewriter":
                return {
                    animation: `typewriter ${text.length * 0.05}s steps(${text.length})`,
                    overflow: "hidden",
                    whiteSpace: "nowrap" as const,
                };
            case "scroll":
                return {
                    animation: "scrollText 10s linear infinite",
                };
            default:
                return {};
        }
    };

    return (
        <div
            style={{
                position: "absolute",
                top: `${position.y}%`,
                left: `${position.x}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 15,
                ...getAnimationStyles(),
            }}
        >
            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes scrollText {
          0% { transform: translate(-50%, -50%) translateX(100vw); }
          100% { transform: translate(-50%, -50%) translateX(-100vw); }
        }
      `}</style>
            <span
                style={{
                    fontSize: `${fontSize}px`,
                    fontWeight,
                    color,
                    backgroundColor,
                    padding: padding > 0 ? `${padding}px ${padding * 2}px` : 0,
                    borderRadius: `${borderRadius}px`,
                    textShadow: backgroundColor === "transparent"
                        ? "0 2px 4px rgba(0,0,0,0.5)"
                        : "none",
                    fontFamily: "Inter, sans-serif",
                }}
            >
                {text}
            </span>
        </div>
    );
}

// Countdown Timer Overlay
interface CountdownOverlayProps {
    seconds: number;
    isVisible: boolean;
    onComplete?: () => void;
    format?: "full" | "minimal";
}

export function CountdownOverlay({
    seconds,
    isVisible,
    onComplete,
    format = "full",
}: CountdownOverlayProps) {
    const [timeLeft, setTimeLeft] = useState(seconds);

    useState(() => {
        if (!isVisible) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onComplete?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    });

    if (!isVisible || timeLeft === 0) return null;

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return format === "full"
            ? `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
            : `${s}`;
    };

    return (
        <div
            style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 25,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: format === "minimal" ? "120px" : "200px",
                    height: format === "minimal" ? "120px" : "200px",
                    background: "rgba(0, 0, 0, 0.8)",
                    borderRadius: "50%",
                    border: "4px solid rgba(255, 255, 255, 0.2)",
                }}
            >
                <span
                    style={{
                        fontSize: format === "minimal" ? "48px" : "64px",
                        fontWeight: 700,
                        color: timeLeft <= 5 ? "#ef4444" : "#fff",
                        fontFamily: "var(--font-family-mono)",
                    }}
                >
                    {formatTime(timeLeft)}
                </span>
            </div>
        </div>
    );
}

// Banner/Notification Overlay
interface BannerOverlayProps {
    text: string;
    isVisible: boolean;
    type?: "info" | "success" | "warning" | "error";
    position?: "top" | "bottom";
    icon?: React.ReactNode;
}

export function BannerOverlay({
    text,
    isVisible,
    type = "info",
    position = "top",
    icon,
}: BannerOverlayProps) {
    if (!isVisible) return null;

    const getTypeStyles = () => {
        switch (type) {
            case "success":
                return { background: "#22c55e", color: "#052e16" };
            case "warning":
                return { background: "#eab308", color: "#422006" };
            case "error":
                return { background: "#ef4444", color: "#fff" };
            default:
                return { background: "#3b82f6", color: "#fff" };
        }
    };

    const styles = getTypeStyles();

    return (
        <div
            style={{
                position: "absolute",
                [position]: 0,
                left: 0,
                right: 0,
                zIndex: 20,
                animation: "slideDown 0.3s ease-out",
            }}
        >
            <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(${position === "top" ? "-100%" : "100%"});
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    padding: "16px 24px",
                    background: styles.background,
                    color: styles.color,
                }}
            >
                {icon}
                <span
                    style={{
                        fontSize: "18px",
                        fontWeight: 600,
                        fontFamily: "Inter, sans-serif",
                    }}
                >
                    {text}
                </span>
            </div>
        </div>
    );
}

// Overlay Manager - For managing multiple overlays
interface OverlayItem {
    id: string;
    type: "text" | "logo" | "lowerThird" | "countdown" | "banner";
    isVisible: boolean;
    config: Record<string, any>;
}

interface OverlayManagerProps {
    overlays: OverlayItem[];
    onToggleVisibility: (id: string) => void;
    onRemove: (id: string) => void;
    onAdd: () => void;
}

export function OverlayManager({
    overlays,
    onToggleVisibility,
    onRemove,
    onAdd,
}: OverlayManagerProps) {
    return (
        <div className="overlay-manager">
            <style jsx>{`
        .overlay-manager {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .overlay-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .overlay-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-md);
        }

        .overlay-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: var(--color-bg-primary);
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
        }

        .overlay-info {
          flex: 1;
          min-width: 0;
        }

        .overlay-name {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-primary);
        }

        .overlay-type {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          text-transform: capitalize;
        }

        .overlay-actions {
          display: flex;
          gap: var(--space-1);
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: none;
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .action-btn:hover {
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
        }

        .action-btn.active {
          background: var(--color-accent-secondary);
          border-color: var(--color-accent-secondary);
          color: #fff;
        }

        .action-btn.danger:hover {
          background: hsla(0, 84%, 55%, 0.15);
          border-color: hsla(0, 84%, 55%, 0.3);
          color: var(--color-error);
        }

        .add-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-3);
          background: var(--color-bg-tertiary);
          border: 1px dashed var(--color-border-default);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .add-btn:hover {
          border-color: var(--color-accent-secondary);
          color: var(--color-accent-secondary);
        }
      `}</style>

            <div className="overlay-list">
                {overlays.map((overlay) => (
                    <div key={overlay.id} className="overlay-item">
                        <div className="overlay-icon">
                            <Type size={16} />
                        </div>
                        <div className="overlay-info">
                            <div className="overlay-name">
                                {overlay.config.text || overlay.config.name || "Overlay"}
                            </div>
                            <div className="overlay-type">{overlay.type}</div>
                        </div>
                        <div className="overlay-actions">
                            <button
                                className={`action-btn ${overlay.isVisible ? "active" : ""}`}
                                onClick={() => onToggleVisibility(overlay.id)}
                                title={overlay.isVisible ? "Hide" : "Show"}
                            >
                                {overlay.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button
                                className="action-btn danger"
                                onClick={() => onRemove(overlay.id)}
                                title="Remove"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button className="add-btn" onClick={onAdd}>
                <Plus size={16} />
                Add Overlay
            </button>
        </div>
    );
}
