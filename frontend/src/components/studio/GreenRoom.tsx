"use client";

import { useState, useEffect, useRef } from "react";
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    Settings,
    RefreshCw,
    Check,
    AlertCircle,
    ChevronDown,
    Monitor,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card"; // Custom or simple div
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface GreenRoomProps {
    roomId: string;
    guestName: string;
    onJoin: (stream: MediaStream) => void;
    onLeave: () => void;
    isWaiting: boolean;
    hostName?: string;
}

export function GreenRoom({
    roomId,
    guestName,
    onJoin,
    onLeave,
    isWaiting,
    hostName = "Host",
}: GreenRoomProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedAudio, setSelectedAudio] = useState("");
    const [selectedVideo, setSelectedVideo] = useState("");
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeviceSettings, setShowDeviceSettings] = useState(false);

    // Initialize media
    useEffect(() => {
        initializeMedia();
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const initializeMedia = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            // Enumerate devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter((d) => d.kind === "audioinput");
            const videoInputs = devices.filter((d) => d.kind === "videoinput");

            setAudioDevices(audioInputs);
            setVideoDevices(videoInputs);

            if (audioInputs.length > 0) setSelectedAudio(audioInputs[0].deviceId);
            if (videoInputs.length > 0) setSelectedVideo(videoInputs[0].deviceId);

            setError(null);
        } catch (err: any) {
            setError(err.message || "Could not access camera/microphone");
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleAudio = () => {
        if (stream) {
            stream.getAudioTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    const switchDevice = async (type: "audio" | "video", deviceId: string) => {
        if (!stream) return;

        try {
            const constraints =
                type === "audio"
                    ? { audio: { deviceId: { exact: deviceId } } }
                    : { video: { deviceId: { exact: deviceId } } };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const newTrack = type === "audio"
                ? newStream.getAudioTracks()[0]
                : newStream.getVideoTracks()[0];

            const oldTrack = type === "audio"
                ? stream.getAudioTracks()[0]
                : stream.getVideoTracks()[0];

            if (oldTrack) {
                stream.removeTrack(oldTrack);
                oldTrack.stop();
            }
            stream.addTrack(newTrack);

            if (type === "audio") setSelectedAudio(deviceId);
            else setSelectedVideo(deviceId);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err: any) {
            setError(`Could not switch ${type} device`);
        }
    };

    const handleReady = () => {
        setIsReady(true);
        if (stream) {
            onJoin(stream);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 md:p-10 selection:bg-primary/30">
            <div className="w-full max-w-4xl grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">

                {/* Left Column: Video Preview */}
                <div className="space-y-6">
                    <div className="relative aspect-video bg-card rounded-[32px] overflow-hidden border-2 border-border/40 shadow-2xl glass-morphism">
                        {isVideoEnabled && stream ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover scale-x-[-1]"
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-secondary/10 backdrop-blur-sm">
                                <div className="bg-destructive/10 p-6 rounded-full border border-destructive/20">
                                    <VideoOff className="w-10 h-10 text-destructive/60" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Camera is off</span>
                            </div>
                        )}

                        {/* Top Overlay Badge */}
                        <div className="absolute top-5 left-5">
                            <Badge variant="secondary" className="bg-black/40 backdrop-blur-md border-white/5 text-white/90 py-1.5 px-4 rounded-xl font-semibold tracking-wide uppercase text-[10px]">
                                Green Room Preview
                            </Badge>
                        </div>

                        {/* Guest Name Overlay */}
                        <div className="absolute bottom-5 left-5 flex items-center gap-2.5 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl overflow-hidden">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                                {guestName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-white drop-shadow-sm">{guestName}</span>
                        </div>

                        {/* Mic Visualizer Overlay */}
                        {isAudioEnabled && (
                            <div className="absolute bottom-5 right-5 flex items-end gap-[2px] h-6">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="w-1 h-2 bg-primary/80 rounded-full animate-pulse" />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center items-center gap-4">
                        <Button
                            variant={!isAudioEnabled ? "destructive" : "secondary"}
                            size="icon"
                            onClick={toggleAudio}
                            className="w-14 h-14 rounded-full shadow-lg transition-all active:scale-90"
                        >
                            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                        </Button>
                        <Button
                            variant={!isVideoEnabled ? "destructive" : "secondary"}
                            size="icon"
                            onClick={toggleVideo}
                            className="w-14 h-14 rounded-full shadow-lg transition-all active:scale-90"
                        >
                            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                            className={cn("w-14 h-14 rounded-full shadow-lg transition-all active:scale-90", showDeviceSettings && "bg-primary text-white shadow-primary/20")}
                        >
                            <Settings className="w-6 h-6" />
                        </Button>
                    </div>
                </div>

                {/* Right Column: Setup & Join */}
                <div className="space-y-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-primary/20 p-2 rounded-xl">
                                <Video className="text-primary w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter">Ready to join?</h1>
                        </div>
                        <p className="text-muted-foreground font-medium leading-relaxed">
                            Verify your presence before entering the studio. Room <span className="text-foreground font-bold">{roomId}</span> is active and waiting for you.
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="w-5 h-5 text-destructive" />
                            <span className="text-xs font-bold text-destructive flex-1">{error}</span>
                            <Button variant="ghost" size="icon" onClick={initializeMedia} className="h-8 w-8 hover:bg-destructive/10">
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {showDeviceSettings ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-400">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 ml-1">Microphone</Label>
                                    <Select value={selectedAudio} onValueChange={(val) => switchDevice("audio", val)}>
                                        <SelectTrigger className="h-12 rounded-xl bg-card border-border/40">
                                            <SelectValue placeholder="Select Microphone" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-border/40 shadow-2xl">
                                            {audioDevices.map((device) => (
                                                <SelectItem key={device.deviceId} value={device.deviceId} className="rounded-lg">
                                                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 ml-1">Camera</Label>
                                    <Select value={selectedVideo} onValueChange={(val) => switchDevice("video", val)}>
                                        <SelectTrigger className="h-12 rounded-xl bg-card border-border/40">
                                            <SelectValue placeholder="Select Camera" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-border/40 shadow-2xl">
                                            {videoDevices.map((device) => (
                                                <SelectItem key={device.deviceId} value={device.deviceId} className="rounded-lg">
                                                    {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button variant="ghost" onClick={() => setShowDeviceSettings(false)} className="w-full h-10 rounded-xl text-xs font-bold text-muted-foreground">
                                Back to Studio Join
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {isReady && isWaiting ? (
                                <div className="p-8 flex flex-col items-center justify-center text-center gap-6 bg-primary/5 border border-primary/20 rounded-[32px] animate-in zoom-in-95 duration-500">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Monitor className="w-6 h-6 text-primary" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold">Knocking on the door...</h3>
                                        <p className="text-xs text-muted-foreground font-medium max-w-[200px] mx-auto leading-relaxed">
                                            Waiting for <span className="text-primary font-bold">{hostName}</span> to let you into the broadcast.
                                        </p>
                                    </div>
                                    <Button variant="ghost" onClick={onLeave} className="h-10 px-8 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10">
                                        Cancel Joining
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Button
                                        onClick={handleReady}
                                        disabled={!stream || !!error}
                                        className="w-full h-16 rounded-[24px] text-lg font-bold gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all"
                                    >
                                        <Check className="w-6 h-6" />
                                        I'm Ready to Join
                                    </Button>
                                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
                                        By joining, you agree to share your camera and microphone.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

