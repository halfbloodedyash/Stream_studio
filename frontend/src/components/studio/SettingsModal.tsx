"use client";

import { X, Camera, Mic, Speaker, Check, AlertCircle, Headphones, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    audioDevices: MediaDeviceInfo[];
    videoDevices: MediaDeviceInfo[];
    selectedAudioDevice: string;
    selectedVideoDevice: string;
    onAudioDeviceChange: (deviceId: string) => void;
    onVideoDeviceChange: (deviceId: string) => void;
    localStream: MediaStream | null;
}

export function SettingsModal({
    isOpen,
    onClose,
    audioDevices,
    videoDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    onAudioDeviceChange,
    onVideoDeviceChange,
    localStream,
}: SettingsModalProps) {
    const [audioLevel, setAudioLevel] = useState(0);

    // Audio level meter for the selected microphone
    useEffect(() => {
        if (!localStream || !isOpen) return;

        let audioContext: AudioContext | null = null;
        let animationFrame: number;

        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(localStream);

            analyser.fftSize = 128; // Smaller for performance
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setAudioLevel(average * 1.5);
                animationFrame = requestAnimationFrame(updateLevel);
            };

            updateLevel();
        } catch (e) {
            console.error("Failed to start audio analyzer:", e);
        }

        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
            if (audioContext) audioContext.close();
        };
    }, [localStream, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <Card className="relative w-full max-w-lg bg-card border-border/60 shadow-2xl rounded-[32px] overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="flex flex-col h-[600px] max-h-[90vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-6 border-b border-border/40 bg-secondary/20">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-xl">
                                <Settings2 className="w-5 h-5 text-primary" />
                            </div>
                            <div className="space-y-0.5">
                                <h2 className="text-xl font-bold tracking-tight">Studio Settings</h2>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Configure your hardware</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Body */}
                    <ScrollArea className="flex-1 px-8 py-6">
                        <div className="space-y-8 pb-4">
                            {/* Camera Selection */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                                    <Camera className="w-4 h-4 text-primary" />
                                    <span>Camera</span>
                                </div>
                                <div className="grid gap-2">
                                    {videoDevices.length > 0 ? (
                                        videoDevices.map((device) => (
                                            <button
                                                key={device.deviceId}
                                                className={cn(
                                                    "flex items-center justify-between w-full p-4 rounded-2xl border transition-all text-left",
                                                    selectedVideoDevice === device.deviceId
                                                        ? "bg-primary/10 border-primary/20 ring-1 ring-primary/20"
                                                        : "bg-secondary/20 border-border/40 hover:bg-secondary/40 hover:border-border/60"
                                                )}
                                                onClick={() => onVideoDeviceChange(device.deviceId)}
                                            >
                                                <span className={cn(
                                                    "text-sm font-semibold truncate pr-4",
                                                    selectedVideoDevice === device.deviceId ? "text-primary" : "text-foreground/80"
                                                )}>
                                                    {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                                                </span>
                                                {selectedVideoDevice === device.deviceId && (
                                                    <div className="bg-primary text-white p-1 rounded-lg">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-8 flex flex-col items-center justify-center gap-3 bg-destructive/5 border border-dashed border-destructive/20 rounded-2xl text-destructive/60">
                                            <AlertCircle className="w-6 h-6" />
                                            <span className="text-xs font-bold uppercase tracking-wider">No cameras found</span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <Separator className="bg-border/40" />

                            {/* Microphone Selection */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                                    <Mic className="w-4 h-4 text-primary" />
                                    <span>Microphone</span>
                                </div>

                                <div className="grid gap-2">
                                    {audioDevices.length > 0 ? (
                                        audioDevices.map((device) => (
                                            <button
                                                key={device.deviceId}
                                                className={cn(
                                                    "flex items-center justify-between w-full p-4 rounded-2xl border transition-all text-left",
                                                    selectedAudioDevice === device.deviceId
                                                        ? "bg-primary/10 border-primary/20 ring-1 ring-primary/20"
                                                        : "bg-secondary/20 border-border/40 hover:bg-secondary/40 hover:border-border/60"
                                                )}
                                                onClick={() => onAudioDeviceChange(device.deviceId)}
                                            >
                                                <span className={cn(
                                                    "text-sm font-semibold truncate pr-4",
                                                    selectedAudioDevice === device.deviceId ? "text-primary" : "text-foreground/80"
                                                )}>
                                                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                                                </span>
                                                {selectedAudioDevice === device.deviceId && (
                                                    <div className="bg-primary text-white p-1 rounded-lg">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-8 flex flex-col items-center justify-center gap-3 bg-destructive/5 border border-dashed border-destructive/20 rounded-2xl text-destructive/60">
                                            <AlertCircle className="w-6 h-6" />
                                            <span className="text-xs font-bold uppercase tracking-wider">No microphones found</span>
                                        </div>
                                    )}
                                </div>

                                {/* Audio Level Indicator / Mic Test */}
                                <div className="p-5 bg-card border border-border/40 rounded-2xl space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Live Mic Test</span>
                                        <Badge variant="outline" className="text-[9px] bg-secondary/30">{Math.round(audioLevel)}%</Badge>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-75"
                                            style={{ width: `${Math.min(100, audioLevel)}%` }}
                                        />
                                    </div>
                                </div>
                            </section>

                            <Separator className="bg-border/40" />

                            {/* Audio Output */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                                    <Headphones className="w-4 h-4 text-primary" />
                                    <span>Audio Output</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-2xl border border-border/20 italic text-xs text-muted-foreground">
                                    <Speaker className="w-4 h-4" />
                                    System default output is currently used.
                                </div>
                            </section>
                        </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="p-6 bg-secondary/10 border-t border-border/40 flex justify-end gap-3 shadow-inner">
                        <Button variant="outline" onClick={onClose} className="rounded-xl px-8 h-11 font-bold">Cancel</Button>
                        <Button onClick={onClose} className="rounded-xl px-10 h-11 font-bold shadow-lg shadow-primary/10">Save Changes</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

