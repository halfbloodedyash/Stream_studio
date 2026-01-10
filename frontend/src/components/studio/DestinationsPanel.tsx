"use client";

import { useState } from "react";
import { Wifi, Plus, Youtube, Twitch, Facebook, Globe, Settings, Trash2, X, Play, Square, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
} from "@/components/ui/dialog";

interface Destination {
    id: string;
    platform: "youtube" | "twitch" | "facebook" | "custom";
    name: string;
    status: "idle" | "connecting" | "live" | "error";
    streamKey?: string;
    streamUrl?: string;
}

const PLATFORM_PRESETS = {
    youtube: {
        name: "YouTube Live",
        url: "rtmp://a.rtmp.youtube.com/live2",
        icon: Youtube,
        color: "bg-red-600",
        textColor: "text-red-600",
    },
    twitch: {
        name: "Twitch",
        url: "rtmp://live.twitch.tv/app",
        icon: Twitch,
        color: "bg-purple-600",
        textColor: "text-purple-600",
    },
    facebook: {
        name: "Facebook Live",
        url: "rtmps://live-api-s.facebook.com:443/rtmp",
        icon: Facebook,
        color: "bg-blue-600",
        textColor: "text-blue-600",
    },
    custom: {
        name: "Custom RTMP",
        url: "",
        icon: Globe,
        color: "bg-zinc-600",
        textColor: "text-zinc-400",
    },
};

export function DestinationsPanel() {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<keyof typeof PLATFORM_PRESETS | null>(null);
    const [newDestination, setNewDestination] = useState({
        name: "",
        streamKey: "",
        streamUrl: "",
    });

    const addDestination = () => {
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
        resetForm();
    };

    const removeDestination = (id: string) => {
        setDestinations(destinations.filter((d) => d.id !== id));
    };

    const toggleDestinationStatus = (id: string) => {
        setDestinations(destinations.map((d) => {
            if (d.id !== id) return d;
            // Simulate status toggle: idle -> connecting -> live, or live -> idle
            if (d.status === "idle") {
                // Simulate connection
                setTimeout(() => {
                    setDestinations((prev) =>
                        prev.map((dest) =>
                            dest.id === id ? { ...dest, status: "live" as const } : dest
                        )
                    );
                }, 1500);
                return { ...d, status: "connecting" as const };
            }
            return { ...d, status: "idle" as const };
        }));
    };

    const resetForm = () => {
        setIsAddOpen(false);
        setSelectedPlatform(null);
        setNewDestination({ name: "", streamKey: "", streamUrl: "" });
    };

    const getPlatformIcon = (platform: keyof typeof PLATFORM_PRESETS) => {
        const Icon = PLATFORM_PRESETS[platform].icon;
        return <Icon className="w-5 h-5" />;
    };

    const getStatusBadge = (status: Destination["status"]) => {
        switch (status) {
            case "live":
                return <Badge className="bg-destructive text-white border-none animate-pulse">LIVE</Badge>;
            case "connecting":
                return <Badge variant="outline" className="text-amber-500 border-amber-500/20 animate-pulse">CONNECTING</Badge>;
            case "error":
                return <Badge variant="destructive">ERROR</Badge>;
            default:
                return <Badge variant="secondary">READY</Badge>;
        }
    };

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
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Streaming Destination</DialogTitle>
                            <DialogDescription>
                                Connect to YouTube, Twitch, Facebook, or a custom RTMP server.
                            </DialogDescription>
                        </DialogHeader>

                        {!selectedPlatform ? (
                            <div className="grid grid-cols-2 gap-3 py-4">
                                {(Object.keys(PLATFORM_PRESETS) as Array<keyof typeof PLATFORM_PRESETS>).map((key) => {
                                    const preset = PLATFORM_PRESETS[key];
                                    const Icon = preset.icon;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedPlatform(key)}
                                            className={cn(
                                                "flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border/40 hover:border-primary/40 hover:bg-secondary/20 transition-all",
                                                "focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            )}
                                        >
                                            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center text-white", preset.color)}>
                                                <Icon className="w-7 h-7" />
                                            </div>
                                            <span className="text-sm font-bold">{preset.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-4 py-4">
                                <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl">
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", PLATFORM_PRESETS[selectedPlatform].color)}>
                                        {getPlatformIcon(selectedPlatform)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{PLATFORM_PRESETS[selectedPlatform].name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Selected Platform</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => setSelectedPlatform(null)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-3">
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
                                        <Label htmlFor="key">Stream Key</Label>
                                        <Input
                                            id="key"
                                            type="password"
                                            placeholder="Enter your stream key"
                                            value={newDestination.streamKey}
                                            onChange={(e) => setNewDestination({ ...newDestination, streamKey: e.target.value })}
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Find this in your {PLATFORM_PRESETS[selectedPlatform].name} streaming settings.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" onClick={resetForm} className="flex-1">
                                        Cancel
                                    </Button>
                                    <Button onClick={addDestination} disabled={!newDestination.streamKey} className="flex-1">
                                        Add Destination
                                    </Button>
                                </div>
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
                        <p className="text-[11px] text-muted-foreground/60 max-w-[180px] leading-relaxed mx-auto">
                            Simulcast to YouTube, Twitch, Facebook, or custom servers.
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
                        <Card key={dest.id} className="group relative overflow-hidden rounded-xl border-border/40 bg-card/60 transition-all hover:bg-secondary/10">
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
                                        {dest.platform} • {dest.status === "live" ? "Streaming" : "Ready"}
                                    </p>
                                </div>

                                <div className="flex gap-1">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant={dest.status === "live" ? "destructive" : "default"}
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg"
                                                    onClick={() => toggleDestinationStatus(dest.id)}
                                                    disabled={dest.status === "connecting"}
                                                >
                                                    {dest.status === "live" ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{dest.status === "live" ? "Stop" : "Start"}</TooltipContent>
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

                            {/* Status indicator bar */}
                            <div className={cn(
                                "absolute bottom-0 left-0 h-0.5 transition-all duration-500",
                                dest.status === "live" ? "w-full bg-destructive" :
                                    dest.status === "connecting" ? "w-1/2 bg-amber-500 animate-pulse" : "w-0"
                            )} />
                        </Card>
                    ))}

                    {/* Quick Stats */}
                    <div className="mt-4 p-3 bg-secondary/10 rounded-xl border border-border/20">
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground uppercase tracking-wider font-medium">Total Destinations</span>
                            <span className="font-bold">{destinations.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] mt-1.5">
                            <span className="text-muted-foreground uppercase tracking-wider font-medium">Active Streams</span>
                            <span className="font-bold text-destructive">{destinations.filter((d) => d.status === "live").length}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
