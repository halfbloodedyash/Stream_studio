"use client";

import { useState, useEffect } from "react";
import {
    Activity,
    Wifi,
    WifiOff,
    Clock,
    ArrowUp,
    ArrowDown,
    Signal,
    Monitor,
    Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        packetsLost?: number;
        jitter?: number;
        roundTripTime?: number;
        resolution?: { width: number; height: number };
        codec?: string;
        isConnected?: boolean;
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
                return "text-green-500";
            case "good":
                return "text-lime-500";
            case "fair":
                return "text-amber-500";
            case "poor":
                return "text-red-500";
        }
    };

    const getQualityBgColor = () => {
        switch (quality) {
            case "excellent":
                return "bg-green-500/10 border-green-500/20";
            case "good":
                return "bg-lime-500/10 border-lime-500/20";
            case "fair":
                return "bg-amber-500/10 border-amber-500/20";
            case "poor":
                return "bg-red-500/10 border-red-500/20";
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

    const formatResolution = () => {
        if (!stats.resolution || stats.resolution.width === 0) return "N/A";
        return `${stats.resolution.width}×${stats.resolution.height}`;
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Quality Badge */}
            <div className={cn(
                "flex items-center justify-between p-3 rounded-xl border",
                isLive ? getQualityBgColor() : "bg-secondary/20 border-border/40"
            )}>
                <div className="flex items-center gap-2">
                    <Signal className={cn("w-4 h-4", isLive ? getQualityColor() : "text-muted-foreground")} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                        Connection
                    </span>
                </div>
                <div className={cn(
                    "flex items-center gap-1.5 text-xs font-bold uppercase",
                    isLive ? getQualityColor() : "text-muted-foreground"
                )}>
                    <span className={cn(
                        "w-2 h-2 rounded-full",
                        isLive ? "bg-current animate-pulse" : "bg-muted-foreground/50"
                    )} />
                    {isLive ? quality : "Offline"}
                </div>
            </div>

            {isLive ? (
                <>
                    {/* Primary Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard
                            icon={ArrowUp}
                            label="Bitrate"
                            value={formatBitrate(stats.bitrate)}
                            subValue={`/ ${formatBitrate(stats.targetBitrate)}`}
                        />
                        <StatCard
                            icon={Activity}
                            label="Frame Rate"
                            value={`${stats.fps.toFixed(1)} fps`}
                            subValue={`/ ${stats.targetFps} fps`}
                        />
                        <StatCard
                            icon={Clock}
                            label="Duration"
                            value={formatDuration(stats.duration)}
                        />
                        <StatCard
                            icon={ArrowDown}
                            label="Dropped"
                            value={`${stats.droppedFrames}`}
                            warning={stats.droppedFrames > 10}
                        />
                    </div>

                    {/* Bitrate Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                            <span>Bitrate Utilization</span>
                            <span>{Math.round((stats.bitrate / stats.targetBitrate) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    quality === "excellent" ? "bg-green-500" :
                                        quality === "good" ? "bg-lime-500" :
                                            quality === "fair" ? "bg-amber-500" : "bg-red-500"
                                )}
                                style={{ width: `${Math.min(100, (stats.bitrate / stats.targetBitrate) * 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Secondary Stats */}
                    <div className="pt-2 border-t border-border/40 space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Connection Details
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Resolution</span>
                                <span className="font-mono font-medium">{formatResolution()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Codec</span>
                                <span className="font-mono font-medium">{stats.codec || "H.264"}</span>
                            </div>
                            {stats.roundTripTime !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Latency</span>
                                    <span className="font-mono font-medium">{Math.round(stats.roundTripTime)} ms</span>
                                </div>
                            )}
                            {stats.jitter !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Jitter</span>
                                    <span className="font-mono font-medium">{stats.jitter.toFixed(1)} ms</span>
                                </div>
                            )}
                            {stats.packetsLost !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Packets Lost</span>
                                    <span className={cn(
                                        "font-mono font-medium",
                                        stats.packetsLost > 100 ? "text-red-500" : ""
                                    )}>{stats.packetsLost}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                    <div className="p-4 rounded-full bg-muted/20 border border-border/40">
                        <WifiOff className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Not Streaming</p>
                        <p className="text-xs text-muted-foreground/60">
                            Click "Go Live" to start broadcasting
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper component for stat cards
function StatCard({
    icon: Icon,
    label,
    value,
    subValue,
    warning
}: {
    icon: any;
    label: string;
    value: string;
    subValue?: string;
    warning?: boolean;
}) {
    return (
        <div className="p-3 rounded-xl bg-secondary/20 border border-border/40">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                    <Icon className="w-3 h-3 text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {label}
                </span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className={cn(
                    "text-lg font-bold font-mono",
                    warning ? "text-red-500" : "text-foreground"
                )}>{value}</span>
                {subValue && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                        {subValue}
                    </span>
                )}
            </div>
        </div>
    );
}
