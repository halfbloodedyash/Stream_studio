"use client";

import { useState, useEffect } from "react";
import {
    Activity,
    Wifi,
    WifiOff,
    HardDrive,
    Cpu,
    Clock,
    ArrowUp,
    ArrowDown,
} from "lucide-react";

interface StreamHealthProps {
    isLive: boolean;
    stats: {
        bitrate: number; // current bitrate in kbps
        targetBitrate: number; // target bitrate in kbps
        fps: number;
        targetFps: number;
        droppedFrames: number;
        duration: number; // seconds
        cpuUsage?: number; // percentage
        memoryUsage?: number; // percentage
    };
}

export function StreamHealth({ isLive, stats }: StreamHealthProps) {
    const [quality, setQuality] = useState<"excellent" | "good" | "fair" | "poor">("excellent");

    useEffect(() => {
        // Calculate quality based on stats
        const bitrateRatio = stats.bitrate / stats.targetBitrate;
        const fpsRatio = stats.fps / stats.targetFps;
        const droppedRatio = stats.droppedFrames / (stats.duration || 1);

        if (bitrateRatio >= 0.9 && fpsRatio >= 0.95 && droppedRatio < 0.01) {
            setQuality("excellent");
        } else if (bitrateRatio >= 0.75 && fpsRatio >= 0.85 && droppedRatio < 0.03) {
            setQuality("good");
        } else if (bitrateRatio >= 0.5 && fpsRatio >= 0.7 && droppedRatio < 0.05) {
            setQuality("fair");
        } else {
            setQuality("poor");
        }
    }, [stats]);

    const getQualityColor = () => {
        switch (quality) {
            case "excellent":
                return "var(--color-success)";
            case "good":
                return "#84cc16"; // lime
            case "fair":
                return "var(--color-warning)";
            case "poor":
                return "var(--color-error)";
        }
    };

    const formatBitrate = (kbps: number) => {
        if (kbps >= 1000) {
            return `${(kbps / 1000).toFixed(1)} Mbps`;
        }
        return `${kbps} Kbps`;
    };

    const formatDuration = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="stream-health">
            <style jsx>{`
        .stream-health {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          padding: var(--space-3);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
        }

        .health-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .health-title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
        }

        .quality-badge {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--font-medium);
          text-transform: capitalize;
        }

        .quality-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-2);
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2);
          background: var(--color-bg-primary);
          border-radius: var(--radius-sm);
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: var(--color-bg-secondary);
          border-radius: var(--radius-sm);
          color: var(--color-text-muted);
        }

        .stat-content {
          flex: 1;
          min-width: 0;
        }

        .stat-label {
          font-size: 10px;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }

        .stat-value {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-primary);
          font-family: var(--font-family-mono);
        }

        .bitrate-bar {
          height: 4px;
          margin-top: var(--space-2);
          background: var(--color-bg-primary);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .bitrate-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.3s ease;
        }

        .offline-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-4);
          color: var(--color-text-muted);
        }

        .offline-state p {
          font-size: var(--text-sm);
        }
      `}</style>

            <div className="health-header">
                <span className="health-title">
                    <Activity size={14} />
                    Stream Health
                </span>
                {isLive && (
                    <span
                        className="quality-badge"
                        style={{
                            background: `${getQualityColor()}20`,
                            color: getQualityColor(),
                        }}
                    >
                        <span className="quality-dot" style={{ background: getQualityColor() }} />
                        {quality}
                    </span>
                )}
            </div>

            {isLive ? (
                <>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-icon">
                                <ArrowUp size={14} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Bitrate</div>
                                <div className="stat-value">{formatBitrate(stats.bitrate)}</div>
                            </div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-icon">
                                <Activity size={14} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Frame Rate</div>
                                <div className="stat-value">{stats.fps.toFixed(1)} fps</div>
                            </div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-icon">
                                <Clock size={14} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Duration</div>
                                <div className="stat-value">{formatDuration(stats.duration)}</div>
                            </div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-icon">
                                <ArrowDown size={14} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Dropped</div>
                                <div className="stat-value">{stats.droppedFrames}</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "4px",
                                fontSize: "var(--text-xs)",
                                color: "var(--color-text-muted)",
                            }}
                        >
                            <span>Bitrate</span>
                            <span>{Math.round((stats.bitrate / stats.targetBitrate) * 100)}%</span>
                        </div>
                        <div className="bitrate-bar">
                            <div
                                className="bitrate-fill"
                                style={{
                                    width: `${Math.min(100, (stats.bitrate / stats.targetBitrate) * 100)}%`,
                                    background: getQualityColor(),
                                }}
                            />
                        </div>
                    </div>
                </>
            ) : (
                <div className="offline-state">
                    <WifiOff size={24} />
                    <p>Not streaming</p>
                </div>
            )}
        </div>
    );
}
