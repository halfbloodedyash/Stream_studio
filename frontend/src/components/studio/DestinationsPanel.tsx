"use client";

import { useState, useEffect } from "react";
import {
    Wifi,
    Plus,
    Youtube,
    Twitch,
    Facebook,
    Linkedin,
    Globe,
    Settings,
    Trash2,
    X,
    Play,
    Square,
    AlertCircle,
    Check,
    RefreshCw,
    ExternalLink,
    Eye,
    EyeOff,
    Copy,
    Zap,
    Signal,
    CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { useToastStore } from "@/stores/toastStore";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface Destination {
    id: string;
    platform: "youtube" | "twitch" | "facebook" | "linkedin" | "custom";
    name: string;
    status: "idle" | "connecting" | "live" | "error" | "reconnecting";
    streamKey: string;
    streamUrl: string;
    egressId?: string; // LiveKit Egress ID when streaming
    error?: string;
    stats?: {
        bitrate: number;
        fps: number;
        droppedFrames: number;
        duration: number;
        connectionQuality: "excellent" | "good" | "fair" | "poor";
    };
}

const PLATFORM_PRESETS = {
    youtube: {
        name: "YouTube Live",
        url: "rtmp://a.rtmp.youtube.com/live2",
        backupUrl: "rtmp://b.rtmp.youtube.com/live2?backup=1",
        icon: Youtube,
        color: "bg-red-600",
        textColor: "text-red-500",
        borderColor: "border-red-500/30",
        helpUrl: "https://studio.youtube.com/channel/UC/livestreaming",
        features: ["Low Latency", "DVR", "Captions", "4K Support"],
    },
    twitch: {
        name: "Twitch",
        url: "rtmp://live.twitch.tv/app",
        backupUrl: null,
        icon: Twitch,
        color: "bg-purple-600",
        textColor: "text-purple-500",
        borderColor: "border-purple-500/30",
        helpUrl: "https://dashboard.twitch.tv/settings/stream",
        features: ["Low Latency", "Clips", "Chat Integration"],
    },
    facebook: {
        name: "Facebook Live",
        url: "rtmps://live-api-s.facebook.com:443/rtmp",
        backupUrl: null,
        icon: Facebook,
        color: "bg-blue-600",
        textColor: "text-blue-500",
        borderColor: "border-blue-500/30",
        helpUrl: "https://www.facebook.com/live/producer",
        features: ["DVR", "Crossposting", "Premieres"],
    },
    linkedin: {
        name: "LinkedIn Live",
        url: "rtmps://prod-global-rtmp.publish.live-video.net:443/rtmp",
        backupUrl: null,
        icon: Linkedin,
        color: "bg-sky-700",
        textColor: "text-sky-500",
        borderColor: "border-sky-500/30",
        helpUrl: "https://www.linkedin.com/video/golive",
        features: ["Professional Network", "B2B Audience"],
    },
    custom: {
        name: "Custom RTMP",
        url: "",
        backupUrl: null,
        icon: Globe,
        color: "bg-zinc-600",
        textColor: "text-zinc-400",
        borderColor: "border-zinc-500/30",
        helpUrl: "",
        features: ["Any RTMP Server", "Self-hosted"],
    },
};

type PlatformType = keyof typeof PLATFORM_PRESETS;

interface DestinationsPanelProps {
    roomName?: string; // LiveKit room name for egress
}

export function DestinationsPanel({ roomName }: DestinationsPanelProps) {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(null);
    const [showStreamKey, setShowStreamKey] = useState<Record<string, boolean>>({});
    const [testingConnection, setTestingConnection] = useState<string | null>(null);
    const [connectionTestResult, setConnectionTestResult] = useState<{
        success: boolean;
        latency?: number;
        error?: string;
    } | null>(null);

    const [newDestination, setNewDestination] = useState({
        name: "",
        streamKey: "",
        streamUrl: "",
    });

    const { addToast } = useToastStore();

    // Test connection before adding
    const testConnection = async () => {
        if (!selectedPlatform || !newDestination.streamKey) return;

        setTestingConnection("testing");
        setConnectionTestResult(null);

        try {
            const result = await apiClient.streaming.testConnection({
                platform: selectedPlatform,
                streamKey: newDestination.streamKey,
                rtmpUrl: selectedPlatform === "custom" ? newDestination.streamUrl : undefined,
            });

            setConnectionTestResult({
                success: result.success,
                latency: result.latency,
                error: result.error,
            });

            if (result.success) {
                addToast(`Connection successful! Latency: ${result.latency}ms`, "success");
            } else {
                addToast(`Connection failed: ${result.error}`, "error");
            }
        } catch (error: any) {
            setConnectionTestResult({
                success: false,
                error: error.message || "Connection test failed",
            });
            addToast(`Connection test failed: ${error.message}`, "error");
        } finally {
            setTestingConnection(null);
        }
    };

    const addDestination = async () => {
        if (!selectedPlatform || !newDestination.streamKey) return;

        const preset = PLATFORM_PRESETS[selectedPlatform];
        const dest: Destination = {
            id: Date.now().toString(),
            platform: selectedPlatform,
            name: newDestination.name || preset.name,
            status: "idle",
            streamKey: newDestination.streamKey,
            streamUrl: selectedPlatform === "custom" ? newDestination.streamUrl : preset.url,
        };

        setDestinations([...destinations, dest]);
        addToast(`${dest.name} added successfully`, "success");
        resetForm();
    };

    const removeDestination = (id: string) => {
        setDestinations(destinations.filter((d) => d.id !== id));
        addToast("Destination removed", "info");
    };

    const toggleDestinationStatus = async (id: string) => {
        const dest = destinations.find((d) => d.id === id);
        if (!dest) return;

        if (dest.status === "idle") {
            // Check if we have a room name for egress
            if (!roomName) {
                addToast("Cannot stream: No active room. Please join a room first.", "error");
                return;
            }

            // Start streaming using LiveKit Egress
            setDestinations(destinations.map((d) =>
                d.id === id ? { ...d, status: "connecting" as const, error: undefined } : d
            ));

            try {
                console.log(`[DESTINATIONS] Starting egress for room: ${roomName}`);
                console.log(`[DESTINATIONS] RTMP URL: ${dest.streamUrl}`);

                // Use LiveKit Egress API for actual streaming
                const result = await apiClient.egress.startStream({
                    roomName: roomName,
                    rtmpUrl: dest.streamUrl,
                    streamKey: dest.streamKey,
                });

                console.log(`[DESTINATIONS] Egress started! ID: ${result.egressId}`);

                setDestinations((prev) =>
                    prev.map((d) =>
                        d.id === id
                            ? {
                                ...d,
                                status: "live" as const,
                                egressId: result.egressId,
                                stats: {
                                    bitrate: 4500,
                                    fps: 30,
                                    droppedFrames: 0,
                                    duration: 0,
                                    connectionQuality: "excellent" as const,
                                },
                            }
                            : d
                    )
                );
                addToast(`Now streaming to ${dest.name}!`, "success");
            } catch (error: any) {
                console.error(`[DESTINATIONS] Egress error:`, error);
                setDestinations((prev) =>
                    prev.map((d) =>
                        d.id === id
                            ? { ...d, status: "error" as const, error: error.message }
                            : d
                    )
                );
                addToast(`Failed to start stream: ${error.message}`, "error");
            }
        } else if (dest.status === "live" && dest.egressId) {
            // Stop streaming using LiveKit Egress
            try {
                console.log(`[DESTINATIONS] Stopping egress: ${dest.egressId}`);
                await apiClient.egress.stopStream(dest.egressId);

                setDestinations((prev) =>
                    prev.map((d) =>
                        d.id === id
                            ? { ...d, status: "idle" as const, stats: undefined, egressId: undefined }
                            : d
                    )
                );
                addToast(`Stopped streaming to ${dest.name}`, "info");
            } catch (error: any) {
                console.error(`[DESTINATIONS] Stop egress error:`, error);
                addToast(`Failed to stop stream: ${error.message}`, "error");
            }
        } else if (dest.status === "live") {
            // No egress ID, just reset status
            setDestinations((prev) =>
                prev.map((d) =>
                    d.id === id
                        ? { ...d, status: "idle" as const, stats: undefined }
                        : d
                )
            );
            addToast(`Stopped streaming to ${dest.name}`, "info");
        }
    };

    const resetForm = () => {
        setIsAddOpen(false);
        setSelectedPlatform(null);
        setNewDestination({ name: "", streamKey: "", streamUrl: "" });
        setConnectionTestResult(null);
    };

    const copyStreamKey = async (streamKey: string) => {
        await navigator.clipboard.writeText(streamKey);
        addToast("Stream key copied!", "success");
    };

    const getPlatformIcon = (platform: PlatformType) => {
        const Icon = PLATFORM_PRESETS[platform].icon;
        return <Icon className="w-5 h-5" />;
    };

    const getStatusBadge = (status: Destination["status"]) => {
        switch (status) {
            case "live":
                return (
                    <Badge className="bg-destructive text-white border-none gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        LIVE
                    </Badge>
                );
            case "connecting":
                return (
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Connecting
                    </Badge>
                );
            case "reconnecting":
                return (
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Reconnecting
                    </Badge>
                );
            case "error":
                return (
                    <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Error
                    </Badge>
                );
            default:
                return <Badge variant="secondary">Ready</Badge>;
        }
    };

    const getConnectionQualityBadge = (quality: Destination["stats"] extends undefined ? never : NonNullable<Destination["stats"]>["connectionQuality"]) => {
        const configs = {
            excellent: { color: "text-green-500", icon: Signal, label: "Excellent" },
            good: { color: "text-emerald-500", icon: Signal, label: "Good" },
            fair: { color: "text-yellow-500", icon: Signal, label: "Fair" },
            poor: { color: "text-red-500", icon: Signal, label: "Poor" },
        };

        const config = configs[quality];
        return (
            <span className={cn("flex items-center gap-1 text-[10px] font-medium", config.color)}>
                <config.icon className="w-3 h-3" />
                {config.label}
            </span>
        );
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // Update stats for live destinations
    useEffect(() => {
        const interval = setInterval(() => {
            setDestinations((prev) =>
                prev.map((d) => {
                    if (d.status === "live" && d.stats) {
                        return {
                            ...d,
                            stats: {
                                ...d.stats,
                                duration: d.stats.duration + 1,
                                bitrate: 4500 + Math.floor(Math.random() * 200 - 100),
                                droppedFrames: d.stats.droppedFrames + (Math.random() > 0.95 ? 1 : 0),
                            },
                        };
                    }
                    return d;
                })
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-6 p-1">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                    <Wifi className="w-4 h-4 text-primary" />
                    <span>Destinations</span>
                    {destinations.filter((d) => d.status === "live").length > 0 && (
                        <Badge className="bg-destructive text-white text-[9px] px-1.5 py-0 h-4">
                            {destinations.filter((d) => d.status === "live").length} LIVE
                        </Badge>
                    )}
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 text-[10px] font-bold uppercase tracking-tighter">
                            <Plus className="w-3 h-3" />
                            Add
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Add Streaming Destination</DialogTitle>
                            <DialogDescription>
                                Connect to YouTube, Twitch, Facebook, LinkedIn, or a custom RTMP server.
                            </DialogDescription>
                        </DialogHeader>

                        {!selectedPlatform ? (
                            <div className="grid grid-cols-3 gap-3 py-4">
                                {(Object.keys(PLATFORM_PRESETS) as PlatformType[]).map((key) => {
                                    const preset = PLATFORM_PRESETS[key];
                                    const Icon = preset.icon;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedPlatform(key)}
                                            className={cn(
                                                "flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-border/40 hover:border-primary/40 hover:bg-secondary/20 transition-all",
                                                "focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            )}
                                        >
                                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg", preset.color)}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <span className="text-xs font-bold text-center">{preset.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-4 py-4">
                                {/* Selected Platform Header */}
                                <div className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border",
                                    PLATFORM_PRESETS[selectedPlatform].borderColor,
                                    "bg-secondary/20"
                                )}>
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", PLATFORM_PRESETS[selectedPlatform].color)}>
                                        {getPlatformIcon(selectedPlatform)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold">{PLATFORM_PRESETS[selectedPlatform].name}</p>
                                        <div className="flex gap-2 mt-1">
                                            {PLATFORM_PRESETS[selectedPlatform].features.slice(0, 3).map((feature) => (
                                                <span key={feature} className="text-[9px] px-1.5 py-0.5 bg-primary/10 rounded text-primary font-medium">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                        setSelectedPlatform(null);
                                        setConnectionTestResult(null);
                                    }}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Display Name (optional)</Label>
                                        <Input
                                            id="name"
                                            placeholder={PLATFORM_PRESETS[selectedPlatform].name}
                                            value={newDestination.name}
                                            onChange={(e) => setNewDestination({ ...newDestination, name: e.target.value })}
                                        />
                                    </div>

                                    {selectedPlatform === "custom" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="url">RTMP Server URL</Label>
                                            <Input
                                                id="url"
                                                placeholder="rtmp://your-server.com/live"
                                                value={newDestination.streamUrl}
                                                onChange={(e) => setNewDestination({ ...newDestination, streamUrl: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="key">Stream Key</Label>
                                            {PLATFORM_PRESETS[selectedPlatform].helpUrl && (
                                                <a
                                                    href={PLATFORM_PRESETS[selectedPlatform].helpUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                                                >
                                                    Get your stream key
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                        <Input
                                            id="key"
                                            type="password"
                                            placeholder="Enter your stream key"
                                            value={newDestination.streamKey}
                                            onChange={(e) => {
                                                setNewDestination({ ...newDestination, streamKey: e.target.value });
                                                setConnectionTestResult(null);
                                            }}
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Find this in your {PLATFORM_PRESETS[selectedPlatform].name} streaming settings. Keep it private!
                                        </p>
                                    </div>

                                    {/* Connection Test Result */}
                                    {connectionTestResult && (
                                        <div className={cn(
                                            "p-3 rounded-lg border flex items-center gap-3",
                                            connectionTestResult.success
                                                ? "bg-green-500/10 border-green-500/30"
                                                : "bg-red-500/10 border-red-500/30"
                                        )}>
                                            {connectionTestResult.success ? (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                    <div>
                                                        <p className="text-sm font-medium text-green-500">Connection Successful!</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Latency: {connectionTestResult.latency}ms
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                                    <div>
                                                        <p className="text-sm font-medium text-red-500">Connection Failed</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {connectionTestResult.error}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="flex gap-2 pt-2">
                                    <Button variant="outline" onClick={resetForm} className="flex-1">
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={testConnection}
                                        disabled={!newDestination.streamKey || testingConnection === "testing"}
                                        className="flex-1 gap-2"
                                    >
                                        {testingConnection === "testing" ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Testing...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-4 h-4" />
                                                Test Connection
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={addDestination}
                                        disabled={!newDestination.streamKey || (selectedPlatform === "custom" && !newDestination.streamUrl)}
                                        className="flex-1 gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            {destinations.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center gap-5 border border-dashed border-border rounded-2xl bg-secondary/5">
                    <div className="bg-muted/10 p-5 rounded-full border border-border/40">
                        <Wifi className="w-8 h-8 text-muted-foreground/20" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold tracking-tight">No Destinations</h4>
                        <p className="text-[11px] text-muted-foreground/60 max-w-[200px] leading-relaxed mx-auto">
                            Simulcast to YouTube, Twitch, Facebook, LinkedIn, or custom RTMP servers.
                        </p>
                    </div>
                    <Button variant="secondary" onClick={() => setIsAddOpen(true)} className="rounded-xl px-6 h-9 font-bold gap-2 text-xs">
                        <Plus className="w-3.5 h-3.5" />
                        Add Destination
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {destinations.map((dest) => (
                        <Card
                            key={dest.id}
                            className={cn(
                                "group relative overflow-hidden rounded-xl border transition-all",
                                dest.status === "live"
                                    ? PLATFORM_PRESETS[dest.platform].borderColor
                                    : "border-border/40",
                                dest.status === "live"
                                    ? "bg-card/80"
                                    : "bg-card/60 hover:bg-secondary/10"
                            )}
                        >
                            <div className="p-3 flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105",
                                    PLATFORM_PRESETS[dest.platform].color
                                )}>
                                    {getPlatformIcon(dest.platform)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h5 className="text-xs font-bold truncate leading-none">{dest.name}</h5>
                                        {getStatusBadge(dest.status)}
                                    </div>
                                    <p className="text-[9px] text-muted-foreground/60 font-medium uppercase tracking-tighter mt-1">
                                        {dest.platform} • {dest.status === "live" ? formatDuration(dest.stats?.duration || 0) : "Ready"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Stream Stats (when live) */}
                                    {dest.status === "live" && dest.stats && (
                                        <div className="hidden lg:flex items-center gap-3 mr-2">
                                            <div className="text-right">
                                                <p className="text-[9px] text-muted-foreground uppercase">Bitrate</p>
                                                <p className="text-xs font-mono font-bold">{dest.stats.bitrate} kbps</p>
                                            </div>
                                            <Separator orientation="vertical" className="h-6" />
                                            <div className="text-right">
                                                <p className="text-[9px] text-muted-foreground uppercase">Quality</p>
                                                {getConnectionQualityBadge(dest.stats.connectionQuality)}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-1">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant={dest.status === "live" ? "destructive" : "default"}
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg"
                                                        onClick={() => toggleDestinationStatus(dest.id)}
                                                        disabled={dest.status === "connecting" || dest.status === "reconnecting"}
                                                    >
                                                        {dest.status === "live" ? (
                                                            <Square className="w-3.5 h-3.5" />
                                                        ) : dest.status === "connecting" || dest.status === "reconnecting" ? (
                                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Play className="w-3.5 h-3.5" />
                                                        )}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {dest.status === "live" ? "Stop Streaming" : "Start Streaming"}
                                                </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                                        onClick={() => setShowStreamKey({
                                                            ...showStreamKey,
                                                            [dest.id]: !showStreamKey[dest.id],
                                                        })}
                                                    >
                                                        {showStreamKey[dest.id] ? (
                                                            <EyeOff className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <Eye className="w-3.5 h-3.5" />
                                                        )}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {showStreamKey[dest.id] ? "Hide Stream Key" : "Show Stream Key"}
                                                </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => removeDestination(dest.id)}
                                                        disabled={dest.status === "live"}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Remove</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                            </div>

                            {/* Stream Key Row */}
                            {showStreamKey[dest.id] && (
                                <div className="px-3 pb-3">
                                    <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                                        <code className="flex-1 text-[10px] font-mono text-muted-foreground truncate">
                                            {dest.streamKey}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => copyStreamKey(dest.streamKey)}
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {dest.error && (
                                <div className="px-3 pb-3">
                                    <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg text-destructive text-xs">
                                        <AlertCircle className="w-4 h-4" />
                                        {dest.error}
                                    </div>
                                </div>
                            )}

                            {/* Status indicator bar */}
                            <div className={cn(
                                "absolute bottom-0 left-0 h-0.5 transition-all duration-500",
                                dest.status === "live" ? "w-full bg-destructive" :
                                    dest.status === "connecting" ? "w-1/2 bg-amber-500 animate-pulse" :
                                        dest.status === "reconnecting" ? "w-3/4 bg-amber-500 animate-pulse" :
                                            dest.status === "error" ? "w-full bg-destructive" : "w-0"
                            )} />
                        </Card>
                    ))}

                    {/* Quick Stats Summary */}
                    <div className="mt-4 p-3 bg-secondary/10 rounded-xl border border-border/20">
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground uppercase tracking-wider font-medium">Total Destinations</span>
                            <span className="font-bold">{destinations.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] mt-1.5">
                            <span className="text-muted-foreground uppercase tracking-wider font-medium">Active Streams</span>
                            <span className="font-bold text-destructive">{destinations.filter((d) => d.status === "live").length}</span>
                        </div>
                        {destinations.some((d) => d.status === "live") && (
                            <div className="flex items-center justify-between text-[10px] mt-1.5">
                                <span className="text-muted-foreground uppercase tracking-wider font-medium">Total Bitrate</span>
                                <span className="font-bold font-mono">
                                    {destinations
                                        .filter((d) => d.status === "live" && d.stats)
                                        .reduce((acc, d) => acc + (d.stats?.bitrate || 0), 0)} kbps
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
