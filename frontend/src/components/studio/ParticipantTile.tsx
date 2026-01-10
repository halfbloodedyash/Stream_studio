"use client";

import { useRef, useEffect, useState } from "react";
import { MicOff, VideoOff, User, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParticipantTileProps {
    name: string;
    stream: MediaStream | null;
    isLocal?: boolean;
    isMuted?: boolean;
    isVideoOff?: boolean;
    isSpeaking?: boolean;
    className?: string;
}

export function ParticipantTile({
    name,
    stream,
    isLocal = false,
    isMuted = false,
    isVideoOff = false,
    isSpeaking = false,
    className,
}: ParticipantTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [audioLevel, setAudioLevel] = useState(0);

    // Attach stream to video element
    useEffect(() => {
        if (videoRef.current && stream && !isVideoOff) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, isVideoOff]);

    // Audio level analyzer for the visualizer
    useEffect(() => {
        if (!stream || isMuted) {
            setAudioLevel(0);
            return;
        }

        // Check if stream has audio tracks before creating analyzer
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
            setAudioLevel(0);
            return;
        }

        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);

            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setAudioLevel(Math.min(100, average * 2));
            };

            const interval = setInterval(updateLevel, 50);

            return () => {
                clearInterval(interval);
                audioContext.close();
            };
        } catch (e) {
            console.warn("AudioContext failed to start", e);
        }
    }, [stream, isMuted]);

    const getInitial = () => {
        return name.charAt(0).toUpperCase();
    };

    return (
        <div className={cn(
            "relative aspect-video bg-card rounded-2xl overflow-hidden border-2 border-border/40 transition-all duration-300 group",
            isSpeaking && "border-primary shadow-lg shadow-primary/10",
            className
        )}>
            {/* Video / Placeholder */}
            {!isVideoOff && stream ? (
                <video
                    ref={videoRef}
                    className={cn(
                        "absolute inset-0 w-full h-full object-cover",
                        isLocal && "scale-x-[-1]"
                    )}
                    autoPlay
                    playsInline
                    muted={isLocal}
                />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-secondary/20">
                    <div className="w-20 h-20 rounded-full bg-secondary border border-border/40 flex items-center justify-center text-3xl font-black text-muted-foreground/60 shadow-inner">
                        {getInitial()}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-black/20 backdrop-blur-md rounded-full border border-white/5">
                        <VideoOff className="w-3 h-3 text-muted-foreground/60" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Camera Off</span>
                    </div>
                </div>
            )}

            {/* Speaking Indicator Glow */}
            {isSpeaking && (
                <div className="absolute inset-0 pointer-events-none ring-4 ring-primary/20 animate-pulse" />
            )}

            {/* Audio Level Visualizer (Bottom Bar Style) */}
            {!isMuted && (
                <div className="absolute bottom-4 right-4 flex items-end gap-[2px] h-4">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="w-1 bg-primary rounded-full transition-all duration-75"
                            style={{ height: `${Math.max(20, audioLevel * (0.5 + Math.random() * 0.5))}%` }}
                        />
                    ))}
                </div>
            )}

            {/* Info Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl overflow-hidden max-w-[80%]">
                    {isMuted ? (
                        <div className="bg-destructive/20 p-1 rounded-md">
                            <MicOff className="w-3 h-3 text-destructive" />
                        </div>
                    ) : (
                        <div className={cn("p-1 rounded-md", isSpeaking ? "bg-primary/20 shadow-sm" : "bg-white/10")}>
                            <Mic className={cn("w-3 h-3 text-white/80", isSpeaking && "text-primary animate-pulse")} />
                        </div>
                    )}
                    <span className="text-xs font-bold text-white truncate drop-shadow-sm">
                        {name} {isLocal && <span className="text-[8px] opacity-60 uppercase ml-1">(You)</span>}
                    </span>
                </div>

                {isVideoOff && (
                    <div className="p-2 bg-destructive/20 backdrop-blur-xl border border-destructive/20 rounded-xl">
                        <VideoOff className="w-3.5 h-3.5 text-destructive" />
                    </div>
                )}
            </div>
        </div>
    );
}
